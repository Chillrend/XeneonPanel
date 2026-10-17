import React, { useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  ChevronUp,
  Monitor,
  Wifi,
  WifiOff,
  Speaker,
} from 'lucide-react';
import { usePcAgent } from '../../hooks/usePcAgent';
import { PcPowerControls } from './PcPowerControls';
import { PerAppMixer } from './PerAppMixer';

interface ControlCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlCenterDrawer: React.FC<ControlCenterDrawerProps> = ({ isOpen, onClose }) => {
  const {
    status,
    setMasterVolume,
    setMasterMute,
    setAppVolume,
    setAppMute,
    sendPowerAction,
  } = usePcAgent();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Dark frosted backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
        />
      )}

      {/* Slide-down Android Shade Drawer */}
      <div
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ease-out transform ${
          isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full max-w-4xl mx-auto bg-[#0d0f17]/95 backdrop-blur-2xl border-b border-white/10 rounded-b-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] p-5 flex flex-col gap-4 text-slate-100">
          {/* Top Status Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                  status.online
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-slate-400 border border-white/5'
                }`}
              >
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight leading-tight">
                    {status.hostname}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      status.online
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {status.online ? (
                      <>
                        <Wifi className="w-2.5 h-2.5" />
                        <span>Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-2.5 h-2.5" />
                        <span>Standby / Sleep</span>
                      </>
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {status.os} • {status.device_name}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Tutup Control Center"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>

          {/* Section 1: PC Quick Power Actions */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold px-1">
              Manajemen Daya PC
            </span>
            <PcPowerControls onPowerAction={sendPowerAction} disabled={!status.online} />
          </div>

          {/* Section 2: Master Volume Slider */}
          <div className="p-3.5 rounded-2xl bg-[#14161f]/90 border border-white/5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={!status.online}
                  onClick={() => setMasterMute(!status.master_muted)}
                  title={status.master_muted ? 'Unmute Master' : 'Mute Master'}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                    status.master_muted
                      ? 'bg-rose-500/15 text-rose-400'
                      : 'bg-blue-500/15 text-blue-400'
                  }`}
                >
                  {status.master_muted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <div>
                  <span className="text-xs font-semibold text-slate-100 block leading-tight">
                    Master Volume
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Speaker className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] text-slate-400">{status.device_name}</span>
                  </div>
                </div>
              </div>

              <span className="font-mono text-sm font-bold text-white">
                {status.master_muted ? 'Muted' : `${status.master_volume}%`}
              </span>
            </div>

            {/* Master Slider */}
            <input
              type="range"
              min="0"
              max="100"
              disabled={!status.online}
              value={status.master_muted ? 0 : status.master_volume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="w-full h-2 bg-[#1f2330] rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-40"
            />
          </div>

          {/* Section 3: Per-App Volume Mixer */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
                Per-App Audio Mixer (Windows 11)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {status.sessions.length} stream aktif
              </span>
            </div>
            <PerAppMixer
              sessions={status.sessions}
              onVolumeChange={setAppVolume}
              onMuteToggle={setAppMute}
              disabled={!status.online}
            />
          </div>

          {/* Bottom Pull-Up Handle */}
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={onClose}
              title="Tutup Control Center"
              className="w-24 h-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors cursor-pointer"
            />
          </div>
        </div>
      </div>
    </>
  );
};
