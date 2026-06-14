import mongoose, { Document, Schema } from 'mongoose';

export type StepStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface IStepInstance extends Document {
  _id: mongoose.Types.ObjectId;
  enrollmentId: mongoose.Types.ObjectId;
  sequenceId: mongoose.Types.ObjectId;
  stepOrder: number;
  stepType: 'email' | 'notification' | 'sms' | 'delay' | 'condition' | 'webhook' | 'task';
  stepName: string;
  status: StepStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: {
    sent?: boolean;
    delivered?: boolean;
    opened?: boolean;
    clicked?: boolean;
    response?: Record<string, unknown>;
  };
  error?: string;
  retryCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const StepInstanceSchema = new Schema<IStepInstance>(
  {
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
    sequenceId: { type: Schema.Types.ObjectId, ref: 'Sequence', required: true, index: true },
    stepOrder: { type: Number, required: true },
    stepType: {
      type: String,
      enum: ['email', 'notification', 'sms', 'delay', 'condition', 'webhook', 'task'],
      required: true
    },
    stepName: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'in_progress', 'completed', 'failed', 'skipped'],
      default: 'pending',
      index: true
    },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    result: {
      sent: Boolean,
      delivered: Boolean,
      opened: Boolean,
      clicked: Boolean,
      response: { type: Map, of: Schema.Types.Mixed }
    },
    error: String,
    retryCount: { type: Number, default: 0 },
    metadata: { type: Map, of: Schema.Types.Mixed }
  },
  { timestamps: true }
);

StepInstanceSchema.index({ enrollmentId: 1, stepOrder: 1 });
StepInstanceSchema.index({ sequenceId: 1, status: 1 });

export const StepInstance = mongoose.model<IStepInstance>('StepInstance', StepInstanceSchema);