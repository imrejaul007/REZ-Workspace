import mongoose, { Document, Schema } from 'mongoose';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ILog extends Document {
  _id: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  executionId: mongoose.Types.ObjectId;
  actionId?: mongoose.Types.ObjectId;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const LogSchema = new Schema<ILog>(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    executionId: { type: Schema.Types.ObjectId, ref: 'Execution', required: true, index: true },
    actionId: { type: Schema.Types.ObjectId, ref: 'Action' },
    level: {
      type: String,
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info',
      index: true
    },
    message: { type: String, required: true, maxlength: 2000 },
    context: { type: Map, of: Schema.Types.Mixed },
    metadata: { type: Map, of: Schema.Types.Mixed }
  },
  { timestamps: true }
);

LogSchema.index({ workflowId: 1, executionId: 1, createdAt: -1 });
LogSchema.index({ executionId: 1, level: 1 });

export const Log = mongoose.model<ILog>('Log', LogSchema);