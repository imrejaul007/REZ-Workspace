import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  onboardingId: string;
  customerId: string;
  stepOrder: number;
  name: string;
  description: string;
  category: string;
  required: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  attachments: {
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }[];
  estimatedMinutes: number;
  actualMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
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
    stepOrder: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    required: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      required: true,
      default: 'pending',
      index: true,
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: String,
    },
    notes: {
      type: String,
    },
    attachments: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      type: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    }],
    estimatedMinutes: {
      type: Number,
      default: 15,
    },
    actualMinutes: {
      type: Number,
    },
  },
  {
    timestamps: true,
    collection: 'onboarding_tasks',
  }
);

TaskSchema.index({ onboardingId: 1, stepOrder: 1 });
TaskSchema.index({ customerId: 1, status: 1 });
TaskSchema.index({ status: 1, completedAt: -1 });

export const TaskModel = mongoose.model<ITask>('OnboardingTask', TaskSchema);