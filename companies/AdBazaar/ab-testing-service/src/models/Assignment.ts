import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  assignmentId: string;
  testId: string;
  variantId: string;
  userId: string;
  companyId: string;
  sessionId?: string;
  assignedAt: Date;
  converted: boolean;
  convertedAt?: Date;
  revenue?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    assignmentId: { type: String, required: true, unique: true, index: true },
    testId: { type: String, required: true, index: true },
    variantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    sessionId: { type: String },
    assignedAt: { type: Date, default: Date.now },
    converted: { type: Boolean, default: false },
    convertedAt: { type: Date },
    revenue: { type: Number },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

AssignmentSchema.index({ testId: 1, userId: 1 });
AssignmentSchema.index({ testId: 1, converted: 1 });
AssignmentSchema.index({ userId: 1, assignedAt: -1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);