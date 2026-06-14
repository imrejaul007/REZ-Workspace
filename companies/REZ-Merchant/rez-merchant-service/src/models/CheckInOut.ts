import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * CheckInOut - Hotel check-in/check-out tracking model.
 * Manages guest check-in and check-out workflows with scheduled and actual timestamps.
 */
export interface ICheckInOut extends Document {
  bookingId: Types.ObjectId;
  storeId: Types.ObjectId;
  roomId: string;
  guestName: string;
  guestPhone: string;
  checkIn: {
    scheduled: Date;
    actual?: Date;
    status: 'pending' | 'completed' | 'early' | 'late';
    staffId?: Types.ObjectId;
  };
  checkOut: {
    scheduled: Date;
    actual?: Date;
    status: 'pending' | 'completed' | 'early' | 'late';
    staffId?: Types.ObjectId;
  };
  status: 'upcoming' | 'checked_in' | 'checked_out';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CheckInOutSchema = new Schema<ICheckInOut>(
  {
    bookingId: { type: Schema.Types.ObjectId, required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    roomId: { type: String, required: true },
    guestName: { type: String, required: true, trim: true },
    guestPhone: { type: String, required: true, trim: true },
    checkIn: {
      scheduled: { type: Date, required: true },
      actual: { type: Date },
      status: {
        type: String,
        enum: ['pending', 'completed', 'early', 'late'],
        default: 'pending',
      },
      staffId: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },
    },
    checkOut: {
      scheduled: { type: Date, required: true },
      actual: { type: Date },
      status: {
        type: String,
        enum: ['pending', 'completed', 'early', 'late'],
        default: 'pending',
      },
      staffId: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },
    },
    status: {
      type: String,
      enum: ['upcoming', 'checked_in', 'checked_out'],
      default: 'upcoming',
    },
    notes: { type: String },
  },
  { timestamps: true },
);

// Compound indexes for common queries
CheckInOutSchema.index({ storeId: 1, 'checkIn.scheduled': 1 });
CheckInOutSchema.index({ storeId: 1, 'checkOut.scheduled': 1 });
CheckInOutSchema.index({ bookingId: 1, storeId: 1 }, { unique: true });

export const CheckInOut = mongoose.models.CheckInOut || mongoose.model<ICheckInOut>('CheckInOut', CheckInOutSchema);
