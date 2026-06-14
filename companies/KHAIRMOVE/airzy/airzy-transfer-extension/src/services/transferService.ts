import mongoose, { Schema, Document, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Transfer, TransferBooking } from '../types';
import { logger } from '../utils/logger';

interface ITransferBooking extends Document {
  confirmationCode: string; userId: string; transferType: string; pickup: any; dropoff: any; driver?: any;
  status: string; totalAmount: number; currency: string; paymentStatus: string;
}

const TransferBookingSchema = new Schema({
  confirmationCode: { type: String, required: true, unique: true }, userId: { type: String, required: true, index: true },
  transferType: String,
  pickup: { location: String, address: String, time: String, flightNumber: String },
  dropoff: { location: String, address: String },
  driver: { name: String, phone: String, vehicleNumber: String },
  status: { type: String, enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
  totalAmount: { type: Number, required: true }, currency: { type: String, default: 'INR' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' }
}, { timestamps: true });

export const TransferBookingModel = model<ITransferBooking>('TransferBooking', TransferBookingSchema);

const sampleTransfers: Transfer[] = [
  { id: 'TRF001', type: 'sedan', name: 'Toyota Camry', description: 'Comfortable sedan for up to 3 passengers', maxPassengers: 3, maxLuggage: 2, price: { amount: 1500, currency: 'INR', perTrip: true }, amenities: ['ac', 'wifi', 'music'] },
  { id: 'TRF002', type: 'suv', name: 'Toyota Innova', description: 'Spacious SUV for up to 6 passengers', maxPassengers: 6, maxLuggage: 4, price: { amount: 2500, currency: 'INR', perTrip: true }, amenities: ['ac', 'wifi', 'music', 'extra_space'] },
  { id: 'TRF003', type: 'minivan', name: 'Mercedes V-Class', description: 'Luxury minivan for groups', maxPassengers: 7, maxLuggage: 5, price: { amount: 4000, currency: 'INR', perTrip: true }, amenities: ['ac', 'wifi', 'music', 'leather_seats', 'charging'] },
  { id: 'TRF004', type: 'luxury', name: 'BMW 7 Series', description: 'Premium luxury sedan', maxPassengers: 3, maxLuggage: 2, price: { amount: 5000, currency: 'INR', perTrip: true }, amenities: ['ac', 'wifi', 'music', 'leather_seats', 'champagne', 'wifi'] }
];

export class TransferService {
  async searchTransfers(pickup?: string, dropoff?: string, passengers?: number): Promise<Transfer[]> {
    let results = [...sampleTransfers];
    if (passengers) results = results.filter(t => t.maxPassengers >= passengers);
    return results;
  }

  async bookTransfer(userId: string, transferType: string, pickup: { location: string; address: string; time: string; flightNumber?: string }, dropoff: { location: string; address: string }): Promise<TransferBooking> {
    const transfer = sampleTransfers.find(t => t.type === transferType);
    if (!transfer) throw new Error('Transfer type not found');

    const booking = new TransferBookingModel({
      confirmationCode: `TRF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      userId, transferType, pickup, dropoff, status: 'pending', totalAmount: transfer.price.amount, currency: 'INR', paymentStatus: 'pending'
    });
    await booking.save();
    return { id: booking._id.toString(), confirmationCode: booking.confirmationCode, userId: booking.userId, transferType: booking.transferType, pickup: booking.pickup as any, dropoff: booking.dropoff as any, status: booking.status as any, totalAmount: booking.totalAmount, currency: booking.currency, paymentStatus: booking.paymentStatus as any, createdAt: booking.createdAt };
  }

  async getBooking(bookingId: string): Promise<TransferBooking | null> {
    const b = await TransferBookingModel.findById(bookingId);
    return b ? { id: b._id.toString(), confirmationCode: b.confirmationCode, userId: b.userId, transferType: b.transferType, pickup: b.pickup as any, dropoff: b.dropoff as any, driver: b.driver as any, status: b.status as any, totalAmount: b.totalAmount, currency: b.currency, paymentStatus: b.paymentStatus as any, createdAt: b.createdAt } : null;
  }

  async getUserBookings(userId: string): Promise<TransferBooking[]> {
    const bookings = await TransferBookingModel.find({ userId }).sort({ createdAt: -1 });
    return bookings.map(b => ({ id: b._id.toString(), confirmationCode: b.confirmationCode, userId: b.userId, transferType: b.transferType, pickup: b.pickup as any, dropoff: b.dropoff as any, driver: b.driver as any, status: b.status as any, totalAmount: b.totalAmount, currency: b.currency, paymentStatus: b.paymentStatus as any, createdAt: b.createdAt }));
  }

  async updateStatus(bookingId: string, status: string, driver?: { name: string; phone: string; vehicleNumber: string }): Promise<TransferBooking | null> {
    const update: Record<string, unknown> = { status };
    if (driver) update.driver = driver;
    const b = await TransferBookingModel.findByIdAndUpdate(bookingId, update, { new: true });
    return b ? { id: b._id.toString(), confirmationCode: b.confirmationCode, userId: b.userId, transferType: b.transferType, pickup: b.pickup as any, dropoff: b.dropoff as any, driver: b.driver as any, status: b.status as any, totalAmount: b.totalAmount, currency: b.currency, paymentStatus: b.paymentStatus as any, createdAt: b.createdAt } : null;
  }

  async cancelBooking(bookingId: string): Promise<TransferBooking | null> {
    const b = await TransferBookingModel.findByIdAndUpdate(bookingId, { status: 'cancelled', paymentStatus: 'refunded' }, { new: true });
    return b ? { id: b._id.toString(), confirmationCode: b.confirmationCode, userId: b.userId, transferType: b.transferType, pickup: b.pickup as any, dropoff: b.dropoff as any, status: b.status as any, totalAmount: b.totalAmount, currency: b.currency, paymentStatus: b.paymentStatus as any, createdAt: b.createdAt } : null;
  }
}

export const transferService = new TransferService();
export default transferService;