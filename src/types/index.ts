export interface HAEntityAttributes {
  friendly_name: string;
  icon?: string;
  unit_of_measurement?: string;
  device_class?: string;
  brightness?: number;
  current_temperature?: number;
  temperature?: number;
  hvac_action?: string;
  fan_mode?: string;
  rgb_color?: [number, number, number];
  [key: string]: any;
}

export interface HAEntity {
  entity_id: string;
  state: string;
  attributes: HAEntityAttributes;
  last_changed: string;
  last_updated: string;
}

export interface SystemServiceStatus {
  configured: boolean;
  url: string;
  mode: 'live' | 'simulation';
  org?: string;
  bucket?: string;
}

export interface SystemStatus {
  status: string;
  timestamp: string;
  homeAssistant: SystemServiceStatus;
  influxDb: SystemServiceStatus;
}

export interface MetricPoint {
  time: string;
  value: number;
}

export interface InfluxHistoryResponse {
  measurement: string;
  field: string;
  range: string;
  points: MetricPoint[];
}

export type ThemeAccent =
  | 'amber'
  | 'blue'
  | 'emerald'
  | 'rose'
  | 'purple'
  | 'cyan'
  | 'orange'
  | 'indigo';

export type ShortcutOpenBehavior = 'both' | 'browser' | 'host';

export interface WebShortcut {
  id: number;
  title: string;
  url: string;
  subtitle: string;
  icon: string;
  accent: ThemeAccent;
  open_behavior: ShortcutOpenBehavior;
  sort_order: number;
  created_at?: string;
}

export type WebShortcutInput = Omit<WebShortcut, 'id' | 'created_at'>;

export interface AudioSession {
  id: string;
  process_name: string;
  display_name: string;
  volume: number; // 0 to 100
  muted: boolean;
  icon?: string;
}

export interface PcStatus {
  online: boolean;
  hostname: string;
  os: string;
  master_volume: number;
  master_muted: boolean;
  device_name: string;
  sessions: AudioSession[];
  last_seen: string;
}


