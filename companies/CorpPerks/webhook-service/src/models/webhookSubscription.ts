import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhookSubscription extends Document {
  _id: mongoose.Types.ObjectId;
  url: string;
  events: string[];
  secret: string;
  description?: string;
  isActive: boolean;
  headers: Record<string, string>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  successCount: number;
  failureCount: number;
}

const webhookSubscriptionSchema = new Schema<IWebhookSubscription>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    events: {
      type: [String],
      required: true,
      index: true,
    },
    secret: {
      type: String,
      required: true,
      select: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    headers: {
      type: Map,
      of: String,
      default: {},
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
    },
    lastTriggeredAt: {
      type: Date,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

webhookSubscriptionSchema.index({ url: 1 });
webhookSubscriptionSchema.index({ createdBy: 1, events: 1 });

export const WebhookSubscription = mongoose.model<IWebhookSubscription>(
  'WebhookSubscription',
  webhookSubscriptionSchema
);
