import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWebhookLog extends Document {
  webhookId: Types.ObjectId;
  event: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  responseCode?: number;
  responseBody?: string;
  error?: string;
  duration?: number;
  headers: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookLogSchema = new Schema<IWebhookLog>(
  {
    webhookId: { type: Schema.Types.ObjectId, ref: 'Webhook', required: true, index: true },
    event: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['pending', 'delivered', 'failed', 'retrying'],
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: Date,
    nextRetryAt: Date,
    responseCode: Number,
    responseBody: String,
    error: String,
    duration: Number,
    headers: { type: Map, of: String, default: {} },
  },
  {
    timestamps: true,
  }
);

WebhookLogSchema.index({ webhookId: 1, createdAt: -1 });
WebhookLogSchema.index({ status: 1, nextRetryAt: 1 });
WebhookLogSchema.index({ createdAt: -1 });

export const WebhookLog = mongoose.model<IWebhookLog>('WebhookLog', WebhookLogSchema);