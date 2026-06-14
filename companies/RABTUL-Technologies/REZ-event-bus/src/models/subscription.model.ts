/**
 * Subscription Model - MongoDB Schema for Event Bus Subscribers
 *
 * Stores subscription configurations for services that want to receive events.
 * Each subscription defines which event categories/types a service wants to receive.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionConfig extends Document {
  serviceId: string;
  serviceName: string;
  endpoint: string;
  port: number;
  categories: string[];
  eventTypes: string[];
  filters?: Record<string, unknown>;
  concurrency: number;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  dlqThreshold: number;
  headers?: Record<string, string>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastEventAt?: Date;
  eventsReceived: number;
  errorsCount: number;
}

const SubscriptionConfigSchema = new Schema<ISubscriptionConfig>(
  {
    serviceId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    serviceName: {
      type: String,
      required: true,
      index: true
    },
    endpoint: {
      type: String,
      required: true
    },
    port: {
      type: Number,
      required: true
    },
    categories: [{
      type: String,
      enum: ['commerce', 'identity', 'intelligence', 'notification', 'payment', 'loyalty', 'engagement', 'support', 'media', 'system', 'whatsapp']
    }],
    eventTypes: [{
      type: String
    }],
    filters: {
      type: Schema.Types.Mixed,
      default: {}
    },
    concurrency: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    retryPolicy: {
      maxRetries: {
        type: Number,
        default: 3
      },
      backoffMultiplier: {
        type: Number,
        default: 2
      },
      initialDelayMs: {
        type: Number,
        default: 1000
      }
    },
    dlqThreshold: {
      type: Number,
      default: 5,
      min: 1
    },
    headers: {
      type: Map,
      of: String,
      default: {}
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    lastEventAt: {
      type: Date,
      default: null
    },
    eventsReceived: {
      type: Number,
      default: 0
    },
    errorsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
SubscriptionConfigSchema.index({ categories: 1, active: 1 });
SubscriptionConfigSchema.index({ eventTypes: 1, active: 1 });
SubscriptionConfigSchema.index({ serviceName: 1, active: 1 });

export const SubscriptionConfig = mongoose.model<ISubscriptionConfig>('SubscriptionConfig', SubscriptionConfigSchema);

// ============================================================================
// Dead Letter Queue Model
// ============================================================================

export interface IDeadLetterEvent extends Document {
  originalEvent;
  subscriberId: string;
  subscriberName: string;
  error: string;
  errorStack?: string;
  retryCount: number;
  status: 'pending' | 'retrying' | 'resolved' | 'failed';
  nextRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeadLetterEventSchema = new Schema<IDeadLetterEvent>(
  {
    originalEvent: {
      type: Schema.Types.Mixed,
      required: true
    },
    subscriberId: {
      type: String,
      required: true,
      index: true
    },
    subscriberName: {
      type: String,
      required: true
    },
    error: {
      type: String,
      required: true
    },
    errorStack: {
      type: String
    },
    retryCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'retrying', 'resolved', 'failed'],
      default: 'pending',
      index: true
    },
    nextRetryAt: {
      type: Date,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Index for finding events ready to retry
DeadLetterEventSchema.index({ status: 1, nextRetryAt: 1 });

export const DeadLetterEvent = mongoose.model<IDeadLetterEvent>('DeadLetterEvent', DeadLetterEventSchema);

// ============================================================================
// Event Delivery Log Model
// ============================================================================

export interface IEventDeliveryLog extends Document {
  eventId: string;
  subscriberId: string;
  subscriberName: string;
  eventType: string;
  category: string;
  status: 'delivered' | 'failed' | 'retrying';
  deliveryTimeMs?: number;
  error?: string;
  retryCount: number;
  createdAt: Date;
}

const EventDeliveryLogSchema = new Schema<IEventDeliveryLog>(
  {
    eventId: {
      type: String,
      required: true,
      index: true
    },
    subscriberId: {
      type: String,
      required: true,
      index: true
    },
    subscriberName: {
      type: String,
      required: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['delivered', 'failed', 'retrying'],
      required: true,
      index: true
    },
    deliveryTimeMs: {
      type: Number
    },
    error: {
      type: String
    },
    retryCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// TTL index - automatically remove logs after 30 days
EventDeliveryLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Compound indexes for analytics
EventDeliveryLogSchema.index({ subscriberId: 1, status: 1, createdAt: -1 });
EventDeliveryLogSchema.index({ eventType: 1, status: 1, createdAt: -1 });

export const EventDeliveryLog = mongoose.model<IEventDeliveryLog>('EventDeliveryLog', EventDeliveryLogSchema);

export default {
  SubscriptionConfig,
  DeadLetterEvent,
  EventDeliveryLog
};
