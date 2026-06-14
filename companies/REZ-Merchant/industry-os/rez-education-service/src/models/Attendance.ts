import mongoose, { Document, Schema } from 'mongoose';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

export interface IAttendance extends Document {
  attendanceId: string;
  batchId: string;
  studentId: string;
  merchantId: string;
  date: Date;
  status: AttendanceStatus;
  checkInTime?: Date;
  checkOutTime?: Date;
  markedBy: string;
  notes?: string;
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  attendanceId: { type: String, required: true, unique: true, index: true },
  batchId: { type: String, required: true, index: true },
  studentId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  status: { type: String, enum: AttendanceStatus, required: true, default: AttendanceStatus.PRESENT },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  markedBy: { type: String, required: true },
  notes: { type: String }
}, {
  timestamps: true,
  collection: 'attendance'
});

// Compound indexes for common queries
AttendanceSchema.index({ merchantId: 1, date: 1 });
AttendanceSchema.index({ batchId: 1, date: 1 });
AttendanceSchema.index({ studentId: 1, date: 1 });
AttendanceSchema.index({ batchId: 1, studentId: 1 });
AttendanceSchema.index({ merchantId: 1, batchId: 1, date: 1 });

// Unique constraint: one attendance record per student per day per batch
AttendanceSchema.index({ batchId: 1, studentId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
