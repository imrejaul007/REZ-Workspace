/**
 * Attendance Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  attendanceId: string;
  merchantId: string;
  restaurantId: string;
  employeeId: string;
  shiftId?: string;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  scheduledHours: number;
  actualHours: number;
  overtimeHours: number;
  status: 'present' | 'absent' | 'late' | 'early_leave';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>({
  attendanceId: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  shiftId: { type: String, index: true },
  date: { type: Date, required: true, index: true },
  clockIn: Date,
  clockOut: Date,
  scheduledHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'early_leave'],
    default: 'present'
  },
  notes: String,
}, { timestamps: true });

attendanceSchema.index({ merchantId: 1, restaurantId: 1, date: 1 });
attendanceSchema.index({ employeeId: 1, date: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
