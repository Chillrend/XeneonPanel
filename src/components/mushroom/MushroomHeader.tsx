import React, { useState, useEffect } from 'react';
import {
  Clock,
  Radio,
  Database,
  Moon,
  Sun,
  LayoutGrid,
  Columns,
  RefreshCw,
  Zap,
  Monitor,
  ChevronDown,
} from 'lucide-react';
import type { SystemStatus } from '../../types';

export type LayoutMode = 'grid' | 'ribbon' | 'compact';

interface MushroomHeaderProps {
  systemStatus: SystemStatus | null;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  onRefreshAll?: () => void;
  onQuickScene?: (scene: string) => void;
  onToggleControlCenter?: () => void;
  isControlCenterOpen?: boolean;
  pcOnline?: boolean;
  pcMasterVolume?: number;
}

export const MushroomHeader: React.FC<MushroomHeaderProps> = ({
  systemStatus,
  layoutMode,
  setLayoutMode,
  onRefreshAll,
  onQuickScene,
  onToggleControlCenter,
  isControlCenterOpen = false,
  pcOnline = false,
  pcMasterVolume,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formattedDate = time.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const haLive = systemStatus?.homeAssistant.mode === 'live';
  const influxLive = systemStatus?.influxDb.mode === 'live';

  return (
    <header className="w-full bg-[#101218]/90 backdrop-blur-md border-b border-white/5 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Left: Clock & Date */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-300">
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <div className="font-mono text-base font-bold tracking-tight text-white leading-tight">
            {formattedTime}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">{formattedDate}</div>
        </div>
      </div>

      {/* Center: Quick Scene Buttons & PC Control Center Pill */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-[#14161f]/80 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => onQuickScene?.('focus')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1.5"
            title="Focus / Work Mode"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Focus</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickScene?.('night')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1.5"
            title="Night / All Off"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Night</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickScene?.('day')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1.5"
            title="Daylight Mode"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Day</span>
          </button>
        </div>

        {/* PC Control Center Trigger (Android Notification Shade Style) */}
        {onToggleControlCenter && (
          <button
            type="button"
            onClick={onToggleControlCenter}
            title="Buka Control Center PC & Volume Mixer"
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              isControlCenterOpen
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                : 'bg-[#14161f]/80 border-white/5 hover:border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  pcOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
            </div>
            <div className="flex items-center gap-1 text-xs font-mono">
              <span>PC</span>
              {pcOnline && pcMasterVolume !== undefined && (
                <span className="text-[10px] text-slate-400">{pcMasterVolume}%</span>
              )}
              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                  isControlCenterOpen ? 'rotate-180 text-blue-400' : ''
                }`}
              />
            </div>
          </button>
        )}
      </div>

      {/* Right: Layout Switcher & Status Indicators */}
      <div className="flex items-center gap-2">
        {/* Layout Switcher */}
        <div className="flex items-center bg-[#14161f]/80 p-0.5 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => setLayoutMode('grid')}
            title="Standard Grid Layout"
            className={`p-1.5 rounded-md transition-colors ${
              layoutMode === 'grid'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('ribbon')}
            title="Xeneon Ultrawide Ribbon"
            className={`p-1.5 rounded-md transition-colors ${
              layoutMode === 'ribbon'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-4 h-4" />
          </button>
        </div>

        {/* Home Assistant Status */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#14161f]/80 border border-white/5 text-[11px] font-mono text-slate-300"
          title={`Home Assistant: ${haLive ? 'Live Connection' : 'Simulation Mode'}`}
        >
          <Radio className="w-3 h-3 text-slate-400" />
          <span className="hidden sm:inline">HA</span>
          <span
            className={`w-2 h-2 rounded-full ${
              haLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
        </div>

        {/* InfluxDB Status */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#14161f]/80 border border-white/5 text-[11px] font-mono text-slate-300"
          title={`InfluxDB 2.x: ${influxLive ? 'Live Connection' : 'Simulation Mode'}`}
        >
          <Database className="w-3 h-3 text-slate-400" />
          <span className="hidden sm:inline">Influx</span>
          <span
            className={`w-2 h-2 rounded-full ${
              influxLive ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
            }`}
          />
        </div>

        {/* Refresh button */}
        {onRefreshAll && (
          <button
            type="button"
            onClick={onRefreshAll}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95"
            title="Refresh All States"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
