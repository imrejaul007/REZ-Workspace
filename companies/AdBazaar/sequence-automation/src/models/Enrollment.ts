import mongoose, { Document, Schema } from 'mongoose';

export type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'dropped' | 'unsubscribed';

export interface IEnrollment extends Document {
  _id: mongoose.Types.ObjectId;
  sequenceId: mongoose.Types.ObjectId;
  userId: string;
  contactId: string;
  contactEmail?: string;
  contactName?: string;
  status: EnrollmentStatus;
  currentStep: number;
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  lastActivityAt?: Date;
  progress: {
    completedSteps: number;
    totalSteps: number;
    percentComplete: number;
  };
  stepHistory: {
    stepOrder: number;
    stepType: string;
    status: string;
    completedAt?: Date;
    result?: Record<string, unknown>;
  }[];
  metrics: {
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
    notificationsSent: number;
    webhooksTriggered: number;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    sequenceId: { type: Schema.Types.ObjectId, ref: 'Sequence', required: true, index: true },
    userId: { type: String, required: true, index: true },
    contactId: { type: String, required: true, index: true },
    contactEmail: String,
    contactName: String,
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'dropped', 'unsubscribed'],
      default: 'active',
      index: true
    },
    currentStep: { type: Number, default: 0 },
    enrolledAt: { type: Date, default: Date.now },
    startedAt: Date,
    completedAt: Date,
    pausedAt: Date,
    resumedAt: Date,
    lastActivityAt: Date,
    progress: {
      completedSteps: { type: Number, default: 0 },
      totalSteps: { type: Number, default: 0 },
      percentComplete: { type: Number, default: 0 }
    },
    stepHistory: [
      {
        stepOrder: { type: Number, required: true },
        stepType: { type: String, required: true },
        status: { type: String, required: true },
        completedAt: Date,
        result: { type: Map, of: Schema.Types.Mixed }
      }
    ],
    metrics: {
      emailsSent: { type: Number, default: 0 },
      emailsOpened: { type: Number, default: 0 },
      emailsClicked: { type: Number, default: 0 },
      notificationsSent: { type: Number, default: 0 },
      webhooksTriggered: { type: Number, default: 0 }
    },
    metadata: { type: Map, of: Schema.Types.Mixed }
  },
  { timestamps: true }
);

EnrollmentSchema.index({ sequenceId: 1, status: 1 });
EnrollmentSchema.index({ userId: 1, contactId: 1 });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);