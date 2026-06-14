import mongoose, { Schema, Document } from 'mongoose';

export interface IDigitalKey extends Document {
  keyId: string;
  hotelId: string;
  roomId: string;
  guestId: string;
  bookingId: string;
  guestPhone?: string;
  guestEmail?: string;
  lockId: string;
  keyType: 'ble' | 'nfc' | 'qr' | 'pin';
  keyData: string;
  permissions: ('enter' | 'exit' | 'emergency' | 'minibar' | 'safe')[];
  validFrom: Date;
  validUntil: Date;
  status: 'pending' | 'active' | 'expired' | 'revoked' | 'used';
  activatedAt: Date | null;
  lastUsed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DigitalKeySchema = new Schema<IDigitalKey>(
  {
    keyId: { type: String, required: true, unique: true, index: true },
    hotelId: { type: String, required: true, index: true },
    roomId: { type: String, required: true },
    guestId: { type: String, required: true, index: true },
    bookingId: { type: String, required: true, index: true },
    guestPhone: String,
    guestEmail: String,
    lockId: { type: String, required: true, index: true },
    keyType: {
      type: String,
      enum: ['ble', 'nfc', 'qr', 'pin'],
      required: true,
    },
    keyData: { type: String, required: true },
    permissions: [{
      type: String,
      enum: ['enter', 'exit', 'emergency', 'minibar', 'safe'],
    }],
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'revoked', 'used'],
      default: 'active',
      index: true,
    },
    activatedAt: Date,
    lastUsed: Date,
  },
  { timestamps: true }
);

DigitalKeySchema.index({ hotelId: 1, status: 1 });
DigitalKeySchema.index({ guestId: 1, status: 1 });
DigitalKeySchema.index({ validUntil: 1 });

export const DigitalKey = mongoose.model<IDigitalKey>('DigitalKey', DigitalKeySchema);