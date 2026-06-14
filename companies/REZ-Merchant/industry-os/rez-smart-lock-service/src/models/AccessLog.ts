import mongoose, { Schema, Document } from 'mongoose';

export interface IAccessLog extends Document {
  logId: string;
  hotelId: string;
  roomId: string;
  lockId: string;
  keyId: string | null;
  guestId: string | null;
  action: 'grant' | 'revoke' | 'access_granted' | 'access_denied' | 'low_battery';
  timestamp: Date;
  metadata: Record<string, any>;
  createdAt: Date;
}

const AccessLogSchema = new Schema<IAccessLog>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    hotelId: { type: String, required: true, index: true },
    roomId: { type: String, required: true },
    lockId: { type: String, required: true, index: true },
    keyId: String,
    guestId: String,
    action: {
      type: String,
      enum: ['grant', 'revoke', 'access_granted', 'access_denied', 'low_battery'],
      required: true,
    },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AccessLogSchema.index({ hotelId: 1, timestamp: -1 });
AccessLogSchema.index({ lockId: 1, timestamp: -1 });
AccessLogSchema.index({ guestId: 1, timestamp: -1 });

export const AccessLog = mongoose.model<IAccessLog>('AccessLog', AccessLogSchema);