import React from 'react';
import type { LayoutMode } from '../mushroom/MushroomHeader';

interface DashboardGridProps {
  mode: LayoutMode;
  children: React.ReactNode;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({ mode, children }) => {
  if (mode === 'ribbon') {
    return (
      <div className="w-full flex items-stretch gap-3 overflow-x-auto p-4 snap-x snap-mandatory">
        {children}
      </div>
    );
  }

  // Default Grid Layout
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 p-4">
      {children}
    </div>
  );
};

interface SectionContainerProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
  mode?: LayoutMode;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  badge,
  children,
  mode = 'grid',
}) => {
  if (mode === 'ribbon') {
    return (
      <div className="flex flex-col gap-2.5 min-w-[320px] max-w-[380px] shrink-0 bg-[#0d0f15]/60 p-3 rounded-3xl border border-white/5 snap-start">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            {title}
          </span>
          {badge && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
              {badge}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2.5">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 col-span-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          {title}
        </span>
        {badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
};
