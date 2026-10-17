import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ThemeAccent } from '../../types';

interface MushroomStatCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  accent?: ThemeAccent;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

const accentColors: Record<
  ThemeAccent,
  {
    iconBg: string;
    iconText: string;
    border: string;
  }
> = {
  amber: {
    iconBg: 'bg-amber-500/15',
    iconText: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  blue: {
    iconBg: 'bg-blue-500/15',
    iconText: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  emerald: {
    iconBg: 'bg-emerald-500/15',
    iconText: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  rose: {
    iconBg: 'bg-rose-500/15',
    iconText: 'text-rose-400',
    border: 'border-rose-500/20',
  },
  purple: {
    iconBg: 'bg-purple-500/15',
    iconText: 'text-purple-400',
    border: 'border-purple-500/20',
  },
  cyan: {
    iconBg: 'bg-cyan-500/15',
    iconText: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  orange: {
    iconBg: 'bg-orange-500/15',
    iconText: 'text-orange-400',
    border: 'border-orange-500/20',
  },
  indigo: {
    iconBg: 'bg-indigo-500/15',
    iconText: 'text-indigo-400',
    border: 'border-indigo-500/20',
  },
};

export const MushroomStatCard: React.FC<MushroomStatCardProps> = React.memo(({
  title,
  value,
  unit = '',
  icon: Icon,
  accent = 'blue',
  subtitle,
  className = '',
  onClick,
}) => {
  const styles = accentColors[accent] || accentColors.blue;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden p-3 rounded-2xl bg-[#14161d]/85 border border-white/5 
        hover:border-white/10 transition-all duration-200 flex items-center gap-3 ${onClick ? 'cursor-pointer active:scale-95' : ''} ${className}`}
    >
      <div
        className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${styles.iconBg} ${styles.iconText}`}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-medium text-slate-400 block truncate leading-none mb-1">
          {title}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold tracking-tight text-white font-mono">
            {value}
          </span>
          {unit && <span className="text-xs text-slate-400 font-medium">{unit}</span>}
        </div>
        {subtitle && (
          <span className="text-[10px] text-slate-500 truncate block mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
});
