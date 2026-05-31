/**
 * GENIE Sync Service
 * Cross-device synchronization for Personal Intelligence
 * Port: 4707
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60000, max: 100 }));

// Types
interface Device {
  id: string;
  user_id: string;
  type: 'mac' | 'windows' | 'iphone' | 'android' | 'web';
  name: string;
  last_seen: string;
  sync_enabled: boolean;
  created_at: string;
}

interface SyncState {
  user_id: string;
  devices: Device[];
  last_sync: string;
  pending_changes: SyncChange[];
}

interface SyncChange {
  id: string;
  entity_type: 'memory' | 'relationship' | 'project' | 'briefing';
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: string;
  device_id: string;
}

// In-memory stores (replace with MongoDB in production)
const devices = new Map<string, Device[]>();
const syncStates = new Map<string, SyncState>();
const changes = new Map<string, SyncChange[]>();

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'genie-sync-service', port: 4707 });
});

app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
app.get('/health/ready', (req, res) => res.json({ status: 'ready' }));

// Device Management
app.post('/api/devices', (req, res) => {
  const { user_id, type, name } = req.body;
  if (!user_id || !type || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const device: Device = {
    id: `dev_${Date.now()}`,
    user_id,
    type,
    name,
    last_seen: new Date().toISOString(),
    sync_enabled: true,
    created_at: new Date().toISOString()
  };

  const userDevices = devices.get(user_id) || [];
  userDevices.push(device);
  devices.set(user_id, userDevices);

  res.json({ success: true, device });
});

app.get('/api/devices', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(400).json({ error: 'X-User-Id required' });

  const userDevices = devices.get(userId) || [];
  res.json({ devices: userDevices });
});

app.delete('/api/devices/:id', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const deviceId = req.params.id;

  const userDevices = devices.get(userId) || [];
  const filtered = userDevices.filter(d => d.id !== deviceId);
  devices.set(userId, filtered);

  res.json({ success: true });
});

// Sync Operations
app.get('/api/sync/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(400).json({ error: 'X-User-Id required' });

  const userChanges = changes.get(userId) || [];
  const deviceChanges = userChanges.filter(c => c.device_id !== deviceId);

  res.json({
    changes: deviceChanges,
    last_sync: new Date().toISOString()
  });
});

app.post('/api/sync', (req, res) => {
  const { user_id, device_id, changes: syncChanges } = req.body;
  if (!user_id || !device_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const processedChanges: SyncChange[] = [];

  for (const change of syncChanges || []) {
    const syncChange: SyncChange = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entity_type: change.entity_type,
      entity_id: change.entity_id,
      operation: change.operation,
      data: change.data,
      timestamp: new Date().toISOString(),
      device_id
    };

    const userChanges = changes.get(user_id) || [];
    userChanges.push(syncChange);
    changes.set(user_id, userChanges);
    processedChanges.push(syncChange);
  }

  // Update device last_seen
  const userDevices = devices.get(user_id) || [];
  const device = userDevices.find(d => d.id === device_id);
  if (device) {
    device.last_seen = new Date().toISOString();
  }

  res.json({
    success: true,
    synced: processedChanges.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/sync/resolve', (req, res) => {
  const { user_id, change_ids } = req.body;
  if (!user_id || !change_ids) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const userChanges = changes.get(user_id) || [];
  const filtered = userChanges.filter(c => !change_ids.includes(c.id));
  changes.set(user_id, filtered);

  res.json({ success: true, resolved: change_ids.length });
});

// Get sync state
app.get('/api/sync/state', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(400).json({ error: 'X-User-Id required' });

  const userDevices = devices.get(userId) || [];
  const userChanges = changes.get(userId) || [];

  const state: SyncState = {
    user_id: userId,
    devices: userDevices,
    last_sync: new Date().toISOString(),
    pending_changes: userChanges
  };

  res.json(state);
});

// Start server
const PORT = process.env.PORT || 4707;
app.listen(PORT, () => {
  console.log(`GENIE Sync Service running on port ${PORT}`);
});

export default app;
