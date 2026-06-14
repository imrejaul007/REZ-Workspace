import mongoose, { Schema, model, Document } from 'mongoose';
import { IVehicle, FuelType, TransmissionType, OwnershipType, VehicleStatus, InsuranceStatus, TaxStatus, PucStatus } from '../types';

export interface VehicleDocument extends Omit<IVehicle, '_id'>, Document {}

const vehicleSchema = new Schema<VehicleDocument>(
  {
    vehicleId: {
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
    make: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    variant: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    registrationNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    vin: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minLength: 17,
      maxLength: 17,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    fuelType: {
      type: String,
      required: true,
      enum: ['petrol', 'diesel', 'electric', 'hybrid'] as FuelType[],
      lowercase: true,
    },
    transmission: {
      type: String,
      required: true,
      enum: ['manual', 'auto'] as TransmissionType[],
      lowercase: true,
    },
    kilometerReading: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    ownership: {
      type: String,
      required: true,
      enum: ['1st', '2nd', '3rd'] as OwnershipType[],
    },
    insuranceStatus: {
      type: String,
      required: true,
      enum: ['valid', 'expired', 'pending'] as InsuranceStatus[],
      lowercase: true,
      default: 'pending',
    },
    insuranceExpiry: {
      type: Date,
    },
    taxStatus: {
      type: String,
      required: true,
      enum: ['paid', 'pending', 'expired'] as TaxStatus[],
      lowercase: true,
      default: 'pending',
    },
    pucStatus: {
      type: String,
      required: true,
      enum: ['valid', 'expired', 'pending'] as PucStatus[],
      lowercase: true,
      default: 'pending',
    },
    customerId: {
      type: String,
      index: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    images: [{
      type: String,
    }],
    status: {
      type: String,
      required: true,
      enum: ['available', 'sold', 'reserved'] as VehicleStatus[],
      lowercase: true,
      default: 'available',
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    priceNegotiable: {
      type: Boolean,
      default: true,
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
        keys: { merchantId: 1, status: 1 },
        name: 'idx_merchant_status',
      },
      {
        keys: { make: 1, model: 1 },
        name: 'idx_make_model',
      },
      {
        keys: { year: 1, price: 1 },
        name: 'idx_year_price',
      },
      {
        keys: { registrationNumber: 1 },
        name: 'idx_reg_number',
        unique: true,
        sparse: true,
      },
    ],
  }
);

// Pre-save hook to generate vehicleId if not provided
vehicleSchema.pre('save', function (next) {
  if (!this.vehicleId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.vehicleId = `VEH-${timestamp}-${randomStr}`;
  }
  next();
});

// Virtual for age calculation
vehicleSchema.virtual('age').get(function () {
  return new Date().getFullYear() - this.year;
});

// Method to check if vehicle is ready for sale
vehicleSchema.methods.isReadyForSale = function (): boolean {
  return (
    this.status === 'available' &&
    this.insuranceStatus === 'valid' &&
    this.taxStatus === 'paid' &&
    this.pucStatus === 'valid'
  );
};

// Static method to find available vehicles by merchant
vehicleSchema.statics.findAvailableByMerchant = function (merchantId: string) {
  return this.find({ merchantId, status: 'available' }).sort({ createdAt: -1 });
};

// Ensure virtuals are included in JSON output
vehicleSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Vehicle = model<VehicleDocument>('Vehicle', vehicleSchema);