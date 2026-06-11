/**
 * Reservation Manager AI - Booking Agent
 * Part of STAYBOT - Hotel AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface Reservation {
  id: string;
  confirmationCode: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  roomType: 'standard' | 'deluxe' | 'suite';
  roomNumber?: string;
  adults: number;
  children?: number;
  specialRequests?: string;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'no-show';
  totalAmount?: number;
  createdAt: string;
  source?: 'direct' | 'ota' | 'agent' | 'walk-in';
  otaBookingId?: string;
}

export interface AvailabilityResult {
  roomType: string;
  available: number;
  rate: number;
  date: string;
}

export class ReservationManager {
  private readonly roomRates: Record<string, number> = {
    'standard': 3000,
    'deluxe': 5000,
    'suite': 10000
  };

  private readonly roomAvailability: Record<string, number> = {
    'standard': 8,
    'deluxe': 4,
    'suite': 2
  };

  /**
   * Create a new reservation
   */
  async createReservation(data: {
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
    adults: number;
    children?: number;
    specialRequests?: string;
    source?: string;
  }): Promise<{ reservation: Reservation; message: string }> {
    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    const available = this.roomAvailability[data.roomType] || 0;

    if (available <= 0) {
      throw new Error('No rooms available for selected type');
    }

    const confirmationCode = `STAY${Date.now().toString(36).toUpperCase()}`;
    const subtotal = nights * this.roomRates[data.roomType];
    const taxes = subtotal * 0.18;

    const reservation: Reservation = {
      id: uuidv4(),
      confirmationCode,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      guestEmail: data.guestEmail,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      roomType: data.roomType as Reservation['roomType'],
      adults: data.adults,
      children: data.children,
      specialRequests: data.specialRequests,
      status: 'confirmed',
      totalAmount: Math.round(subtotal + taxes),
      createdAt: new Date().toISOString(),
      source: (data.source as Reservation['source']) || 'direct'
    };

    const message = this.generateConfirmationMessage(reservation, nights);

    return { reservation, message };
  }

  /**
   * Check room availability
   */
  async checkAvailability(
    checkIn: string,
    checkOut: string,
    roomType?: string
  ): Promise<{ available: AvailabilityResult[]; message: string }> {
    const results: AvailabilityResult[] = [];
    const types = roomType ? [roomType] : ['standard', 'deluxe', 'suite'];

    for (const type of types) {
      results.push({
        roomType: type,
        available: this.roomAvailability[type] || 0,
        rate: this.roomRates[type],
        date: checkIn
      });
    }

    return {
      available: results,
      message: `${results.filter(r => r.available > 0).length} room type(s) available for selected dates.`
    };
  }

  /**
   * Modify reservation
   */
  async modifyReservation(
    reservationId: string,
    modifications: Partial<{
      checkIn: string;
      checkOut: string;
      roomType: string;
      specialRequests: string;
    }>
  ): Promise<{ success: boolean; reservation: Reservation; message: string }> {
    // Simulate fetching and modifying reservation
    const reservation: Reservation = {
      id: reservationId,
      confirmationCode: `STAY${reservationId.slice(0, 8).toUpperCase()}`,
      guestName: 'Guest',
      guestPhone: '1234567890',
      guestEmail: 'guest@email.com',
      checkIn: modifications.checkIn || new Date().toISOString(),
      checkOut: modifications.checkOut || new Date(Date.now() + 86400000).toISOString(),
      roomType: (modifications.roomType as Reservation['roomType']) || 'standard',
      adults: 2,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      reservation,
      message: 'Reservation modified successfully. Confirmation sent to your email.'
    };
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(
    reservationId: string,
    reason?: string
  ): Promise<{ success: boolean; refundAmount?: number; message: string }> {
    // Simulate cancellation
    const refundAmount = Math.floor(Math.random() * 5000) + 2000;

    return {
      success: true,
      refundAmount,
      message: `Reservation cancelled. Refund of ₹${refundAmount} will be processed within 5-7 business days.`
    };
  }

  /**
   * Get reservation by confirmation code
   */
  async getByConfirmationCode(code: string): Promise<Reservation | null> {
    // Simulate retrieval
    return {
      id: uuidv4(),
      confirmationCode: code,
      guestName: 'Guest',
      guestPhone: '1234567890',
      guestEmail: 'guest@email.com',
      checkIn: new Date().toISOString(),
      checkOut: new Date(Date.now() + 86400000).toISOString(),
      roomType: 'deluxe',
      adults: 2,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Calculate pricing
   */
  async calculatePrice(
    checkIn: string,
    checkOut: string,
    roomType: string
  ): Promise<{
    nights: number;
    ratePerNight: number;
    subtotal: number;
    taxes: number;
    total: number;
    breakdown: { item: string; amount: number }[];
  }> {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    const ratePerNight = this.roomRates[roomType] || 3000;
    const subtotal = nights * ratePerNight;
    const taxes = subtotal * 0.18;

    return {
      nights,
      ratePerNight,
      subtotal,
      taxes,
      total: Math.round(subtotal + taxes),
      breakdown: [
        { item: `${nights} nights x ₹${ratePerNight}`, amount: subtotal },
        { item: 'GST (18%)', amount: Math.round(taxes) }
      ]
    };
  }

  /**
   * Apply promo code
   */
  async applyPromoCode(
    code: string,
    totalAmount: number
  ): Promise<{ valid: boolean; discount?: number; newTotal?: number; message: string }> {
    const validCodes: Record<string, number> = {
      'WELCOME20': 20,
      'SUMMER15': 15,
      'VIP30': 30
    };

    const discountPercent = validCodes[code.toUpperCase()];

    if (discountPercent) {
      const discount = Math.round(totalAmount * (discountPercent / 100));
      return {
        valid: true,
        discount,
        newTotal: totalAmount - discount,
        message: `Promo code applied! ${discountPercent}% discount (₹${discount})`
      };
    }

    return {
      valid: false,
      message: 'Invalid promo code. Please check and try again.'
    };
  }

  private generateConfirmationMessage(reservation: Reservation, nights: number): string {
    return `Reservation confirmed for ${reservation.guestName}! ` +
      `Confirmation code: ${reservation.confirmationCode}. ` +
      `${nights} night(s) in ${reservation.roomType} room. ` +
      `Check-in from 2 PM, check-out by 11 AM. ` +
      `Total: ₹${reservation.totalAmount}. ` +
      `We look forward to welcoming you!`;
  }
}

export default ReservationManager;