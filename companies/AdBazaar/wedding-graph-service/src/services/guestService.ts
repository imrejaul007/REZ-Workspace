import { v4 as uuidv4 } from 'uuid';
import { Guest, IGuest } from '../models/Guest';
import { Wedding } from '../models/Wedding';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export interface CreateGuestDto {
  weddingId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  rsvp?: 'pending' | 'confirmed' | 'declined' | 'tentative';
  plusOne?: boolean;
  plusOneName?: string;
  dietary?: Partial<Guest['dietary']>;
  tableNumber?: number;
  seatNumber?: string;
  category?: 'family' | 'friend' | 'colleague' | 'vendor' | 'neighbor' | 'other';
  relationship?: string;
  giftRegistered?: boolean;
  mealPreference?: 'buffet' | 'plated' | 'family_style';
  specialRequests?: string;
  attendingCeremony?: boolean;
  attendingReception?: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
}

export interface UpdateGuestDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  rsvp?: 'pending' | 'confirmed' | 'declined' | 'tentative';
  plusOne?: boolean;
  plusOneName?: string;
  dietary?: Partial<Guest['dietary']>;
  tableNumber?: number;
  seatNumber?: string;
  category?: 'family' | 'friend' | 'colleague' | 'vendor' | 'neighbor' | 'other';
  relationship?: string;
  giftRegistered?: boolean;
  mealPreference?: 'buffet' | 'plated' | 'family_style';
  specialRequests?: string;
  attendingCeremony?: boolean;
  attendingReception?: boolean;
  sendingGift?: boolean;
  giftAmount?: number;
  invitationSent?: boolean;
  reminderSent?: boolean;
}

export interface GuestFilters {
  weddingId: string;
  rsvp?: Guest['rsvp'];
  category?: Guest['category'];
  tableNumber?: number;
  dietary?: string;
  attendingCeremony?: boolean;
  attendingReception?: boolean;
  search?: string;
}

export interface BulkGuestDto {
  weddingId: string;
  guests: CreateGuestDto[];
}

class GuestService {
  /**
   * Create a new guest
   */
  async createGuest(data: CreateGuestDto): Promise<IGuest> {
    try {
      const guestId = `GST-${uuidv4().substring(0, 8).toUpperCase()}`;

      const guest = new Guest({
        guestId,
        ...data,
        attendingCeremony: data.attendingCeremony ?? true,
        attendingReception: data.attendingReception ?? true
      });

      await guest.save();

      // Update wedding guest count
      await this.syncWeddingGuestCount(data.weddingId);

      logger.info('Guest created', {
        guestId,
        weddingId: data.weddingId,
        name: `${data.firstName} ${data.lastName}`
      });

      return guest;
    } catch (error) {
      logger.error('Error creating guest:', error);
      throw error;
    }
  }

  /**
   * Create multiple guests (bulk)
   */
  async createBulkGuests(data: BulkGuestDto): Promise<{ created: number; failed: number; guests: IGuest[] }> {
    try {
      const guests: IGuest[] = [];
      let failed = 0;

      for (const guestData of data.guests) {
        try {
          const guest = await this.createGuest({
            ...guestData,
            weddingId: data.weddingId
          });
          guests.push(guest);
        } catch (error) {
          failed++;
          logger.error('Error creating guest in bulk:', error);
        }
      }

      logger.info('Bulk guests created', {
        weddingId: data.weddingId,
        created: guests.length,
        failed
      });

      return {
        created: guests.length,
        failed,
        guests
      };
    } catch (error) {
      logger.error('Error in bulk guest creation:', error);
      throw error;
    }
  }

  /**
   * Get guest by ID
   */
  async getGuestById(guestId: string): Promise<IGuest | null> {
    try {
      const guest = await Guest.findOne({ guestId });
      return guest;
    } catch (error) {
      logger.error('Error getting guest:', error);
      throw error;
    }
  }

  /**
   * Update guest
   */
  async updateGuest(guestId: string, data: UpdateGuestDto): Promise<IGuest | null> {
    try {
      const guest = await Guest.findOneAndUpdate(
        { guestId },
        { $set: data },
        { new: true, runValidators: true }
      );

      if (guest) {
        // Sync wedding guest count if RSVP changed
        if (data.rsvp) {
          await this.syncWeddingGuestCount(guest.weddingId);
        }

        logger.info('Guest updated', {
          guestId,
          updatedFields: Object.keys(data)
        });
      }

      return guest;
    } catch (error) {
      logger.error('Error updating guest:', error);
      throw error;
    }
  }

  /**
   * Delete guest
   */
  async deleteGuest(guestId: string): Promise<boolean> {
    try {
      const guest = await Guest.findOne({ guestId });
      if (!guest) return false;

      await Guest.deleteOne({ guestId });

      // Update wedding guest count
      await this.syncWeddingGuestCount(guest.weddingId);

      logger.info('Guest deleted', { guestId, weddingId: guest.weddingId });

      return true;
    } catch (error) {
      logger.error('Error deleting guest:', error);
      throw error;
    }
  }

