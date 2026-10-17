import { useState, useEffect, useCallback } from 'react';
import type { WebShortcut, WebShortcutInput } from '../types';

export function useWebShortcuts() {
  const [shortcuts, setShortcuts] = useState<WebShortcut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShortcuts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/shortcuts');
      if (!res.ok) {
        throw new Error(`Failed to fetch shortcuts (${res.status})`);
      }
      const data: WebShortcut[] = await res.json();
      setShortcuts(data);
    } catch (err: any) {
      console.error('[useWebShortcuts] Error fetching:', err);
      setError(err.message || 'Error fetching shortcuts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShortcuts();
  }, [fetchShortcuts]);

  const addShortcut = async (input: WebShortcutInput): Promise<WebShortcut | null> => {
    try {
      const res = await fetch('/api/shortcuts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error(`Failed to add shortcut: ${res.statusText}`);
      }

      const created: WebShortcut = await res.json();
      setShortcuts((prev) => [...prev, created]);
      return created;
    } catch (err: any) {
      console.error('[useWebShortcuts] Error adding:', err);
      setError(err.message);
      return null;
    }
  };

  const updateShortcut = async (
    id: number,
    input: Partial<WebShortcutInput>
  ): Promise<WebShortcut | null> => {
    try {
      // Optimistic update
      setShortcuts((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...input } as WebShortcut : s))
      );

      const res = await fetch(`/api/shortcuts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error(`Failed to update shortcut: ${res.statusText}`);
      }

      const updated: WebShortcut = await res.json();
      setShortcuts((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    } catch (err: any) {
      console.error('[useWebShortcuts] Error updating:', err);
      setError(err.message);
      // Re-sync on failure
      fetchShortcuts();
      return null;
    }
  };

  const deleteShortcut = async (id: number): Promise<boolean> => {
    try {
      // Optimistic update
      setShortcuts((prev) => prev.filter((s) => s.id !== id));

      const res = await fetch(`/api/shortcuts/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`Failed to delete shortcut: ${res.statusText}`);
      }

      return true;
    } catch (err: any) {
      console.error('[useWebShortcuts] Error deleting:', err);
      setError(err.message);
      fetchShortcuts();
      return false;
    }
  };

  const openShortcut = (shortcut: WebShortcut) => {
    const behavior = shortcut.open_behavior || 'both';

    if (behavior === 'browser' || behavior === 'both') {
      window.open(shortcut.url, '_blank');
    }

    if (behavior === 'host' || behavior === 'both') {
      fetch('/api/open-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: shortcut.url }),
      }).catch((err) => {
        console.warn('[useWebShortcuts] Host open notice:', err);
      });
    }
  };

  return {
    shortcuts,
    loading,
    error,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    openShortcut,
    refetch: fetchShortcuts,
  };
}
