import mongoose, { Document, Schema } from 'mongoose';

export interface IRecovery extends Document {
  recoveryId: string;
  cartId: string;
  userId: string;
  channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'webhook';
  sequence: number;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked' | 'converted';
  sentAt?: Date;
  deliveredAt?: Date;
  clickedAt?: Date;
  convertedAt?: Date;
  templateId?: string;
  messageContent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const recoverySchema = new Schema<IRecovery>({
  recoveryId: { type: String, required: true, unique: true },
  cartId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  channel: {
    type: String,
    enum: ['email', 'sms', 'push', 'whatsapp', 'webhook'],
    required: true
  },
  sequence: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'clicked', 'converted'],
    default: 'pending'
  },
  sentAt: Date,
  deliveredAt: Date,
  clickedAt: Date,
  convertedAt: Date,
  templateId: String,
  messageContent: String,
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

recoverySchema.index({ recoveryId: 1 });
recoverySchema.index({ cartId: 1 });
recoverySchema.index({ userId: 1 });
recoverySchema.index({ status: 1, sentAt: -1 });

export const Recovery = mongoose.model<IRecovery>('Recovery', recoverySchema);