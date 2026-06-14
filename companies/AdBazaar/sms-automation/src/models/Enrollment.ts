import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAction extends Document {
  enrollmentId: Types.ObjectId;
  userId: string;
  sequenceId: Types.ObjectId;
  stepId: Types.ObjectId;
  actionType: 'sent' | 'delivered' | 'failed' | 'replied' | 'unsubscribed' | 'skipped';
  timestamp: Date;
  metadata?: {
    twilioSid?: string;
    errorMessage?: string;
    replyContent?: string;
  };
  createdAt: Date;
}

export interface IEnrollment extends Document {
  sequenceId: Types.ObjectId;
  userId: string;
  phone: string;
  status: 'active' | 'completed' | 'opted_out' | 'failed' | 'paused';
  enrolledAt: Date;
  completedAt?: Date;
  currentStepIndex: number;
  stepHistory: Array<{
    stepId: Types.ObjectId;
    status: 'pending' | 'sent' | 'skipped' | 'completed';
    sentAt?: Date;
    completedAt?: Date;
  }>;
  variables: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActionSchema = new Schema<IAction>(
  {
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
    userId: { type: String, required: true, index: true },
    sequenceId: { type: Schema.Types.ObjectId, ref: 'Sequence', required: true, index: true },
    stepId: { type: Schema.Types.ObjectId, ref: 'Step', required: true, index: true },
    actionType: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'replied', 'unsubscribed', 'skipped'],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    metadata: {
      twilioSid: String,
      errorMessage: String,
      replyContent: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActionSchema.index({ userId: 1, timestamp: -1 });
ActionSchema.index({ sequenceId: 1, actionType: 1 });

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    sequenceId: { type: Schema.Types.ObjectId, ref: 'Sequence', required: true, index: true },
    userId: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'opted_out', 'failed', 'paused'],
      default: 'active',
      index: true,
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: Date,
    currentStepIndex: { type: Number, default: 0 },
    stepHistory: [{
      stepId: { type: Schema.Types.ObjectId, ref: 'Step' },
      status: { type: String, enum: ['pending', 'sent', 'skipped', 'completed'], default: 'pending' },
      sentAt: Date,
      completedAt: Date,
    }],
    variables: { type: Map, of: Schema.Types.Mixed, default: {} },
    metadata: { type: Schema.Types.Mixed },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ sequenceId: 1, status: 1 });
EnrollmentSchema.index({ userId: 1, enrolledAt: -1 });
EnrollmentSchema.index({ lastActivityAt: 1 });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
export const Action = mongoose.model<IAction>('Action', ActionSchema);