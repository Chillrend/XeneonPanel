import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.resolve(DATA_DIR, 'shortcuts.db');
export const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency and write safety
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS shortcuts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    subtitle TEXT DEFAULT '',
    icon TEXT DEFAULT 'Globe',
    accent TEXT DEFAULT 'blue',
    open_behavior TEXT DEFAULT 'both',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export interface DbShortcut {
  id: number;
  title: string;
  url: string;
  subtitle: string;
  icon: string;
  accent: string;
  open_behavior: 'both' | 'browser' | 'host';
  sort_order: number;
  created_at: string;
}

// Initial seed data if database is fresh
const countRow = db.prepare('SELECT COUNT(*) as count FROM shortcuts').get() as { count: number };
if (countRow.count === 0) {
  const insert = db.prepare(`
    INSERT INTO shortcuts (title, url, subtitle, icon, accent, open_behavior, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const initialSeeds: [string, string, string, string, string, string, number][] = [
    ['Home Assistant', 'http://homeassistant.local:8123', ':8123', 'Globe', 'amber', 'both', 1],
    ['Frigate NVR', 'http://frigate.local:5000', ':5000', 'Video', 'cyan', 'both', 2],
    ['Proxmox VE', 'https://pve1.local:8006', ':8006', 'Server', 'purple', 'both', 3],
    ['Mikrotik Router', 'http://10.34.11.1', 'RouterOS', 'Network', 'emerald', 'both', 4],
  ];

  for (const seed of initialSeeds) {
    insert.run(...seed);
  }
}

export function getAllShortcuts(): DbShortcut[] {
  return db
    .prepare('SELECT * FROM shortcuts ORDER BY sort_order ASC, id ASC')
    .all() as DbShortcut[];
}

export function getShortcutById(id: number): DbShortcut | undefined {
  return db.prepare('SELECT * FROM shortcuts WHERE id = ?').get(id) as DbShortcut | undefined;
}

export function createShortcut(data: {
  title: string;
  url: string;
  subtitle?: string;
  icon?: string;
  accent?: string;
  open_behavior?: string;
  sort_order?: number;
}): DbShortcut {
  // If sort_order is not provided, put it at the end
  let sortOrder = data.sort_order;
  if (sortOrder === undefined) {
    const maxRow = db.prepare('SELECT MAX(sort_order) as max_order FROM shortcuts').get() as {
      max_order: number | null;
    };
    sortOrder = (maxRow.max_order || 0) + 1;
  }

  const result = db
    .prepare(
      `
    INSERT INTO shortcuts (title, url, subtitle, icon, accent, open_behavior, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
    )
    .run(
      data.title,
      data.url,
      data.subtitle || '',
      data.icon || 'Globe',
      data.accent || 'blue',
      data.open_behavior || 'both',
      sortOrder
    );

  return getShortcutById(Number(result.lastInsertRowid))!;
}

export function updateShortcut(
  id: number,
  data: Partial<{
    title: string;
    url: string;
    subtitle: string;
    icon: string;
    accent: string;
    open_behavior: string;
    sort_order: number;
  }>
): DbShortcut | undefined {
  const current = getShortcutById(id);
  if (!current) return undefined;

  const title = data.title ?? current.title;
  const url = data.url ?? current.url;
  const subtitle = data.subtitle ?? current.subtitle;
  const icon = data.icon ?? current.icon;
  const accent = data.accent ?? current.accent;
  const open_behavior = data.open_behavior ?? current.open_behavior;
  const sort_order = data.sort_order ?? current.sort_order;

  db.prepare(
    `
    UPDATE shortcuts
    SET title = ?, url = ?, subtitle = ?, icon = ?, accent = ?, open_behavior = ?, sort_order = ?
    WHERE id = ?
  `
  ).run(title, url, subtitle, icon, accent, open_behavior, sort_order, id);

  return getShortcutById(id);
}

export function deleteShortcut(id: number): boolean {
  const result = db.prepare('DELETE FROM shortcuts WHERE id = ?').run(id);
  return result.changes > 0;
}

export function reorderShortcuts(orderedIds: number[]): boolean {
  const updateStmt = db.prepare('UPDATE shortcuts SET sort_order = ? WHERE id = ?');
  const transaction = db.transaction((ids: number[]) => {
    ids.forEach((id, index) => {
      updateStmt.run(index + 1, id);
    });
  });

  transaction(orderedIds);
  return true;
}
