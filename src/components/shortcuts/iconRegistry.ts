import type { LucideIcon } from 'lucide-react';
import {
  Globe,
  Video,
  Server,
  Network,
  Radio,
  Shield,
  Database,
  Terminal,
  HardDrive,
  Cpu,
  Activity,
  Zap,
  Flame,
  Layers,
  Box,
  ExternalLink,
  Tv,
  Music,
  Bookmark,
  Folder,
  Sliders,
} from 'lucide-react';

export interface IconOption {
  name: string;
  label: string;
  icon: LucideIcon;
}

export const AVAILABLE_ICONS: IconOption[] = [
  { name: 'Globe', label: 'Web / Internet', icon: Globe },
  { name: 'Video', label: 'Cameras / NVR', icon: Video },
  { name: 'Server', label: 'Proxmox / Hypervisor', icon: Server },
  { name: 'Network', label: 'Router / Mikrotik', icon: Network },
  { name: 'Shield', label: 'Security / Pi-hole', icon: Shield },
  { name: 'Terminal', label: 'SSH / Console', icon: Terminal },
  { name: 'HardDrive', label: 'NAS / Storage', icon: HardDrive },
  { name: 'Activity', label: 'Grafana / Metrics', icon: Activity },
  { name: 'Database', label: 'InfluxDB / SQL', icon: Database },
  { name: 'Radio', label: 'IoT / Wireless', icon: Radio },
  { name: 'Cpu', label: 'Hardware / System', icon: Cpu },
  { name: 'Zap', label: 'Automation / Home', icon: Zap },
  { name: 'Layers', label: 'Portainer / Stacks', icon: Layers },
  { name: 'Box', label: 'Docker / Container', icon: Box },
  { name: 'Tv', label: 'Media / Plex', icon: Tv },
  { name: 'Music', label: 'Audio / Stream', icon: Music },
  { name: 'Flame', label: 'Prometheus / Speedtest', icon: Flame },
  { name: 'Folder', label: 'Nextcloud / Files', icon: Folder },
  { name: 'Sliders', label: 'Management / Admin', icon: Sliders },
  { name: 'Bookmark', label: 'General Bookmark', icon: Bookmark },
  { name: 'ExternalLink', label: 'External App', icon: ExternalLink },
];

export const ICON_MAP: Record<string, LucideIcon> = AVAILABLE_ICONS.reduce(
  (acc, curr) => {
    acc[curr.name] = curr.icon;
    return acc;
  },
  {} as Record<string, LucideIcon>
);

export function getShortcutIcon(iconName?: string): LucideIcon {
  if (!iconName) return Globe;
  return ICON_MAP[iconName] || Globe;
}
