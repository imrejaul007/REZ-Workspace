import mongoose, { Document, Schema } from 'mongoose';

// Sync action types
export type SyncActionType =
  | 'create_session'
  | 'add_item'
  | 'update_item'
  | 'remove_item'
  | 'update_quantity'
  | 'checkout'
  | 'cancel_session';

// Sync status
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed' | 'conflict';

// Offline sync item document interface
export interface IOfflineSyncItem extends Document {
  syncId: string;
  userId: string;
  sessionId: string;
  action: SyncActionType;
  payload: Record<string, unknown>;
  localTimestamp: Date;
  syncAttempts: number;
  lastSyncAttempt?: Date;
  status: SyncStatus;
  error?: string;
  conflictResolution?: {
    resolved: boolean;
    resolution: 'server_wins' | 'client_wins' | 'merged';
    resolvedAt?: Date;
    resolvedBy?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// User offline state document interface
export interface IUserOfflineState extends Document {
  userId: string;
  activeSessions: {
    sessionId: string;
    storeId: string;
    lastSyncAt: Date;
    pendingActions: number;
  }[];
  localCartSnapshots: {
    sessionId: string;
    snapshot: unknown;
    createdAt: Date;
  }[];
  lastOnlineAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OfflineSyncItemSchema = new Schema<IOfflineSyncItem>(
  {
    syncId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    action: {
      type: String,
      enum: [
        'create_session',
        'add_item',
        'update_item',
        'remove_item',
        'update_quantity',
        'checkout',
        'cancel_session',
      ],
      required: true,
    },
    payload: { type: Schema.Types.Mixed, required: true },
    localTimestamp: { type: Date, required: true },
    syncAttempts: { type: Number, default: 0, min: 0 },
    lastSyncAttempt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'syncing', 'completed', 'failed', 'conflict'],
      default: 'pending',
      index: true,
    },
    error: { type: String },
    conflictResolution: {
      resolved: { type: Boolean, default: false },
      resolution: { type: String, enum: ['server_wins', 'client_wins', 'merged'] },
      resolvedAt: { type: Date },
      resolvedBy: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
OfflineSyncItemSchema.index({ userId: 1, status: 1 });
OfflineSyncItemSchema.index({ sessionId: 1, status: 1 });
OfflineSyncItemSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 * 7 }); // 7 days TTL

const ActiveSessionSchema = new Schema(
  {
    sessionId: { type: String, required: true },
    storeId: { type: String, required: true },
    lastSyncAt: { type: Date, default: Date.now },
    pendingActions: { type: Number, default: 0 },
  },
  { _id: false }
);

const CartSnapshotSchema = new Schema(
  {
    sessionId: { type: String, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserOfflineStateSchema = new Schema<IUserOfflineState>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    activeSessions: [ActiveSessionSchema],
    localCartSnapshots: [CartSnapshotSchema],
    lastOnlineAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const OfflineSyncItem = mongoose.model<IOfflineSyncItem>('OfflineSyncItem', OfflineSyncItemSchema);
export const UserOfflineState = mongoose.model<IUserOfflineState>('UserOfflineState', UserOfflineStateSchema);
