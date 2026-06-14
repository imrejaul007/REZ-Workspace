import mongoose, { Schema, Document } from 'mongoose';
import { Appointment as IAppointment, BookingStatus } from '../types';

export interface AppointmentDocument extends Omit<IAppointment, '_id'>, Document {}

const AppointmentSchema = new Schema<AppointmentDocument>(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customerId: {
      type: String,
      required: true,
      index: true
    },
    serviceId: {
      type: String,
      required: true,
      index: true
    },
    therapistId: {
      type: String,
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 15
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
      index: true
    },
    notes: {
      type: String,
      default: ''
    },
    specialRequests: {
      type: String,
      default: ''
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

AppointmentSchema.index({ date: 1, therapistId: 1 });
AppointmentSchema.index({ customerId: 1, date: 1 });
AppointmentSchema.index({ serviceId: 1, date: 1 });
AppointmentSchema.index({ status: 1, date: 1 });

AppointmentSchema.statics.findByDate = function(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    date: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ startTime: 1 });
};

AppointmentSchema.statics.findByTherapistAndDate = function(therapistId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    therapistId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['cancelled', 'no_show'] }
  }).sort({ startTime: 1 });
};

AppointmentSchema.statics.findByCustomer = function(customerId: string, limit = 10) {
  return this.find({ customerId })
    .sort({ date: -1 })
    .limit(limit);
};

export const AppointmentModel = mongoose.model<AppointmentDocument>('Appointment', AppointmentSchema);
