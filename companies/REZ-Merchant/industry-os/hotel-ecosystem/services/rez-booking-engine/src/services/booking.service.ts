import { v4 as uuidv4 } from 'uuid';

export interface Booking {
  id: string;
  hotelId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingRequest {
  hotelId: string;
  guestId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
}

export class BookingService {
  private bookings: Map<string, Booking> = new Map();

  createBooking(request: CreateBookingRequest): Booking {
    const id = `BK${uuidv4().substring(0, 8).toUpperCase()}`;
    const checkIn = new Date(request.checkIn);
    const checkOut = new Date(request.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    const booking: Booking = {
      id,
      hotelId: request.hotelId,
      guestId: request.guestId || `GUEST-${id}`,
      guestName: request.guestName,
      guestEmail: request.guestEmail,
      guestPhone: request.guestPhone,
      roomId: request.roomId,
      roomType: request.roomType,
      checkIn,
      checkOut,
      nights,
      guests: request.guests,
      totalAmount: request.totalAmount,
      status: 'confirmed',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.bookings.set(id, booking);
    return booking;
  }

  getBooking(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  getBookingsByHotel(hotelId: string): Booking[] {
    return Array.from(this.bookings.values()).filter((b) => b.hotelId === hotelId);
  }

  getBookingsByGuest(guestId: string): Booking[] {
    return Array.from(this.bookings.values()).filter((b) => b.guestId === guestId);
  }

  updateBookingStatus(id: string, status: Booking['status']): Booking | undefined {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    booking.status = status;
    booking.updatedAt = new Date();
    this.bookings.set(id, booking);
    return booking;
  }

  updatePaymentStatus(id: string, paymentStatus: Booking['paymentStatus']): Booking | undefined {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    booking.paymentStatus = paymentStatus;
    booking.updatedAt = new Date();
    this.bookings.set(id, booking);
    return booking;
  }

  cancelBooking(id: string): Booking | undefined {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return undefined;
    }

    booking.status = 'cancelled';
    booking.updatedAt = new Date();
    this.bookings.set(id, booking);
    return booking;
  }
}
