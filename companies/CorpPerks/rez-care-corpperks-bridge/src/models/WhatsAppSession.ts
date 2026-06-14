import mongoose, { Schema, Document } from 'mongoose';
import type { WhatsAppSessionStatus } from '../types/index.js';

export interface IWhatsAppSession extends Document {
  sessionId: string;
  employeeId: string;
  employeeName: string;
  companyId: string;
  phoneNumber: string;
  status: WhatsAppSessionStatus;
  lastMessageAt?: Date;
  messageCount: number;
  createdAt: Date;
  closedAt?: Date;
}

const WhatsAppSessionSchema = new Schema<IWhatsAppSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    phoneNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'idle', 'closed'],
      default: 'active',
    },
    lastMessageAt: { type: Date },
    messageCount: { type: Number, default: 0 },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

WhatsAppSessionSchema.index({ employeeId: 1, companyId: 1 });

export const WhatsAppSession = mongoose.model<IWhatsAppSession>('WhatsAppSession', WhatsAppSessionSchema);

// WhatsApp Message
export interface IWhatsAppMessage extends Document {
  messageId: string;
  sessionId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: Record<string, unknown>;
}

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>(
  {
    messageId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent',
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

WhatsAppMessageSchema.index({ sessionId: 1, timestamp: -1 });

export const WhatsAppMessage = mongoose.model<IWhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);
