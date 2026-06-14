import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhookLog {
  timestamp: Date;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  responseCode?: number;
  responseBody?: string;
  error?: string;
  attemptNumber: number;
  duration?: number;
}

export interface IWebhook extends Document {
  name: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  headers: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  filters?: {
    campaignTypes?: string[];
    advertisers?: string[];
    minBudget?: number;
  };
  metadata?: Record<string, unknown>;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  successRate?: number;
}

const WebhookSchema = new Schema<IWebhook>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    events: { type: [String], required: true, index: true },
    secret: { type: String, required: true },
    active: { type: Boolean, default: true, index: true },
    headers: { type: Map, of: String, default: {} },
    retryPolicy: {
      maxRetries: { type: Number, default: 3 },
      retryDelay: { type: Number, default: 5000 },
      backoffMultiplier: { type: Number, default: 2 },
    },
    filters: {
      campaignTypes: [String],
      advertisers: [String],
      minBudget: Number,
    },
    metadata: { type: Schema.Types.Mixed },
    ownerId: { type: String, required: true, index: true },
    lastTriggeredAt: Date,
    successRate: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

WebhookSchema.index({ ownerId: 1, active: 1 });

export const Webhook = mongoose.model<IWebhook>('Webhook', WebhookSchema);