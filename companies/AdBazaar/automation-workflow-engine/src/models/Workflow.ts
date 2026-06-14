import mongoose, { Document, Schema } from 'mongoose';

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'disabled';
export type TriggerType = 'manual' | 'scheduled' | 'event' | 'webhook' | 'condition';

export interface IAction {
  type: string;
  config: Record<string, unknown>;
  order: number;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
}

export interface ITrigger {
  type: TriggerType;
  config: {
    schedule?: string;
    eventType?: string;
    webhookUrl?: string;
    conditions?: Record<string, unknown>;
  };
}

export interface IWorkflow extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  trigger: ITrigger;
  actions: IAction[];
  conditions?: {
    type: 'and' | 'or';
    rules: Record<string, unknown>[];
  };
  variables: Record<string, unknown>;
  isTemplate: boolean;
  templateId?: mongoose.Types.ObjectId;
  executionCount: number;
  lastExecutedAt?: Date;
  avgExecutionTime?: number;
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema = new Schema<IWorkflow>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 200 },
    description: String,
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'disabled'],
      default: 'draft',
      index: true
    },
    trigger: {
      type: {
        type: String,
        enum: ['manual', 'scheduled', 'event', 'webhook', 'condition'],
        required: true
      },
      config: { type: Schema.Types.Mixed, default: {} }
    },
    actions: [
      {
        type: { type: String, required: true },
        config: { type: Schema.Types.Mixed, default: {} },
        order: { type: Number, required: true },
        retryConfig: {
          maxRetries: Number,
          retryDelay: Number
        }
      }
    ],
    conditions: {
      type: { type: String, enum: ['and', 'or'] },
      rules: [Schema.Types.Mixed]
    },
    variables: { type: Map, of: Schema.Types.Mixed, default: {} },
    isTemplate: { type: Boolean, default: false },
    templateId: { type: Schema.Types.ObjectId, ref: 'Workflow' },
    executionCount: { type: Number, default: 0 },
    lastExecutedAt: Date,
    avgExecutionTime: Number,
    errorCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

WorkflowSchema.index({ userId: 1, status: 1 });
WorkflowSchema.index({ userId: 1, isTemplate: 1 });

export const Workflow = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);