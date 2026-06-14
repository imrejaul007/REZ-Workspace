import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  assignmentId: string;
  experimentId: string;
  userId: string;
  variantId: string;
  assignedAt: Date;
  converted: boolean;
  convertedAt?: Date;
  metadata?: {
    deviceType?: string;
    browser?: string;
    country?: string;
    platform?: string;
    source?: string;
    medium?: string;
  };
  createdAt: Date;
}

const assignmentSchema = new Schema<IAssignment>({
  assignmentId: { type: String, required: true, unique: true },
  experimentId: { type: String, required: true },
  userId: { type: String, required: true },
  variantId: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now },
  converted: { type: Boolean, default: false },
  convertedAt: { type: Date },
  metadata: {
    deviceType: String,
    browser: String,
    country: String,
    platform: String,
    source: String,
    medium: String
  }
}, { timestamps: true });

assignmentSchema.index({ assignmentId: 1 });
assignmentSchema.index({ experimentId: 1 });
assignmentSchema.index({ userId: 1 });
assignmentSchema.index({ experimentId: 1, userId: 1 }, { unique: true });
assignmentSchema.index({ variantId: 1 });
assignmentSchema.index({ converted: 1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);