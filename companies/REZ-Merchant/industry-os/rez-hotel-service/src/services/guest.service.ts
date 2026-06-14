/**
 * Guest Service
 *
 * Business logic for guest management
 */

import { Guest } from '../models/Guest';
import { Booking } from '../models/Booking';
import { logger } from '../config/logger';
import { CreateGuestInput, UpdateGuestInput, GuestSearchFilters } from '../types';

const log = (msg: string, meta?) => logger.info(`[guest-service] ${msg}`, meta);

function generateGuestId(): string {
  try {
    const { randomUUID } = require('crypto');
    const uuid = randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
    return `GST${Date.now().toString(36)}${uuid}`;
  } catch {
    return 'GST' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
}

class GuestService {
  /**
   * Create a new guest
   */
  async createGuest(hotelId: string, input: CreateGuestInput): Promise<typeof Guest.prototype> {
    const guestId = generateGuestId();

    // Parse name into firstName and lastName
    const nameParts = input.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const guest = new Guest({
      guestId,
      hotelId,
      name: input.name,
      firstName,
      lastName,
      email: input.email,
      phone: input.phone,
      idType: input.idType,
      idNumber: input.idNumber,
      address: input.address,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      nationality: input.nationality,
      preferences: input.preferences || {},
      loyaltyTier: 'bronze',
      loyaltyPoints: 0,
      totalStays: 0,
      totalSpent: 0,
      isBlacklisted: false,
    });

    await guest.save();
    log('Guest created', { guestId, hotelId, name: input.name });

    return guest;
  }

  /**
   * Get guest by ID
   */
  async getGuest(guestId: string): Promise<typeof Guest.prototype | null> {
    return Guest.findOne({ guestId });
  }

  /**
   * Get guest by email
   */
  async getGuestByEmail(hotelId: string, email: string): Promise<typeof Guest.prototype | null> {
    return Guest.findOne({ hotelId, email: email.toLowerCase() });
  }

  /**
   * Get guest by phone
   */
  async getGuestByPhone(hotelId: string, phone: string): Promise<typeof Guest.prototype | null> {
    return Guest.findOne({ hotelId, phone });
  }

  /**
   * Get all guests for a hotel
   */
  async getGuestsByHotel(hotelId: string, limit = 100, offset = 0): Promise<typeof Guest[]> {
    return Guest.find({ hotelId }).sort({ createdAt: -1 }).skip(offset).limit(limit);
  }

  /**
   * Update guest
   */
  async updateGuest(guestId: string, input: UpdateGuestInput): Promise<typeof Guest.prototype | null> {
    const updates: Record<string, unknown> = {};

    if (input.name !== undefined) {
      updates.name = input.name;
      const nameParts = input.name.trim().split(/\s+/);
      updates.firstName = nameParts[0] || '';
      updates.lastName = nameParts.slice(1).join(' ') || '';
    }
    if (input.email !== undefined) updates.email = input.email.toLowerCase();
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.idType !== undefined) updates.idType = input.idType;
    if (input.idNumber !== undefined) updates.idNumber = input.idNumber;
    if (input.address !== undefined) updates.address = input.address;
    if (input.dateOfBirth !== undefined) updates.dateOfBirth = new Date(input.dateOfBirth);
    if (input.nationality !== undefined) updates.nationality = input.nationality;
    if (input.preferences !== undefined) updates.preferences = input.preferences;
    if (input.loyaltyTier !== undefined) updates.loyaltyTier = input.loyaltyTier;
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.isBlacklisted !== undefined) updates.isBlacklisted = input.isBlacklisted;

    const guest = await Guest.findOneAndUpdate(
      { guestId },
      { $set: updates },
      { new: true }
    );

    if (guest) {
      log('Guest updated', { guestId });
    }

    return guest;
  }

  /**
   * Blacklist a guest
   */
  async blacklistGuest(guestId: string, reason?: string): Promise<typeof Guest.prototype | null> {
    const guest = await Guest.findOneAndUpdate(
      { guestId },
      {
        $set: {
          isBlacklisted: true,
          ...(reason ? { notes: `${guest?.notes || ''}\nBlacklisted: ${reason}` } : {}),
        },
      },
      { new: true }
    );

    if (guest) {
      log('Guest blacklisted', { guestId, reason });
    }

    return guest;
  }

  /**
   * Remove guest from blacklist
   */
  async removeFromBlacklist(guestId: string): Promise<typeof Guest.prototype | null> {
    const guest = await Guest.findOneAndUpdate(
      { guestId },
      { $set: { isBlacklisted: false } },
      { new: true }
    );

    if (guest) {
      log('Guest removed from blacklist', { guestId });
    }

    return guest;
  }

  /**
   * Search guests
   */
  async searchGuests(filters: GuestSearchFilters): Promise<typeof Guest[]> {
    const query: Record<string, unknown> = {};

    if (filters.hotelId) query.hotelId = filters.hotelId;
    if (filters.loyaltyTier) query.loyaltyTier = filters.loyaltyTier;
    if (filters.isBlacklisted !== undefined) query.isBlacklisted = filters.isBlacklisted;

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return Guest.find(query).sort({ lastStay: -1, createdAt: -1 });
  }

  /**
   * Get guest booking history
   */
  async getGuestBookingHistory(guestId: string): Promise<typeof Booking[]> {
    return Booking.find({ guestId }).sort({ checkIn: -1 });
  }

  /**
   * Update guest loyalty tier based on points
   */
  async updateLoyaltyTier(guestId: string): Promise<typeof Guest.prototype | null> {
    const guest = await Guest.findOne({ guestId });
    if (!guest) return null;

    let newTier = 'bronze';
    const points = guest.loyaltyPoints;

    if (points >= 50000) newTier = 'diamond';
    else if (points >= 25000) newTier = 'platinum';
    else if (points >= 10000) newTier = 'gold';
    else if (points >= 5000) newTier = 'silver';

    if (newTier !== guest.loyaltyTier) {
      const updated = await Guest.findOneAndUpdate(
        { guestId },
        { $set: { loyaltyTier: newTier } },
        { new: true }
      );
      log('Guest loyalty tier updated', { guestId, oldTier: guest.loyaltyTier, newTier });
      return updated;
    }

    return guest;
  }

  /**
   * Add loyalty points to guest
   */
  async addLoyaltyPoints(guestId: string, points: number): Promise<typeof Guest.prototype | null> {
    const guest = await Guest.findOneAndUpdate(
      { guestId },
      {
        $inc: { loyaltyPoints: points },
        $set: { lastStay: new Date() },
      },
      { new: true }
    );

    if (guest) {
      log('Loyalty points added', { guestId, points, totalPoints: guest.loyaltyPoints });

      // Check and update tier
      await this.updateLoyaltyTier(guestId);
    }

    return guest;
  }

  /**
   * Redeem loyalty points
   */
  async redeemLoyaltyPoints(guestId: string, points: number): Promise<typeof Guest.prototype | null> {
    const guest = await Guest.findOne({ guestId });
    if (!guest) return null;

    if (guest.loyaltyPoints < points) {
      log('Insufficient loyalty points', { guestId, requested: points, available: guest.loyaltyPoints });
      return null;
    }

    const updated = await Guest.findOneAndUpdate(
      { guestId },
      { $inc: { loyaltyPoints: -points } },
      { new: true }
    );

    if (updated) {
      log('Loyalty points redeemed', { guestId, points, remaining: updated.loyaltyPoints });
    }

    return updated;
  }

  /**
   * Get VIP guests (high tier or high spenders)
   */
  async getVipGuests(hotelId: string): Promise<typeof Guest[]> {
    return Guest.find({
      hotelId,
      isBlacklisted: false,
      $or: [
        { loyaltyTier: { $in: ['gold', 'platinum', 'diamond'] } },
        { totalSpent: { $gte: 100000 } },
      ],
    }).sort({ loyaltyPoints: -1, totalSpent: -1 });
  }

  /**
   * Get guest statistics
   */
  async getGuestStats(hotelId: string): Promise<{
    totalGuests: number;
    blacklisted: number;
    byTier: Record<string, number>;
    repeatGuests: number;
    averageSpend: number;
  }> {
    const guests = await Guest.find({ hotelId });

    const stats = {
      totalGuests: guests.length,
      blacklisted: 0,
      byTier: {} as Record<string, number>,
      repeatGuests: 0,
      averageSpend: 0,
    };

    let totalSpend = 0;

    for (const guest of guests) {
      if (guest.isBlacklisted) stats.blacklisted++;
      if (guest.totalStays > 1) stats.repeatGuests++;
      totalSpend += guest.totalSpent;

      if (!stats.byTier[guest.loyaltyTier]) {
        stats.byTier[guest.loyaltyTier] = 0;
      }
      stats.byTier[guest.loyaltyTier]++;
    }

    stats.averageSpend = stats.totalGuests > 0 ? totalSpend / stats.totalGuests : 0;

    return stats;
  }

  /**
   * Delete guest (soft delete by blacklisting)
   */
  async deleteGuest(guestId: string): Promise<boolean> {
    const result = await this.blacklistGuest(guestId, 'Guest account deleted');

    if (result) {
      log('Guest deleted (blacklisted)', { guestId });
      return true;
    }

    return false;
  }
}

export const guestService = new GuestService();
