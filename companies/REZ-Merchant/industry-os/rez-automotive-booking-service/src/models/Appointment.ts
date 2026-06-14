import mongoose, { Schema, Document } from 'mongoose';
import { Appointment as IAppointment, BookingStatus } from '../types';

export interface AppointmentDocument extends Omit<IAppointment, '_id'>, Document {}

const AppointmentSchema = new Schema<AppointmentDocument>(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    vehicleId: { type: String, required: true, index: true },
    serviceId: { type: String, required: true, index: true },
    technicianId: { type: String },
    bayNumber: { type: String },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
      index: true
    },
    notes: { type: String }
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

AppointmentSchema.index({ date: 1, technicianId: 1 });
AppointmentSchema.index({ customerId: 1, date: 1 });
AppointmentSchema.index({ vehicleId: 1, date: 1 });

AppointmentSchema.statics.findByDate = function(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return this.find({ date: { $gte: startOfDay, $lte: endOfDay } }).sort({ startTime: 1 });
};

export const AppointmentModel = mongoose.model<AppointmentDocument>('Appointment', AppointmentSchema);
