import mongoose, { Document, Schema } from 'mongoose';

export type WebhookEventStatus = 'pending' | 'success' | 'failed' | 'retrying';

export interface IWebhookEvent extends Document {
  _id: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  eventType: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  status: WebhookEventStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  response?: {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  };
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  processingTimeMs?: number;
  createdAt: Date;
  completedAt?: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'WebhookSubscription',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    headers: {
      type: Map,
      of: String,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'retrying'],
      default: 'pending',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    lastAttemptAt: {
      type: Date,
    },
    nextRetryAt: {
      type: Date,
      index: true,
    },
    response: {
      statusCode: Number,
      body: String,
      headers: Map,
    },
    error: {
      message: String,
      code: String,
      stack: String,
    },
    processingTimeMs: {
      type: Number,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

webhookEventSchema.index({ createdAt: -1 });
webhookEventSchema.index({ subscriptionId: 1, status: 1 });
webhookEventSchema.index({ nextRetryAt: 1, status: 1 });

export const WebhookEvent = mongoose.model<IWebhookEvent>(
  'WebhookEvent',
  webhookEventSchema
);
