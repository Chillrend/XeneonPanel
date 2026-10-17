# XeneonPanel — Corsair Xeneon Edge Iframe Dashboard

A sleek, Mushroom Card-styled dashboard engineered specifically for secondary displays and iframe widgets like the **Corsair Xeneon Edge** (or iCUE / browser sources). Built with **React 19**, **Tailwind CSS**, and **ApexCharts** for smooth Bézier spline graphs and soft gradient area fills.

---

## 🌟 Highlights

* **Mushroom Aesthetic:** Pill-shaped cards, glowing colored icon chips, and clutter-free sparklines modeled after Home Assistant's Mushroom Cards.
* **ApexCharts Integration:** Ultra-smooth curved splines (`curve: 'smooth'`) and soft vertical area gradients (`fill: 'gradient'`).
* **Home Assistant Controls:** Interactive buttons, light brightness sliders, climate adjustments, and instant optimistic state updates.
* **InfluxDB 2.x Flux Telemetry:** Real-time historical sparklines for CPU/GPU temperatures, load, power draw, and ambient room sensors.
* **Configurable Web Shortcuts (SQLite):** Persistent homelab quick links and web shortcuts backed by SQLite (`better-sqlite3`). Add, edit, and launch services directly from the panel.
* **Android-Style PC Control Center & Volume Mixer:** Pull-down drawer with real-time per-app volume sliders (Spotify, Discord, Chrome, Games), master audio, and PC power controls (Lock, Sleep, Restart, Shutdown) connected to a Windows 11 Companion Agent over WebSocket.
* **Docker & Homelab Ready:** Production multi-stage `Dockerfile` and `docker-compose.yml` with persistent SQLite volume mounting.
* **Iframe & Xeneon Edge Ready:**
  * Zero scrollbar jitter (`scrollbar-width: none`).
  * Deep OLED dark theme (`#0a0b0e`).
  * Layout modes: **Ribbon Mode** (horizontal scrollable bar for 32:9 ultrawide screens) and **Grid Mode** (multi-column responsive grid).
  * URL query params for iframe embedding presets (e.g. `?layout=ribbon`).
* **Built-in Simulation Mode:** Runs out of the box with realistic dynamic data even before you provide API tokens.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure credentials (Optional)
Copy `.env.example` to `.env` and fill in your Home Assistant and InfluxDB 2.x credentials:

```bash
cp .env.example .env
```

```ini
# Proxy Server Configuration
PORT=3001

# Home Assistant Configuration
# Generate a token in Home Assistant: User Profile > Long-Lived Access Tokens
HA_URL=http://homeassistant.local:8123
HA_TOKEN=your_ha_long_lived_token_here

# InfluxDB 2.x Configuration
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=your_influx_api_token_here
INFLUX_ORG=home
INFLUX_BUCKET=home_assistant

# If tokens are blank, the server automatically runs in Simulation Mode
MOCK_MODE=auto
```

### 3. Start development server
Runs both the proxy backend (`http://localhost:3001`) and Vite frontend (`http://localhost:5173`):

```bash
npm run dev
```

---

## 🖥️ Corsair Xeneon Edge / Iframe Embedding

In your Xeneon Edge display iframe widget or browser source, enter your host address:

* **Grid Mode (Multi-column dashboard):**
  ```
  http://<PC_LOCAL_IP>:5173/
  ```
* **Ribbon Mode (Ultrawide strip for 32:9 aspect ratios):**
  ```
  http://<PC_LOCAL_IP>:5173/?layout=ribbon
  ```

---

## 🧩 Customizing Panels & Entities

All panels are defined cleanly in `src/App.tsx`. You can swap entity IDs with your own:

### Home Assistant Toggle Button
```tsx
<MushroomButtonCard
  title="Desk Lamp"
  subtitle={deskLightOn ? "Active" : "Off"}
  icon={Lightbulb}
  active={deskLightOn}
  accent="amber"
  onClick={() => toggle('light.your_lamp_id')}
/>
```

### InfluxDB Sparkline Sensor Graph
```tsx
const mySensor = useInfluxQuery({
  measurement: 'sensor.pc_cpu_temp',
  field: 'value',
  range: '2h',
  window: '5m',
});

<MushroomGraphCard
  title="CPU Temperature"
  value={mySensor.latestValue}
  unit="°C"
  delta={mySensor.delta}
  icon={Cpu}
  accent="rose"
  data={mySensor.points}
/>
```

---

## 🛠️ Build for Production

```bash
npm run build
```
Generates production-ready optimized assets in `dist/` and bundles the Windows agent files in `dist/agent/`.

---

## 🐳 Docker Deployment (Homelab Server)

Deploy directly using Docker Compose:

```bash
docker compose up -d --build
```

The container runs on port `3001` with persistent SQLite storage mounted to `./data`:

```bash
http://<HOMELAB_IP>:3001/
```

---

## 🖥️ Windows 11 Companion Agent Setup

To enable the Android-style slide-down Control Center, per-app volume mixer, and PC power controls:

1. Copy the `agent/` (or `dist/agent/`) folder to your Windows 11 PC.
2. Edit `config.json` and set your homelab server address:
   ```json
   {
     "server_url": "ws://<HOMELAB_IP>:3001/ws/pc",
     "auth_token": "xeneon-secret-token"
   }
   ```
3. To generate the standalone executable `xeneon-agent.exe`:
   * Double-click `build_exe.bat` on your PC.
4. To run on Windows startup:
   * Place a shortcut to `run_silent.vbs` in your Windows startup folder (`Win + R` > `shell:startup`).

