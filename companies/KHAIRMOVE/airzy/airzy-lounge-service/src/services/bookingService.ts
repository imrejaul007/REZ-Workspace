import mongoose, { Schema, Document, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { LoungeBooking, AccessValidation } from '../types';
import { logger } from '../utils/logger';

interface ILoungeBooking extends Omit<LoungeBooking, 'id'>, Document {}

const LoungeBookingSchema = new Schema({
  confirmationCode: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  lounge: {
    id: String,
    name: String,
    airport: String,
    terminal: String
  },
  date: { type: String, required: true },
  guests: { type: Number, required: true },
  flightNumber: String,
  specialRequests: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  qrCode: String,
  checkInTime: Date,
  checkOutTime: Date
}, { timestamps: true });

export const LoungeBookingModel = model<ILoungeBooking>('LoungeBooking', LoungeBookingSchema);

function generateConfirmationCode(): string {
  return `LNG${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

function generateQRCode(): string {
  return `LNGQR${uuidv4().split('-')[0].toUpperCase()}`;
}

export class LoungeBookingService {
  async createBooking(
    userId: string,
    loungeId: string,
    loungeName: string,
    airport: string,
    terminal: string,
    date: string,
    guests: number,
    pricePerPerson: number,
    flightNumber?: string,
    specialRequests?: string
  ): Promise<LoungeBooking> {
    logger.info('Creating lounge booking', { userId, loungeId, date, guests });

    const booking = new LoungeBookingModel({
      confirmationCode: generateConfirmationCode(),
      userId,
      lounge: { id: loungeId, name: loungeName, airport, terminal },
      date,
      guests,
      flightNumber,
      specialRequests,
      status: 'pending',
      totalAmount: pricePerPerson * guests,
      currency: 'INR',
      paymentStatus: 'pending',
      qrCode: generateQRCode()
    });

    await booking.save();

    logger.info('Lounge booking created', {
      bookingId: booking._id,
      confirmationCode: booking.confirmationCode
    });

    return this.toBookingResponse(booking);
  }

  async getBookingById(bookingId: string): Promise<LoungeBooking | null> {
    const booking = await LoungeBookingModel.findById(bookingId);
    return booking ? this.toBookingResponse(booking) : null;
  }

  async getBookingByCode(code: string): Promise<LoungeBooking | null> {
    const booking = await LoungeBookingModel.findOne({ confirmationCode: code.toUpperCase() });
    return booking ? this.toBookingResponse(booking) : null;
  }

  async getUserBookings(
    userId: string,
    options: { page?: number; limit?: number; status?: string } = {}
  ): Promise<{ bookings: LoungeBooking[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { userId };
    if (options.status) {
      query.status = options.status;
    }

    const [bookings, total] = await Promise.all([
      LoungeBookingModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      LoungeBookingModel.countDocuments(query)
    ]);

    return {
      bookings: bookings.map(b => this.toBookingResponse(b)),
      total
    };
  }

  async validateAccess(qrCode: string): Promise<AccessValidation> {
    const booking = await LoungeBookingModel.findOne({ qrCode });

    if (!booking) {
      return { valid: false, message: 'Invalid QR code' };
    }

    if (booking.status === 'cancelled') {
      return { valid: false, message: 'Booking has been cancelled' };
    }

    if (booking.status === 'completed') {
      return { valid: false, message: 'Booking already used' };
    }

    const today = new Date().toISOString().split('T')[0];
    if (booking.date !== today) {
      return { valid: false, message: `Booking valid for ${booking.date}, not today` };
    }

    return {
      valid: true,
      bookingId: booking._id.toString(),
      loungeId: booking.lounge.id,
      guestName: booking.userId,
      guests: booking.guests,
      validUntil: new Date(new Date().setHours(23, 59, 59, 999))
    };
  }

  async checkIn(bookingId: string): Promise<LoungeBooking | null> {
    const booking = await LoungeBookingModel.findByIdAndUpdate(
      bookingId,
      { checkInTime: new Date(), status: 'confirmed' },
      { new: true }
    );
    return booking ? this.toBookingResponse(booking) : null;
  }

  async checkOut(bookingId: string): Promise<LoungeBooking | null> {
    const booking = await LoungeBookingModel.findByIdAndUpdate(
      bookingId,
      { checkOutTime: new Date(), status: 'completed' },
      { new: true }
    );
    return booking ? this.toBookingResponse(booking) : null;
  }

  async cancelBooking(bookingId: string): Promise<LoungeBooking | null> {
    const booking = await LoungeBookingModel.findByIdAndUpdate(
      bookingId,
      { status: 'cancelled', paymentStatus: 'refunded' },
      { new: true }
    );
    return booking ? this.toBookingResponse(booking) : null;
  }

  private toBookingResponse(doc: ILoungeBooking): LoungeBooking {
    return {
      id: doc._id.toString(),
      confirmationCode: doc.confirmationCode,
      userId: doc.userId,
      lounge: doc.lounge as any,
      date: doc.date,
      guests: doc.guests,
      flightNumber: doc.flightNumber,
      status: doc.status as any,
      totalAmount: doc.totalAmount,
      currency: doc.currency,
      paymentStatus: doc.paymentStatus as any,
      qrCode: doc.qrCode,
      checkInTime: doc.checkInTime,
      checkOutTime: doc.checkOutTime,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }
}

export const loungeBookingService = new LoungeBookingService();
export default loungeBookingService;