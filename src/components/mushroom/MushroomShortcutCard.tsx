import React from 'react';
import { ExternalLink, Edit2, Trash2 } from 'lucide-react';
import type { WebShortcut, ThemeAccent } from '../../types';
import { getShortcutIcon } from '../shortcuts/iconRegistry';

interface MushroomShortcutCardProps {
  shortcut: WebShortcut;
  isEditMode?: boolean;
  onOpen: (shortcut: WebShortcut) => void;
  onEdit: (shortcut: WebShortcut) => void;
  onDelete: (id: number) => void;
}

const accentMap: Record<
  ThemeAccent,
  {
    iconBg: string;
    iconText: string;
    borderHover: string;
    glowHover: string;
  }
> = {
  amber: {
    iconBg: 'bg-amber-500/15',
    iconText: 'text-amber-400',
    borderHover: 'hover:border-amber-500/40',
    glowHover: 'hover:shadow-[0_0_15px_rgba(245,158,11,0.12)]',
  },
  blue: {
    iconBg: 'bg-blue-500/15',
    iconText: 'text-blue-400',
    borderHover: 'hover:border-blue-500/40',
    glowHover: 'hover:shadow-[0_0_15px_rgba(59,130,246,0.12)]',
  },
  emerald: {
    iconBg: 'bg-emerald-500/15',
    iconText: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500/40',
    glowHover: 'hover:shadow-[0_0_15px_rgba(16,185,129,0.12)]',
  },
  rose: {
    iconBg: 'bg-rose-500/15',
    iconText: 'text-rose-400',
    borderHover: 'hover:border-rose-500/40',
    glowHover: 'hover:shadow-[0_0_15px_rgba(244,63,94,0.12)]',
  },
  purple: {
    iconBg: 'bg-purple-500/15',
    iconText: 'text-purple-400',
    borderHover: 'hover:border-purple-500/40',
    glowHover: 'hover:shadow-[0_0_15px_rgba(168,85,247,0.12)]',
  },
  cyan: {
    iconBg: 'bg-cyan-500/15',
    iconText: 'text-cyan-400',
    borderHover: 'hover:border-cyan-500/40',
    glowHover: 'hover:shadow-[0_0_15px_rgba(6,182,212,0.12)]',
  },
  orange: {
    iconBg: 'bg-orange-500/15',
    iconText: 'text-orange-400',
    borderHover: 'hover:border-orange-500/40',
    glowHover: 'hover:shadow-[0_0_15px_rgba(249,115,22,0.12)]',
  },
  indigo: {
    iconBg: 'bg-indigo-500/15',
    iconText: 'text-indigo-400',
    borderHover: 'hover:border-indigo-500/40',
    glowHover: 'hover:shadow-[0_0_15px_rgba(99,102,241,0.12)]',
  },
};

export const MushroomShortcutCard: React.FC<MushroomShortcutCardProps> = ({
  shortcut,
  isEditMode = false,
  onOpen,
  onEdit,
  onDelete,
}) => {
  const icon = getShortcutIcon(shortcut.icon);
  const accentKey = (shortcut.accent as ThemeAccent) || 'blue';
  const styles = accentMap[accentKey] || accentMap.blue;

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.stopPropagation();
      onEdit(shortcut);
    } else {
      onOpen(shortcut);
    }
  };

  const displaySubtitle = shortcut.subtitle || (() => {
    try {
      const parsed = new URL(shortcut.url);
      return parsed.port ? `:${parsed.port}` : parsed.hostname;
    } catch {
      return '';
    }
  })();

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as any);
        }
      }}
      className={`group relative p-2.5 rounded-2xl bg-[#14161d]/85 border border-white/5 
        ${styles.borderHover} ${styles.glowHover} hover:bg-[#181a24] 
        transition-all duration-200 text-left flex items-center justify-between cursor-pointer select-none active:scale-[0.98]`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Glowing Icon Chip */}
        <div
          className={`w-9 h-9 rounded-full ${styles.iconBg} ${styles.iconText} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
        >
          {React.createElement(icon, { className: 'w-4 h-4' })}
        </div>

        {/* Text Details */}
        <div className="truncate flex-1 pr-1">
          <span className="text-xs font-semibold text-slate-200 block truncate leading-tight">
            {shortcut.title}
          </span>
          {displaySubtitle && (
            <span className="text-[10px] text-slate-500 truncate block mt-0.5">
              {displaySubtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1 shrink-0">
        {isEditMode ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(shortcut);
              }}
              title="Edit shortcut"
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(shortcut.id);
              }}
              title="Delete shortcut"
              className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <ExternalLink className={`w-3.5 h-3.5 text-slate-500 ${styles.iconText} opacity-70 group-hover:opacity-100 transition-opacity`} />
        )}
      </div>
    </div>
  );
};
