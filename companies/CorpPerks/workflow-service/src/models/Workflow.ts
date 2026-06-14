import mongoose, { Document, Schema } from 'mongoose';

export type WorkflowAction = 'approve' | 'reject' | 'notify' | 'complete';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type InstanceStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
export type StepStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

export interface IWorkflowStep extends Document {
  name: string;
  order: number;
  approverId?: string;
  approverName?: string;
  approverEmail?: string;
  action: WorkflowAction;
  actionLabel?: string;
  instructions?: string;
  timeout?: number; // minutes
  timeoutAction?: 'auto_approve' | 'auto_reject' | 'escalate' | 'notify';
  condition?: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
    value: unknown;
  };
  metadata?: Record<string, unknown>;
}

export interface ICondition extends Document {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
  value: unknown;
}

export interface IWorkflow extends Document {
  name: string;
  description?: string;
  category: string;
  type: string;
  version: number;
  status: WorkflowStatus;
  ownerId: string;
  ownerName?: string;
  departmentId?: string;
  steps: IWorkflowStep[];
  conditions?: ICondition[];
  variables?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStepHistory extends Document {
  stepId: string;
  stepName: string;
  action: WorkflowAction;
  actionBy?: string;
  actionByName?: string;
  actionAt?: Date;
  comments?: string;
  status: StepStatus;
  previousValue?: unknown;
  newValue?: unknown;
}

export interface IWorkflowInstance extends Document {
  workflowId: mongoose.Types.ObjectId;
  workflowName?: string;
  workflowVersion: number;
  initiatorId: string;
  initiatorName?: string;
  currentStepIndex: number;
  status: InstanceStatus;
  data: Record<string, unknown>;
  stepHistory: IStepHistory[];
  approverComments?: Record<string, string>;
  escalatedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowStepSchema = new Schema<IWorkflowStep>(
  {
    name: { type: String, required: true },
    order: { type: Number, required: true },
    approverId: { type: String },
    approverName: { type: String },
    approverEmail: { type: String },
    action: {
      type: String,
      enum: ['approve', 'reject', 'notify', 'complete'],
      required: true
    },
    actionLabel: { type: String },
    instructions: { type: String },
    timeout: { type: Number }, // in minutes
    timeoutAction: {
      type: String,
      enum: ['auto_approve', 'auto_reject', 'escalate', 'notify']
    },
    condition: {
      field: { type: String },
      operator: { type: String, enum: ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'contains', 'in'] },
      value: { type: Schema.Types.Mixed }
    },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

const ConditionSchema = new Schema<ICondition>(
  {
    field: { type: String, required: true },
    operator: {
      type: String,
      enum: ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'contains', 'in'],
      required: true
    },
    value: { type: Schema.Types.Mixed, required: true }
  },
  { _id: false }
);

const WorkflowSchema = new Schema<IWorkflow>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, required: true },
    type: { type: String, required: true },
    version: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft'
    },
    ownerId: { type: String, required: true },
    ownerName: { type: String },
    departmentId: { type: String },
    steps: [WorkflowStepSchema],
    conditions: [ConditionSchema],
    variables: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

const StepHistorySchema = new Schema<IStepHistory>(
  {
    stepId: { type: String, required: true },
    stepName: { type: String, required: true },
    action: {
      type: String,
      enum: ['approve', 'reject', 'notify', 'complete'],
      required: true
    },
    actionBy: { type: String },
    actionByName: { type: String },
    actionAt: { type: Date },
    comments: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'skipped'],
      default: 'pending'
    },
    previousValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const WorkflowInstanceSchema = new Schema<IWorkflowInstance>(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
    workflowName: { type: String },
    workflowVersion: { type: Number, default: 1 },
    initiatorId: { type: String, required: true },
    initiatorName: { type: String },
    currentStepIndex: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'approved', 'rejected', 'cancelled'],
      default: 'pending'
    },
    data: { type: Schema.Types.Mixed, default: {} },
    stepHistory: [StepHistorySchema],
    approverComments: { type: Schema.Types.Mixed },
    escalatedTo: { type: String },
    dueDate: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: String },
    cancellationReason: { type: String }
  },
  { timestamps: true }
);

// Indexes
WorkflowSchema.index({ ownerId: 1, status: 1 });
WorkflowSchema.index({ category: 1, type: 1 });
WorkflowSchema.index({ status: 1 });

WorkflowInstanceSchema.index({ workflowId: 1, status: 1 });
WorkflowInstanceSchema.index({ initiatorId: 1, status: 1 });
WorkflowInstanceSchema.index({ 'steps.approverId': 1, status: 1 });
WorkflowInstanceSchema.index({ dueDate: 1, status: 1 });
WorkflowInstanceSchema.index({ createdAt: -1 });

export const Workflow = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);
export const WorkflowInstance = mongoose.model<IWorkflowInstance>('WorkflowInstance', WorkflowInstanceSchema);
