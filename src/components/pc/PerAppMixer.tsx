import React from 'react';
import { VolumeX, Music, Radio, Globe, Tv, Sliders } from 'lucide-react';
import type { AudioSession } from '../../types';

interface PerAppMixerProps {
  sessions: AudioSession[];
  onVolumeChange: (processName: string, volume: number) => void;
  onMuteToggle: (processName: string, muted: boolean) => void;
  disabled?: boolean;
}

function getAppIcon(name: string, iconHint?: string) {
  const lower = name.toLowerCase();
  if (iconHint === 'Music' || lower.includes('spotify') || lower.includes('music')) return Music;
  if (iconHint === 'Radio' || lower.includes('discord')) return Radio;
  if (iconHint === 'Globe' || lower.includes('chrome') || lower.includes('edge') || lower.includes('firefox')) return Globe;
  if (iconHint === 'Tv' || lower.includes('game') || lower.includes('steam')) return Tv;
  return Sliders;
}

function getAppAccent(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('spotify')) return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', accent: 'accent-emerald-400' };
  if (lower.includes('discord')) return { bg: 'bg-indigo-500/15', text: 'text-indigo-400', accent: 'accent-indigo-400' };
  if (lower.includes('chrome') || lower.includes('edge')) return { bg: 'bg-amber-500/15', text: 'text-amber-400', accent: 'accent-amber-400' };
  return { bg: 'bg-blue-500/15', text: 'text-blue-400', accent: 'accent-blue-400' };
}

export const PerAppMixer: React.FC<PerAppMixerProps> = ({
  sessions,
  onVolumeChange,
  onMuteToggle,
  disabled = false,
}) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center p-4 rounded-2xl bg-[#14161f]/50 border border-white/5 text-slate-500 text-xs">
        Tidak ada aplikasi audio aktif
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
      {sessions.map((s) => {
        const IconComp = getAppIcon(s.process_name, s.icon);
        const style = getAppAccent(s.process_name);

        return (
          <div
            key={s.id}
            className="p-3 rounded-2xl bg-[#14161f]/85 border border-white/5 flex flex-col gap-2 hover:border-white/10 transition-colors"
          >
            {/* Header: Icon, Name, Mute & Percentage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onMuteToggle(s.process_name, !s.muted)}
                  title={s.muted ? 'Unmute' : 'Mute'}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                    s.muted
                      ? 'bg-rose-500/15 text-rose-400'
                      : `${style.bg} ${style.text}`
                  }`}
                >
                  {s.muted ? <VolumeX className="w-4 h-4" /> : <IconComp className="w-4 h-4" />}
                </button>
                <div className="truncate">
                  <span className="text-xs font-semibold text-slate-200 block truncate leading-tight">
                    {s.display_name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {s.process_name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono text-xs font-bold text-slate-300">
                  {s.muted ? 'Muted' : `${s.volume}%`}
                </span>
              </div>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="range"
                min="0"
                max="100"
                disabled={disabled}
                value={s.muted ? 0 : s.volume}
                onChange={(e) => onVolumeChange(s.process_name, Number(e.target.value))}
                className={`w-full h-1.5 bg-[#1f2330] rounded-lg appearance-none cursor-pointer ${style.accent} disabled:opacity-40`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
