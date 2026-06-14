/**
 * Attendance Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  attendanceId: string;
  userId: string;
  gymId: string;
  membershipId: string;
  checkInTime: string;
  checkOutTime?: string;
  sessionType: 'gym' | 'class' | 'personal_training';
  sessionId?: string;
  source: 'qr' | 'manual' | 'face_recognition';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  attendanceId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  gymId: { type: String, required: true, index: true },
  membershipId: { type: String, required: true, index: true },
  checkInTime: { type: String, required: true },
  checkOutTime: String,
  sessionType: {
    type: String,
    enum: ['gym', 'class', 'personal_training'],
    default: 'gym',
  },
  sessionId: String,
  source: {
    type: String,
    enum: ['qr', 'manual', 'face_recognition'],
    default: 'qr',
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

AttendanceSchema.index({ userId: 1, checkInTime: -1 });
AttendanceSchema.index({ gymId: 1, checkInTime: -1 });
AttendanceSchema.index({ isActive: 1, checkInTime: -1 });

export const Attendance = mongoose.model<IAttendance>('GymAttendance', AttendanceSchema);
