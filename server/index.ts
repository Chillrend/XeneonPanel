import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { HomeAssistantClient } from './haClient';
import { InfluxClient } from './influxClient';
import { pcHub } from './pcHub';
import {
  getAllShortcuts,
  createShortcut,
  updateShortcut,
  deleteShortcut,
  reorderShortcuts,
} from './db';

// Load .env
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Content-Security-Policy', "frame-ancestors * 'self' app: file:;");
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  next();
});
app.use(express.json());

// Initialize WebSocket hub for PC Agent and UI clients
pcHub.init(server);

const haClient = new HomeAssistantClient();
const influxClient = new InfluxClient();

// Status endpoint
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    homeAssistant: haClient.getStatus(),
    influxDb: influxClient.getStatus(),
  });
});

// Home Assistant endpoints
app.get('/api/ha/states', async (_req, res) => {
  try {
    const states = await haClient.getAllStates();
    res.json(states);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ha/states/:entity_id', async (req, res) => {
  try {
    const state = await haClient.getState(req.params.entity_id);
    if (!state) {
      return res.status(404).json({ error: 'Entity not found' });
    }
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ha/services/:domain/:service', async (req, res) => {
  try {
    const { domain, service } = req.params;
    const result = await haClient.callService(domain, service, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// InfluxDB endpoints
app.get('/api/influx/history', async (req, res) => {
  try {
    const bucket = (req.query.bucket as string) || 'farhan_homelab';
    const measurement = (req.query.measurement as string) || 'W';
    const field = (req.query.field as string) || 'value';
    const entityId = req.query.entityId as string | undefined;
    const host = req.query.host as string | undefined;
    const sensor = req.query.sensor as string | undefined;
    const targetUrl = req.query.url as string | undefined;
    const ifName = req.query.ifName as string | undefined;
    const isNetworkRate = req.query.isNetworkRate === 'true';
    const tagKey = req.query.tagKey as string | undefined;
    const tagValue = req.query.tagValue as string | undefined;
    const range = (req.query.range as string) || '2h';
    const window = (req.query.window as string) || '2m';

    const points = await influxClient.getMetricHistory({
      bucket,
      measurement,
      field,
      entityId,
      host,
      sensor,
      url: targetUrl,
      ifName,
      isNetworkRate,
      tagKey,
      tagValue,
      range,
      window,
    });

    res.json({
      bucket,
      measurement,
      field,
      entityId,
      host,
      points,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// App launcher endpoint for host machine or connected Windows PC
app.post('/api/open-app', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  // First priority: if Windows PC agent is connected, forward to desktop browser
  const dispatchedToPc = pcHub.openUrlOnPc(url);
  if (dispatchedToPc) {
    return res.json({ success: true, target: 'pc_agent', url });
  }

  // Fallback: spawn on host machine running the server
  const cmd = `firefox "${url}" || xdg-open "${url}" || sensible-browser "${url}" &`;
  exec(cmd, (err) => {
    if (err) {
      console.warn('[open-app] Host launch notice:', err.message);
    }
  });

  res.json({ success: true, target: 'local_host', url });
});

// PC Companion Agent endpoints
app.get('/api/pc/status', (_req, res) => {
  res.json(pcHub.getStatus());
});

app.post('/api/pc/volume', (req, res) => {
  const { target = 'master', volume } = req.body;
  if (volume === undefined || typeof volume !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid "volume" (0-100)' });
  }

  if (target === 'master') {
    pcHub.setMasterVolume(volume);
  } else {
    pcHub.setAppVolume(target, volume);
  }

  res.json({ success: true, target, volume });
});

app.post('/api/pc/mute', (req, res) => {
  const { target = 'master', muted } = req.body;
  if (muted === undefined || typeof muted !== 'boolean') {
    return res.status(400).json({ error: 'Missing or invalid "muted" boolean' });
  }

  if (target === 'master') {
    pcHub.setMasterMute(muted);
  } else {
    pcHub.setAppMute(target, muted);
  }

  res.json({ success: true, target, muted });
});

app.post('/api/pc/power', (req, res) => {
  const { action } = req.body;
  if (!['lock', 'sleep', 'restart', 'shutdown'].includes(action)) {
    return res.status(400).json({ error: 'Invalid power action' });
  }

  const success = pcHub.sendPowerAction(action);
  res.json({ success, action });
});

app.post('/api/influx/query', async (req, res) => {
  try {
    const { flux } = req.body;
    if (!flux) {
      return res.status(400).json({ error: 'Missing "flux" query string in request body' });
    }
    const result = await influxClient.queryFlux(flux);
    res.json({ rows: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Web Shortcuts SQLite endpoints
app.get('/api/shortcuts', (_req, res) => {
  try {
    const shortcuts = getAllShortcuts();
    res.json(shortcuts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shortcuts', (req, res) => {
  try {
    const { title, url, subtitle, icon, accent, open_behavior, sort_order } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }
    const created = createShortcut({
      title,
      url,
      subtitle,
      icon,
      accent,
      open_behavior,
      sort_order,
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/shortcuts/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid shortcut ID' });
    }
    const updated = updateShortcut(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Shortcut not found' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/shortcuts/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid shortcut ID' });
    }
    const success = deleteShortcut(id);
    if (!success) {
      return res.status(404).json({ error: 'Shortcut not found' });
    }
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shortcuts/reorder', (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds array is required' });
    }
    reorderShortcuts(orderedIds);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Static assets serving in production mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
    next();
  });
}

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 XeneonPanel Proxy Server running on http://localhost:${PORT}`);
  console.log(`   - Home Assistant: [${haClient.getStatus().mode}] ${haClient.getStatus().url}`);
  console.log(`   - InfluxDB 2.x:   [${influxClient.getStatus().mode}] ${influxClient.getStatus().url}`);
  console.log(`   - SQLite DB:      [active] server/data/shortcuts.db`);
});
