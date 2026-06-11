/**
 * Reservation Manager - Table Booking Agent
 * Part of WAITRON - Restaurant AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface Table {
  number: number;
  capacity: number;
  section: 'indoor' | 'outdoor' | 'private' | 'rooftop';
  isOccupied: boolean;
}

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  dateTime: string;
  guests: number;
  tableNumber?: number;
  tablePreference?: string;
  occasion?: string;
  specialRequests?: string;
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  phone: string;
  guests: number;
  dateTime: string;
  status: 'waiting' | 'notified' | 'seated' | 'expired';
  joinedAt: string;
}

export class ReservationManager {
  private tables: Table[] = [];
  private reservations: Map<string, Reservation> = new Map();
  private waitlist: Map<string, WaitlistEntry> = new Map();

  constructor(tableCount: number = 20) {
    this.initializeTables(tableCount);
  }

  private initializeTables(count: number): void {
    this.tables = Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      capacity: i < 8 ? 2 : i < 14 ? 4 : i < 18 ? 6 : 8,
      section: i < 8 ? 'indoor' : i < 14 ? 'outdoor' : i < 18 ? 'private' : 'rooftop',
      isOccupied: false
    }));
  }

  /**
   * Book a table
   */
  async bookTable(reservation: Omit<Reservation, 'id' | 'status' | 'createdAt'>): Promise<{
    success: boolean;
    reservation?: Reservation;
    message: string;
  }> {
    const availableTables = this.getAvailableTables(reservation.guests);

    if (availableTables.length === 0) {
      // Add to waitlist
      const waitlistEntry = await this.addToWaitlist({
        customerName: reservation.customerName,
        phone: reservation.phone,
        guests: reservation.guests,
        dateTime: reservation.dateTime
      });

      return {
        success: false,
        message: `No tables available for ${reservation.guests} guests. You've been added to the waitlist.`
      };
    }

    // Assign best table
    let assignedTable = availableTables[0];
    if (reservation.tablePreference) {
      const preferred = availableTables.find(t => t.section === reservation.tablePreference);
      if (preferred) assignedTable = preferred;
    }

    const newReservation: Reservation = {
      ...reservation,
      id: uuidv4(),
      tableNumber: assignedTable.number,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    this.reservations.set(newReservation.id, newReservation);
    assignedTable.isOccupied = true;

    return {
      success: true,
      reservation: newReservation,
      message: `Table ${assignedTable.number} (capacity: ${assignedTable.capacity}) confirmed for ${reservation.guests} guests on ${reservation.dateTime}.`
    };
  }

  /**
   * Check table availability
   */
  async checkAvailability(guests: number, dateTime: string): Promise<{
    available: boolean;
    tables: { section: string; count: number }[];
    message: string;
  }> {
    const available = this.getAvailableTables(guests);
    const sectionCount = this.countBySection(available);

    return {
      available: available.length > 0,
      tables: sectionCount,
      message: available.length > 0
        ? `${available.length} tables available for ${guests} guests.`
        : `No tables available for ${guests} guests. Please join waitlist.`
    };
  }

  /**
   * Modify reservation
   */
  async modifyReservation(
    reservationId: string,
    updates: Partial<Omit<Reservation, 'id' | 'createdAt'>>
  ): Promise<{
    success: boolean;
    reservation?: Reservation;
    message: string;
  }> {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      return { success: false, message: 'Reservation not found' };
    }

    // Release old table
    if (reservation.tableNumber) {
      const oldTable = this.tables.find(t => t.number === reservation.tableNumber);
      if (oldTable) oldTable.isOccupied = false;
    }

    // Check new availability if changing guests
    if (updates.guests && updates.guests !== reservation.guests) {
      const available = this.getAvailableTables(updates.guests);
      if (available.length === 0) {
        return {
          success: false,
          message: 'Cannot accommodate the new guest count. Please try different timing.'
        };
      }
      updates.tableNumber = available[0].number;
      available[0].isOccupied = true;
    }

    const updated: Reservation = { ...reservation, ...updates };
    this.reservations.set(reservationId, updated);

    return {
      success: true,
      reservation: updated,
      message: 'Reservation updated successfully.'
    };
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(reservationId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      return { success: false, message: 'Reservation not found' };
    }

    reservation.status = 'cancelled';
    if (reservation.tableNumber) {
      const table = this.tables.find(t => t.number === reservation.tableNumber);
      if (table) table.isOccupied = false;
    }

    // Check waitlist
    await this.notifyWaitlist(reservation.dateTime, reservation.guests);

    return { success: true, message: 'Reservation cancelled.' };
  }

  /**
   * Add to waitlist
   */
  async addToWaitlist(entry: Omit<WaitlistEntry, 'id' | 'status' | 'joinedAt'>): Promise<WaitlistEntry> {
    const waitlistEntry: WaitlistEntry = {
      ...entry,
      id: uuidv4(),
      status: 'waiting',
      joinedAt: new Date().toISOString()
    };

    this.waitlist.set(waitlistEntry.id, waitlistEntry);
    return waitlistEntry;
  }

  /**
   * Get waitlist
   */
  async getWaitlist(dateTime?: string): Promise<WaitlistEntry[]> {
    const entries = Array.from(this.waitlist.values())
      .filter(w => w.status === 'waiting');

    if (dateTime) {
      return entries.filter(w => w.dateTime === dateTime);
    }

    return entries;
  }

  private getAvailableTables(guests: number): Table[] {
    return this.tables.filter(t => !t.isOccupied && t.capacity >= guests);
  }

  private countBySection(tables: Table[]): { section: string; count: number }[] {
    const counts: Record<string, number> = {};
    tables.forEach(t => {
      counts[t.section] = (counts[t.section] || 0) + 1;
    });
    return Object.entries(counts).map(([section, count]) => ({ section, count }));
  }

  private async notifyWaitlist(dateTime: string, guests: number): Promise<void> {
    const matching = Array.from(this.waitlist.values())
      .filter(w => w.dateTime === dateTime && w.guests <= guests + 2 && w.status === 'waiting');

    for (const entry of matching) {
      entry.status = 'notified';
    }
  }
}

export default ReservationManager;
