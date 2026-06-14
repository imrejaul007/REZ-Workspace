import mongoose, { Schema, Document } from 'mongoose';

export interface ILock extends Document {
  lockId: string;
  hotelId: string;
  roomId: string;
  lockType: 'ble' | 'nfc' | 'qr' | 'pin';
  provider: 'salto' | 'yale' | 'august' | 'samsung' | 'igloohome' | 'generic';
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  batteryLevel: number;
  doorStatus: 'open' | 'closed' | 'ajar' | 'unknown';
  lastSync: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const LockSchema = new Schema<ILock>(
  {
    lockId: { type: String, required: true, unique: true, index: true },
    hotelId: { type: String, required: true, index: true },
    roomId: { type: String, required: true },
    lockType: {
      type: String,
      enum: ['ble', 'nfc', 'qr', 'pin'],
      required: true,
    },
    provider: {
      type: String,
      enum: ['salto', 'yale', 'august', 'samsung', 'igloohome', 'generic'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'error', 'maintenance'],
      default: 'active',
    },
    batteryLevel: { type: Number, default: 100 },
    doorStatus: {
      type: String,
      enum: ['open', 'closed', 'ajar', 'unknown'],
      default: 'unknown',
    },
    lastSync: Date,
  },
  { timestamps: true }
);

LockSchema.index({ hotelId: 1, roomId: 1 }, { unique: true });
LockSchema.index({ hotelId: 1, status: 1 });

export const Lock = mongoose.model<ILock>('Lock', LockSchema);