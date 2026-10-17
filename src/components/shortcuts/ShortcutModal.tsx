import React, { useState } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import type { WebShortcut, WebShortcutInput, ThemeAccent, ShortcutOpenBehavior } from '../../types';
import { AVAILABLE_ICONS } from './iconRegistry';

interface ShortcutModalProps {
  isOpen: boolean;
  editingShortcut: WebShortcut | null;
  onClose: () => void;
  onSave: (data: WebShortcutInput, id?: number) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

const ACCENT_OPTIONS: { name: ThemeAccent; label: string; colorClass: string }[] = [
  { name: 'amber', label: 'Amber', colorClass: 'bg-amber-400' },
  { name: 'blue', label: 'Blue', colorClass: 'bg-blue-400' },
  { name: 'emerald', label: 'Emerald', colorClass: 'bg-emerald-400' },
  { name: 'cyan', label: 'Cyan', colorClass: 'bg-cyan-400' },
  { name: 'purple', label: 'Purple', colorClass: 'bg-purple-400' },
  { name: 'rose', label: 'Rose', colorClass: 'bg-rose-400' },
  { name: 'orange', label: 'Orange', colorClass: 'bg-orange-400' },
  { name: 'indigo', label: 'Indigo', colorClass: 'bg-indigo-400' },
];

interface ShortcutFormProps {
  editingShortcut: WebShortcut | null;
  onClose: () => void;
  onSave: (data: WebShortcutInput, id?: number) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

const ShortcutForm: React.FC<ShortcutFormProps> = ({
  editingShortcut,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState(editingShortcut?.title || '');
  const [url, setUrl] = useState(editingShortcut?.url || '');
  const [subtitle, setSubtitle] = useState(editingShortcut?.subtitle || '');
  const [icon, setIcon] = useState(editingShortcut?.icon || 'Globe');
  const [accent, setAccent] = useState<ThemeAccent>(editingShortcut?.accent || 'blue');
  const [openBehavior, setOpenBehavior] = useState<ShortcutOpenBehavior>(
    editingShortcut?.open_behavior || 'both'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlBlur = () => {
    if (!subtitle && url) {
      try {
        const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `http://${url}`;
        const parsed = new URL(fullUrl);
        if (parsed.port) {
          setSubtitle(`:${parsed.port}`);
        } else if (parsed.hostname) {
          setSubtitle(parsed.hostname);
        }
      } catch {
        // ignore invalid url
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    if (!url.trim()) {
      setError('URL cannot be empty');
      return;
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `http://${formattedUrl}`;
    }

    setIsSubmitting(true);
    try {
      const payload: WebShortcutInput = {
        title: title.trim(),
        url: formattedUrl,
        subtitle: subtitle.trim(),
        icon,
        accent,
        open_behavior: openBehavior,
        sort_order: editingShortcut?.sort_order ?? 0,
      };

      await onSave(payload, editingShortcut?.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save shortcut');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingShortcut || !onDelete) return;
    if (window.confirm(`Delete shortcut "${editingShortcut.title}"?`)) {
      setIsSubmitting(true);
      try {
        await onDelete(editingShortcut.id);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to delete shortcut');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="w-full max-w-md bg-[#12141c] border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-slate-100 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            {editingShortcut ? 'Edit Web Shortcut' : 'Tambah Web Shortcut'}
          </h3>
          <p className="text-xs text-slate-400">
            Konfigurasi shortcut untuk tampilan Xeneon Edge
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {/* Title Field */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Nama Aplikasi / Judul <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Proxmox VE, Pi-hole, Plex"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#191c26] border border-white/10 focus:border-blue-500 focus:outline-none text-xs text-white placeholder-slate-500"
            required
          />
        </div>

        {/* URL Field */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Target URL <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. http://10.34.11.2:8006 or https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleUrlBlur}
            className="w-full px-3 py-2 rounded-xl bg-[#191c26] border border-white/10 focus:border-blue-500 focus:outline-none text-xs text-white placeholder-slate-500 font-mono"
            required
          />
        </div>

        {/* Subtitle Field */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Subtitle / Port (Opsional)
          </label>
          <input
            type="text"
            placeholder="e.g. :8006, Hypervisor, RouterOS"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#191c26] border border-white/10 focus:border-blue-500 focus:outline-none text-xs text-white placeholder-slate-500"
          />
        </div>

        {/* Accent Color Picker */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Warna Aksen Mushroom
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {ACCENT_OPTIONS.map((opt) => (
              <button
                key={opt.name}
                type="button"
                onClick={() => setAccent(opt.name)}
                className={`w-7 h-7 rounded-full ${opt.colorClass} flex items-center justify-center transition-all cursor-pointer ${
                  accent === opt.name
                    ? `ring-2 ring-white ring-offset-2 ring-offset-[#12141c] scale-110`
                    : 'opacity-70 hover:opacity-100'
                }`}
                title={opt.label}
              >
                {accent === opt.name && <Check className="w-3.5 h-3.5 text-black" />}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Pilih Icon ({icon})
          </label>
          <div className="grid grid-cols-7 gap-1.5 p-2 bg-[#161822] border border-white/5 rounded-2xl max-h-32 overflow-y-auto">
            {AVAILABLE_ICONS.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = icon === opt.name;
              return (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => setIcon(opt.name)}
                  title={opt.label}
                  className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Open Behavior */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Aksi Buka (Open Behavior)
          </label>
          <select
            value={openBehavior}
            onChange={(e) => setOpenBehavior(e.target.value as ShortcutOpenBehavior)}
            className="w-full px-3 py-2 rounded-xl bg-[#191c26] border border-white/10 focus:border-blue-500 focus:outline-none text-xs text-white"
          >
            <option value="both">Host Display + Browser Tab (Default Dual-Launch)</option>
            <option value="browser">Browser Tab Only (window.open)</option>
            <option value="host">Host Edge Display Only (/api/open-app)</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-1">
          {editingShortcut && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : editingShortcut ? 'Perbarui' : 'Tambah'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export const ShortcutModal: React.FC<ShortcutModalProps> = ({
  isOpen,
  editingShortcut,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <ShortcutForm
        key={editingShortcut ? editingShortcut.id : 'new-shortcut'}
        editingShortcut={editingShortcut}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
      />
    </div>
  );
};
