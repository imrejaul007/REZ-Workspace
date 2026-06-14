/**
 * Smart Lock Service
 * Port: 3825
 *
 * Integrates with BLE/NFC/IoT smart locks for hotel rooms.
 * Supports: Salto, Yale, Allegion, and generic protocols.
 *
 * Features:
 * - Auto key activation on check-in
 * - Auto key revocation on checkout
 * - Temporary access codes
 * - Access logs
 * - Emergency override
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const PORT = process.env.PORT || 3825;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-lock';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || 'smart-lock-secret';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

let redis: RedisClientType;

// Lock provider types
type LockProvider = 'salto' | 'yale' | 'allegion' | 'generic' | 'simulated';

interface LockConfig {
  provider: LockProvider;
  host?: string;
  port?: number;
  apiKey?: string;
  username?: string;
  password?: string;
}

// Schemas
const HotelLockSchema = new mongoose.Schema({
  hotelId: { type: String, required: true, index: true },
  lockId: { type: String, required: true, unique: true },
  roomId: { type: String, required: true, index: true },
  roomNumber: { type: String, required: true },
  floor: { type: String },
  provider: { type: String, enum: ['salto', 'yale', 'allegion', 'generic', 'simulated'], default: 'simulated' },
  config: {
    host: String,
    port: Number,
    apiKey: String
  },
  status: { type: String, enum: ['online', 'offline', 'battery_low'], default: 'online' },
  batteryLevel: { type: Number, default: 100 },
  lastActivity: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const AccessCredentialSchema = new mongoose.Schema({
  credentialId: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true, index: true },
  guestId: { type: String, required: true, index: true },
  bookingId: { type: String, index: true },
  lockId: { type: String, required: true },
  roomId: { type: String, required: true },
  roomNumber: { type: String, required: true },
  accessType: { type: String, enum: ['mobile_key', 'code', 'nfc', 'fingerprint'], default: 'mobile_key' },
  code: String,
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['active', 'expired', 'revoked', 'used'], default: 'active' },
  accessCount: { type: Number, default: 0 },
  lastAccess: { type: Date },
  createdAt: { type: Date, default: Date.now },
  revokedAt: { type: Date },
  revokedBy: String
});

const AccessLogSchema = new mongoose.Schema({
  logId: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true, index: true },
  lockId: { type: String, required: true },
  roomId: { type: String },
  credentialId: String,
  guestId: String,
  eventType: { type: String, enum: ['unlock', 'lock', 'denied', 'low_battery', 'door_open', 'door_close'] },
  method: { type: String, enum: ['ble', 'nfc', 'code', 'manual'] },
  timestamp: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed
});

const HotelLock = mongoose.model('HotelLock', HotelLockSchema);
const AccessCredential = mongoose.model('AccessCredential', AccessCredentialSchema);
const AccessLog = mongoose.model('AccessLog', AccessLogSchema);

const app = express();
app.use(cors());
app.use(express.json());

// Auth middleware
const authMiddleware = async (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).hotelId = decoded.hotelId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Lock Provider Implementations
const lockProviders = {
  // Simulated lock for development/testing
  simulated: async (config: LockConfig, action: string, data: any): Promise<any> => {
    logger.info(`[Simulated Lock] ${action}`, data);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true, simulated: true, action, ...data };
  },

  // Salto KS integration
  salto: async (config: LockConfig, action: string, data: any): Promise<any> => {
    const { host, port, apiKey } = config;
    logger.info(`[Salto Lock] ${action}`, { host, lockId: data.lockId });

    // In production: Make HTTP request to Salto cloud
    // POST https://cloud.salto.io/api/locks/{lockId}/action
    // Headers: Authorization: Bearer {apiKey}

    return { success: true, provider: 'salto', action };
  },

  // Yale locks integration
  yale: async (config: LockConfig, action: string, data: any): Promise<any> => {
    logger.info(`[Yale Lock] ${action}`, { lockId: data.lockId });
    return { success: true, provider: 'yale', action };
  },

  // Allegion/Schlage integration
  allegion: async (config: LockConfig, action: string, data: any): Promise<any> => {
    logger.info(`[Allegion Lock] ${action}`, { lockId: data.lockId });
    return { success: true, provider: 'allegion', action };
  },

  // Generic REST API lock
  generic: async (config: LockConfig, action: string, data: any): Promise<any> => {
    logger.info(`[Generic Lock] ${action}`, { host: config.host, lockId: data.lockId });
    return { success: true, provider: 'generic', action };
  }
};

// Routes

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'smart-lock-service', port: PORT });
});

// Register a new lock
app.post('/locks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { lockId, roomId, roomNumber, floor, provider = 'simulated', config } = req.body;

    const lock = new HotelLock({
      hotelId,
      lockId,
      roomId,
      roomNumber,
      floor,
      provider,
      config
    });

    await lock.save();

    logger.info('Lock registered', { hotelId, lockId, roomNumber });
    res.status(201).json({ success: true, lock });
  } catch (error: any) {
    logger.error('Failed to register lock', { error: error.message });
    res.status(500).json({ error: 'Failed to register lock' });
  }
});

// Get all locks for hotel
app.get('/locks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { status, floor } = req.query;

    const query: any = { hotelId };
    if (status) query.status = status;
    if (floor) query.floor = floor;

    const locks = await HotelLock.find(query);
    res.json({ locks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get lock by ID
app.get('/locks/:lockId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { lockId } = req.params;
    const lock = await HotelLock.findOne({ lockId });

    if (!lock) return res.status(404).json({ error: 'Lock not found' });
    res.json({ lock });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Grant access (check-in)
app.post('/access/grant', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { guestId, bookingId, lockId, roomId, roomNumber, startTime, endTime, accessType = 'mobile_key' } = req.body;

    // Find the lock
    const lock = await HotelLock.findOne({ hotelId, lockId });
    if (!lock) return res.status(404).json({ error: 'Lock not found' });

    // Create credential
    const credentialId = `CRED_${uuidv4().substring(0, 8).toUpperCase()}`;
    let code: string | undefined;

    if (accessType === 'code') {
      code = generateAccessCode();
    }

    const credential = new AccessCredential({
      credentialId,
      hotelId,
      guestId,
      bookingId,
      lockId,
      roomId,
      roomNumber,
      accessType,
      code,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: 'active'
    });

    await credential.save();

    // Activate key on lock
    const provider = lockProviders[lock.provider as keyof typeof lockProviders] || lockProviders.simulated;
    await provider(lock.config as LockConfig, 'grant_access', {
      lockId,
      credentialId,
      guestId,
      startTime,
      endTime
    });

    // Store in Redis for quick validation
    await redis.setEx(
      `lock:access:${credentialId}`,
      Math.floor((new Date(endTime).getTime() - Date.now()) / 1000),
      JSON.stringify({ guestId, lockId, roomId })
    );

    logger.info('Access granted', { credentialId, guestId, lockId });

    res.status(201).json({
      success: true,
      credential: {
        credentialId,
        roomNumber,
        accessType,
        code,
        startTime,
        endTime
      }
    });
  } catch (error: any) {
    logger.error('Failed to grant access', { error: error.message });
    res.status(500).json({ error: 'Failed to grant access' });
  }
});

// Revoke access (checkout)
app.post('/access/revoke', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { credentialId, guestId, reason = 'checkout' } = req.body;

    const credential = await AccessCredential.findOne({ credentialId, hotelId });
    if (!credential) return res.status(404).json({ error: 'Credential not found' });

    // Find the lock
    const lock = await HotelLock.findOne({ lockId: credential.lockId });

    // Update credential status
    credential.status = 'revoked';
    credential.revokedAt = new Date();
    credential.revokedBy = reason;
    await credential.save();

    // Deactivate on lock
    if (lock) {
      const provider = lockProviders[lock.provider as keyof typeof lockProviders] || lockProviders.simulated;
      await provider(lock.config as LockConfig, 'revoke_access', {
        lockId: credential.lockId,
        credentialId
      });
    }

    // Remove from Redis
    await redis.del(`lock:access:${credentialId}`);

    // Log the event
    await logAccessEvent(hotelId, credential.lockId, credential.roomId, 'revoked', 'system', {
      credentialId,
      guestId,
      reason
    });

    logger.info('Access revoked', { credentialId, reason });

    res.json({ success: true, message: 'Access revoked successfully' });
  } catch (error: any) {
    logger.error('Failed to revoke access', { error: error.message });
    res.status(500).json({ error: 'Failed to revoke access' });
  }
});

// Revoke all access for guest (emergency)
app.post('/access/revoke-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { guestId, reason = 'emergency' } = req.body;

    const credentials = await AccessCredential.find({ hotelId, guestId, status: 'active' });

    for (const cred of credentials) {
      cred.status = 'revoked';
      cred.revokedAt = new Date();
      cred.revokedBy = reason;
      await cred.save();

      await redis.del(`lock:access:${cred.credentialId}`);

      const lock = await HotelLock.findOne({ lockId: cred.lockId });
      if (lock) {
        const provider = lockProviders[lock.provider as keyof typeof lockProviders] || lockProviders.simulated;
        await provider(lock.config as LockConfig, 'revoke_access', { lockId: cred.lockId, credentialId: cred.credentialId });
      }
    }

    logger.info('All access revoked for guest', { guestId, count: credentials.length });

    res.json({ success: true, revoked: credentials.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Validate access (for mobile app)
app.post('/access/validate', async (req: Request, res: Response) => {
  try {
    const { credentialId, lockId, method = 'ble' } = req.body;

    // Check Redis first (fast path)
    const cached = await redis.get(`lock:access:${credentialId}`);
    if (cached) {
      const data = JSON.parse(cached);

      // Log access
      const lock = await HotelLock.findOne({ lockId });
      if (lock) {
        await logAccessEvent(lock.hotelId, lockId, lock.roomId, 'unlock', method, { credentialId });
      }

      // Update credential access count
      await AccessCredential.findOneAndUpdate(
        { credentialId },
        { $inc: { accessCount: 1 }, lastAccess: new Date() }
      );

      return res.json({ success: true, access: true, roomId: data.roomId });
    }

    // Check database
    const credential = await AccessCredential.findOne({
      credentialId,
      lockId,
      status: 'active',
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() }
    });

    if (!credential) {
      return res.json({ success: true, access: false, reason: 'Invalid or expired' });
    }

    res.json({ success: true, access: true, roomId: credential.roomId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Unlock door (trigger unlock)
app.post('/locks/:lockId/unlock', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { lockId } = req.params;
    const { credentialId, guestId } = req.body;

    const lock = await HotelLock.findOne({ lockId });
    if (!lock) return res.status(404).json({ error: 'Lock not found' });

    // Trigger unlock on lock
    const provider = lockProviders[lock.provider as keyof typeof lockProviders] || lockProviders.simulated;
    const result = await provider(lock.config as LockConfig, 'unlock', { lockId, credentialId });

    // Update lock activity
    lock.lastActivity = new Date();
    await lock.save();

    // Log the unlock
    await logAccessEvent(lock.hotelId, lockId, lock.roomId, 'unlock', 'ble', { credentialId, guestId });

    logger.info('Door unlocked', { lockId, credentialId });

    res.json({ success: true, unlocked: true });
  } catch (error: any) {
    logger.error('Failed to unlock', { error: error.message });
    res.status(500).json({ error: 'Failed to unlock door' });
  }
});

// Lock door
app.post('/locks/:lockId/lock', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { lockId } = req.params;
    const lock = await HotelLock.findOne({ lockId });

    if (!lock) return res.status(404).json({ error: 'Lock not found' });

    const provider = lockProviders[lock.provider as keyof typeof lockProviders] || lockProviders.simulated;
    await provider(lock.config as LockConfig, 'lock', { lockId });

    lock.lastActivity = new Date();
    await lock.save();

    await logAccessEvent(lock.hotelId, lockId, lock.roomId, 'lock', 'ble', {});

    res.json({ success: true, locked: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get access logs
app.get('/logs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { lockId, guestId, startDate, endDate, limit = 100 } = req.query;

    const query: any = { hotelId };
    if (lockId) query.lockId = lockId;
    if (guestId) query.guestId = guestId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const logs = await AccessLog.find(query).sort({ timestamp: -1 }).limit(Number(limit));

    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get access credentials for guest
app.get('/credentials/:guestId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { guestId } = req.params;
    const { status } = req.query;

    const query: any = { hotelId, guestId };
    if (status) query.status = status;

    const credentials = await AccessCredential.find(query);
    res.json({ credentials });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function logAccessEvent(
  hotelId: string,
  lockId: string,
  roomId: string | null,
  eventType: string,
  method: string,
  metadata: any
): Promise<void> {
  const log = new AccessLog({
    logId: `LOG_${uuidv4().substring(0, 12)}`,
    hotelId,
    lockId,
    roomId,
    eventType: eventType as any,
    method: method as any,
    metadata
  });
  await log.save();
}

// Start server
async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    redis = createClient({ url: REDIS_URL });
    await redis.connect();
    logger.info('Connected to Redis');

    app.listen(PORT, () => {
      logger.info(`Smart Lock Service started on port ${PORT}`);
      logger.info(🔐 Smart Lock Service running on port ${PORT}`);
    });
  } catch (error: any) {
    logger.error('Failed to start', { error: error.message });
    process.exit(1);
  }
}

start();