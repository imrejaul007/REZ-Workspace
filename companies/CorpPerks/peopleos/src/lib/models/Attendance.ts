import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  employeeId: string;
  companyId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  type: 'office' | 'wfh' | 'field' | 'leave';
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: 'present' | 'absent' | 'late' | 'half_day';
  onTime: boolean;
  workHours?: number;
  notes?: string;
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  employeeId: { type: String, required: true, index: true },
  companyId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  checkIn: Date,
  checkOut: Date,
  type: { type: String, enum: ['office', 'wfh', 'field', 'leave'], default: 'office' },
  location: {
    lat: Number,
    lng: Number,
    address: String,
  },
  status: { type: String, enum: ['present', 'absent', 'late', 'half_day'], default: 'present' },
  onTime: { type: Boolean, default: true },
  workHours: Number,
  notes: String,
}, { timestamps: true });

AttendanceSchema.index({ employeeId: 1, date: -1 });
AttendanceSchema.index({ companyId: 1, date: -1 });

export const Attendance = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
