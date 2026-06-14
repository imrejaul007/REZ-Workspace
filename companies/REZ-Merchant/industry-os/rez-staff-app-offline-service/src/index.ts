/**
 * REZ Staff App Offline Service
 * Port: 4038
 *
 * Offline-First Architecture for Hotel Staff Mobile App
 *
 * Features:
 * - Sync queue management (pending operations)
 * - Conflict resolution with server-wins/last-write-wins/client-wins strategies
 * - Data versioning for optimistic locking
 * - Batch sync operations
 * - Network status tracking
 * - Delta sync (only changed data)
 *
 * Conflict Resolution Strategies:
 * 1. SERVER_WINS - Server data always wins (default for critical data)
 * 2. CLIENT_WINS - Client changes always win (for user-generated content)
 * 3. LAST_WRITE_WINS - Most recent timestamp wins
 * 4. MANUAL - Queue for manual resolution
 * 5. MERGE - Attempt automatic merge (for compatible changes)
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const config = {
  port: parseInt(process.env.PORT || '4038'),
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/rez_staff_offline',
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'dev-token',
};

// ============================================
// SCHEMAS
// ============================================

const SyncOperationInputSchema = z.object({
  staffId: z.string().min(1),
  deviceId: z.string().min(1),
  operationType: z.enum([
    'ROOM_STATUS_UPDATE',
    'HOUSEKEEPING_TASK_UPDATE',
    'MAINTENANCE_ISSUE_CREATE',
    'MAINTENANCE_ISSUE_UPDATE',
    'GUEST_CHECK_IN',
    'GUEST_CHECK_OUT',
    'SERVICE_REQUEST_UPDATE',
    'MESSAGE_SEND',
    'INVENTORY_UPDATE',
    'TASK_COMPLETE',
    'NOTE_ADD',
  ]),
  entityType: z.enum(['room', 'housekeeping', 'maintenance', 'guest', 'service_request', 'message', 'inventory', 'task', 'note']),
  entityId: z.string().min(1),
  data: z.record(z.any()),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  conflictStrategy: z.enum(['SERVER_WINS', 'CLIENT_WINS', 'LAST_WRITE_WINS', 'MANUAL', 'MERGE']).default('SERVER_WINS'),
  timestamp: z.string().datetime(),
  clientVersion: z.number().optional(),
  parentOperationId: z.string().optional(),
});

const ConflictInputSchema = z.object({
  operationId: z.string().min(1),
  serverData: z.record(z.any()),
  clientData: z.record(z.any()),
  resolution: z.enum(['pending', 'server_wins', 'client_wins', 'merged', 'manual']).default('pending'),
  resolvedBy: z.string().optional(),
  resolvedAt: z.date().optional(),
  mergeResult: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

const DeviceRegistrationInputSchema = z.object({
  deviceId: z.string().min(1),
  staffId: z.string().min(1),
  deviceType: z.enum(['ios', 'android', 'tablet']),
  appVersion: z.string(),
  lastSync: z.date().optional(),
  syncToken: z.string().optional(),
  pendingOperations: z.number().default(0),
  status: z.enum(['active', 'inactive', 'syncing']).default('active'),
});

const DataSnapshotInputSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  staffId: z.string(),
  data: z.record(z.any()),
  version: z.number(),
  lastModified: z.date(),
  lastModifiedBy: z.string(),
  isDeleted: z.boolean().default(false),
});

// ============================================
// MODELS
// ============================================

const SyncOperationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  staffId: { type: String, required: true, index: true },
  deviceId: { type: String, required: true, index: true },
  operationType: { type: String, enum: [
    'ROOM_STATUS_UPDATE',
    'HOUSEKEEPING_TASK_UPDATE',
    'MAINTENANCE_ISSUE_CREATE',
    'MAINTENANCE_ISSUE_UPDATE',
    'GUEST_CHECK_IN',
    'GUEST_CHECK_OUT',
    'SERVICE_REQUEST_UPDATE',
    'MESSAGE_SEND',
    'INVENTORY_UPDATE',
    'TASK_COMPLETE',
    'NOTE_ADD',
  ], required: true },
  entityType: { type: String, enum: ['room', 'housekeeping', 'maintenance', 'guest', 'service_request', 'message', 'inventory', 'task', 'note'] },
  entityId: { type: String, required: true, index: true },
  data: mongoose.Schema.Types.Mixed,
  priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
  conflictStrategy: { type: String, enum: ['SERVER_WINS', 'CLIENT_WINS', 'LAST_WRITE_WINS', 'MANUAL', 'MERGE'], default: 'SERVER_WINS' },
  timestamp: { type: Date, required: true },
  clientVersion: Number,
  parentOperationId: String,
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'conflict'], default: 'pending', index: true },
  attempts: { type: Number, default: 0 },
  lastAttempt: Date,
  error: String,
  serverVersion: Number,
  result: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  processedAt: Date,
}, { timestamps: true });

// Index for efficient queue processing
SyncOperationSchema.index({ status: 1, priority: 1, timestamp: 1 });
SyncOperationSchema.index({ staffId: 1, status: 1 });

const SyncOperation = mongoose.model('SyncOperation', SyncOperationSchema);

const ConflictSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  operationId: { type: String, required: true, index: true },
  entityType: String,
  entityId: { type: String, required: true, index: true },
  staffId: { type: String, required: true, index: true },
  serverData: mongoose.Schema.Types.Mixed,
  clientData: mongoose.Schema.Types.Mixed,
  resolution: { type: String, enum: ['pending', 'server_wins', 'client_wins', 'merged', 'manual'], default: 'pending' },
  resolvedBy: String,
  resolvedAt: Date,
  mergeResult: mongoose.Schema.Types.Mixed,
  notes: String,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for pending conflicts - add BEFORE model creation
ConflictSchema.index({ resolution: 1, staffId: 1 });

const Conflict = mongoose.model('Conflict', ConflictSchema);

const DeviceRegistrationSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  staffId: { type: String, required: true, index: true },
  deviceType: { type: String, enum: ['ios', 'android', 'tablet'] },
  appVersion: String,
  lastSync: Date,
  syncToken: String,
  pendingOperations: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'syncing'], default: 'active' },
  deviceInfo: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const DeviceRegistration = mongoose.model('DeviceRegistration', DeviceRegistrationSchema);

const DataSnapshotSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, required: true, index: true },
  staffId: { type: String, required: true, index: true },
  data: mongoose.Schema.Types.Mixed,
  version: { type: Number, default: 1 },
  lastModified: { type: Date, default: Date.now },
  lastModifiedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Compound index for snapshot lookups - add BEFORE model creation
DataSnapshotSchema.index({ entityType: 1, entityId: 1, staffId: 1 });
DataSnapshotSchema.index({ lastModified: 1 });

const DataSnapshot = mongoose.model('DataSnapshot', DataSnapshotSchema);

const SyncLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  staffId: { type: String, required: true, index: true },
  deviceId: { type: String, required: true },
  syncType: { type: String, enum: ['push', 'pull', 'bidirectional', 'conflict_resolution'] },
  operationsProcessed: Number,
  conflictsDetected: Number,
  conflictsResolved: Number,
  bytesTransferred: Number,
  duration: Number,
  status: { type: String, enum: ['success', 'partial', 'failed'] },
  errors: [String],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const SyncLog = mongoose.model('SyncLog', SyncLogSchema);

// ============================================
// CONFLICT RESOLUTION ENGINE
// ============================================

interface ConflictResult {
  resolved: boolean;
  resolution: 'server_wins' | 'client_wins' | 'merged' | 'manual';
  data?: Record<string, any>;
  serverVersion?: number;
}

function resolveConflict(
  serverData: Record<string, any>,
  clientData: Record<string, any>,
  strategy: string,
  timestamp: Date,
  serverTimestamp: Date
): ConflictResult {
  switch (strategy) {
    case 'SERVER_WINS':
      return { resolved: true, resolution: 'server_wins', data: serverData, serverVersion: (serverData.version || 0) + 1 };

    case 'CLIENT_WINS':
      return { resolved: true, resolution: 'client_wins', data: { ...clientData, version: (serverData.version || 0) + 1 }, serverVersion: (serverData.version || 0) + 1 };

    case 'LAST_WRITE_WINS':
      const isClientNewer = timestamp > serverTimestamp;
      return {
        resolved: true,
        resolution: isClientNewer ? 'client_wins' : 'server_wins',
        data: isClientNewer ? { ...clientData, version: (serverData.version || 0) + 1 } : serverData,
        serverVersion: (serverData.version || 0) + 1,
      };

    case 'MERGE':
      return attemptAutoMerge(serverData, clientData);

    case 'MANUAL':
    default:
      return { resolved: false, resolution: 'manual' };
  }
}

function attemptAutoMerge(serverData: Record<string, any>, clientData: Record<string, any>): ConflictResult {
  const merged: Record<string, any> = { ...serverData };
  const conflicts: string[] = [];

  for (const key of Object.keys(clientData)) {
    const serverValue = serverData[key];
    const clientValue = clientData[key];

    if (serverValue === undefined) {
      // New field from client - accept it
      merged[key] = clientValue;
    } else if (JSON.stringify(serverValue) === JSON.stringify(clientValue)) {
      // Same value - no conflict
      continue;
    } else if (typeof serverValue !== typeof clientValue) {
      // Type mismatch - server wins
      conflicts.push(key);
    } else if (typeof serverValue === 'object' && !Array.isArray(serverValue)) {
      // Nested object - recurse merge
      const nestedMerge = attemptAutoMerge(serverValue, clientValue);
      if (nestedMerge.resolved) {
        merged[key] = nestedMerge.data;
      } else {
        conflicts.push(key);
      }
    } else {
      // Primitive conflict
      conflicts.push(key);
    }
  }

  if (conflicts.length === 0) {
    return { resolved: true, resolution: 'merged', data: { ...merged, version: (serverData.version || 0) + 1 }, serverVersion: (serverData.version || 0) + 1 };
  }

  // Some conflicts - try field-level resolution
  return { resolved: false, resolution: 'manual' };
}

// ============================================
// SYNC ENGINE
// ============================================

async function processSyncOperation(operation: any): Promise<any> {
  const maxAttempts = 3;
  const now = new Date();

  try {
    // Get current server state
    const snapshot = await DataSnapshot.findOne({
      entityType: operation.entityType,
      entityId: operation.entityId,
    });

    // Check for version conflict
    if (snapshot && operation.clientVersion && snapshot.version >= operation.clientVersion) {
      // Client is behind - conflict detected
      if (operation.conflictStrategy === 'SERVER_WINS') {
        // Auto-resolve with server data
        await SyncOperation.findByIdAndUpdate(operation._id, {
          status: 'completed',
          serverVersion: snapshot.version,
          result: { autoResolved: true, strategy: 'SERVER_WINS', data: snapshot.data },
          processedAt: now,
        });
        return { status: 'completed', autoResolved: true, data: snapshot.data };
      }

      // Create conflict record for manual or MERGE resolution
      const conflictId = uuidv4();
      await Conflict.create({
        id: conflictId,
        operationId: operation.id,
        entityType: operation.entityType,
        entityId: operation.entityId,
        staffId: operation.staffId,
        serverData: snapshot.data,
        clientData: operation.data,
        resolution: 'pending',
      });

      await SyncOperation.findByIdAndUpdate(operation._id, {
        status: 'conflict',
        serverVersion: snapshot.version,
      });

      return { status: 'conflict', conflictId, serverData: snapshot.data };
    }

    // Apply operation
    const newVersion = (snapshot?.version || 0) + 1;
    const operationResult = await applyOperation(operation.entityType, operation.entityId, operation.data, operation.operationType);

    // Update snapshot
    await DataSnapshot.findOneAndUpdate(
      { entityType: operation.entityType, entityId: operation.entityId },
      {
        id: snapshot?.id || uuidv4(),
        entityType: operation.entityType,
        entityId: operation.entityId,
        staffId: operation.staffId,
        data: operationResult.data,
        version: newVersion,
        lastModified: now,
        lastModifiedBy: operation.staffId,
        isDeleted: false,
      },
      { upsert: true, new: true }
    );

    // Mark operation complete
    await SyncOperation.findByIdAndUpdate(operation._id, {
      status: 'completed',
      serverVersion: newVersion,
      result: operationResult,
      processedAt: now,
    });

    return { status: 'completed', version: newVersion, data: operationResult.data };
  } catch (error: any) {
    // Increment attempt count
    const attempts = (operation.attempts || 0) + 1;

    if (attempts >= maxAttempts) {
      await SyncOperation.findByIdAndUpdate(operation._id, {
        status: 'failed',
        attempts,
        lastAttempt: now,
        error: error.message,
      });
    } else {
      await SyncOperation.findByIdAndUpdate(operation._id, {
        attempts,
        lastAttempt: now,
        error: error.message,
      });
    }

    throw error;
  }
}

async function applyOperation(entityType: string, entityId: string, data: any, operationType: string): Promise<any> {
  // Route to appropriate service based on entity type
  // In production, this would make HTTP calls to the actual services

  switch (entityType) {
    case 'room':
      return await applyRoomOperation(entityId, data, operationType);
    case 'housekeeping':
      return await applyHousekeepingOperation(entityId, data, operationType);
    case 'maintenance':
      return await applyMaintenanceOperation(entityId, data, operationType);
    case 'guest':
      return await applyGuestOperation(entityId, data, operationType);
    case 'service_request':
      return await applyServiceRequestOperation(entityId, data, operationType);
    default:
      return { success: true, data, operationType };
  }
}

async function applyRoomOperation(roomId: string, data: any, operationType: string): Promise<any> {
  // In production: Call PMS Service (4031) or Hotel Service (4015)
  console.log(`[Room Operation] ${operationType} for room ${roomId}`);
  return { success: true, data, roomId };
}

async function applyHousekeepingOperation(taskId: string, data: any, operationType: string): Promise<any> {
  // In production: Call Housekeeping Service
  console.log(`[HK Operation] ${operationType} for task ${taskId}`);
  return { success: true, data, taskId };
}

async function applyMaintenanceOperation(issueId: string, data: any, operationType: string): Promise<any> {
  // In production: Call Maintenance Service (4019)
  console.log(`[Maintenance Operation] ${operationType} for issue ${issueId}`);
  return { success: true, data, issueId };
}

async function applyGuestOperation(guestId: string, data: any, operationType: string): Promise<any> {
  // In production: Call PMS Service (4031) or CRM Service
  console.log(`[Guest Operation] ${operationType} for guest ${guestId}`);
  return { success: true, data, guestId };
}

async function applyServiceRequestOperation(requestId: string, data: any, operationType: string): Promise<any> {
  // In production: Call Messaging Service (4018) or Virtual Concierge (4034)
  console.log(`[Service Request Operation] ${operationType} for request ${requestId}`);
  return { success: true, data, requestId };
}

// ============================================
// ENDPOINTS
// ============================================

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'staff-offline-service', port: config.port });
});

/** GET /api/info - Service info */
app.get('/api/info', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'REZ Staff App Offline Service',
      version: '1.0.0',
      capabilities: [
        'offline_queue',
        'conflict_resolution',
        'delta_sync',
        'batch_sync',
        'version_tracking',
      ],
      conflictStrategies: ['SERVER_WINS', 'CLIENT_WINS', 'LAST_WRITE_WINS', 'MANUAL', 'MERGE'],
      supportedEntities: ['room', 'housekeeping', 'maintenance', 'guest', 'service_request', 'message', 'inventory', 'task', 'note'],
    },
  });
});

