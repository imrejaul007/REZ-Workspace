import mongoose, { Document, Schema } from 'mongoose';

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  GRADUATED = 'GRADUATED',
  DROPPED = 'DROPPED'
}

export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE'
}

export interface IStudent extends Document {
  studentId: string;
  merchantId: string;
  batchId?: string;
  name: string;
  email?: string;
  phone: string;
  age?: number;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  emergencyContact?: string;
  photoUrl?: string;
  enrollmentDate: Date;
  status: StudentStatus;
  attendanceRate: number;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>({
  studentId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  batchId: { type: String, index: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true, index: true },
  age: { type: Number },
  parentName: { type: String },
  parentPhone: { type: String },
  address: { type: String },
  emergencyContact: { type: String },
  photoUrl: { type: String },
  enrollmentDate: { type: Date, required: true, default: Date.now },
  status: { type: String, enum: StudentStatus, default: StudentStatus.ACTIVE, index: true },
  attendanceRate: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: PaymentStatus, default: PaymentStatus.PENDING }
}, {
  timestamps: true,
  collection: 'students'
});

// Compound indexes for common queries
StudentSchema.index({ merchantId: 1, status: 1 });
StudentSchema.index({ batchId: 1, status: 1 });
StudentSchema.index({ merchantId: 1, batchId: 1 });
StudentSchema.index({ email: 1 });
StudentSchema.index({ name: 'text', phone: 'text' });

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
