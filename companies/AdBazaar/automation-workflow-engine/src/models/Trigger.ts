import mongoose, { Document, Schema } from 'mongoose';

export type TriggerStatus = 'active' | 'paused' | 'disabled';

export interface ITrigger extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  workflowId: mongoose.Types.ObjectId;
  name: string;
  type: 'scheduled' | 'event' | 'webhook' | 'api';
  config: {
    schedule?: string;
    cronExpression?: string;
    eventType?: string;
    eventSource?: string;
    webhookPath?: string;
    webhookSecret?: string;
  };
  conditions?: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'regex';
    value: unknown;
  }[];
  status: TriggerStatus;
  lastTriggeredAt?: Date;
  triggerCount: number;
  errorCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const TriggerSchema = new Schema<ITrigger>(
  {
    userId: { type: String, required: true, index: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
    name: { type: String, required: true, maxlength: 200 },
    type: {
      type: String,
      enum: ['scheduled', 'event', 'webhook', 'api'],
      required: true
    },
    config: { type: Schema.Types.Mixed, default: {} },
    conditions: [
      {
        field: { type: String, required: true },
        operator: {
          type: String,
          enum: ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'contains', 'regex'],
          required: true
        },
        value: { type: Schema.Types.Mixed, required: true }
      }
    ],
    status: {
      type: String,
      enum: ['active', 'paused', 'disabled'],
      default: 'active',
      index: true
    },
    lastTriggeredAt: Date,
    triggerCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    metadata: { type: Map, of: Schema.Types.Mixed }
  },
  { timestamps: true }
);

TriggerSchema.index({ userId: 1, status: 1 });
TriggerSchema.index({ workflowId: 1 });

export const Trigger = mongoose.model<ITrigger>('Trigger', TriggerSchema);