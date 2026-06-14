/**
 * Webhook Model
 *
 * Stores webhook subscriptions for merchants.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { WebhookEvent } from '../services/webhookService';

export interface IWebhook extends Document {
  merchantId: Types.ObjectId;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  description?: string;
  headers?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const webhookSchema = new Schema<IWebhook>(
  {
    merchantId: { type: Schema.Types.ObjectId, required: true, index: true },
    url: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => {
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid URL format',
      },
    },
    events: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one event is required',
      },
    },
    secret: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    description: { type: String, maxlength: 500 },
    headers: { type: Map, of: String },
  },
  { timestamps: true }
);

// Compound indexes
webhookSchema.index({ merchantId: 1, isActive: 1 });
webhookSchema.index({ merchantId: 1, events: 1 });

// TTL index for old webhooks (optional)
webhookSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year

export const Webhook =
  mongoose.models.Webhook || mongoose.model<IWebhook>('Webhook', webhookSchema);
