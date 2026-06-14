import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICertificate {
  tenantId: string;
  enrollmentId: Types.ObjectId;
  courseId: Types.ObjectId;
  employeeId: string;
  certificateId: string;
  issuedAt: Date;
  expiresAt?: Date;
  certificateUrl?: string;
  metadata?: {
    courseTitle: string;
    employeeName: string;
    completionDate: Date;
    score?: number;
  };
}

export interface ICertificateDocument extends ICertificate, Document {
  _id: Types.ObjectId;
}

const certificateSchema = new Schema<ICertificateDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    certificateId: { type: String, required: true, unique: true },
    issuedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date },
    certificateUrl: { type: String },
    metadata: {
      courseTitle: { type: String, required: true },
      employeeName: { type: String, required: true },
      completionDate: { type: Date, required: true },
      score: { type: Number },
    },
  },
  { timestamps: true }
);

// Indexes
certificateSchema.index({ tenantId: 1, employeeId: 1 });
certificateSchema.index({ tenantId: 1, courseId: 1 });

export const Certificate = mongoose.model<ICertificateDocument>('Certificate', certificateSchema);
