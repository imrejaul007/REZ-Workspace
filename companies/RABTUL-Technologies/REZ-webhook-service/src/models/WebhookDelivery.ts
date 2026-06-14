/**
 * Webhook Delivery Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhookDelivery extends Document {
  webhookId: mongoose.Types.ObjectId;
  deliveryId: string;
  eventType: string;
  payload: Record<string, any>;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  lastAttemptAt: Date;
  responseStatus?: number;
  responseBody?: string;
  error?: string;
  createdAt: Date;
}

const WebhookDeliverySchema = new Schema<IWebhookDelivery>({
  webhookId: { type: Schema.Types.ObjectId, ref: 'Webhook', required: true },
  deliveryId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  payload: { type: Map, of: Schema.Types.Mixed, required: true },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  },
  attempts: { type: Number, default: 1 },
  lastAttemptAt: Date,
  responseStatus: Number,
  responseBody: String,
  error: String,
}, { timestamps: true });

WebhookDeliverySchema.index({ webhookId: 1, createdAt: -1 });
WebhookDeliverySchema.index({ deliveryId: 1 });
WebhookDeliverySchema.index({ status: 1 });

export const WebhookDelivery = mongoose.model<IWebhookDelivery>('WebhookDelivery', WebhookDeliverySchema);
