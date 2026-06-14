/**
 * Fitness Attendance Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFitnessAttendance extends Document {
  memberId: Types.ObjectId;
  storeId: Types.ObjectId;
  classId?: Types.ObjectId;
  date: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: 'checked_in' | 'checked_out' | 'no_show';
  source: 'qr' | 'manual' | 'class';
  duration?: number;
}

const FitnessAttendanceSchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  classId: { type: Schema.Types.ObjectId },
  date: { type: String, required: true },
  checkInTime: Date,
  checkOutTime: Date,
  status: {
    type: String,
    enum: ['checked_in', 'checked_out', 'no_show'],
    default: 'checked_in'
  },
  source: {
    type: String,
    enum: ['qr', 'manual', 'class'],
    default: 'manual'
  },
  duration: Number
}, { timestamps: true });

FitnessAttendanceSchema.index({ memberId: 1, date: -1 });
FitnessAttendanceSchema.index({ storeId: 1, date: 1 });

export const FitnessAttendance = mongoose.model<IFitnessAttendance>('FitnessAttendance', FitnessAttendanceSchema);
