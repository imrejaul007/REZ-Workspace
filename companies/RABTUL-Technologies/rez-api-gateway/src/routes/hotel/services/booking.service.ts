/**
 * Booking Service
 * Handles booking creation, retrieval, and management
 */

import { OTABooking, CreateBookingParams, PricingParams, PricingResult } from '../types/makcorps.types';
import { makcorpsService } from './makcorps.service';

export class BookingService {
  private bookingsStore = new Map<string, OTABooking>();

  /**
   * Calculate number of nights between check-in and check-out
   */
  calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Create a new booking
   */
  async createBooking(params: CreateBookingParams, companyId?: string): Promise<OTABooking> {
    const property = await makcorpsService.getProperty(params.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    const room = property.rooms.find(r => r.roomId === params.roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (!room.available) {
      throw new Error('Room not available');
    }

    const nights = this.calculateNights(params.checkIn, params.checkOut);
    const subtotal = room.corporateRate * nights;
    const taxableAmount = subtotal / (1 + property.gstInfo.taxRate / 100);
    const gstAmount = subtotal - taxableAmount;
    const totalAmount = subtotal + gstAmount;

    const bookingId = `HB${Date.now()}`;
    const confirmationNumber = `MCB${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    const booking: OTABooking = {
      bookingId,
      confirmationNumber,
      status: 'confirmed',
      property: {
        propertyId: property.propertyId,
        name: property.name,
        address: `${property.address.line1}, ${property.address.city}`,
        phone: '+91 1234 567890',
      },
      room: {
        roomId: room.roomId,
        name: room.roomType,
        bedType: room.bedType,
      },
      guest: {
        firstName: params.guestDetails[0].firstName,
        lastName: params.guestDetails[0].lastName,
        email: params.guestDetails[0].email,
        phone: params.guestDetails[0].phone,
      },
      dates: {
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        nights,
      },
      pricing: {
        roomRate: room.corporateRate,
        numberOfRooms: 1,
        subtotal,
        discount: 0,
        gstAmount,
        totalAmount,
        currency: 'INR',
      },
      createdAt: new Date().toISOString(),
    };

    this.bookingsStore.set(bookingId, booking);
    return booking;
  }

  /**
   * Get all bookings with optional filtering
   */
  getBookings(options: {
    status?: string;
    page: number;
    limit: number;
  }): { bookings: OTABooking[]; total: number } {
    let bookings = Array.from(this.bookingsStore.values());

    if (options.status) {
      bookings = bookings.filter(b => b.status === options.status);
    }

    bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = (options.page - 1) * options.limit;
    const paginatedBookings = bookings.slice(start, start + options.limit);

    return {
      bookings: paginatedBookings,
      total: bookings.length,
    };
  }

  /**
   * Get a single booking by ID
   */
  getBooking(bookingId: string): OTABooking | undefined {
    return this.bookingsStore.get(bookingId);
  }

  /**
   * Cancel a booking
   */
  cancelBooking(bookingId: string, reason?: string): OTABooking {
    const booking = this.bookingsStore.get(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Booking already cancelled');
    }

    booking.status = 'cancelled';
    this.bookingsStore.set(bookingId, booking);
    return booking;
  }

  /**
   * Calculate pricing for a booking
   */
  async calculatePricing(params: PricingParams): Promise<PricingResult> {
    const property = await makcorpsService.getProperty(params.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    const room = property.rooms.find(r => r.roomId === params.roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const nights = this.calculateNights(params.checkIn, params.checkOut);
    const subtotal = room.corporateRate * nights;
    const taxableAmount = Math.round(subtotal / 1.12 * 100) / 100;
    const cgstAmount = Math.round(taxableAmount * 0.06 * 100) / 100;
    const sgstAmount = cgstAmount;
    const totalTax = cgstAmount + sgstAmount;
    const totalAmount = subtotal + totalTax;

    return {
      baseRate: room.baseRate,
      corporateRate: room.corporateRate,
      nights,
      subtotal,
      corporateDiscount: room.discount,
      taxableAmount,
      cgstRate: 6,
      cgstAmount,
      sgstRate: 6,
      sgstAmount,
      totalTax,
      totalAmount,
      itcEligible: true,
    };
  }
}

export const bookingService = new BookingService();