  /**
   * List guests for a wedding
   */
  async listGuests(
    filters: GuestFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<{ guests: IGuest[]; total: number; page: number; totalPages: number }> {
    try {
      const query: any = { weddingId: filters.weddingId };

      if (filters.rsvp) query.rsvp = filters.rsvp;
      if (filters.category) query.category = filters.category;
      if (filters.tableNumber) query.tableNumber = filters.tableNumber;
      if (filters.attendingCeremony !== undefined) query.attendingCeremony = filters.attendingCeremony;
      if (filters.attendingReception !== undefined) query.attendingReception = filters.attendingReception;

      if (filters.dietary) {
        query[`dietary.${filters.dietary}`] = true;
      }

      if (filters.search) {
        query.$or = [
          { firstName: { $regex: filters.search, $options: 'i' } },
          { lastName: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const [guests, total] = await Promise.all([
        Guest.find(query)
          .sort({ lastName: 1, firstName: 1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Guest.countDocuments(query)
      ]);

      return {
        guests,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error listing guests:', error);
      throw error;
    }
  }

  /**
   * Get guest statistics for a wedding
   */
  async getGuestStats(weddingId: string): Promise<any> {
    try {
      const stats = await Guest.aggregate([
        { $match: { weddingId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            confirmed: {
              $sum: { $cond: [{ $eq: ['$rsvp', 'confirmed'] }, 1, 0] }
            },
            declined: {
              $sum: { $cond: [{ $eq: ['$rsvp', 'declined'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$rsvp', 'pending'] }, 1, 0] }
            },
            tentative: {
              $sum: { $cond: [{ $eq: ['$rsvp', 'tentative'] }, 1, 0] }
            },
            withPlusOne: {
              $sum: { $cond: ['$plusOne', 1, 0] }
            },
            sendingGift: {
              $sum: { $cond: ['$sendingGift', 1, 0] }
            },
            totalGiftAmount: {
              $sum: { $cond: ['$giftAmount', '$giftAmount', 0] }
            }
          }
        }
      ]);

      const categoryStats = await Guest.aggregate([
        { $match: { weddingId } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);

      const dietaryStats = await Guest.aggregate([
        { $match: { weddingId } },
        {
          $group: {
            _id: null,
            vegetarian: { $sum: { $cond: ['$dietary.vegetarian', 1, 0] } },
            vegan: { $sum: { $cond: ['$dietary.vegan', 1, 0] } },
            glutenFree: { $sum: { $cond: ['$dietary.glutenFree', 1, 0] } },
            halal: { $sum: { $cond: ['$dietary.halal', 1, 0] } },
            kosher: { $sum: { $cond: ['$dietary.kosher', 1, 0] } },
            nutAllergy: { $sum: { $cond: ['$dietary.nutAllergy', 1, 0] } },
            dairyFree: { $sum: { $cond: ['$dietary.dairyFree', 1, 0] } }
          }
        }
      ]);

      const tableStats = await Guest.aggregate([
        { $match: { weddingId, tableNumber: { $exists: true } } },
        { $group: { _id: '$tableNumber', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      return {
        weddingId,
        summary: stats[0] || {
          total: 0,
          confirmed: 0,
          declined: 0,
          pending: 0,
          tentative: 0,
          withPlusOne: 0,
          sendingGift: 0,
          totalGiftAmount: 0
        },
        categoryBreakdown: categoryStats,
        dietaryBreakdown: dietaryStats[0] || {},
        tableBreakdown: tableStats,
        avgGiftValue: stats[0]?.sendingGift > 0
          ? stats[0].totalGiftAmount / stats[0].sendingGift
          : 0
      };
    } catch (error) {
      logger.error('Error getting guest stats:', error);
      throw error;
    }
  }

  /**
   * Sync wedding guest count
   */
  private async syncWeddingGuestCount(weddingId: string): Promise<void> {
    try {
      const stats = await Guest.aggregate([
        { $match: { weddingId } },
        {
          $group: {
            _id: '$rsvp',
            count: { $sum: 1 }
          }
        }
      ]);

      const guestCount = {
        expected: stats.reduce((sum, s) => sum + s.count, 0),
        confirmed: stats.find((s) => s._id === 'confirmed')?.count || 0,
        declined: stats.find((s) => s._id === 'declined')?.count || 0,
        tentative: stats.find((s) => s._id === 'tentative')?.count || 0
      };

      await Wedding.updateOne({ weddingId }, { $set: { guestCount } });

      logger.info('Wedding guest count synced', { weddingId, guestCount });
    } catch (error) {
      logger.error('Error syncing wedding guest count:', error);
    }
  }

  /**
   * Get guests by location for targeting
   */
  async getGuestsByLocation(weddingId: string): Promise<any[]> {
    try {
      const guests = await Guest.find({
        weddingId,
        'address.city': { $exists: true }
      }).select('firstName lastName address');

      const locationGroups = guests.reduce((acc, guest) => {
        const city = guest.address?.city || 'Unknown';
        if (!acc[city]) {
          acc[city] = { city, count: 0, guests: [] };
        }
        acc[city].count++;
        acc[city].guests.push({
          name: `${guest.firstName} ${guest.lastName}`,
          address: guest.address
        });
        return acc;
      }, {} as Record<string, any>);

      return Object.values(locationGroups);
    } catch (error) {
      logger.error('Error getting guests by location:', error);
      throw error;
    }
  }
}

export const guestService = new GuestService();