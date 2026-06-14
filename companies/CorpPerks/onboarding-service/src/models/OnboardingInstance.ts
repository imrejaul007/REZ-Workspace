import mongoose, { Document, Schema } from 'mongoose';

// Task instance during onboarding
export interface IOnboardingTask {
  taskId: string;
  templateTaskId?: string;
  title: string;
  description: string;
  assigneeType: 'employee' | 'manager' | 'hr' | 'it' | 'finance';
  assigneeId?: string;
  category: 'documentation' | 'training' | 'equipment' | 'introduction' | 'compliance' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dueDate: Date;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  order: number;
  isRequired: boolean;
}

export type OnboardingStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';

export interface IOnboardingInstance extends Document {
  instanceId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  templateId: string;
  templateName: string;
  startDate: Date;
  targetEndDate: Date;
  actualEndDate?: Date;
  status: OnboardingStatus;
  progress: number; // percentage 0-100
  tasks: IOnboardingTask[];
  currentStep: number;
  completedSteps: string[];
  managerId?: string;
  hrId?: string;
  department?: string;
  role?: string;
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

const OnboardingTaskSchema = new Schema<IOnboardingTask>({
  taskId: { type: String, required: true },
  templateTaskId: { type: String },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  assigneeType: {
    type: String,
    enum: ['employee', 'manager', 'hr', 'it', 'finance'],
    required: true
  },
  assigneeId: { type: String },
  category: {
    type: String,
    enum: ['documentation', 'training', 'equipment', 'introduction', 'compliance', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'skipped'],
    default: 'pending'
  },
  dueDate: { type: Date, required: true },
  completedAt: { type: Date },
  completedBy: { type: String },
  notes: { type: String },
  order: { type: Number, required: true },
  isRequired: { type: Boolean, default: true }
}, { _id: false });

const OnboardingInstanceSchema = new Schema<IOnboardingInstance>({
  instanceId: { type: String, required: true, unique: true, index: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  employeeEmail: { type: String, required: true },
  templateId: { type: String, required: true, index: true },
  templateName: { type: String, required: true },
  startDate: { type: Date, required: true },
  targetEndDate: { type: Date, required: true },
  actualEndDate: { type: Date },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'blocked', 'completed', 'cancelled'],
    default: 'not_started'
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  tasks: [OnboardingTaskSchema],
  currentStep: { type: Number, default: 0 },
  completedSteps: [{ type: String }],
  managerId: { type: String },
  hrId: { type: String },
  department: { type: String, index: true },
  role: { type: String },
  notes: [{ type: String }],
  lastActivityAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
OnboardingInstanceSchema.index({ employeeId: 1, status: 1 });
OnboardingInstanceSchema.index({ managerId: 1 });
OnboardingInstanceSchema.index({ status: 1, startDate: -1 });
OnboardingInstanceSchema.index({ 'tasks.assigneeId': 1, 'tasks.status': 1 });

export const OnboardingInstance = mongoose.model<IOnboardingInstance>('OnboardingInstance', OnboardingInstanceSchema);