// ----------------------------------------
// DEVICE REGISTRATION
// --------------------------------

/** POST /api/devices/register - Register a device for offline sync */
app.post('/api/devices/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = DeviceRegistrationSchema.parse(req.body);

    const existing = await DeviceRegistration.findOne({ deviceId: data.deviceId });

    if (existing) {
      // Update existing device
      existing.lastSync = new Date();
      existing.status = 'active';
      existing.appVersion = data.appVersion;
      existing.pendingOperations = await SyncOperation.countDocuments({
        deviceId: data.deviceId,
        status: 'pending',
      });
      await existing.save();

      return res.json({
        success: true,
        data: {
          device: existing,
          syncToken: existing.syncToken,
        },
        message: 'Device updated',
      });
    }

    // Create new registration
    const syncToken = uuidv4();
    const device = await DeviceRegistration.create({
      ...data,
      syncToken,
      lastSync: new Date(),
    });

    res.status(201).json({
      success: true,
      data: { device, syncToken },
      message: 'Device registered',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    }
    next(error);
  }
});

/** POST /api/devices/heartbeat - Keep device connection alive and get pending operations count */
app.post('/api/devices/heartbeat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.body;

    const device = await DeviceRegistration.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ success: false, error: { code: 'DEVICE_NOT_FOUND' } });
    }

    device.lastSync = new Date();
    device.pendingOperations = await SyncOperation.countDocuments({
      deviceId,
      status: 'pending',
    });
    await device.save();

    res.json({
      success: true,
      data: {
        lastSync: device.lastSync,
        pendingOperations: device.pendingOperations,
        serverTime: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------
// SYNC QUEUE OPERATIONS
// --------------------------------

/** POST /api/sync/push - Push operations from device to server */
app.post('/api/sync/push', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const { deviceId, staffId, operations } = req.body;

    if (!deviceId || !staffId || !Array.isArray(operations)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'deviceId, staffId, and operations array are required' },
      });
    }

    // Validate device
    const device = await DeviceRegistration.findOne({ deviceId, staffId });
    if (!device) {
      return res.status(401).json({ success: false, error: { code: 'DEVICE_NOT_REGISTERED' } });
    }

    const results: any[] = [];
    const conflicts: any[] = [];

    // Process each operation
    for (const op of operations) {
      const parsed = SyncOperationSchema.safeParse(op);
      if (!parsed.success) {
        results.push({ id: op.id, status: 'failed', error: 'Validation failed', details: parsed.error.errors });
        continue;
      }

      const opData = parsed.data;

      // Check for duplicate
      const existing = await SyncOperation.findOne({
        deviceId,
        entityId: opData.entityId,
        operationType: opData.operationType,
        timestamp: new Date(opData.timestamp),
        status: { $in: ['pending', 'processing'] },
      });

      if (existing) {
        results.push({ id: op.id, status: 'skipped', message: 'Duplicate operation' });
        continue;
      }

      // Create sync operation
      const syncOp = await SyncOperation.create({
        id: op.id || uuidv4(),
        staffId,
        deviceId,
        operationType: opData.operationType,
        entityType: opData.entityType,
        entityId: opData.entityId,
        data: opData.data,
        priority: opData.priority,
        conflictStrategy: opData.conflictStrategy,
        timestamp: new Date(opData.timestamp),
        clientVersion: opData.clientVersion,
        parentOperationId: opData.parentOperationId,
        status: 'pending',
      });

      // Process immediately
      try {
        const result = await processSyncOperation(syncOp);
        results.push({ id: syncOp.id, status: result.status, ...result });

        if (result.status === 'conflict') {
          conflicts.push({ operationId: syncOp.id, conflictId: result.conflictId });
        }
      } catch (error: any) {
        results.push({ id: syncOp.id, status: 'failed', error: error.message });
      }
    }

    // Update device status
    device.lastSync = new Date();
    device.pendingOperations = await SyncOperation.countDocuments({ deviceId, status: 'pending' });
    await device.save();

    // Log sync
    const duration = Date.now() - startTime;
    await SyncLog.create({
      id: uuidv4(),
      staffId,
      deviceId,
      syncType: 'push',
      operationsProcessed: operations.length,
      conflictsDetected: conflicts.length,
      conflictsResolved: 0,
      bytesTransferred: JSON.stringify(req.body).length,
      duration,
      status: 'success',
    });

    res.json({
      success: true,
      data: {
        results,
        conflicts,
        serverTime: new Date(),
        processedCount: results.filter((r) => r.status === 'completed').length,
        failedCount: results.filter((r) => r.status === 'failed').length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/sync/pull - Pull data changes from server to device */
app.post('/api/sync/pull', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId, staffId, lastSync, entityTypes } = req.body;

    if (!deviceId || !staffId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'deviceId and staffId are required' },
      });
    }

    // Validate device
    const device = await DeviceRegistration.findOne({ deviceId, staffId });
    if (!device) {
      return res.status(401).json({ success: false, error: { code: 'DEVICE_NOT_REGISTERED' } });
    }

    // Build query for changed data
    const query: any = { staffId: { $in: [staffId, 'system'] } };

    if (lastSync) {
      query.lastModified = { $gt: new Date(lastSync) };
    }

    if (entityTypes && entityTypes.length > 0) {
      query.entityType = { $in: entityTypes };
    }

    // Get all changed snapshots
    const snapshots = await DataSnapshot.find(query)
      .sort({ lastModified: 1 })
      .limit(1000);

    // Group by entity type for delta sync
    const changes: Record<string, any[]> = {};
    for (const snapshot of snapshots) {
      if (!changes[snapshot.entityType]) {
        changes[snapshot.entityType] = [];
      }
      changes[snapshot.entityType].push({
        entityId: snapshot.entityId,
        data: snapshot.data,
        version: snapshot.version,
        lastModified: snapshot.lastModified,
        lastModifiedBy: snapshot.lastModifiedBy,
        isDeleted: snapshot.isDeleted,
      });
    }

    // Get pending operations for this device (for awareness)
    const pendingOps = await SyncOperation.find({
      deviceId,
      status: { $in: ['pending', 'processing'] },
    }).select('operationType entityType entityId priority timestamp');

    res.json({
      success: true,
      data: {
        changes,
        serverTime: new Date(),
        lastSync: new Date(),
        hasMore: snapshots.length === 1000,
        pendingOperationsCount: pendingOps.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/sync/bidirectional - Full bidirectional sync */
app.post('/api/sync/full', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const { deviceId, staffId, lastSync, operations, entityTypes } = req.body;

    if (!deviceId || !staffId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'deviceId and staffId are required' },
      });
    }

    // Process incoming operations (push)
    const pushResults: any[] = [];
    const conflicts: any[] = [];

    if (operations && operations.length > 0) {
      for (const op of operations) {
        try {
          const parsed = SyncOperationSchema.safeParse(op);
          if (!parsed.success) {
            pushResults.push({ id: op.id, status: 'failed', error: 'Validation failed' });
            continue;
          }

          const opData = parsed.data;

          const syncOp = await SyncOperation.create({
            id: op.id || uuidv4(),
            staffId,
            deviceId,
            operationType: opData.operationType,
            entityType: opData.entityType,
            entityId: opData.entityId,
            data: opData.data,
            priority: opData.priority,
            conflictStrategy: opData.conflictStrategy,
            timestamp: new Date(opData.timestamp),
            clientVersion: opData.clientVersion,
            status: 'pending',
          });

          const result = await processSyncOperation(syncOp);
          pushResults.push({ id: syncOp.id, status: result.status, ...result });

          if (result.status === 'conflict') {
            conflicts.push({ operationId: syncOp.id, conflictId: result.conflictId });
          }
        } catch (error: any) {
          pushResults.push({ id: op.id, status: 'failed', error: error.message });
        }
      }
    }

    // Pull changes (delta sync)
    const pullQuery: any = { staffId: { $in: [staffId, 'system'] } };

    if (lastSync) {
      pullQuery.lastModified = { $gt: new Date(lastSync) };
    }

    if (entityTypes && entityTypes.length > 0) {
      pullQuery.entityType = { $in: entityTypes };
    }

    const snapshots = await DataSnapshot.find(pullQuery)
      .sort({ lastModified: 1 })
      .limit(1000);

    const changes: Record<string, any[]> = {};
    for (const snapshot of snapshots) {
      if (!changes[snapshot.entityType]) {
        changes[snapshot.entityType] = [];
      }
      changes[snapshot.entityType].push({
        entityId: snapshot.entityId,
        data: snapshot.data,
        version: snapshot.version,
        lastModified: snapshot.lastModified,
        lastModifiedBy: snapshot.lastModifiedBy,
        isDeleted: snapshot.isDeleted,
      });
    }

    // Update device
    await DeviceRegistration.findOneAndUpdate(
      { deviceId, staffId },
      { lastSync: new Date(), pendingOperations: await SyncOperation.countDocuments({ deviceId, status: 'pending' }) }
    );

    // Log sync
    const duration = Date.now() - startTime;
    await SyncLog.create({
      id: uuidv4(),
      staffId,
      deviceId,
      syncType: 'bidirectional',
      operationsProcessed: pushResults.length,
      conflictsDetected: conflicts.length,
      conflictsResolved: 0,
      bytesTransferred: JSON.stringify(req.body).length,
      duration,
      status: 'success',
    });

    res.json({
      success: true,
      data: {
        push: {
          results: pushResults,
          processedCount: pushResults.filter((r) => r.status === 'completed').length,
        },
        pull: {
          changes,
          serverTime: new Date(),
          hasMore: snapshots.length === 1000,
        },
        conflicts,
        syncTime: duration,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------
// QUEUE MANAGEMENT
// --------------------------------

/** GET /api/queue/:staffId - Get pending operations for a staff member */
app.get('/api/queue/:staffId', async (req: res, next) => {
  try {
    const { status, priority, entityType, limit = 50 } = req.query;

    const query: any = { staffId: req.params.staffId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (entityType) query.entityType = entityType;

    const operations = await SyncOperation.find(query)
      .sort({ priority: -1, timestamp: 1 })
      .limit(Math.min(Number(limit), 500));

    const counts = await SyncOperation.aggregate([
      { $match: { staffId: req.params.staffId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        operations,
        counts: Object.fromEntries(counts.map((c) => [c._id, c.count])),
        total: counts.reduce((sum, c) => sum + c.count, 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/queue/:operationId - Cancel/delete a pending operation */
app.delete('/api/queue/:operationId', async (req: res, next) => {
  try {
    const operation = await SyncOperation.findOneAndDelete({
      id: req.params.operationId,
      status: { $in: ['pending'] },
    });

    if (!operation) {
      return res.status(404).json({
        success: false,
        error: { code: 'OPERATION_NOT_FOUND', message: 'Operation not found or already processed' },
      });
    }

    res.json({ success: true, message: 'Operation cancelled' });
  } catch (error) {
    next(error);
  }
});

/** POST /api/queue/retry/:operationId - Retry a failed operation */
app.post('/api/queue/retry/:operationId', async (req: res, next) => {
  try {
    const operation = await SyncOperation.findOne({
      id: req.params.operationId,
      status: { $in: ['failed', 'pending'] },
    });

    if (!operation) {
      return res.status(404).json({ success: false, error: { code: 'OPERATION_NOT_FOUND' } });
    }

    operation.status = 'pending';
    operation.error = undefined;
    await operation.save();

    // Process immediately
    const result = await processSyncOperation(operation);

    res.json({
      success: true,
      data: { operationId: operation.id, status: result.status, ...result },
    });
  } catch (error: any) {
    next(error);
  }
});

// ----------------------------------------
// CONFLICT MANAGEMENT
// --------------------------------

/** GET /api/conflicts/:staffId - Get pending conflicts for a staff member */
app.get('/api/conflicts/:staffId', async (req: res, next) => {
  try {
    const { resolution, limit = 50 } = req.query;

    const query: any = { staffId: req.params.staffId };
    if (resolution) query.resolution = resolution;

    const conflicts = await Conflict.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 100));

    res.json({
      success: true,
      data: { conflicts, count: conflicts.length },
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/conflicts/:conflictId/resolve - Resolve a conflict manually */
app.post('/api/conflicts/:conflictId/resolve', async (req: res, next) => {
  try {
    const { resolution, data, notes } = req.body;

    if (!['server_wins', 'client_wins', 'merged'].includes(resolution)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RESOLUTION', message: 'resolution must be server_wins, client_wins, or merged' },
      });
    }

    const conflict = await Conflict.findOne({ id: req.params.conflictId, resolution: 'pending' });
    if (!conflict) {
      return res.status(404).json({ success: false, error: { code: 'CONFLICT_NOT_FOUND' } });
    }

    // Get the associated operation
    const operation = await SyncOperation.findOne({ id: conflict.operationId });
    if (!operation) {
      return res.status(404).json({ success: false, error: { code: 'OPERATION_NOT_FOUND' } });
    }

    // Determine final data based on resolution
    let finalData: Record<string, any>;
    if (resolution === 'server_wins') {
      finalData = conflict.serverData;
    } else if (resolution === 'client_wins') {
      finalData = conflict.clientData;
    } else {
      finalData = data || conflict.clientData;
    }

    // Apply the resolution
    const snapshot = await DataSnapshot.findOne({
      entityType: conflict.entityType,
      entityId: conflict.entityId,
    });

    const newVersion = (snapshot?.version || 0) + 1;

    await DataSnapshot.findOneAndUpdate(
      { entityType: conflict.entityType, entityId: conflict.entityId },
      {
        id: snapshot?.id || uuidv4(),
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        staffId: conflict.staffId,
        data: finalData,
        version: newVersion,
        lastModified: new Date(),
        lastModifiedBy: conflict.staffId,
        isDeleted: false,
      },
      { upsert: true, new: true }
    );

    // Update conflict record
    conflict.resolution = resolution;
    conflict.resolvedAt = new Date();
    conflict.mergeResult = resolution === 'merged' ? data : undefined;
    conflict.notes = notes;
    await conflict.save();

    // Update operation
    operation.status = 'completed';
    operation.serverVersion = newVersion;
    operation.result = { resolved: true, strategy: resolution };
    operation.processedAt = new Date();
    await operation.save();

    res.json({
      success: true,
      data: {
        conflictId: conflict.id,
        resolution,
        finalData,
        newVersion,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------
// DATA SNAPSHOTS (for initial sync / full refresh)
// --------------------------------

/** POST /api/snapshots/bulk - Create or update multiple snapshots (for initial sync) */
app.post('/api/snapshots/bulk', async (req: res, next) => {
  try {
    const { staffId, snapshots } = req.body;

    if (!staffId || !Array.isArray(snapshots)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'staffId and snapshots array are required' },
      });
    }

    const results = [];
    for (const snapshot of snapshots) {
      const existing = await DataSnapshot.findOne({
        entityType: snapshot.entityType,
        entityId: snapshot.entityId,
        staffId,
      });

      const newVersion = (existing?.version || 0) + 1;

      const updated = await DataSnapshot.findOneAndUpdate(
        { entityType: snapshot.entityType, entityId: snapshot.entityId, staffId },
        {
          id: existing?.id || uuidv4(),
          entityType: snapshot.entityType,
          entityId: snapshot.entityId,
          staffId,
          data: snapshot.data,
          version: newVersion,
          lastModified: new Date(),
          lastModifiedBy: staffId,
          isDeleted: snapshot.isDeleted || false,
        },
        { upsert: true, new: true }
      );

      results.push({ entityType: snapshot.entityType, entityId: snapshot.entityId, version: newVersion });
    }

    res.json({
      success: true,
      data: { results, count: results.length },
    });
  } catch (error) {
    next(error);
  }
});

/** GET /api/snapshots/:staffId - Get all snapshots for a staff member */
app.get('/api/snapshots/:staffId', async (req: res, next) => {
  try {
    const { entityType } = req.query;

    const query: any = { staffId: req.params.staffId };
    if (entityType) query.entityType = entityType;

    const snapshots = await DataSnapshot.find(query).sort({ entityType: 1, entityId: 1 });

    res.json({
      success: true,
      data: {
        snapshots: snapshots.map((s) => ({
          entityType: s.entityType,
          entityId: s.entityId,
          data: s.data,
          version: s.version,
          lastModified: s.lastModified,
          lastModifiedBy: s.lastModifiedBy,
          isDeleted: s.isDeleted,
        })),
        count: snapshots.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------
// SYNC ANALYTICS
// --------------------------------

/** GET /api/analytics/:staffId - Get sync analytics for a staff member */
app.get('/api/analytics/:staffId', async (req: res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const match: any = { staffId: req.params.staffId };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate as string);
      if (endDate) match.createdAt.$lte = new Date(endDate as string);
    }

    const [operationStats, syncLogs, conflictStats] = await Promise.all([
      // Operation stats by status
      SyncOperation.aggregate([
        { $match: { staffId: req.params.staffId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Sync log summary
      SyncLog.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalSyncs: { $sum: 1 },
            totalOperations: { $sum: '$operationsProcessed' },
            totalConflicts: { $sum: '$conflictsDetected' },
            avgDuration: { $avg: '$duration' },
            totalBytes: { $sum: '$bytesTransferred' },
          },
        },
      ]),
      // Conflict resolution stats
      Conflict.aggregate([
        { $match: { staffId: req.params.staffId } },
        { $group: { _id: '$resolution', count: { $sum: 1 } } },
      ]),
    ]);

    const pendingCount = operationStats.find((s) => s._id === 'pending')?.count || 0;
    const conflictCount = operationStats.find((s) => s._id === 'conflict')?.count || 0;

    res.json({
      success: true,
      data: {
        operations: Object.fromEntries(operationStats.map((s) => [s._id, s.count])),
        syncSummary: syncLogs[0] || {
          totalSyncs: 0,
          totalOperations: 0,
          totalConflicts: 0,
          avgDuration: 0,
          totalBytes: 0,
        },
        conflicts: Object.fromEntries(conflictStats.map((c) => [c._id, c.count])),
        needsAttention: pendingCount > 10 || conflictCount > 0,
        pendingOperations: pendingCount,
        pendingConflicts: conflictCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** GET /api/analytics/:staffId/recent - Get recent sync operations */
app.get('/api/analytics/:staffId/recent', async (req: res, next) => {
  try {
    const { limit = 20 } = req.query;

    const recentOps = await SyncOperation.find({ staffId: req.params.staffId })
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const recentSyncs = await SyncLog.find({ staffId: req.params.staffId })
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: {
        recentOperations: recentOps,
        recentSyncs,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------
// ADMIN ENDPOINTS
// --------------------------------

/** POST /api/admin/force-sync/:staffId - Force sync all pending operations for a staff member */
app.post('/api/admin/force-sync/:staffId', async (req: res, next) => {
  try {
    const operations = await SyncOperation.find({
      staffId: req.params.staffId,
      status: { $in: ['pending', 'failed'] },
    }).sort({ priority: -1, timestamp: 1 });

    const results = [];
    for (const op of operations) {
      try {
        const result = await processSyncOperation(op);
        results.push({ id: op.id, status: result.status });
      } catch (error: any) {
        results.push({ id: op.id, status: 'failed', error: error.message });
      }
    }

    res.json({
      success: true,
      data: {
        total: operations.length,
        completed: results.filter((r) => r.status === 'completed').length,
        failed: results.filter((r) => r.status === 'failed').length,
        conflicts: results.filter((r) => r.status === 'conflict').length,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/admin/clear-queue/:staffId - Clear all pending operations for a staff member (admin only) */
app.delete('/api/admin/clear-queue/:staffId', async (req: res, next) => {
  try {
    const { token } = req.headers;

    if (token !== config.internalToken) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN' } });
    }

    const result = await SyncOperation.deleteMany({
      staffId: req.params.staffId,
      status: 'pending',
    });

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} pending operations`,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Staff Offline Error]', err);

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'ERROR',
      message: 'Internal server error',
    },
  });
});

// ============================================
// START
// ============================================

async function start() {
  try {
    await mongoose.connect(config.mongoUrl);
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║  REZ Staff App Offline Service         ║`);
    console.log(`║  Port: ${config.port}                           ║`);
    console.log(`╠══════════════════════════════════════════╣`);
    console.log(`║  Features:                             ║`);
    console.log(`║  - Sync queue management               ║`);
    console.log(`║  - Conflict resolution                 ║`);
    console.log(`║  - Delta sync                          ║`);
    console.log(`║  - Version tracking                    ║`);
    console.log(`╚══════════════════════════════════════════╝\n`);

    app.listen(config.port, () => {
      console.log(`✅ Staff Offline Service running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start Staff Offline Service:', error);
    process.exit(1);
  }
}

start().catch(console.error);
