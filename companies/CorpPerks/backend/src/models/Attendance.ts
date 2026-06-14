import mongoose, { Schema } from 'mongoose';
import { IAttendance, AttendanceStatus, IGeoLocation } from '../types/index.js';

const geoLocationSchema = new Schema<IGeoLocation>({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true },
  address: { type: String },
}, { _id: false });

const attendanceSchema = new Schema<IAttendance>(
  {
    tenantId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    checkInLocation: { type: geoLocationSchema },
    checkOutLocation: { type: geoLocationSchema },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half_day', 'on_leave'],
      default: 'present',
    },
    remarks: { type: String },
    isRemote: { type: Boolean, default: false },
    hoursWorked: { type: Number },
  },
  { timestamps: true }
);

attendanceSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ tenantId: 1, date: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
