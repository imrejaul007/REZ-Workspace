import mongoose, { Schema, Document } from 'mongoose';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export interface IBooking extends Document {
  bookingId: string;
  userId: string;
  propertyId: string;
  brokerId?: string;
  amount: number;
  currency: string;
  status: BookingStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  cancelledAt?: Date;
  refundId?: string;
  refundAmount?: number;
  deletedAt?: Date;
}

const BookingSchema = new Schema<IBooking>({
  bookingId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  propertyId: { type: String, required: true, index: true },
  brokerId: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: Object.values(BookingStatus), default: BookingStatus.PENDING },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
  paidAt: Date,
  cancelledAt: Date,
  refundId: String,
  refundAmount: Number,
  deletedAt: Date
}, { timestamps: true });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
