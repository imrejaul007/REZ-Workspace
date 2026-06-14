import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Service - Services catalog for appointment-based businesses.
 * Supports salons, spas, and other service-oriented stores.
 */
export interface IService extends Document {
  storeId: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  duration: number; // minutes
  category: string;
  staff: Types.ObjectId[];
  images: string[];
  beforeAfter?: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 }, // minutes
    category: { type: String, required: true, trim: true },
    staff: [{ type: Schema.Types.ObjectId, ref: 'MerchantUser' }],
    images: [{ type: String }],
    beforeAfter: [{ type: String }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ServiceSchema.index({ storeId: 1, isActive: 1 });
ServiceSchema.index({ storeId: 1, category: 1 });
ServiceSchema.index({ storeId: 1, sortOrder: 1 });

export const Service = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);

/**
 * Appointment - Bookings for services.
 */
export interface IAppointment extends Document {
  serviceId: Types.ObjectId;
  storeId: Types.ObjectId;
  staffId: Types.ObjectId;
  customerId: Types.ObjectId;
  dateTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    dateTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
  },
  { timestamps: true },
);

AppointmentSchema.index({ storeId: 1, dateTime: 1 });
AppointmentSchema.index({ staffId: 1, dateTime: 1 });
AppointmentSchema.index({ customerId: 1 });

export const Appointment = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
