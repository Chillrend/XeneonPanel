import { useState, useEffect, useCallback, useRef } from 'react';
import type { PcStatus } from '../types';

const defaultStatus: PcStatus = {
  online: false,
  hostname: 'Desktop-PC',
  os: 'Windows 11',
  master_volume: 75,
  master_muted: false,
  device_name: 'Default Speakers',
  sessions: [
    {
      id: 'mock-spotify',
      process_name: 'Spotify.exe',
      display_name: 'Spotify',
      volume: 70,
      muted: false,
      icon: 'Music',
    },
    {
      id: 'mock-discord',
      process_name: 'Discord.exe',
      display_name: 'Discord',
      volume: 85,
      muted: false,
      icon: 'Radio',
    },
    {
      id: 'mock-chrome',
      process_name: 'chrome.exe',
      display_name: 'Google Chrome',
      volume: 90,
      muted: false,
      icon: 'Globe',
    },
  ],
  last_seen: new Date().toISOString(),
};

export function usePcAgent() {
  const [status, setStatus] = useState<PcStatus>(defaultStatus);
  const wsRef = useRef<WebSocket | null>(null);

  // Poll fallback / initial fetch
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/pc/status');
      if (res.ok) {
        const data: PcStatus = await res.json();
        setStatus(data);
      }
    } catch {
      // keep existing status
    }
  }, []);

  // Setup WebSocket subscription
  useEffect(() => {
    fetchStatus();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/ui`;

    let reconnectTimer: any = null;

    const connectWs = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'pc_state' && msg.data) {
              setStatus((prev) => {
                const next = msg.data;
                if (
                  prev.online === next.online &&
                  prev.master_volume === next.master_volume &&
                  prev.master_muted === next.master_muted &&
                  prev.device_name === next.device_name &&
                  prev.sessions.length === next.sessions.length &&
                  JSON.stringify(prev.sessions) === JSON.stringify(next.sessions)
                ) {
                  return prev;
                }
                return next;
              });
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          wsRef.current = null;
          reconnectTimer = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        reconnectTimer = setTimeout(connectWs, 5000);
      }
    };

    connectWs();

    // Secondary poll interval only as fallback when WebSocket is offline
    const interval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        fetchStatus();
      }
    }, 6000);

    return () => {
      clearInterval(interval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchStatus]);

  const setMasterVolume = useCallback((vol: number) => {
    setStatus((prev) => ({ ...prev, master_volume: vol }));
    fetch('/api/pc/volume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'master', volume: vol }),
    }).catch(() => {});
  }, []);

  const setMasterMute = useCallback((muted: boolean) => {
    setStatus((prev) => ({ ...prev, master_muted: muted }));
    fetch('/api/pc/mute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'master', muted }),
    }).catch(() => {});
  }, []);

  const setAppVolume = useCallback((processName: string, vol: number) => {
    setStatus((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.process_name === processName ? { ...s, volume: vol } : s
      ),
    }));
    fetch('/api/pc/volume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: processName, volume: vol }),
    }).catch(() => {});
  }, []);

  const setAppMute = useCallback((processName: string, muted: boolean) => {
    setStatus((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.process_name === processName ? { ...s, muted } : s
      ),
    }));
    fetch('/api/pc/mute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: processName, muted }),
    }).catch(() => {});
  }, []);

  const sendPowerAction = useCallback(async (action: 'lock' | 'sleep' | 'restart' | 'shutdown') => {
    try {
      const res = await fetch('/api/pc/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  return {
    status,
    setMasterVolume,
    setMasterMute,
    setAppVolume,
    setAppMute,
    sendPowerAction,
    refetch: fetchStatus,
  };
}
