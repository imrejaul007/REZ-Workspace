import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  enrollmentId: string;
  employeeId: string;
  programId: string;
  companyId: string;
  enrolledAt: Date;
  completedAt?: Date;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  progress: number;
  score?: number;
  certificateUrl?: string;
  metadata?: Record<string, unknown>;
}

const EnrollmentSchema = new Schema<IEnrollment>({
  enrollmentId: { type: String, required: true, unique: true, index: true },
  employeeId: { type: String, required: true, index: true },
  programId: { type: String, required: true, index: true },
  companyId: { type: String, required: true, index: true },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  status: {
    type: String,
    enum: ['enrolled', 'in_progress', 'completed', 'dropped'],
    default: 'enrolled',
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  score: { type: Number },
  certificateUrl: { type: String },
  metadata: { type: Schema.Types.Mixed },
});

EnrollmentSchema.index({ status: 1 });
EnrollmentSchema.index({ employeeId: 1, programId: 1 });
EnrollmentSchema.index({ companyId: 1, status: 1 });
EnrollmentSchema.index({ enrolledAt: -1 });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
