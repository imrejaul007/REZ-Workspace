import mongoose, { Document, Schema, Types } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day';

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  staffId: Types.ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: AttendanceStatus;
  overtimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true,
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
      enum: ['present', 'absent', 'late', 'half_day'],
      default: 'absent',
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient attendance queries
AttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1, status: 1 });

// Virtual to calculate worked hours
AttendanceSchema.virtual('workedHours').get(function () {
  if (!this.checkIn || !this.checkOut) return 0;

  const diff = this.checkOut.getTime() - this.checkIn.getTime();
  const hours = diff / (1000 * 60 * 60);

  // Add overtime
  return hours + this.overtimeMinutes / 60;
});

// Virtual to check if still checked in
AttendanceSchema.virtual('isCheckedIn').get(function () {
  return !!this.checkIn && !this.checkOut;
});

// Pre-save hook to update status based on check-in/out times
AttendanceSchema.pre('save', function (next) {
  if (this.checkIn && !this.checkOut) {
    // Check if late (after 9:00 AM default)
    const checkInHour = this.checkIn.getHours();
    if (checkInHour >= 9) {
      this.status = 'late';
    } else {
      this.status = 'present';
    }
  } else if (this.checkIn && this.checkOut) {
    this.status = 'present';
  }
  next();
});

// Ensure virtuals are included in JSON
AttendanceSchema.set('toJSON', { virtuals: true });
AttendanceSchema.set('toObject', { virtuals: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
