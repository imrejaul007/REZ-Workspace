import mongoose, { Schema, Document } from 'mongoose';

// ==========================================
// Presence Document Interface
// ==========================================

export interface IPresenceDocument extends Document {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  socketIds: string[];
  rooms: string[];
  metadata: {
    device?: string;
    platform?: string;
    location?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Presence Schema
// ==========================================

const PresenceSchema = new Schema<IPresenceDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away', 'busy'],
      default: 'offline',
      index: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketIds: {
      type: [String],
      default: [],
    },
    rooms: {
      type: [String],
      default: [],
    },
    metadata: {
      device: String,
      platform: String,
      location: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'presence',
  }
);

// ==========================================
// Indexes
// ==========================================

PresenceSchema.index({ status: 1, lastSeen: -1 });
PresenceSchema.index({ rooms: 1 });

// ==========================================
// Methods
// ==========================================

PresenceSchema.methods.setOnline = function (socketId: string, metadata?: Record<string, string>): void {
  this.status = 'online';
  this.lastSeen = new Date();
  if (!this.socketIds.includes(socketId)) {
    this.socketIds.push(socketId);
  }
  if (metadata) {
    this.metadata = { ...this.metadata, ...metadata };
  }
};

PresenceSchema.methods.setOffline = function (socketId: string): void {
  this.socketIds = this.socketIds.filter((id) => id !== socketId);
  if (this.socketIds.length === 0) {
    this.status = 'offline';
    this.lastSeen = new Date();
  }
};

PresenceSchema.methods.joinRoom = function (roomId: string): void {
  if (!this.rooms.includes(roomId)) {
    this.rooms.push(roomId);
  }
};

PresenceSchema.methods.leaveRoom = function (roomId: string): void {
  this.rooms = this.rooms.filter((id) => id !== roomId);
};

// ==========================================
// Static Methods
// ==========================================

PresenceSchema.statics.findOnlineUsers = function (userIds: string[]): Promise<IPresenceDocument[]> {
  return this.find({ userId: { $in: userIds }, status: 'online' }).exec();
};

PresenceSchema.statics.findByRoom = function (roomId: string): Promise<IPresenceDocument[]> {
  return this.find({ rooms: roomId, status: 'online' }).exec();
};

// ==========================================
// Pre-save Hook
// ==========================================

PresenceSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// ==========================================
// Export
// ==========================================

export const Presence = mongoose.model<IPresenceDocument>('Presence', PresenceSchema);
