import mongoose, { Schema, Document } from 'mongoose';
import { Attendance as IAttendance, AttendanceStatus } from '../types';

export interface AttendanceDocument extends Omit<IAttendance, '_id'>, Document {}

const AttendanceSchema = new Schema<AttendanceDocument>(
  {
    studentId: {
      type: String,
      required: true,
      index: true
    },
    batchId: {
      type: String,
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: ['present', 'absent', 'late', 'excused', 'holiday'],
      default: 'present'
    },
    markedBy: {
      type: String,
      required: true
    },
    remarks: {
      type: String,
      maxlength: 200
    },
    checkInTime: {
      type: String
    },
    checkOutTime: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ batchId: 1, date: 1 });
AttendanceSchema.index({ date: 1, status: 1 });

AttendanceSchema.statics.findByDate = function(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    date: { $gte: startOfDay, $lte: endOfDay }
  });
};

AttendanceSchema.statics.findByStudentAndDateRange = function(
  studentId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    studentId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

export const AttendanceModel = mongoose.model<AttendanceDocument>('Attendance', AttendanceSchema);
