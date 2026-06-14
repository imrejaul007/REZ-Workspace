import mongoose, { Document, Schema } from 'mongoose';

export type OffboardingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
export type OffboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';

// Offboarding task
export interface IOffboardingTask {
  taskId: string;
  title: string;
  description: string;
  assigneeType: 'employee' | 'manager' | 'hr' | 'it' | 'finance' | 'legal';
  assigneeId?: string;
  category: 'knowledge_transfer' | 'equipment_return' | 'access_revocation' | 'documentation' | 'clearance' | 'final_payroll' | 'other';
  status: OffboardingTaskStatus;
  dueDate: Date;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  order: number;
  isRequired: boolean;
}

// Offboarding instance
export interface IOffboardingInstance extends Document {
  instanceId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  interviewId?: string;
  department?: string;
  role?: string;
  managerId?: string;
  startDate: Date;
  targetEndDate: Date;
  actualEndDate?: Date;
  status: OffboardingStatus;
  progress: number;
  tasks: IOffboardingTask[];
  clearanceChecklist: {
    category: string;
    cleared: boolean;
    clearedBy?: string;
    clearedAt?: Date;
    notes?: string;
  }[];
  managerClearance: boolean;
  hrClearance: boolean;
  financeClearance: boolean;
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

const OffboardingTaskSchema = new Schema<IOffboardingTask>({
  taskId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  assigneeType: {
    type: String,
    enum: ['employee', 'manager', 'hr', 'it', 'finance', 'legal'],
    required: true
  },
  assigneeId: { type: String },
  category: {
    type: String,
    enum: ['knowledge_transfer', 'equipment_return', 'access_revocation', 'documentation', 'clearance', 'final_payroll', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'skipped', 'blocked'],
    default: 'pending'
  },
  dueDate: { type: Date, required: true },
  completedAt: { type: Date },
  completedBy: { type: String },
  notes: { type: String },
  order: { type: Number, required: true },
  isRequired: { type: Boolean, default: true }
}, { _id: false });

const ClearanceItemSchema = new Schema({
  category: { type: String, required: true },
  cleared: { type: Boolean, default: false },
  clearedBy: { type: String },
  clearedAt: { type: Date },
  notes: { type: String }
}, { _id: false });

const OffboardingInstanceSchema = new Schema<IOffboardingInstance>({
  instanceId: { type: String, required: true, unique: true, index: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  employeeEmail: { type: String, required: true },
  interviewId: { type: String, index: true },
  department: { type: String, index: true },
  role: { type: String },
  managerId: { type: String },
  startDate: { type: Date, required: true },
  targetEndDate: { type: Date, required: true },
  actualEndDate: { type: Date },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'cancelled'],
    default: 'not_started'
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  tasks: [OffboardingTaskSchema],
  clearanceChecklist: [ClearanceItemSchema],
  managerClearance: { type: Boolean, default: false },
  hrClearance: { type: Boolean, default: false },
  financeClearance: { type: Boolean, default: false },
  notes: [{ type: String }],
  lastActivityAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
OffboardingInstanceSchema.index({ employeeId: 1, status: 1 });
OffboardingInstanceSchema.index({ managerId: 1 });
OffboardingInstanceSchema.index({ status: 1, targetEndDate: -1 });
OffboardingInstanceSchema.index({ 'tasks.assigneeId': 1, 'tasks.status': 1 });

export const OffboardingInstance = mongoose.model<IOffboardingInstance>('OffboardingInstance', OffboardingInstanceSchema);
