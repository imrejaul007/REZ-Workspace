import { Guest, GuestStatus, GuestCategory } from '../models';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export interface RSVPInput {
  status: GuestStatus;
  plusOnes?: number;
  dietaryRestrictions?: string[];
  notes?: string;
}

export interface BulkGuestImport {
  eventId: string;
  merchantId: string;
  guests: Array<{
    name: string;
    phone?: string;
    email?: string;
    category?: GuestCategory;
    plusOnes?: number;
    dietaryRestrictions?: string[];
    tableNumber?: number;
    seatNumber?: number;
    notes?: string;
  }>;
}

export interface RSVPResult {
  success: boolean;
  guest?: InstanceType<typeof Guest>;
  message: string;
}

export class RSVPService {
  /**
   * Process RSVP for a guest
   */
  async processRSVP(guestId: string, input: RSVPInput): Promise<RSVPResult> {
    const guest = await Guest.findOne({ guestId });
    if (!guest) {
      throw new Error(`Guest ${guestId} not found`);
    }

    // Update guest based on RSVP status
    const updates: Record<string, unknown> = {
      status: input.status,
      notes: input.notes || guest.notes
    };

    if (input.plusOnes !== undefined) {
      updates.plusOnes = input.plusOnes;
    }

    if (input.dietaryRestrictions) {
      updates.dietaryRestrictions = input.dietaryRestrictions;
    }

    // Auto-update category based on status
    if (input.status === GuestStatus.CONFIRMED || input.status === GuestStatus.ATTENDED) {
      // Check if VIP based on existing category
      if (guest.category === GuestCategory.VIP) {
        updates.category = GuestCategory.VIP;
      } else {
        updates.category = GuestCategory.CONFIRMED;
      }
    }

    const updatedGuest = await Guest.findOneAndUpdate(
      { guestId },
      { $set: updates },
      { new: true }
    );

    logger.info(`RSVP processed for guest ${guestId}: ${input.status}`);

    return {
      success: true,
      guest: updatedGuest!,
      message: `RSVP updated to ${input.status}`
    };
  }

  /**
   * Bulk import guests
   */
  async bulkImportGuests(input: BulkGuestImport): Promise<Guest[]> {
    const { eventId, merchantId, guests } = input;

    const guestDocs = guests.map(g => new Guest({
      guestId: `GST-${uuidv4().substring(0, 8).toUpperCase()}`,
      eventId,
      merchantId,
      name: g.name,
      phone: g.phone,
      email: g.email,
      category: g.category || GuestCategory.RSVP_PENDING,
      plusOnes: g.plusOnes || 0,
      dietaryRestrictions: g.dietaryRestrictions || [],
      tableNumber: g.tableNumber,
      seatNumber: g.seatNumber,
      status: GuestStatus.PENDING,
      reminderSent: false,
      notes: g.notes
    }));

    const results = await Guest.insertMany(guestDocs);

    logger.info(`Bulk imported ${results.length} guests for event ${eventId}`);

    return results;
  }

  /**
   * Send reminders to pending guests
   */
  async sendReminders(eventId: string): Promise<{
    sent: number;
    failed: number;
    guests: Array<{ guestId: string; name: string; status: string }>;
  }> {
    const pendingGuests = await Guest.find({
      eventId,
      status: GuestStatus.PENDING,
      reminderSent: false
    });

    const results = {
      sent: 0,
      failed: 0,
      guests: [] as Array<{ guestId: string; name: string; status: string }>
    };

    for (const guest of pendingGuests) {
      try {
        // In a real implementation, this would send an email/SMS
        // For now, just mark as sent
        await Guest.findOneAndUpdate(
          { guestId: guest.guestId },
          { $set: { reminderSent: true } }
        );

        results.sent++;
        results.guests.push({
          guestId: guest.guestId,
          name: guest.name,
          status: 'reminder_sent'
        });

        logger.info(`Reminder sent to guest ${guest.guestId} (${guest.name})`);
      } catch (error) {
        results.failed++;
        logger.error(`Failed to send reminder to guest ${guest.guestId}:`, error);
      }
    }

    return results;
  }

  /**
   * Confirm guest attendance (mark as attended)
   */
  async confirmAttendance(guestId: string): Promise<RSVPResult> {
    return this.processRSVP(guestId, { status: GuestStatus.ATTENDED });
  }

  /**
   * Cancel guest attendance
   */
  async cancelAttendance(guestId: string, reason?: string): Promise<RSVPResult> {
    return this.processRSVP(guestId, {
      status: GuestStatus.ABSENT,
      notes: reason
    });
  }

  /**
   * Get RSVP statistics for an event
   */
  async getRSVPStats(eventId: string): Promise<{
    total: number;
    totalWithPlusOnes: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    dietarySummary: Record<string, number>;
  }> {
    const guests = await Guest.find({ eventId });

    const stats = {
      total: guests.length,
      totalWithPlusOnes: guests.reduce((sum, g) => sum + 1 + g.plusOnes, 0),
      byStatus: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      dietarySummary: {} as Record<string, number>
    };

    // Count by status
    for (const guest of guests) {
      stats.byStatus[guest.status] = (stats.byStatus[guest.status] || 0) + 1;
      stats.byCategory[guest.category] = (stats.byCategory[guest.category] || 0) + 1;

      // Count dietary restrictions
      for (const restriction of guest.dietaryRestrictions) {
        stats.dietarySummary[restriction] = (stats.dietarySummary[restriction] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Get seating arrangement for an event
   */
  async getSeatingArrangement(eventId: string): Promise<{
    tables: Array<{
      tableNumber: number;
      guests: Array<{
        guestId: string;
        name: string;
        seatNumber?: number;
        category: string;
      }>;
      totalSeats: number;
    }>;
    unassigned: Array<{ guestId: string; name: string }>;
  }> {
    const guests = await Guest.find({ eventId }).sort({ tableNumber: 1, seatNumber: 1 });

    const tableMap: Record<number, Array<{
      guestId: string;
      name: string;
      seatNumber?: number;
      category: string;
    }>> = {};

    const unassigned: Array<{ guestId: string; name: string }> = [];

    for (const guest of guests) {
      if (guest.tableNumber) {
        if (!tableMap[guest.tableNumber]) {
          tableMap[guest.tableNumber] = [];
        }
        tableMap[guest.tableNumber].push({
          guestId: guest.guestId,
          name: guest.name,
          seatNumber: guest.seatNumber,
          category: guest.category
        });
      } else {
        unassigned.push({
          guestId: guest.guestId,
          name: guest.name
        });
      }
    }

    const tables = Object.entries(tableMap).map(([tableNumber, guestsArr]) => ({
      tableNumber: parseInt(tableNumber),
      guests: guestsArr,
      totalSeats: guestsArr.length
    }));

    return { tables, unassigned };
  }
}

export const rsvpService = new RSVPService();