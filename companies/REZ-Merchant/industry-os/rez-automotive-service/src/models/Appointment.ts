import mongoose, { Schema, model, Document } from 'mongoose';
import { IAppointment, AppointmentStatus, ServiceType } from '../types';

export interface AppointmentDocument extends Omit<IAppointment, '_id'>, Document {}

const appointmentSchema = new Schema<AppointmentDocument>(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    vehicleId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    serviceType: {
      type: String,
      required: true,
      enum: ['regular', 'repair', 'inspection'] as ServiceType[],
      lowercase: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'] as AppointmentStatus[],
      lowercase: true,
      default: 'scheduled',
      index: true,
    },
    estimatedDuration: {
      type: Number,
      required: true,
      min: 15,
      max: 480,
    },
    estimatedCost: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        keys: { merchantId: 1, date: 1, status: 1 },
        name: 'idx_merchant_date_status',
      },
      {
        keys: { customerId: 1, date: 1 },
        name: 'idx_customer_date',
      },
      {
        keys: { vehicleId: 1, date: 1 },
        name: 'idx_vehicle_date',
      },
    ],
  }
);

// Pre-save hook to generate appointmentId if not provided
appointmentSchema.pre('save', function (next) {
  if (!this.appointmentId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.appointmentId = `APT-${timestamp}-${randomStr}`;
  }
  next();
});

// Virtual for end time calculation
appointmentSchema.virtual('endTime').get(function () {
  const [hours, minutes] = this.time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + this.estimatedDuration;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
});

// Method to check if appointment is upcoming (within 24 hours)
appointmentSchema.methods.isUpcoming = function (): boolean {
  const now = new Date();
  const appointmentTime = new Date(this.date);
  appointmentTime.setHours(parseInt(this.time.split(':')[0]), parseInt(this.time.split(':')[1]));
  const diffHours = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= 24;
};

// Static method to get calendar events for a date range
appointmentSchema.statics.getCalendarEvents = function (
  merchantId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    merchantId,
    date: { $gte: startDate, $lte: endDate },
    status: { $nin: ['cancelled'] },
  }).sort({ date: 1, time: 1 }).select('-__v -_id');
};

// Static method to check slot availability
appointmentSchema.statics.isSlotAvailable = async function (
  merchantId: string,
  date: Date,
  time: string,
  duration: number
): Promise<boolean> {
  const existingAppointments = await this.find({
    merchantId,
    date: new Date(date),
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
  });

  const newStart = timeToMinutes(time);
  const newEnd = newStart + duration;

  for (const apt of existingAppointments) {
    const aptStart = timeToMinutes(apt.time);
    const aptEnd = aptStart + apt.estimatedDuration;

    if (!(newEnd <= aptStart || newStart >= aptEnd)) {
      return false;
    }
  }

  return true;
};

// Helper function to convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Ensure virtuals are included in JSON output
appointmentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Appointment = model<AppointmentDocument>('Appointment', appointmentSchema);