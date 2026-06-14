/**
 * Staff Commission Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStaffCommission extends Document {
  staffId: Types.ObjectId;
  storeId: Types.ObjectId;
  appointmentId: Types.ObjectId;
  serviceId: Types.ObjectId;
  serviceName: string;
  amount: number;
  commissionPercent: number;
  commissionAmount: number;
  status: 'pending' | 'paid';
  paidAt?: Date;
  createdAt: Date;
}

const StaffCommissionSchema = new Schema({
  staffId: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  appointmentId: { type: Schema.Types.ObjectId, required: true },
  serviceId: { type: Schema.Types.ObjectId, required: true },
  serviceName: { type: String, required: true },
  amount: { type: Number, required: true },
  commissionPercent: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidAt: { type: Date }
}, { timestamps: true });

StaffCommissionSchema.index({ staffId: 1, createdAt: -1 });

export const StaffCommission = mongoose.model<IStaffCommission>('StaffCommission', StaffCommissionSchema);
