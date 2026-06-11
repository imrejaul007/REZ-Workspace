/**
 * Booking Service - Travel Booking Management
 * Part of TRIPMIND - Travel Agency AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface Booking {
  id: string;
  bookingRef: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  type: 'flight' | 'hotel' | 'package' | 'visa' | 'insurance';
  details: {
    departure?: string;
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    hotelName?: string;
    packageName?: string;
    travelers: number;
  };
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  bookingDate: string;
  confirmationNumber?: string;
  pnr?: string;
}

export interface FlightSegment {
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  class: 'economy' | 'business' | 'first';
  fare: number;
}

export class BookingService {
  private bookings: Map<string, Booking> = new Map();

  async create(data: Omit<Booking, 'id' | 'bookingRef' | 'bookingDate' | 'paidAmount'>): Promise<Booking> {
    const booking: Booking = {
      ...data,
      id: uuidv4(),
      bookingRef: `TRIP${Date.now().toString(36).toUpperCase()}`,
      bookingDate: new Date().toISOString(),
      paidAmount: 0
    };

    this.bookings.set(booking.id, booking);
    return booking;
  }

  async getById(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getByRef(ref: string): Promise<Booking | undefined> {
    return Array.from(this.bookings.values()).find(b => b.bookingRef === ref);
  }

  async getByCustomer(customerId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(b => b.customerId === customerId)
      .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
  }

  async updateStatus(id: string, status: Booking['status']): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    booking.status = status;
    this.bookings.set(id, booking);
    return booking;
  }

  async confirm(id: string, confirmationNumber: string, pnr?: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    booking.status = 'confirmed';
    booking.confirmationNumber = confirmationNumber;
    booking.pnr = pnr;
    this.bookings.set(id, booking);
    return booking;
  }

  async processPayment(id: string, amount: number): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    booking.paidAmount += amount;
    if (booking.paidAmount >= booking.totalAmount) {
      booking.status = 'confirmed';
    }
    this.bookings.set(id, booking);
    return booking;
  }

  async cancel(id: string, reason: string): Promise<{ success: boolean; refundAmount: number }> {
    const booking = this.bookings.get(id);
    if (!booking) return { success: false, refundAmount: 0 };

    booking.status = 'cancelled';
    this.bookings.set(id, booking);

    const refundAmount = booking.paidAmount * 0.8; // 80% refund policy
    return { success: true, refundAmount };
  }

  async getUpcoming(checkInDate: string): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(b => b.status === 'confirmed')
      .filter(b => {
        const checkIn = b.details.checkIn || b.details.departure;
        return checkIn && checkIn >= checkInDate;
      })
      .sort((a, b) => {
        const aDate = a.details.checkIn || a.details.departure || '';
        const bDate = b.details.checkIn || b.details.departure || '';
        return aDate.localeCompare(bDate);
      });
  }

  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalRevenue: number;
    pendingPayments: number;
  }> {
    const all = Array.from(this.bookings.values());

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    all.forEach(b => {
      byType[b.type] = (byType[b.type] || 0) + 1;
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
    });

    return {
      total: all.length,
      byType,
      byStatus,
      totalRevenue: all.reduce((sum, b) => sum + b.paidAmount, 0),
      pendingPayments: all.filter(b => b.status === 'pending').length
    };
  }
}

export default BookingService;