import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  userId: string;
  type: 'campaign' | 'promotion' | 'update' | 'reminder' | 'alert';
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'unsubscribed';
  channels: string[];
  frequency?: 'realtime' | 'daily' | 'weekly' | 'monthly';
  source: 'user' | 'system' | 'advertiser';
  metadata?: Record<string, unknown>;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  lastNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['campaign', 'promotion', 'update', 'reminder', 'alert'],
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ['active', 'paused', 'unsubscribed'],
      default: 'active',
      index: true,
    },
    channels: { type: [String], default: ['email', 'push'] },
    frequency: { type: String, enum: ['realtime', 'daily', 'weekly', 'monthly'] },
    source: {
      type: String,
      enum: ['user', 'system', 'advertiser'],
      default: 'user',
    },
    metadata: { type: Schema.Types.Mixed },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: Date,
    lastNotifiedAt: Date,
  },
  {
    timestamps: true,
  }
);

SubscriptionSchema.index({ userId: 1, type: 1, status: 1 });
SubscriptionSchema.index({ status: 1, subscribedAt: -1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);