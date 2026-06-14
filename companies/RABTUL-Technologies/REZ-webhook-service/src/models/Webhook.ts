/**
 * Webhook Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhook extends Document {
  merchantId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  description?: string;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  lastDeliveryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema = new Schema<IWebhook>({
  merchantId: { type: String, required: true, index: true },
  url: { type: String, required: true },
  events: [{ type: String, required: true }],
  secret: { type: String, required: true },
  active: { type: Boolean, default: true },
  description: String,
  totalDeliveries: { type: Number, default: 0 },
  successfulDeliveries: { type: Number, default: 0 },
  failedDeliveries: { type: Number, default: 0 },
  lastDeliveryAt: Date,
}, { timestamps: true });

WebhookSchema.index({ merchantId: 1, active: 1 });

export const Webhook = mongoose.model<IWebhook>('Webhook', WebhookSchema);
