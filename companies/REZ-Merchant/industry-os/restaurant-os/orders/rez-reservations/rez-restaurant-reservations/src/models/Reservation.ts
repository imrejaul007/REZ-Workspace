import mongoose, { Document, Schema } from 'mongoose';

export interface IReservation extends Document {
  reservationId: string;
  merchantId: string;
  restaurantId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tableId?: string;
  partySize: number;
  date: Date;
  time: string;
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  source: 'walkin' | 'phone' | 'website' | 'app' | 'zomato' | 'swiggy';
  specialRequests?: string;
  occasion?: string;
  depositAmount?: number;
  depositPaid: boolean;
  reminderSent: boolean;
  notes?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<IReservation>({
  reservationId: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  customerId: { type: String, index: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: String,
  tableId: { type: String, index: true },
  partySize: { type: Number, required: true },
  date: { type: Date, required: true, index: true },
  time: { type: String, required: true },
  duration: { type: Number, default: 90 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
    default: 'pending',
  },
  source: {
    type: String,
    enum: ['walkin', 'phone', 'website', 'app', 'zomato', 'swiggy'],
    default: 'website',
  },
  specialRequests: String,
  occasion: String,
  depositAmount: Number,
  depositPaid: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false },
  notes: String,
  cancelledBy: String,
  cancellationReason: String,
}, { timestamps: true });

reservationSchema.index({ restaurantId: 1, date: 1, status: 1 });
reservationSchema.index({ customerPhone: 1 });
reservationSchema.index({ customerId: 1 });

export const Reservation = mongoose.model<IReservation>('Reservation', reservationSchema);
