import mongoose, { Schema, Document } from 'mongoose';
import { Room as IRoom, RoomType } from '../types';

export interface IRoomDocument extends Omit<IRoom, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

// ==========================================
// Room Schema
// ==========================================

const RoomSchema = new Schema<IRoomDocument>(
  {
    type: {
      type: String,
      enum: ['user', 'team', 'company', 'project', 'custom'],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    members: {
      type: [String],
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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
    collection: 'rooms',
  }
);

// ==========================================
// Indexes
// ==========================================

RoomSchema.index({ type: 1, members: 1 });
RoomSchema.index({ members: 1, updatedAt: -1 });

// ==========================================
// Methods
// ==========================================

RoomSchema.methods.addMember = function (userId: string): void {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
  }
};

RoomSchema.methods.removeMember = function (userId: string): void {
  this.members = this.members.filter((id) => id !== userId);
};

RoomSchema.methods.isMember = function (userId: string): boolean {
  return this.members.includes(userId);
};

// ==========================================
// Static Methods
// ==========================================

RoomSchema.statics.findByUserId = function (userId: string): Promise<IRoomDocument[]> {
  return this.find({ members: userId }).sort({ updatedAt: -1 }).exec();
};

RoomSchema.statics.findByTypeAndUserId = function (
  type: RoomType,
  userId: string
): Promise<IRoomDocument[]> {
  return this.find({ type, members: userId }).exec();
};

// ==========================================
// Pre-save Hook
// ==========================================

RoomSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// ==========================================
// Export
// ==========================================

export const Room = mongoose.model<IRoomDocument>('Room', RoomSchema);
