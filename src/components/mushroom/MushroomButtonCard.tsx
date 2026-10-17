import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ThemeAccent } from '../../types';

interface MushroomButtonCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  active?: boolean;
  accent?: ThemeAccent;
  badge?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const accentStyles: Record<
  ThemeAccent,
  {
    iconBgActive: string;
    iconTextActive: string;
    borderActive: string;
    glowActive: string;
  }
> = {
  amber: {
    iconBgActive: 'bg-amber-500/20',
    iconTextActive: 'text-amber-400',
    borderActive: 'border-amber-500/30',
    glowActive: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  },
  blue: {
    iconBgActive: 'bg-blue-500/20',
    iconTextActive: 'text-blue-400',
    borderActive: 'border-blue-500/30',
    glowActive: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
  },
  emerald: {
    iconBgActive: 'bg-emerald-500/20',
    iconTextActive: 'text-emerald-400',
    borderActive: 'border-emerald-500/30',
    glowActive: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  },
  rose: {
    iconBgActive: 'bg-rose-500/20',
    iconTextActive: 'text-rose-400',
    borderActive: 'border-rose-500/30',
    glowActive: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]',
  },
  purple: {
    iconBgActive: 'bg-purple-500/20',
    iconTextActive: 'text-purple-400',
    borderActive: 'border-purple-500/30',
    glowActive: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
  },
  cyan: {
    iconBgActive: 'bg-cyan-500/20',
    iconTextActive: 'text-cyan-400',
    borderActive: 'border-cyan-500/30',
    glowActive: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
  },
  orange: {
    iconBgActive: 'bg-orange-500/20',
    iconTextActive: 'text-orange-400',
    borderActive: 'border-orange-500/30',
    glowActive: 'shadow-[0_0_20px_rgba(249,115,22,0.15)]',
  },
  indigo: {
    iconBgActive: 'bg-indigo-500/20',
    iconTextActive: 'text-indigo-400',
    borderActive: 'border-indigo-500/30',
    glowActive: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]',
  },
};

export const MushroomButtonCard: React.FC<MushroomButtonCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  active = false,
  accent = 'amber',
  badge,
  onClick,
  disabled = false,
  className = '',
}) => {
  const styles = accentStyles[accent] || accentStyles.amber;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative group w-full text-left p-3.5 rounded-2xl border transition-all duration-200 
        flex items-center gap-3.5 select-none outline-none cursor-pointer
        ${
          active
            ? `bg-[#191c25]/90 ${styles.borderActive} ${styles.glowActive}`
            : 'bg-[#14161d]/80 border-white/5 hover:border-white/10 hover:bg-[#181a24]/90'
        }
        active:scale-[0.98] ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      {/* Icon Badge */}
      <div
        className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-300
          ${
            active
              ? `${styles.iconBgActive} ${styles.iconTextActive}`
              : 'bg-white/5 text-slate-400 group-hover:text-slate-200'
          }`}
      >
        <Icon className="w-5 h-5 transition-transform duration-200 group-active:scale-95" />
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-1">
          <span className="font-semibold text-sm text-slate-100 truncate tracking-tight">
            {title}
          </span>
          {badge && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400 shrink-0">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <div className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
            {active && (
              <span className={`w-1.5 h-1.5 rounded-full ${styles.iconBgActive} animate-pulse`} />
            )}
            {subtitle}
          </div>
        )}
      </div>
    </button>
  );
};
