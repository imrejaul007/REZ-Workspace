import mongoose, { Schema, Document } from 'mongoose';

// Webhook Subscription
export interface IWebhookSubscription extends Document {
  subscriptionId: string;
  name: string;
  url: string;
  events: string[]; // 'entity.created', 'order.paid', 'customer.churned', etc.
  secret: string;
  headers: Record<string, string>;
  active: boolean;
  filters?: Record<string, any>; // Optional filters (e.g., { source: 'hotel' })
  retryCount: number;
  lastTriggered?: Date;
  lastSuccess?: Date;
  lastError?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSubscriptionSchema = new Schema<IWebhookSubscription>({
  subscriptionId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  events: [String],
  secret: { type: String, required: true },
  headers: { type: Schema.Types.Mixed, default: {} },
  active: { type: Boolean, default: true },
  filters: Schema.Types.Mixed,
  retryCount: { type: Number, default: 0 },
  lastTriggered: Date,
  lastSuccess: Date,
  lastError: String,
  createdBy: String,
}, { timestamps: true });

WebhookSubscriptionSchema.index({ active: 1, events: 1 });

export const WebhookSubscription = mongoose.model<IWebhookSubscription>('WebhookSubscription', WebhookSubscriptionSchema);

// Webhook Event Log
export interface IWebhookEvent extends Document {
  eventId: string;
  subscriptionId: string;
  event: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: Date;
  response?: { status: number; body: any };
  error?: string;
  createdAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>({
  eventId: { type: String, required: true, unique: true, index: true },
  subscriptionId: { type: String, required: true, index: true },
  event: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  status: {
    type: String,
    enum: ['pending', 'delivered', 'failed', 'retrying'],
    default: 'pending',
    index: true,
  },
  attempts: { type: Number, default: 0 },
  lastAttempt: Date,
  response: {
    status: Number,
    body: Schema.Types.Mixed,
  },
  error: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

WebhookEventSchema.index({ subscriptionId: 1, createdAt: -1 });
WebhookEventSchema.index({ status: 1, createdAt: -1 });

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);

// Event Types Registry
export const EVENT_TYPES = [
  // Entity Events
  'entity.created',
  'entity.updated',
  'entity.deleted',

  // Order Events
  'order.created',
  'order.paid',
  'order.completed',
  'order.cancelled',
  'order.refunded',

  // Customer Events
  'customer.created',
  'customer.visit',
  'customer.loyalty',
  'customer.churned',

  // Payment Events
  'payment.initiated',
  'payment.success',
  'payment.failed',
  'payment.refunded',

  // Booking Events
  'booking.created',
  'booking.confirmed',
  'booking.checkedin',
  'booking.checkedout',
  'booking.cancelled',

  // Inventory Events
  'inventory.low',
  'inventory.depleted',
  'inventory.restocked',

  // AI Events
  'ai.command.executed',
  'ai.agent.task_completed',
  'ai.prediction.generated',
  'ai.insight.generated',

  // System Events
  'system.alert',
  'system.maintenance',
  'system.health_check',
];

export default { WebhookSubscription, WebhookEvent, EVENT_TYPES };