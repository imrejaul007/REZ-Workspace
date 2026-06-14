import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhook extends Document {
  webhookId: string;
  inventoryId: string;
  type: 'stock_update' | 'low_stock' | 'out_of_stock' | 'reorder' | 'sync_complete';
  payload: Record<string, unknown>;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt?: Date;
  sentAt?: Date;
  responseCode?: number;
  responseBody?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema = new Schema<IWebhook>(
  {
    webhookId: { type: String, required: true, unique: true, index: true },
    inventoryId: { type: String, required: true, index: true },
    type: { type: String, enum: ['stock_update', 'low_stock', 'out_of_stock', 'reorder', 'sync_complete'], required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'retrying'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    sentAt: { type: Date },
    responseCode: { type: Number },
    responseBody: { type: String }
  },
  { timestamps: true }
);

WebhookSchema.index({ inventoryId: 1, type: 1 });
WebhookSchema.index({ status: 1, attempts: 1 });

export const Webhook = mongoose.model<IWebhook>('Webhook', WebhookSchema);