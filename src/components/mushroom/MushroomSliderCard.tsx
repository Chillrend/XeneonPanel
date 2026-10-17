import React, { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ThemeAccent } from '../../types';

interface MushroomSliderCardProps {
  title: string;
  icon: LucideIcon;
  value: number; // 0 to 100
  active: boolean;
  accent?: ThemeAccent;
  onChange: (value: number) => void;
  onToggle: () => void;
  unit?: string;
  className?: string;
}

const sliderAccentClasses: Record<ThemeAccent, { fill: string; activeIcon: string }> = {
  amber: {
    fill: 'bg-gradient-to-r from-amber-500/30 to-amber-500/50 border-r border-amber-400/60',
    activeIcon: 'bg-amber-500/20 text-amber-400',
  },
  blue: {
    fill: 'bg-gradient-to-r from-blue-500/30 to-blue-500/50 border-r border-blue-400/60',
    activeIcon: 'bg-blue-500/20 text-blue-400',
  },
  emerald: {
    fill: 'bg-gradient-to-r from-emerald-500/30 to-emerald-500/50 border-r border-emerald-400/60',
    activeIcon: 'bg-emerald-500/20 text-emerald-400',
  },
  rose: {
    fill: 'bg-gradient-to-r from-rose-500/30 to-rose-500/50 border-r border-rose-400/60',
    activeIcon: 'bg-rose-500/20 text-rose-400',
  },
  purple: {
    fill: 'bg-gradient-to-r from-purple-500/30 to-purple-500/50 border-r border-purple-400/60',
    activeIcon: 'bg-purple-500/20 text-purple-400',
  },
  cyan: {
    fill: 'bg-gradient-to-r from-cyan-500/30 to-cyan-500/50 border-r border-cyan-400/60',
    activeIcon: 'bg-cyan-500/20 text-cyan-400',
  },
  orange: {
    fill: 'bg-gradient-to-r from-orange-500/30 to-orange-500/50 border-r border-orange-400/60',
    activeIcon: 'bg-orange-500/20 text-orange-400',
  },
  indigo: {
    fill: 'bg-gradient-to-r from-indigo-500/30 to-indigo-500/50 border-r border-indigo-400/60',
    activeIcon: 'bg-indigo-500/20 text-indigo-400',
  },
};

export const MushroomSliderCard: React.FC<MushroomSliderCardProps> = ({
  title,
  icon: Icon,
  value,
  active,
  accent = 'amber',
  onChange,
  onToggle,
  unit = '%',
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const accentTheme = sliderAccentClasses[accent] || sliderAccentClasses.amber;

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setInternalValue(val);
    onChange(val);
  };

  return (
    <div
      className={`relative overflow-hidden p-3.5 rounded-2xl bg-[#14161d]/85 border border-white/5 
        hover:border-white/10 transition-all duration-200 flex flex-col gap-2.5 ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggle}
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer
              ${
                active
                  ? accentTheme.activeIcon
                  : 'bg-white/5 text-slate-400 hover:text-slate-200'
              } active:scale-90`}
          >
            <Icon className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <span className="text-sm font-semibold text-slate-100 block truncate">
              {title}
            </span>
            <span className="text-xs text-slate-400">
              {active ? `${internalValue}${unit}` : 'Turned off'}
            </span>
          </div>
        </div>

        <span className="text-xs font-mono font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
          {internalValue}
          {unit}
        </span>
      </div>

      {/* Mushroom Slider Track */}
      <div className="relative w-full h-8 bg-white/5 rounded-xl overflow-hidden flex items-center px-1">
        {/* Fill level */}
        <div
          className={`absolute left-0 top-0 bottom-0 transition-all duration-150 rounded-xl pointer-events-none
            ${
              active
                ? accentTheme.fill
                : 'bg-white/10'
            }`}
          style={{ width: `${Math.max(0, Math.min(100, internalValue))}%` }}
        />

        <input
          type="range"
          min="0"
          max="100"
          value={internalValue}
          onChange={handleSliderChange}
          className="w-full h-full opacity-0 cursor-ew-resize relative z-10"
        />
      </div>
    </div>
  );
};
