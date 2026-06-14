import { v4 as uuidv4 } from 'uuid';

export interface GroupBooking {
  groupId: string;
  groupName: string;
  organizerName: string;
  email: string;
  phone: string;
  properties: {
    propertyId: string;
    propertyName: string;
    roomTypeId: string;
    roomTypeName: string;
    roomCount: number;
  }[];
  checkIn: Date;
  checkOut: Date;
  totalRooms: number;
  status: 'inquiry' | 'quoted' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  quote?: GroupQuote;
  confirmationNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupQuote {
  quoteId: string;
  groupId: string;
  breakdown: {
    propertyId: string;
    propertyName: string;
    roomTypeName: string;
    roomCount: number;
    nights: number;
    ratePerNight: number;
    subtotal: number;
    discount: number;
    subtotalAfterDiscount: number;
    taxes: number;
    total: number;
  }[];
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  taxes: number;
  finalTotal: number;
  currency: string;
  validUntil: Date;
  createdAt: Date;
}

export interface GroupAmendment {
  amendmentId: string;
  groupId: string;
  type: 'dates' | 'rooms' | 'rooms' | 'cancel';
  requestedBy: string;
  details: any;
  status: 'pending' | 'approved' | 'rejected';
  newQuote?: GroupQuote;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Attendee {
  attendeeId: string;
  groupId: string;
  name: string;
  email: string;
  phone?: string;
  checkIn?: Date;
  checkOut?: Date;
  roomAssignment?: string;
  specialRequests?: string;
  status: 'invited' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  createdAt: Date;
}

export interface GroupPaymentDetails {
  method: 'bank_transfer' | 'card' | 'invoice';
  depositAmount: number;
  depositDueDate: Date;
  fullAmount: number;
  billingAddress?: string;
}

export class GroupBookingService {
  private bookings: Map<string, GroupBooking> = new Map();
  private attendees: Map<string, Attendee[]> = new Map();

