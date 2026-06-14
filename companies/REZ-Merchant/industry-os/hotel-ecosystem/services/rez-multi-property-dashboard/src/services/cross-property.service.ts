import { v4 as uuidv4 } from 'uuid';

export interface BookingInquiry {
  inquiryId: string;
  guestName: string;
  email: string;
  phone: string;
  preferences: {
    checkIn?: Date;
    checkOut?: Date;
    guests?: number;
    roomType?: string;
    budget?: number;
    amenities?: string[];
    specialRequests?: string;
  };
  status: 'pending' | 'quoted' | 'reserved' | 'converted' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface RoomAvailability {
  propertyId: string;
  propertyName: string;
  roomTypeId: string;
  roomTypeName: string;
  available: number;
  rate: number;
  total: number;
}

export interface MultiPropertyQuote {
  quoteId: string;
  inquiryId: string;
  properties: {
    propertyId: string;
    propertyName: string;
    roomTypeId: string;
    roomTypeName: string;
    nights: number;
    rooms: number;
    ratePerNight: number;
    subtotal: number;
    taxes: number;
    total: number;
  }[];
  grandTotal: number;
  currency: string;
  validUntil: Date;
  createdAt: Date;
}

export interface Reservation {
  reservationId: string;
  inquiryId: string;
  propertyId: string;
  roomTypeId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'deposit_paid' | 'fully_paid' | 'cancelled';
  confirmationNumber: string;
  createdAt: Date;
}

export class CrossPropertyService {
  private inquiries: Map<string, BookingInquiry> = new Map();
  private quotes: Map<string, MultiPropertyQuote> = new Map();
  private reservations: Map<string, Reservation> = new Map();

  async createBookingInquiry(
    guestName: string,
    email: string,
    phone: string,
    preferences: BookingInquiry['preferences']
  ): Promise<BookingInquiry> {
    const inquiryId = `INQ-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const inquiry: BookingInquiry = {
      inquiryId,
      guestName,
      email,
      phone,
      preferences,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    this.inquiries.set(inquiryId, inquiry);
    return inquiry;
  }

  async getInquiry(inquiryId: string): Promise<BookingInquiry | null> {
    return this.inquiries.get(inquiryId) || null;
  }

  async checkMultiPropertyAvailability(
    propertyIds: string[],
    checkIn: Date,
    checkOut: Date,
    guests: number,
    roomType?: string
  ): Promise<RoomAvailability[]> {
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Mock availability data
    return propertyIds.map(propertyId => {
      const available = 2 + Math.floor(Math.random() * 8);
      const baseRate = 2000 + Math.floor(Math.random() * 5000);
      const total = available * baseRate * nights;

      return {
        propertyId,
        propertyName: `Property ${propertyId}`,
        roomTypeId: roomType || 'standard',
        roomTypeName: roomType || 'Standard Room',
        available,
        rate: baseRate,
        total,
      };
    });
  }

  async getMultiPropertyQuote(
    propertyIds: string[],
    checkIn: Date,
    checkOut: Date,
    roomCount: number,
    guests: number
  ): Promise<MultiPropertyQuote[]> {
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const quotes: MultiPropertyQuote[] = [];

    for (const propertyId of propertyIds) {
      const quoteId = `QT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const ratePerNight = 2000 + Math.floor(Math.random() * 5000);
      const subtotal = ratePerNight * nights * roomCount;
      const taxes = subtotal * 0.18; // 18% GST
      const total = subtotal + taxes;

      const quote: MultiPropertyQuote = {
        quoteId,
        inquiryId: '',
        properties: [{
          propertyId,
          propertyName: `Property ${propertyId}`,
          roomTypeId: 'standard',
          roomTypeName: 'Standard Room',
          nights,
          rooms: roomCount,
          ratePerNight,
          subtotal,
          taxes,
          total,
        }],
        grandTotal: total,
        currency: 'INR',
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
      };

      quotes.push(quote);
      this.quotes.set(quoteId, quote);
    }

    return quotes;
  }

  async reserveRoom(
    inquiryId: string,
    propertyId: string,
    roomTypeId: string,
    paymentMethod: string
  ): Promise<Reservation> {
    const inquiry = this.inquiries.get(inquiryId);
    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    const reservationId = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const confirmationNumber = `CP${Date.now().toString(36).toUpperCase()}`;

    const reservation: Reservation = {
      reservationId,
      inquiryId,
      propertyId,
      roomTypeId,
      checkIn: inquiry.preferences.checkIn || new Date(),
      checkOut: inquiry.preferences.checkOut || new Date(Date.now() + 24 * 60 * 60 * 1000),
      guests: inquiry.preferences.guests || 1,
      totalAmount: 5000 + Math.floor(Math.random() * 20000),
      paymentStatus: 'pending',
      confirmationNumber,
      createdAt: new Date(),
    };

    this.reservations.set(reservationId, reservation);

    inquiry.status = 'reserved';
    this.inquiries.set(inquiryId, inquiry);

    return reservation;
  }

  async getReservation(reservationId: string): Promise<Reservation | null> {
    return this.reservations.get(reservationId) || null;
  }

  async cancelReservation(reservationId: string): Promise<void> {
    const reservation = this.reservations.get(reservationId);
    if (reservation) {
      reservation.paymentStatus = 'cancelled';
      this.reservations.set(reservationId, reservation);
    }
  }

  async getPropertyReservations(propertyId: string): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(r => r.propertyId === propertyId);
  }
}
