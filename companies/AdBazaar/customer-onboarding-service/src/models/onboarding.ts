import mongoose, { Schema, Document } from 'mongoose';

export interface IOnboarding extends Document {
  customerId: string;
  type: 'standard' | 'enterprise' | 'agency' | 'publisher' | 'creator';
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  progress: number;
  currentStep: number;
  totalSteps: number;
  startedAt?: Date;
  completedAt?: Date;
  dueDate: Date;
  assignedTo?: string;
  checklist: {
    checklistId: string;
    name: string;
    completed: boolean;
    completedAt?: Date;
  }[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingSchema = new Schema<IOnboarding>(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['standard', 'enterprise', 'agency', 'publisher', 'creator'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'paused', 'cancelled'],
      required: true,
      default: 'not_started',
      index: true,
    },
    progress: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    currentStep: {
      type: Number,
      required: true,
      default: 0,
    },
    totalSteps: {
      type: Number,
      required: true,
      default: 10,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    assignedTo: {
      type: String,
      index: true,
    },
    checklist: [{
      checklistId: { type: String, required: true },
      name: { type: String, required: true },
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
    }],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'onboardings',
  }
);

OnboardingSchema.index({ customerId: 1, status: 1 });
OnboardingSchema.index({ status: 1, dueDate: 1 });
OnboardingSchema.index({ assignedTo: 1, status: 1 });

export const OnboardingModel = mongoose.model<IOnboarding>('Onboarding', OnboardingSchema);