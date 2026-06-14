/**
 * Guest Service - Business logic for guest management
 */

import { Guest, IGuest } from '../models/Guest';
import { logger } from '../config/logger';
import { GuestInput, GuestData } from '../types';

export class GuestService {
  /**
   * Create a new guest
   */
  async createGuest(input: GuestInput): Promise<IGuest> {
    try {
      const guest = new Guest({
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim(),
        checkIn: new Date(input.checkIn),
        checkOut: new Date(input.checkOut),
        roomNumber: input.roomNumber.trim(),
        preferences: input.preferences || [],
        requests: [],
      });

      await guest.save();
      logger.info('Guest created', { guestId: guest._id, roomNumber: guest.roomNumber });
      return guest;
    } catch (error) {
      logger.error('Failed to create guest', { error: (error as Error).message, input });
      throw error;
    }
  }

  /**
   * Get guest by ID
   */
  async getGuestById(id: string): Promise<IGuest | null> {
    try {
      const guest = await Guest.findById(id);
      return guest;
    } catch (error) {
      logger.error('Failed to get guest', { error: (error as Error).message, guestId: id });
      throw error;
    }
  }

  /**
   * Get guests by room number
   */
  async getGuestsByRoom(roomNumber: string): Promise<IGuest[]> {
    try {
      const guests = await Guest.find({ roomNumber: roomNumber.trim() });
      return guests;
    } catch (error) {
      logger.error('Failed to get guests by room', { error: (error as Error).message, roomNumber });
      throw error;
    }
  }

  /**
   * Get current guest (checked in)
   */
  async getCurrentGuestForRoom(roomNumber: string): Promise<IGuest | null> {
    try {
      const now = new Date();
      const guest = await Guest.findOne({
        roomNumber: roomNumber.trim(),
        checkIn: { $lte: now },
        checkOut: { $gte: now },
      });
      return guest;
    } catch (error) {
      logger.error('Failed to get current guest', { error: (error as Error).message, roomNumber });
      throw error;
    }
  }

  /**
   * Add a request to guest
   */
  async addRequest(guestId: string, request: string): Promise<IGuest | null> {
    try {
      const guest = await Guest.findByIdAndUpdate(
        guestId,
        { $push: { requests: request.trim() } },
        { new: true }
      );
      if (guest) {
        logger.info('Request added to guest', { guestId, request });
      }
      return guest;
    } catch (error) {
      logger.error('Failed to add request', { error: (error as Error).message, guestId });
      throw error;
    }
  }

  /**
   * Get active guests count
   */
  async getActiveGuestsCount(): Promise<number> {
    try {
      const now = new Date();
      const count = await Guest.countDocuments({
        checkIn: { $lte: now },
        checkOut: { $gte: now },
      });
      return count;
    } catch (error) {
      logger.error('Failed to get active guests count', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get today's checkouts
   */
  async getTodayCheckOuts(): Promise<IGuest[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const guests = await Guest.find({
        checkOut: { $gte: today, $lt: tomorrow },
      });
      return guests;
    } catch (error) {
      logger.error('Failed to get today checkouts', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Update guest
   */
  async updateGuest(guestId: string, updates: Partial<GuestInput>): Promise<IGuest | null> {
    try {
      const guest = await Guest.findByIdAndUpdate(
        guestId,
        {
          ...(updates.name && { name: updates.name.trim() }),
          ...(updates.phone && { phone: updates.phone.trim() }),
          ...(updates.email && { email: updates.email?.trim() }),
          ...(updates.checkIn && { checkIn: new Date(updates.checkIn) }),
          ...(updates.checkOut && { checkOut: new Date(updates.checkOut) }),
          ...(updates.roomNumber && { roomNumber: updates.roomNumber.trim() }),
          ...(updates.preferences && { preferences: updates.preferences }),
        },
        { new: true }
      );
      if (guest) {
        logger.info('Guest updated', { guestId });
      }
      return guest;
    } catch (error) {
      logger.error('Failed to update guest', { error: (error as Error).message, guestId });
      throw error;
    }
  }

  /**
   * Delete guest
   */
  async deleteGuest(guestId: string): Promise<boolean> {
    try {
      const result = await Guest.findByIdAndDelete(guestId);
      if (result) {
        logger.info('Guest deleted', { guestId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete guest', { error: (error as Error).message, guestId });
      throw error;
    }
  }
}

export const guestService = new GuestService();
export default guestService;