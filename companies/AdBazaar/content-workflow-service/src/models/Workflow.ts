import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkflow extends Document {
  _id: mongoose.Types.ObjectId;
  workflowId: string;
  name: string;
  description?: string;
  type: 'content_review' | 'campaign_approval' | 'asset_publishing' | 'custom';
  contentId?: string;
  contentType?: string;
  stages: IWorkflowStage[];
  currentStageIndex: number;
  status: 'draft' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'published' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: string;
  assignedTo?: string;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface IWorkflowStage extends Document {
  stageId: string;
  name: string;
  order: number;
  type: 'submission' | 'review' | 'approval' | 'publish';
  assignees: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'rejected';
  approver?: string;
  comments?: string;
  completedAt?: Date;
  requiredApprovals: number;
  currentApprovals: number;
}

const WorkflowStageSchema = new Schema({
  stageId: { type: String, required: true },
  name: { type: String, required: true },
  order: { type: Number, required: true },
  type: {
    type: String,
    enum: ['submission', 'review', 'approval', 'publish'],
    required: true
  },
  assignees: [String],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'skipped', 'rejected'],
    default: 'pending'
  },
  approver: { type: String },
  comments: { type: String },
  completedAt: { type: Date },
  requiredApprovals: { type: Number, default: 1 },
  currentApprovals: { type: Number, default: 0 }
}, { _id: false });

const WorkflowSchema = new Schema<IWorkflow>(
  {
    workflowId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['content_review', 'campaign_approval', 'asset_publishing', 'custom'],
      required: true,
      index: true
    },
    contentId: { type: String, index: true },
    contentType: { type: String },
    stages: [WorkflowStageSchema],
    currentStageIndex: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'pending', 'in_review', 'approved', 'rejected', 'published', 'archived'],
      default: 'draft',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    createdBy: { type: String, required: true, index: true },
    assignedTo: { type: String, index: true },
    deadline: { type: Date },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

WorkflowSchema.index({ createdAt: -1 });
WorkflowSchema.index({ status: 1, priority: -1 });

export const Workflow = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);