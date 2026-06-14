import mongoose, { Document, Schema } from 'mongoose';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface IExecution extends Document {
  _id: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  userId: string;
  status: ExecutionStatus;
  trigger: {
    type: string;
    source?: string;
    payload?: Record<string, unknown>;
  };
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  actionsCompleted: number;
  actionsFailed: number;
  logs: mongoose.Types.ObjectId[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ExecutionSchema = new Schema<IExecution>(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true
    },
    trigger: {
      type: { type: String, required: true },
      source: String,
      payload: { type: Map, of: Schema.Types.Mixed }
    },
    input: { type: Map, of: Schema.Types.Mixed, default: {} },
    output: { type: Map, of: Schema.Types.Mixed },
    error: String,
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    duration: Number,
    actionsCompleted: { type: Number, default: 0 },
    actionsFailed: { type: Number, default: 0 },
    logs: [{ type: Schema.Types.ObjectId, ref: 'Log' }],
    metadata: { type: Map, of: Schema.Types.Mixed }
  },
  { timestamps: true }
);

ExecutionSchema.index({ workflowId: 1, status: 1 });
ExecutionSchema.index({ userId: 1, createdAt: -1 });
ExecutionSchema.index({ workflowId: 1, createdAt: -1 });

export const Execution = mongoose.model<IExecution>('Execution', ExecutionSchema);