import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage, Server } from 'http';

export interface AudioSession {
  id: string;
  process_name: string;
  display_name: string;
  volume: number; // 0 to 100
  muted: boolean;
  icon?: string;
}

export interface PcState {
  online: boolean;
  hostname: string;
  os: string;
  master_volume: number; // 0 to 100
  master_muted: boolean;
  device_name: string;
  sessions: AudioSession[];
  last_seen: string;
}

const defaultPcState: PcState = {
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
    {
      id: 'mock-game',
      process_name: 'Game.exe',
      display_name: 'Active Game',
      volume: 100,
      muted: false,
      icon: 'Tv',
    },
  ],
  last_seen: new Date().toISOString(),
};

export class PcHub {
  private wss: WebSocketServer | null = null;
  private agentSocket: WebSocket | null = null;
  private uiSockets: Set<WebSocket> = new Set();
  private state: PcState = { ...defaultPcState };
  private authToken: string;

  constructor() {
    this.authToken = process.env.PC_AGENT_TOKEN || 'xeneon-secret-token';
  }

  public init(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request: IncomingMessage, socket, head) => {
      const parsedUrl = new URL(request.url || '', 'http://localhost');
      const pathname = parsedUrl.pathname;

      if (pathname === '/ws/pc') {
        // Optional auth verification
        const token = parsedUrl.searchParams.get('token');
        if (this.authToken && token && token !== this.authToken) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          this.handleAgentConnection(ws);
        });
      } else if (pathname === '/ws/ui') {
        // UI clients subscribing to real-time events
        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          this.handleUiConnection(ws);
        });
      }
    });

    console.log('   - WebSocket Hub:  [active] /ws/pc (Agent) & /ws/ui (Clients)');
  }

  private handleAgentConnection(ws: WebSocket) {
    console.log('🔌 [PC Hub] Windows 11 PC agent connected');
    this.agentSocket = ws;
    this.state.online = true;
    this.broadcastStateToUi();

    ws.on('message', (message: string) => {
      try {
        const payload = JSON.parse(message.toString());
        if (payload.type === 'state_update') {
          this.state = {
            ...this.state,
            ...payload.data,
            online: true,
            last_seen: new Date().toISOString(),
          };
          this.broadcastStateToUi();
        } else if (payload.type === 'pong') {
          this.state.last_seen = new Date().toISOString();
        }
      } catch (err: any) {
        console.warn('[PC Hub] Error parsing agent message:', err.message);
      }
    });

    ws.on('close', () => {
      console.log('🔌 [PC Hub] PC agent disconnected');
      this.agentSocket = null;
      this.state.online = false;
      this.broadcastStateToUi();
    });

    ws.on('error', (err) => {
      console.warn('[PC Hub] Agent socket error:', err.message);
    });
  }

  private handleUiConnection(ws: WebSocket) {
    this.uiSockets.add(ws);
    // Send immediate state
    ws.send(JSON.stringify({ type: 'pc_state', data: this.state }));

    ws.on('close', () => {
      this.uiSockets.delete(ws);
    });
  }

  private broadcastStateToUi() {
    const message = JSON.stringify({ type: 'pc_state', data: this.state });
    for (const client of this.uiSockets) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  private sendToAgent(type: string, data: any): boolean {
    if (this.agentSocket && this.agentSocket.readyState === WebSocket.OPEN) {
      this.agentSocket.send(JSON.stringify({ type, data }));
      return true;
    }
    return false;
  }

  public getStatus(): PcState {
    return this.state;
  }

  public setMasterVolume(volume: number) {
    this.state.master_volume = Math.max(0, Math.min(100, volume));
    this.sendToAgent('set_master_volume', { volume: this.state.master_volume });
    this.broadcastStateToUi();
  }

  public setMasterMute(muted: boolean) {
    this.state.master_muted = muted;
    this.sendToAgent('set_master_mute', { muted });
    this.broadcastStateToUi();
  }

  public setAppVolume(processName: string, volume: number) {
    const clamped = Math.max(0, Math.min(100, volume));
    const session = this.state.sessions.find((s) => s.process_name === processName);
    if (session) {
      session.volume = clamped;
    }
    this.sendToAgent('set_app_volume', { process_name: processName, volume: clamped });
    this.broadcastStateToUi();
  }

  public setAppMute(processName: string, muted: boolean) {
    const session = this.state.sessions.find((s) => s.process_name === processName);
    if (session) {
      session.muted = muted;
    }
    this.sendToAgent('set_app_mute', { process_name: processName, muted });
    this.broadcastStateToUi();
  }

  public sendPowerAction(action: 'lock' | 'sleep' | 'restart' | 'shutdown'): boolean {
    console.log(`[PC Hub] Dispatching power action: ${action}`);
    return this.sendToAgent('power_action', { action });
  }

  public openUrlOnPc(url: string): boolean {
    if (this.agentSocket && this.agentSocket.readyState === WebSocket.OPEN) {
      console.log(`[PC Hub] Forwarding URL to PC agent: ${url}`);
      return this.sendToAgent('open_url', { url });
    }
    return false;
  }
}

export const pcHub = new PcHub();
