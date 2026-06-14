import mongoose, { Document, Schema } from 'mongoose';

export type ActionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type ActionType =
  | 'send_email'
  | 'send_notification'
  | 'update_record'
  | 'http_request'
  | 'transform_data'
  | 'delay'
  | 'condition'
  | 'loop'
  | 'webhook'
  | 'script';

export interface IAction extends Document {
  _id: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  executionId: mongoose.Types.ObjectId;
  name: string;
  type: ActionType;
  order: number;
  status: ActionStatus;
  config: Record<string, unknown>;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ActionSchema = new Schema<IAction>(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    executionId: { type: Schema.Types.ObjectId, ref: 'Execution', required: true, index: true },
    name: { type: String, required: true, maxlength: 200 },
    type: {
      type: String,
      enum: [
        'send_email',
        'send_notification',
        'update_record',
        'http_request',
        'transform_data',
        'delay',
        'condition',
        'loop',
        'webhook',
        'script'
      ],
      required: true
    },
    order: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'skipped'],
      default: 'pending'
    },
    config: { type: Schema.Types.Mixed, default: {} },
    input: { type: Map, of: Schema.Types.Mixed },
    output: { type: Map, of: Schema.Types.Mixed },
    error: String,
    startedAt: Date,
    completedAt: Date,
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    metadata: { type: Map, of: Schema.Types.Mixed }
  },
  { timestamps: true }
);

ActionSchema.index({ workflowId: 1, executionId: 1 });
ActionSchema.index({ executionId: 1, order: 1 });

export const Action = mongoose.model<IAction>('Action', ActionSchema);