import React, { useState } from 'react';
import { Plus, Edit2, Check, Globe } from 'lucide-react';
import type { LayoutMode } from '../mushroom/MushroomHeader';
import { SectionContainer } from '../layout/DashboardGrid';
import { MushroomShortcutCard } from '../mushroom/MushroomShortcutCard';
import { ShortcutModal } from './ShortcutModal';
import { useWebShortcuts } from '../../hooks/useWebShortcuts';
import type { WebShortcut, WebShortcutInput } from '../../types';

interface WebShortcutsSectionProps {
  mode: LayoutMode;
}

export const WebShortcutsSection: React.FC<WebShortcutsSectionProps> = ({ mode }) => {
  const {
    shortcuts,
    loading,
    error,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    openShortcut,
  } = useWebShortcuts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<WebShortcut | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleOpenAdd = () => {
    setEditingShortcut(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shortcut: WebShortcut) => {
    setEditingShortcut(shortcut);
    setIsModalOpen(true);
  };

  const handleSave = async (data: WebShortcutInput, id?: number) => {
    if (id) {
      await updateShortcut(id, data);
    } else {
      await addShortcut(data);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteShortcut(id);
  };

  return (
    <>
      <SectionContainer
        title="Web Shortcuts & Apps"
        badge="SQLite • Quick Launch"
        mode={mode}
      >
        {/* Controls bar (Edit mode & Add button) */}
        <div className="flex items-center justify-between px-1 -mt-1 pb-1 border-b border-white/5">
          <span className="text-[11px] font-mono text-slate-500">
            {loading ? 'Memuat...' : `${shortcuts.length} shortcut tersimpan`}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              title={isEditMode ? 'Selesai Mengedit' : 'Edit / Hapus Shortcuts'}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                isEditMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isEditMode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Selesai</span>
                </>
              ) : (
                <Edit2 className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              title="Tambah Web Shortcut"
              className="p-1.5 rounded-lg text-xs font-medium bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 hover:text-blue-300 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">Tambah</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2">
            {error}
          </div>
        )}

        {/* Shortcuts Grid: 2 columns */}
        {shortcuts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {shortcuts.map((shortcut) => (
              <MushroomShortcutCard
                key={shortcut.id}
                shortcut={shortcut}
                isEditMode={isEditMode}
                onOpen={openShortcut}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          !loading && (
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#14161d]/50 border border-dashed border-white/10 text-center">
              <Globe className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-medium text-slate-400 mb-1">
                Belum ada shortcut web
              </p>
              <p className="text-[10px] text-slate-500 mb-3">
                Tambahkan link bookmark homelab atau web app Anda
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Shortcut</span>
              </button>
            </div>
          )
        )}
      </SectionContainer>

      {/* Modal for Adding / Editing */}
      <ShortcutModal
        isOpen={isModalOpen}
        editingShortcut={editingShortcut}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
};
