import asyncio
import json
import os
import sys
import platform
import socket
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("XeneonAgent")

IS_WINDOWS = sys.platform == "win32"

if IS_WINDOWS:
    import ctypes
    from ctypes import cast, POINTER
    from comtypes import CLSCTX_ALL
    try:
        from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
        PYCAW_AVAILABLE = True
    except ImportError:
        logger.warning("pycaw not found. Run: pip install -r requirements.txt")
        PYCAW_AVAILABLE = False
else:
    PYCAW_AVAILABLE = False

# Load configuration
if getattr(sys, "frozen", False):
    SCRIPT_DIR = Path(sys.executable).resolve().parent
else:
    SCRIPT_DIR = Path(__file__).resolve().parent
CONFIG_FILE = SCRIPT_DIR / "config.json"

def load_config():
    defaults = {
        "server_url": "ws://localhost:3001/ws/pc",
        "auth_token": "xeneon-secret-token",
        "poll_interval_sec": 1.0,
        "device_name": "Desktop PC (Windows 11)"
    }
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                user_conf = json.load(f)
                defaults.update(user_conf)
        except Exception as e:
            logger.warning(f"Error loading config.json: {e}")
    return defaults

CONFIG = load_config()

class WindowsAudioManager:
    def __init__(self):
        pass

    def _get_device_and_endpoint(self):
        if not (IS_WINDOWS and PYCAW_AVAILABLE):
            return None, None
        try:
            import comtypes
            comtypes.CoInitialize()
        except Exception:
            pass

        try:
            device = AudioUtilities.GetSpeakers()
            if not device:
                return None, None

            # Modern pycaw (2024+)
            if hasattr(device, "EndpointVolume"):
                return device, device.EndpointVolume

            # AudioDevice._dev
            if hasattr(device, "_dev") and hasattr(device._dev, "Activate"):
                interface = device._dev.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
                return device, cast(interface, POINTER(IAudioEndpointVolume))

            # Classic pycaw
            if hasattr(device, "Activate"):
                interface = device.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
                return device, cast(interface, POINTER(IAudioEndpointVolume))
        except Exception as e:
            logger.debug(f"Failed to get audio endpoint: {e}")

        return None, None

    def get_device_name(self):
        device, _ = self._get_device_and_endpoint()
        if device and hasattr(device, "FriendlyName") and device.FriendlyName:
            return device.FriendlyName
        return CONFIG.get("device_name", "Desktop PC (Windows 11)")

    def get_master_volume(self):
        _, endpoint = self._get_device_and_endpoint()
        if endpoint:
            try:
                scalar = endpoint.GetMasterVolumeLevelScalar()
                return int(round(scalar * 100))
            except Exception as e:
                logger.debug(f"Error reading master volume: {e}")
        return 75

    def get_master_muted(self):
        _, endpoint = self._get_device_and_endpoint()
        if endpoint:
            try:
                return bool(endpoint.GetMute())
            except Exception:
                pass
        return False

    def set_master_volume(self, volume: int):
        clamped = max(0, min(100, volume))
        _, endpoint = self._get_device_and_endpoint()
        if endpoint:
            try:
                endpoint.SetMasterVolumeLevelScalar(clamped / 100.0, None)
                logger.info(f"Master volume set to {clamped}%")
            except Exception as e:
                logger.error(f"Error setting master volume: {e}")

    def set_master_mute(self, muted: bool):
        _, endpoint = self._get_device_and_endpoint()
        if endpoint:
            try:
                endpoint.SetMute(1 if muted else 0, None)
                logger.info(f"Master mute set to {muted}")
            except Exception as e:
                logger.error(f"Error setting master mute: {e}")

    def get_sessions(self):
        sessions_list = []
        if not (IS_WINDOWS and PYCAW_AVAILABLE):
            # Development fallback mock
            return [
                {"id": "s-spotify", "process_name": "Spotify.exe", "display_name": "Spotify", "volume": 65, "muted": False, "icon": "Music"},
                {"id": "s-discord", "process_name": "Discord.exe", "display_name": "Discord", "volume": 80, "muted": False, "icon": "Radio"},
                {"id": "s-chrome", "process_name": "chrome.exe", "display_name": "Google Chrome", "volume": 90, "muted": False, "icon": "Globe"},
            ]

        try:
            sessions = AudioUtilities.GetAllSessions()
            for session in sessions:
                volume = session.SimpleAudioVolume
                if not volume:
                    continue

                proc = session.Process
                if proc:
                    pname = proc.name()
                    pid = proc.pid
                else:
                    pname = "System Audio"
                    pid = 0

                # Filter out idle background noise sessions with 0 volume if unneeded
                vol_scalar = volume.GetMasterVolume()
                is_muted = bool(volume.GetMute())

                display_name = pname.replace(".exe", "").capitalize()
                icon = "Tv"
                if "spotify" in pname.lower():
                    icon = "Music"
                elif "discord" in pname.lower():
                    icon = "Radio"
                elif "chrome" in pname.lower() or "msedge" in pname.lower() or "firefox" in pname.lower():
                    icon = "Globe"

                sessions_list.append({
                    "id": f"{pname}-{pid}",
                    "process_name": pname,
                    "display_name": display_name,
                    "volume": int(round(vol_scalar * 100)),
                    "muted": is_muted,
                    "icon": icon,
                })
        except Exception as e:
            logger.warning(f"Error reading audio sessions: {e}")

        # Deterministic sorting so session order does not oscillate and cause UI flicker
        sessions_list.sort(key=lambda s: s["id"])
        return sessions_list

    def set_app_volume(self, process_name: str, volume: int):
        clamped = max(0, min(100, volume))
        if not (IS_WINDOWS and PYCAW_AVAILABLE):
            logger.info(f"[SIM] App {process_name} volume set to {clamped}%")
            return

        try:
            sessions = AudioUtilities.GetAllSessions()
            for session in sessions:
                proc = session.Process
                if proc and proc.name().lower() == process_name.lower():
                    session.SimpleAudioVolume.SetMasterVolume(clamped / 100.0, None)
                    logger.info(f"Set volume for {process_name} to {clamped}%")
        except Exception as e:
            logger.error(f"Error setting app volume for {process_name}: {e}")

    def set_app_mute(self, process_name: str, muted: bool):
        if not (IS_WINDOWS and PYCAW_AVAILABLE):
            logger.info(f"[SIM] App {process_name} mute set to {muted}")
            return

        try:
            sessions = AudioUtilities.GetAllSessions()
            for session in sessions:
                proc = session.Process
                if proc and proc.name().lower() == process_name.lower():
                    session.SimpleAudioVolume.SetMute(1 if muted else 0, None)
                    logger.info(f"Set mute for {process_name} to {muted}")
        except Exception as e:
            logger.error(f"Error setting app mute for {process_name}: {e}")

