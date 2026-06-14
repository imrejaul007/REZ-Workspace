/**
 * Attendance Record Model - Fitness OS
 * Tracks member check-in/check-out for gym attendance
 */

import mongoose, { Schema, Types } from 'mongoose';

export interface IAttendanceRecord {
  memberId: Types.ObjectId;
  memberName: string;
  storeId: Types.ObjectId;
  classId?: Types.ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: 'checked_in' | 'checked_out' | 'no_show';
  source: 'manual' | 'qr' | 'auto';
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'Member',
    },
    memberName: {
      type: String,
      required: true,
      trim: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'Store',
    },
    classId: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: 'Class',
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['checked_in', 'checked_out', 'no_show'],
      default: 'checked_in',
      index: true,
    },
    source: {
      type: String,
      enum: ['manual', 'qr', 'auto'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
attendanceRecordSchema.index({ storeId: 1, date: 1 });
attendanceRecordSchema.index({ memberId: 1, date: 1 });
attendanceRecordSchema.index({ classId: 1, date: 1 });

// Prevent duplicate check-ins for same member on same day
attendanceRecordSchema.index(
  { memberId: 1, storeId: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $ne: 'no_show' },
    },
  }
);

export const AttendanceRecord =
  mongoose.models.AttendanceRecord ||
  mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema, 'attendance_records');
