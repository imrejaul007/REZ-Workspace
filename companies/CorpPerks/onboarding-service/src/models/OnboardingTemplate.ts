import mongoose, { Document, Schema } from 'mongoose';

// Step in an onboarding template
export interface IOnboardingStep {
  stepId: string;
  name: string;
  description: string;
  order: number;
  tasks: string[]; // Task titles within this step
  estimatedDuration: number; // in days
}

// Task definition in template
export interface ITemplateTask {
  taskId: string;
  title: string;
  description: string;
  assigneeType: 'employee' | 'manager' | 'hr' | 'it' | 'finance';
  category: 'documentation' | 'training' | 'equipment' | 'introduction' | 'compliance' | 'other';
  estimatedDuration: number; // in days
  isRequired: boolean;
  order: number;
}

export interface IOnboardingTemplate extends Document {
  templateId: string;
  name: string;
  description: string;
  department?: string;
  role?: string;
  steps: IOnboardingStep[];
  tasks: ITemplateTask[];
  defaultDuration: number; // in days
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  version: number;
}

const OnboardingStepSchema = new Schema<IOnboardingStep>({
  stepId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  order: { type: Number, required: true },
  tasks: [{ type: String }],
  estimatedDuration: { type: Number, default: 1 }
}, { _id: false });

const TemplateTaskSchema = new Schema<ITemplateTask>({
  taskId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  assigneeType: {
    type: String,
    enum: ['employee', 'manager', 'hr', 'it', 'finance'],
    required: true
  },
  category: {
    type: String,
    enum: ['documentation', 'training', 'equipment', 'introduction', 'compliance', 'other'],
    default: 'other'
  },
  estimatedDuration: { type: Number, default: 1 },
  isRequired: { type: Boolean, default: true },
  order: { type: Number, required: true }
}, { _id: false });

const OnboardingTemplateSchema = new Schema<IOnboardingTemplate>({
  templateId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  department: { type: String },
  role: { type: String },
  steps: [OnboardingStepSchema],
  tasks: [TemplateTaskSchema],
  defaultDuration: { type: Number, default: 30 },
  createdBy: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 }
}, {
  timestamps: true
});

// Indexes
OnboardingTemplateSchema.index({ department: 1 });
OnboardingTemplateSchema.index({ role: 1 });
OnboardingTemplateSchema.index({ isActive: 1 });

export const OnboardingTemplate = mongoose.model<IOnboardingTemplate>('OnboardingTemplate', OnboardingTemplateSchema);
