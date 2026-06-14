import mongoose, { Document, Schema } from 'mongoose';

export type TriggerType = 'scheduled' | 'event' | 'webhook' | 'manual' | 'data_change' | 'threshold';
export type TriggerStatus = 'active' | 'paused' | 'disabled';

export interface ICondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'regex' | 'in' | 'not_in' | 'between' | 'exists' | 'not_exists';
  value: unknown;
  value2?: unknown; // For 'between' operator
}

export interface IAction {
  type: string;
  config: Record<string, unknown>;
  delay?: number; // Delay in milliseconds before execution
}

export interface ITrigger extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  description?: string;
  type: TriggerType;
  status: TriggerStatus;
  source: string; // e.g., 'analytics', 'social', 'payment'
  config: {
    schedule?: string; // Cron expression
    eventType?: string;
    webhookPath?: string;
    dataPath?: string;
    threshold?: number;
    thresholdOperator?: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
    comparisonValue?: unknown;
  };
  conditions: ICondition[];
  conditionLogic: 'and' | 'or';
  actions: IAction[];
  throttle?: {
    enabled: boolean;
    maxFires: number;
    windowMs: number;
  };
  fireCount: number;
  lastFiredAt?: Date;
  lastError?: string;
  errorCount: number;
  isTemplate: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const TriggerSchema = new Schema<ITrigger>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 200 },
    description: String,
    type: {
      type: String,
      enum: ['scheduled', 'event', 'webhook', 'manual', 'data_change', 'threshold'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'disabled'],
      default: 'active',
      index: true
    },
    source: { type: String, required: true, index: true },
    config: { type: Schema.Types.Mixed, default: {} },
    conditions: [
      {
        field: { type: String, required: true },
        operator: {
          type: String,
          enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'not_contains', 'starts_with', 'ends_with', 'regex', 'in', 'not_in', 'between', 'exists', 'not_exists'],
          required: true
        },
        value: { type: Schema.Types.Mixed, required: true },
        value2: { type: Schema.Types.Mixed }
      }
    ],
    conditionLogic: { type: String, enum: ['and', 'or'], default: 'and' },
    actions: [
      {
        type: { type: String, required: true },
        config: { type: Schema.Types.Mixed, default: {} },
        delay: Number
      }
    ],
    throttle: {
      enabled: { type: Boolean, default: false },
      maxFires: { type: Number, default: 10 },
      windowMs: { type: Number, default: 60000 }
    },
    fireCount: { type: Number, default: 0 },
    lastFiredAt: Date,
    lastError: String,
    errorCount: { type: Number, default: 0 },
    isTemplate: { type: Boolean, default: false },
    metadata: { type: Map, of: Schema.Types.Mixed }
  },
  { timestamps: true }
);

TriggerSchema.index({ userId: 1, status: 1 });
TriggerSchema.index({ userId: 1, type: 1 });

export const Trigger = mongoose.model<ITrigger>('Trigger', TriggerSchema);