audio_mgr = WindowsAudioManager()

def execute_power_action(action: str):
    logger.info(f"Executing power action: {action}")
    if action == "lock":
        if IS_WINDOWS:
            ctypes.windll.user32.LockWorkStation()
        else:
            logger.info("[SIM] LockWorkStation called")
    elif action == "sleep":
        if IS_WINDOWS:
            # SetSuspendState(bHibernate, bForce, bWakeupEventsDisabled)
            ctypes.windll.powrprof.SetSuspendState(0, 1, 0)
        else:
            logger.info("[SIM] SetSuspendState (sleep) called")
    elif action == "restart":
        if IS_WINDOWS:
            os.system("shutdown /r /t 0")
        else:
            logger.info("[SIM] shutdown /r /t 0 called")
    elif action == "shutdown":
        if IS_WINDOWS:
            os.system("shutdown /s /t 0")
        else:
            logger.info("[SIM] shutdown /s /t 0 called")

def open_url_on_pc(url: str):
    logger.info(f"Opening URL on PC: {url}")
    try:
        if IS_WINDOWS:
            os.startfile(url)
        else:
            import webbrowser
            webbrowser.open(url)
    except Exception as e:
        logger.error(f"Failed to open URL {url}: {e}")

def get_current_state():
    return {
        "hostname": socket.gethostname(),
        "os": "Windows 11" if IS_WINDOWS else platform.system(),
        "device_name": audio_mgr.get_device_name(),
        "master_volume": audio_mgr.get_master_volume(),
        "master_muted": audio_mgr.get_master_muted(),
        "sessions": audio_mgr.get_sessions(),
    }

async def handle_server_command(msg_str: str):
    try:
        msg = json.loads(msg_str)
        msg_type = msg.get("type")
        data = msg.get("data", {})

        if msg_type == "set_master_volume":
            audio_mgr.set_master_volume(data.get("volume", 75))
        elif msg_type == "set_master_mute":
            audio_mgr.set_master_mute(data.get("muted", False))
        elif msg_type == "set_app_volume":
            audio_mgr.set_app_volume(data.get("process_name", ""), data.get("volume", 100))
        elif msg_type == "set_app_mute":
            audio_mgr.set_app_mute(data.get("process_name", ""), data.get("muted", False))
        elif msg_type == "power_action":
            execute_power_action(data.get("action", ""))
        elif msg_type == "open_url":
            open_url_on_pc(data.get("url", ""))
    except Exception as e:
        logger.error(f"Error handling command: {e}")

async def run_agent():
    import websockets

    server_url = CONFIG["server_url"]
    auth_token = CONFIG.get("auth_token", "")
    poll_sec = CONFIG.get("poll_interval_sec", 1.0)

    url_with_token = f"{server_url}?token={auth_token}" if auth_token else server_url

    logger.info(f"Starting Xeneon Windows Companion Agent...")
    logger.info(f"Connecting outbound to: {server_url}")

    while True:
        try:
            async with websockets.connect(url_with_token, ping_interval=20, ping_timeout=10) as ws:
                logger.info("Connected to XeneonPanel Server!")

                # Initial state push
                await ws.send(json.dumps({
                    "type": "state_update",
                    "data": get_current_state()
                }))

                async def receiver():
                    async for message in ws:
                        await handle_server_command(message)
                        # Push updated state immediately after executing command
                        await ws.send(json.dumps({
                            "type": "state_update",
                            "data": get_current_state()
                        }))

                async def state_poller():
                    last_state_str = ""
                    while True:
                        await asyncio.sleep(poll_sec)
                        current = get_current_state()
                        current_str = json.dumps(current, sort_keys=True)
                        if current_str != last_state_str:
                            last_state_str = current_str
                            await ws.send(json.dumps({
                                "type": "state_update",
                                "data": current
                            }))

                await asyncio.gather(receiver(), state_poller())

        except (websockets.ConnectionClosed, websockets.WebSocketException, OSError) as e:
            logger.warning(f"Connection lost ({e}). Reconnecting in 3 seconds...")
            await asyncio.sleep(3)
        except Exception as e:
            logger.error(f"Unexpected error: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(run_agent())
    except KeyboardInterrupt:
        logger.info("Agent stopped by user.")
