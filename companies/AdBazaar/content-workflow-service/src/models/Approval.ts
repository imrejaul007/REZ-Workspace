import mongoose, { Document, Schema } from 'mongoose';

export interface IApproval extends Document {
  _id: mongoose.Types.ObjectId;
  approvalId: string;
  workflowId: string;
  stageId: string;
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected' | 'delegated';
  comments?: string;
  decision: 'approve' | 'reject' | 'request_changes' | 'delegate';
  delegatedTo?: string;
  decidedAt?: Date;
  createdAt: Date;
}

const ApprovalSchema = new Schema<IApproval>(
  {
    approvalId: { type: String, required: true, unique: true, index: true },
    workflowId: { type: String, required: true, index: true },
    stageId: { type: String, required: true },
    approverId: { type: String, required: true, index: true },
    approverName: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'delegated'],
      default: 'pending',
      index: true
    },
    comments: { type: String },
    decision: {
      type: String,
      enum: ['approve', 'reject', 'request_changes', 'delegate'],
      required: true
    },
    delegatedTo: { type: String },
    decidedAt: { type: Date }
  },
  { timestamps: true }
);

ApprovalSchema.index({ workflowId: 1, stageId: 1 });
ApprovalSchema.index({ approverId: 1, status: 1 });

export const Approval = mongoose.model<IApproval>('Approval', ApprovalSchema);