/**
 * Reservation Service - Hotel Booking Backend
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
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
  source?: 'direct' | 'ota' | 'agent' | 'walk-in';
}

export interface RoomAvailability {
  date: string;
  roomType: string;
  totalRooms: number;
  bookedRooms: number;
  available: number;
  rate: number;
}

export interface CancellationPolicy {
  hoursBeforeCheckIn: number;
  refundPercent: number;
}

export class ReservationService {
  private reservations: Map<string, Reservation> = new Map();
  private readonly roomRates: Record<string, number> = {
    'standard': 3000,
    'deluxe': 5000,
    'suite': 10000
  };

  private readonly cancellationPolicies: CancellationPolicy[] = [
    { hoursBeforeCheckIn: 0, refundPercent: 100 }, // Free cancellation before 24h
    { hoursBeforeCheckIn: 24, refundPercent: 50 },
    { hoursBeforeCheckIn: 72, refundPercent: 25 },
    { hoursBeforeCheckIn: 999, refundPercent: 0 }
  ];

  async createReservation(data: Omit<Reservation, 'id' | 'confirmationCode' | 'createdAt' | 'totalAmount' | 'paidAmount'>): Promise<Reservation> {
    const nights = this.calculateNights(data.checkIn, data.checkOut);
    const subtotal = nights * this.roomRates[data.roomType];
    const taxes = subtotal * 0.18;
    const totalAmount = Math.round(subtotal + taxes);

    const reservation: Reservation = {
      ...data,
      id: uuidv4(),
      confirmationCode: `STAY${Date.now().toString(36).toUpperCase()}`,
      totalAmount,
      paidAmount: 0,
      createdAt: new Date().toISOString()
    };

    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  async getById(id: string): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }

  async getByConfirmationCode(code: string): Promise<Reservation | undefined> {
    return Array.from(this.reservations.values()).find(r => r.confirmationCode === code);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(r => {
      const checkIn = new Date(r.checkIn);
      return checkIn >= new Date(startDate) && checkIn <= new Date(endDate);
    });
  }

  async updateStatus(id: string, status: Reservation['status']): Promise<Reservation | undefined> {
    const reservation = this.reservations.get(id);
    if (!reservation) return undefined;

    reservation.status = status;
    this.reservations.set(id, reservation);
    return reservation;
  }

  async cancel(id: string, reason?: string): Promise<{ success: boolean; refundAmount: number; message: string }> {
    const reservation = this.reservations.get(id);
    if (!reservation) return { success: false, refundAmount: 0, message: 'Reservation not found' };

    const refundAmount = this.calculateRefund(reservation);
    reservation.status = 'cancelled';
    this.reservations.set(id, reservation);

    return {
      success: true,
      refundAmount,
      message: refundAmount > 0
        ? `Reservation cancelled. Refund of ₹${refundAmount} will be processed.`
        : 'Reservation cancelled. No refund applicable due to late cancellation.'
    };
  }

  async getAvailability(checkIn: string, checkOut: string, roomType?: string): Promise<RoomAvailability[]> {
    const results: RoomAvailability[] = [];
    const types = roomType ? [roomType] : ['standard', 'deluxe', 'suite'];

    const totalRooms: Record<string, number> = { 'standard': 10, 'deluxe': 5, 'suite': 2 };

    for (const type of types) {
      const booked = Array.from(this.reservations.values()).filter(r =>
        r.roomType === type &&
        ['confirmed', 'checked-in'].includes(r.status) &&
        this.datesOverlap(r.checkIn, r.checkOut, checkIn, checkOut)
      ).length;

      results.push({
        date: checkIn,
        roomType: type,
        totalRooms: totalRooms[type] || 10,
        bookedRooms: booked,
        available: (totalRooms[type] || 10) - booked,
        rate: this.roomRates[type]
      });
    }

    return results;
  }

  async calculatePrice(checkIn: string, checkOut: string, roomType: string): Promise<{
    nights: number;
    ratePerNight: number;
    subtotal: number;
    taxes: number;
    total: number;
  }> {
    const nights = this.calculateNights(checkIn, checkOut);
    const ratePerNight = this.roomRates[roomType] || 3000;
    const subtotal = nights * ratePerNight;
    const taxes = Math.round(subtotal * 0.18);

    return { nights, ratePerNight, subtotal, taxes, total: subtotal + taxes };
  }

  async getStats(date?: string): Promise<{
    totalReservations: number;
    confirmed: number;
    checkedIn: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    const all = Array.from(this.reservations.values());
    const filtered = date ? all.filter(r => r.createdAt.startsWith(date)) : all;

    return {
      totalReservations: filtered.length,
      confirmed: filtered.filter(r => r.status === 'confirmed').length,
      checkedIn: filtered.filter(r => r.status === 'checked-in').length,
      cancelled: filtered.filter(r => r.status === 'cancelled').length,
      totalRevenue: filtered.reduce((sum, r) => sum + r.paidAmount, 0)
    };
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateRefund(reservation: Reservation): number {
    const hoursUntilCheckIn = (new Date(reservation.checkIn).getTime() - Date.now()) / (1000 * 60 * 60);
    const policy = this.cancellationPolicies.find(p => hoursUntilCheckIn >= p.hoursBeforeCheckIn);
    return Math.round(reservation.totalAmount * ((policy?.refundPercent || 0) / 100));
  }

  private datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return new Date(start1) < new Date(end2) && new Date(end1) > new Date(start2);
  }
}

export default ReservationService;