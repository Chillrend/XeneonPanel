import React, { useState } from 'react';
import { Lock, Moon, RotateCcw, Power, Check, AlertTriangle } from 'lucide-react';

interface PcPowerControlsProps {
  onPowerAction: (action: 'lock' | 'sleep' | 'restart' | 'shutdown') => Promise<boolean>;
  disabled?: boolean;
}

export const PcPowerControls: React.FC<PcPowerControlsProps> = ({
  onPowerAction,
  disabled = false,
}) => {
  const [confirmAction, setConfirmAction] = useState<'restart' | 'shutdown' | null>(null);
  const [successAction, setSuccessAction] = useState<string | null>(null);

  const handleAction = async (action: 'lock' | 'sleep' | 'restart' | 'shutdown') => {
    if (action === 'restart' || action === 'shutdown') {
      if (confirmAction !== action) {
        setConfirmAction(action);
        setTimeout(() => setConfirmAction(null), 3500);
        return;
      }
    }

    setConfirmAction(null);
    const ok = await onPowerAction(action);
    if (ok) {
      setSuccessAction(action);
      setTimeout(() => setSuccessAction(null), 2500);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {/* Lock Workstation */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleAction('lock')}
        title="Kunci Layar PC (Win + L)"
        className="p-2.5 rounded-2xl bg-[#151822] border border-white/5 hover:border-blue-500/30 hover:bg-[#1a1e2b] text-slate-300 hover:text-blue-400 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
      >
        <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400">
          <Lock className="w-4 h-4" />
        </div>
        <span className="text-[11px] font-medium">Kunci</span>
      </button>

      {/* Sleep / Suspend */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleAction('sleep')}
        title="Sleep / Suspend PC"
        className="p-2.5 rounded-2xl bg-[#151822] border border-white/5 hover:border-indigo-500/30 hover:bg-[#1a1e2b] text-slate-300 hover:text-indigo-400 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-400">
          <Moon className="w-4 h-4" />
        </div>
        <span className="text-[11px] font-medium">Sleep</span>
      </button>

      {/* Restart */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleAction('restart')}
        title="Mulai Ulang Komputer"
        className={`p-2.5 rounded-2xl border active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 ${
          confirmAction === 'restart'
            ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
            : 'bg-[#151822] border-white/5 hover:border-amber-500/30 hover:bg-[#1a1e2b] text-slate-300 hover:text-amber-400'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400">
          {confirmAction === 'restart' ? (
            <AlertTriangle className="w-4 h-4 text-amber-300" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
        </div>
        <span className="text-[11px] font-medium">
          {confirmAction === 'restart' ? 'Yakin?' : 'Restart'}
        </span>
      </button>

      {/* Shutdown */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleAction('shutdown')}
        title="Matikan PC"
        className={`p-2.5 rounded-2xl border active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 ${
          confirmAction === 'shutdown'
            ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
            : 'bg-[#151822] border-white/5 hover:border-rose-500/30 hover:bg-[#1a1e2b] text-slate-300 hover:text-rose-400'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-400">
          {confirmAction === 'shutdown' ? (
            <AlertTriangle className="w-4 h-4 text-rose-300" />
          ) : successAction === 'shutdown' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Power className="w-4 h-4" />
          )}
        </div>
        <span className="text-[11px] font-medium">
          {confirmAction === 'shutdown' ? 'Yakin?' : 'Shutdown'}
        </span>
      </button>
    </div>
  );
};
