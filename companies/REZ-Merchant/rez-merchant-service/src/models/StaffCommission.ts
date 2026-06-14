import mongoose, { Schema, Types } from 'mongoose';

/**
 * StaffCommission - Tracks commission payments for salon staff members.
 * Each commission record is linked to a booking/service and calculates
 * the staff's earnings based on service price and commission rate.
 */
export interface IStaffCommission {
  staffId: Types.ObjectId;
  storeId: Types.ObjectId;
  bookingId: Types.ObjectId;
  serviceId: Types.ObjectId;
  serviceName: string;
  amount: number;
  commissionPercent: number;
  commissionAmount: number;
  status: 'pending' | 'paid';
  paidAt?: Date;
  createdAt: Date;
}

const staffCommissionSchema = new Schema<IStaffCommission>(
  {
    staffId: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'ServiceBooking', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    serviceName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    commissionPercent: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending', index: true },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

// Compound indexes for common queries
staffCommissionSchema.index({ staffId: 1, createdAt: -1 });
staffCommissionSchema.index({ staffId: 1, status: 1, createdAt: -1 });
staffCommissionSchema.index({ storeId: 1, createdAt: -1 });

// Prevent duplicate commissions for the same booking/service/staff combination
staffCommissionSchema.index({ staffId: 1, bookingId: 1, serviceId: 1 }, { unique: true });

export const StaffCommission =
  mongoose.models.StaffCommission ||
  mongoose.model<IStaffCommission>('StaffCommission', staffCommissionSchema, 'staffcommissions');
