import mongoose, { Schema, Document } from 'mongoose';

export interface IProgress extends Document {
  onboardingId: string;
  customerId: string;
  step: number;
  action: 'started' | 'completed' | 'skipped' | 'note_added' | 'attachment_added';
  taskId?: string;
  taskName?: string;
  notes?: string;
  completedBy?: string;
  duration?: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    onboardingId: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    step: {
      type: Number,
      required: true,
    },
    action: {
      type: String,
      enum: ['started', 'completed', 'skipped', 'note_added', 'attachment_added'],
      required: true,
    },
    taskId: {
      type: String,
      index: true,
    },
    taskName: {
      type: String,
    },
    notes: {
      type: String,
    },
    completedBy: {
      type: String,
    },
    duration: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'onboarding_progress',
  }
);

ProgressSchema.index({ onboardingId: 1, createdAt: -1 });
ProgressSchema.index({ customerId: 1, createdAt: -1 });

export const ProgressModel = mongoose.model<IProgress>('OnboardingProgress', ProgressSchema);