  async createGroupBooking(
    groupName: string,
    organizerName: string,
    email: string,
    phone: string,
    properties: GroupBooking['properties'],
    checkIn: Date,
    checkOut: Date,
    roomCount: number,
    notes?: string
  ): Promise<GroupBooking> {
    const groupId = `GRP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const booking: GroupBooking = {
      groupId,
      groupName,
      organizerName,
      email,
      phone,
      properties: properties.map(p => ({
        ...p,
        roomCount: p.roomCount || Math.ceil(roomCount / properties.length),
      })),
      checkIn,
      checkOut,
      totalRooms: roomCount,
      status: 'inquiry',
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.bookings.set(groupId, booking);
    this.attendees.set(groupId, []);

    return booking;
  }

  async getGroupBooking(groupId: string): Promise<GroupBooking | null> {
    return this.bookings.get(groupId) || null;
  }

  async getAllGroupBookings(status?: GroupBooking['status']): Promise<GroupBooking[]> {
    let bookings = Array.from(this.bookings.values());
    if (status) {
      bookings = bookings.filter(b => b.status === status);
    }
    return bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getGroupQuote(groupId: string): Promise<GroupQuote | null> {
    const booking = this.bookings.get(groupId);
    if (!booking || !booking.quote) return null;
    return booking.quote;
  }

  async generateQuote(groupId: string): Promise<GroupQuote> {
    const booking = this.bookings.get(groupId);
    if (!booking) throw new Error('Group booking not found');

    const nights = Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24));

    const breakdown = booking.properties.map(prop => {
      const baseRate = 2000 + Math.floor(Math.random() * 5000);
      const subtotal = baseRate * nights * prop.roomCount;
      const discount = subtotal * 0.15; // 15% group discount
      const subtotalAfterDiscount = subtotal - discount;
      const taxes = subtotalAfterDiscount * 0.18;

      return {
        propertyId: prop.propertyId,
        propertyName: prop.propertyName,
        roomTypeName: prop.roomTypeName,
        roomCount: prop.roomCount,
        nights,
        ratePerNight: baseRate,
        subtotal,
        discount,
        subtotalAfterDiscount,
        taxes,
        total: subtotalAfterDiscount + taxes,
      };
    });

    const quote: GroupQuote = {
      quoteId: `GQ-${Date.now()}`,
      groupId,
      breakdown,
      subtotal: breakdown.reduce((sum, b) => sum + b.subtotal, 0),
      totalDiscount: breakdown.reduce((sum, b) => sum + b.discount, 0),
      grandTotal: breakdown.reduce((sum, b) => sum + b.subtotalAfterDiscount, 0),
      taxes: breakdown.reduce((sum, b) => sum + b.taxes, 0),
      finalTotal: breakdown.reduce((sum, b) => sum + b.total, 0),
      currency: 'INR',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    booking.quote = quote;
    booking.status = 'quoted';
    this.bookings.set(groupId, booking);

    return quote;
  }

  async confirmGroupBooking(groupId: string, paymentDetails: GroupPaymentDetails): Promise<{
    confirmationNumber: string;
    booking: GroupBooking;
    paymentSchedule: { dueDate: Date; amount: number; status: string }[];
  }> {
    const booking = this.bookings.get(groupId);
    if (!booking) throw new Error('Group booking not found');
    if (!booking.quote) throw new Error('Quote not generated');

    const confirmationNumber = `GC${Date.now().toString(36).toUpperCase()}`;

    booking.confirmationNumber = confirmationNumber;
    booking.status = 'confirmed';
    booking.updatedAt = new Date();

    this.bookings.set(groupId, booking);

    // Generate payment schedule
    const paymentSchedule = [
      {
        dueDate: paymentDetails.depositDueDate,
        amount: paymentDetails.depositAmount,
        status: 'pending',
      },
      {
        dueDate: booking.checkIn,
        amount: booking.quote.finalTotal - paymentDetails.depositAmount,
        status: 'pending',
      },
    ];

    return { confirmationNumber, booking, paymentSchedule };
  }

  async requestAmendment(groupId: string, type: 'dates' | 'rooms' | 'cancel', details: any): Promise<GroupAmendment> {
    const booking = this.bookings.get(groupId);
    if (!booking) throw new Error('Group booking not found');

    const amendment: GroupAmendment = {
      amendmentId: `AMD-${Date.now()}`,
      groupId,
      type,
      requestedBy: booking.organizerName,
      details,
      status: 'pending',
      createdAt: new Date(),
    };

    // If changing dates or rooms, generate new quote
    if ((type === 'dates' || type === 'rooms') && booking.quote) {
      if (type === 'dates' && details.checkIn && details.checkOut) {
        booking.checkIn = new Date(details.checkIn);
        booking.checkOut = new Date(details.checkOut);
      }
      if (type === 'rooms' && details.properties) {
        booking.properties = details.properties;
        booking.totalRooms = details.properties.reduce((sum: number, p: any) => sum + p.roomCount, 0);
      }

      amendment.newQuote = await this.generateQuote(groupId);
    }

    if (type === 'cancel') {
      booking.status = 'cancelled';
      booking.updatedAt = new Date();
      amendment.status = 'approved';
      amendment.resolvedAt = new Date();
    }

    this.bookings.set(groupId, booking);

    return amendment;
  }

  async getAttendees(groupId: string): Promise<Attendee[]> {
    return this.attendees.get(groupId) || [];
  }

  async addAttendee(groupId: string, attendeeData: Omit<Attendee, 'attendeeId' | 'groupId' | 'createdAt'>): Promise<Attendee> {
    const attendees = this.attendees.get(groupId) || [];

    const attendee: Attendee = {
      ...attendeeData,
      attendeeId: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      groupId,
      createdAt: new Date(),
    };

    attendees.push(attendee);
    this.attendees.set(groupId, attendees);

    return attendee;
  }

  async updateAttendee(groupId: string, attendeeId: string, updates: Partial<Attendee>): Promise<Attendee | null> {
    const attendees = this.attendees.get(groupId) || [];
    const index = attendees.findIndex(a => a.attendeeId === attendeeId);

    if (index === -1) return null;

    attendees[index] = { ...attendees[index], ...updates };
    this.attendees.set(groupId, attendees);

    return attendees[index];
  }

  async removeAttendee(groupId: string, attendeeId: string): Promise<boolean> {
    const attendees = this.attendees.get(groupId) || [];
    const initialLength = attendees.length;

    const filtered = attendees.filter(a => a.attendeeId !== attendeeId);
    this.attendees.set(groupId, filtered);

    return filtered.length < initialLength;
  }
}
