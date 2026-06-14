import mongoose, { Schema, model, Document } from 'mongoose';
import { IServiceRecord, IServiceItem, ServiceType } from '../types';

export interface ServiceRecordDocument extends Omit<IServiceRecord, '_id'>, Document {}

const serviceItemSchema = new Schema<IServiceItem>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const serviceRecordSchema = new Schema<ServiceRecordDocument>(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    vehicleId: {
      type: String,
      required: true,
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
    serviceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    serviceType: {
      type: String,
      required: true,
      enum: ['regular', 'repair', 'inspection'] as ServiceType[],
      lowercase: true,
    },
    kilometersAtService: {
      type: Number,
      required: true,
      min: 0,
    },
    items: {
      type: [serviceItemSchema],
      required: true,
      validate: {
        validator: (v: IServiceItem[]) => v.length > 0,
        message: 'At least one service item is required',
      },
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    nextServiceDue: {
      type: Date,
    },
    nextServiceKm: {
      type: Number,
      min: 0,
    },
    mechanicName: {
      type: String,
      required: true,
      trim: true,
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
        keys: { vehicleId: 1, serviceDate: -1 },
        name: 'idx_vehicle_date',
      },
      {
        keys: { merchantId: 1, serviceDate: -1 },
        name: 'idx_merchant_date',
      },
      {
        keys: { customerId: 1, serviceDate: -1 },
        name: 'idx_customer_date',
      },
    ],
  }
);

// Pre-save hook to generate recordId if not provided
serviceRecordSchema.pre('save', function (next) {
  if (!this.recordId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.recordId = `SRV-${timestamp}-${randomStr}`;
  }
  next();
});

// Static method to get vehicle service history
serviceRecordSchema.statics.getVehicleHistory = function (vehicleId: string) {
  return this.find({ vehicleId })
    .sort({ serviceDate: -1 })
    .select('-__v -_id');
};

// Static method to get total service cost for a vehicle
serviceRecordSchema.statics.getTotalServiceCost = async function (vehicleId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { vehicleId } },
    { $group: { _id: null, total: { $sum: '$totalCost' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

// Method to calculate next service prediction based on average km between services
serviceRecordSchema.methods.predictNextService = function (avgKmPerMonth: number) {
  if (!this.nextServiceKm || !this.kilometersAtService) return null;

  const remainingKm = this.nextServiceKm - this.kilometersAtService;
  if (remainingKm <= 0) return { overdue: true, overdueBy: Math.abs(remainingKm) };

  const monthsUntilService = avgKmPerMonth > 0 ? remainingKm / avgKmPerMonth : 6;

  return {
    overdue: false,
    remainingKm,
    estimatedMonthsUntilService: Math.round(monthsUntilService),
  };
};

// Ensure virtuals are included in JSON output
serviceRecordSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ServiceRecord = model<ServiceRecordDocument>('ServiceRecord', serviceRecordSchema);