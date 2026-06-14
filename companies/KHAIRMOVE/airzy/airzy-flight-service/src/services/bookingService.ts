import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingRequest, BookingContact, Passenger, Flight } from '../types';
import { BookingModel, IBooking } from '../models';
import { logger } from '../utils/logger';
import { flightService } from './flightService';

function generatePNR(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pnr = '';
  for (let i = 0; i < 6; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pnr;
}

function generateConfirmationCode(): string {
  return `CF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

export class BookingService {
  async createBooking(userId: string, request: BookingRequest): Promise<Booking> {
    logger.info('Creating booking', { userId, flightId: request.flightId });

    // Get flight details
    const flight = await flightService.getFlightById(request.flightId);
    if (!flight) {
      throw new Error('Flight not found');
    }

    // Create passengers
    const passengers: Passenger[] = request.passengerDetails.map(p => ({
      id: uuidv4(),
      type: 'adult', // Would determine based on DOB
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
      nationality: p.nationality,
      passportNumber: p.passengerDetails.passportNumber,
      passportExpiry: p.passengerDetails.passportExpiry,
      email: p.email,
      phone: p.phone
    }));

    const contact: BookingContact = {
      email: request.contactDetails.email,
      phone: request.contactDetails.phone,
      countryCode: request.contactDetails.countryCode || '+91'
    };

    // Calculate total amount (base + per passenger)
    const totalAmount = flight.price.amount * request.passengerDetails.length;

    // Create booking document
    const booking = new BookingModel({
      confirmationCode: generateConfirmationCode(),
      userId,
      status: 'pending',
      flights: flight.segments.map(seg => ({
        segmentId: seg.segmentId,
        flightNumber: seg.flightNumber,
        airline: seg.airline,
        aircraft: seg.aircraft,
        departure: seg.departure,
        arrival: seg.arrival,
        duration: seg.duration,
        stops: seg.stops,
        baggage: seg.baggage
      })),
      passengers,
      contact,
      totalAmount,
      currency: flight.price.currency,
      paymentStatus: 'pending',
      pnr: generatePNR(),
      itinerarySent: false
    });

    await booking.save();

    logger.info('Booking created', {
      bookingId: booking._id,
      confirmationCode: booking.confirmationCode,
      pnr: booking.pnr
    });

    return this.toBookingResponse(booking);
  }

  async getBookingById(bookingId: string, userId?: string): Promise<Booking | null> {
    logger.info('Getting booking', { bookingId, userId });

    const query: Record<string, string> = { _id: bookingId };
    if (userId) {
      query.userId = userId;
    }

    const booking = await BookingModel.findOne(query);
    if (!booking) {
      return null;
    }

    return this.toBookingResponse(booking);
  }

  async getBookingByPNR(pnr: string): Promise<Booking | null> {
    logger.info('Getting booking by PNR', { pnr });

    const booking = await BookingModel.findOne({ pnr: pnr.toUpperCase() });
    if (!booking) {
      return null;
    }

    return this.toBookingResponse(booking);
  }

  async getBookingByConfirmationCode(code: string): Promise<Booking | null> {
    logger.info('Getting booking by confirmation code', { code });

    const booking = await BookingModel.findOne({ confirmationCode: code.toUpperCase() });
    if (!booking) {
      return null;
    }

    return this.toBookingResponse(booking);
  }

  async getUserBookings(
    userId: string,
    options: { page?: number; limit?: number; status?: string } = {}
  ): Promise<{ bookings: Booking[]; total: number; page: number; totalPages: number }> {
    logger.info('Getting user bookings', { userId, options });

    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { userId };
    if (options.status) {
      query.status = options.status;
    }

    const [bookings, total] = await Promise.all([
      BookingModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BookingModel.countDocuments(query)
    ]);

    return {
      bookings: bookings.map(b => this.toBookingResponse(b)),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateBookingStatus(
    bookingId: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  ): Promise<Booking | null> {
    logger.info('Updating booking status', { bookingId, status });

    const booking = await BookingModel.findByIdAndUpdate(
      bookingId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!booking) {
      return null;
    }

    return this.toBookingResponse(booking);
  }

  async updatePaymentStatus(
    bookingId: string,
    paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed'
  ): Promise<Booking | null> {
    logger.info('Updating payment status', { bookingId, paymentStatus });

    const booking = await BookingModel.findByIdAndUpdate(
      bookingId,
      { paymentStatus, updatedAt: new Date() },
      { new: true }
    );

    if (!booking) {
      return null;
    }

    // If payment is successful, confirm the booking
    if (paymentStatus === 'paid') {
      booking.status = 'confirmed';
      await booking.save();
    }

    return this.toBookingResponse(booking);
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    reason: string
  ): Promise<Booking | null> {
    logger.info('Cancelling booking', { bookingId, userId, reason });

    const booking = await BookingModel.findOne({ _id: bookingId, userId });
    if (!booking) {
      return null;
    }

    if (booking.status === 'cancelled') {
      throw new Error('Booking already cancelled');
    }

    if (booking.status === 'completed') {
      throw new Error('Cannot cancel completed booking');
    }

    // Calculate refund amount based on cancellation policy
    let refundAmount = 0;
    const timeUntilDeparture = new Date(booking.flights[0]?.departure?.time).getTime() - Date.now();
    const hoursUntilDeparture = timeUntilDeparture / (1000 * 60 * 60);

    if (hoursUntilDeparture > 24) {
      refundAmount = booking.totalAmount * 0.8; // 80% refund if > 24 hours
    } else if (hoursUntilDeparture > 6) {
      refundAmount = booking.totalAmount * 0.5; // 50% refund if > 6 hours
    } else {
      refundAmount = booking.totalAmount * 0.2; // 20% refund if < 6 hours
    }

    booking.status = 'cancelled';
    booking.cancellation = {
      reason,
      refundAmount,
      cancelledAt: new Date()
    };
    booking.paymentStatus = 'refunded';

    await booking.save();

    logger.info('Booking cancelled', {
      bookingId,
      refundAmount,
      reason
    });

    return this.toBookingResponse(booking);
  }

  async sendItinerary(bookingId: string): Promise<boolean> {
    logger.info('Sending itinerary', { bookingId });

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return false;
    }

    // In production, this would send email via nodemailer
    // For now, just mark as sent
    booking.itinerarySent = true;
    await booking.save();

    logger.info('Itinerary sent', { bookingId });
    return true;
  }

  async confirmPayment(bookingId: string, paymentId: string): Promise<Booking | null> {
    logger.info('Confirming payment', { bookingId, paymentId });

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return null;
    }

    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';

    await booking.save();

    logger.info('Payment confirmed', { bookingId, paymentId });

    return this.toBookingResponse(booking);
  }

  private toBookingResponse(doc: IBooking): Booking {
    return {
      id: doc._id.toString(),
      confirmationCode: doc.confirmationCode,
      userId: doc.userId,
      status: doc.status,
      flights: doc.flights.map(seg => ({
        segmentId: seg.segmentId,
        flightNumber: seg.flightNumber,
        airline: seg.airline,
        aircraft: seg.aircraft,
        departure: seg.departure,
        arrival: seg.arrival,
        duration: seg.duration,
        stops: seg.stops,
        baggage: seg.baggage
      })) as any,
      passengers: doc.passengers.map(p => ({
        id: p._id?.toString() || uuidv4(),
        type: p.type,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        nationality: p.nationality,
        passportNumber: p.passportNumber,
        passportExpiry: p.passportExpiry,
        email: p.email,
        phone: p.phone
      })),
      contact: doc.contact,
      totalAmount: doc.totalAmount,
      currency: doc.currency,
      paymentStatus: doc.paymentStatus,
      pnr: doc.pnr || '',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      itinerarySent: doc.itinerarySent,
      cancellation: doc.cancellation
    };
  }
}

export const bookingService = new BookingService();
export default bookingService;