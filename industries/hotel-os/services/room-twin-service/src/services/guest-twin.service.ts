import axios from 'axios';
import { GuestTwin, IGuestTwin, IGuestPreferences } from '../models/types';
import {
  CreateGuestTwinInput,
  UpdateGuestPreferencesInput
} from '../schemas';
import { logger } from '../utils/logger';

export class GuestTwinService {
  private readonly guestMemoryUrl: string;
  private readonly brandPulseUrl: string;

  constructor() {
    this.guestMemoryUrl = process.env.GUEST_MEMORY_URL || 'http://localhost:8447';
    this.brandPulseUrl = process.env.BRANDPULSE_URL || 'http://localhost:8451';
  }

  /**
   * Create a new guest twin
   */
  async createGuestTwin(input: CreateGuestTwinInput): Promise<IGuestTwin> {
    logger.info('Creating new guest twin', { guestId: input.guestId });

    // Check if guest already exists
    const existingGuest = await GuestTwin.findOne({ guestId: input.guestId });
    if (existingGuest) {
      throw new Error(`Guest with ID ${input.guestId} already exists`);
    }

    const guestTwin = new GuestTwin({
      guestId: input.guestId,
      profile: input.profile,
      loyalty: {
        tier: input.loyalty?.tier || 'bronze',
        points: input.loyalty?.points || 0,
        lifetimePoints: input.loyalty?.lifetimePoints || 0,
        memberSince: new Date()
      },
      preferences: {
        room: {
          temperature: input.preferences?.room?.temperature || 22,
          lighting: input.preferences?.room?.lighting || 50,
          pillowType: input.preferences?.room?.pillowType || 'standard',
          bedConfiguration: input.preferences?.room?.bedConfiguration || 'queen'
        },
        amenities: input.preferences?.amenities || [],
        dietary: input.preferences?.dietary || [],
        accessibility: input.preferences?.accessibility || [],
        language: input.preferences?.language || 'en',
        notifications: {
          email: input.preferences?.notifications?.email ?? true,
          sms: input.preferences?.notifications?.sms ?? true,
          push: input.preferences?.notifications?.push ?? true
        }
      },
      stayHistory: [],
      sentiment: {
        overall: 0,
        lastUpdated: new Date(),
        sources: []
      }
    });

    await guestTwin.save();

    // Sync with Guest Memory service
    await this.syncToGuestMemory(guestTwin);

    logger.info('Guest twin created successfully', { guestId: input.guestId });
    return guestTwin;
  }

  /**
   * Get guest twin by ID
   */
  async getGuestTwin(guestId: string): Promise<IGuestTwin | null> {
    logger.debug('Fetching guest twin', { guestId });
    return GuestTwin.findOne({ guestId });
  }

  /**
   * Get guest twin with full profile from Guest Memory
   */
  async getGuestTwinWithMemory(guestId: string): Promise<{
    guestTwin: IGuestTwin | null;
    memory: Record<string, unknown> | null;
  }> {
    const guestTwin = await this.getGuestTwin(guestId);

    let memory = null;
    try {
      const response = await axios.get(`${this.guestMemoryUrl}/api/memory/guest/${guestId}`, {
        timeout: 5000,
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
        }
      });
      memory = response.data;
    } catch (error) {
      logger.warn('Failed to fetch guest memory', { guestId, error });
    }

    return { guestTwin, memory };
  }

  /**
   * Update guest preferences
   */
  async updateGuestPreferences(
    guestId: string,
    input: UpdateGuestPreferencesInput
  ): Promise<IGuestTwin | null> {
    logger.info('Updating guest preferences', { guestId });

    const updateData: Record<string, unknown> = {};

    if (input.preferences.room !== undefined) {
      if (input.preferences.room.temperature !== undefined) {
        updateData['preferences.room.temperature'] = input.preferences.room.temperature;
      }
      if (input.preferences.room.lighting !== undefined) {
        updateData['preferences.room.lighting'] = input.preferences.room.lighting;
      }
      if (input.preferences.room.pillowType !== undefined) {
        updateData['preferences.room.pillowType'] = input.preferences.room.pillowType;
      }
      if (input.preferences.room.bedConfiguration !== undefined) {
        updateData['preferences.room.bedConfiguration'] = input.preferences.room.bedConfiguration;
      }
    }

    if (input.preferences.amenities !== undefined) {
      updateData['preferences.amenities'] = input.preferences.amenities;
    }

    if (input.preferences.dietary !== undefined) {
      updateData['preferences.dietary'] = input.preferences.dietary;
    }

    if (input.preferences.accessibility !== undefined) {
      updateData['preferences.accessibility'] = input.preferences.accessibility;
    }

    if (input.preferences.language !== undefined) {
      updateData['preferences.language'] = input.preferences.language;
    }

    if (input.preferences.notifications !== undefined) {
      Object.entries(input.preferences.notifications).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[`preferences.notifications.${key}`] = value;
        }
      });
    }

    const guest = await GuestTwin.findOneAndUpdate(
      { guestId },
      { $set: updateData },
      { new: true }
    );

    if (guest) {
      // Sync updated preferences to Guest Memory
      await this.syncToGuestMemory(guest);
    }

    return guest;
  }

  /**
   * Update guest loyalty tier
   */
  async updateLoyaltyTier(
    guestId: string,
    tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond',
    points?: number
  ): Promise<IGuestTwin | null> {
    const updateData: Record<string, unknown> = {
      'loyalty.tier': tier
    };

    if (points !== undefined) {
      updateData['loyalty.points'] = points;
    }

    return GuestTwin.findOneAndUpdate(
      { guestId },
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Add stay to guest history
   */
  async addStayHistory(
    guestId: string,
    stay: {
      reservationId: string;
      propertyId: string;
      roomId: string;
      checkIn: Date;
      checkOut: Date;
      totalSpend?: number;
    }
  ): Promise<IGuestTwin | null> {
    const updateData = {
      $push: {
        stayHistory: {
          reservationId: stay.reservationId,
          propertyId: stay.propertyId,
          roomId: stay.roomId,
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          totalSpend: stay.totalSpend || 0
        }
      },
      $inc: {
        'loyalty.lifetimePoints': Math.floor((stay.totalSpend || 0) * 0.1) // 10 points per dollar
      }
    };

    return GuestTwin.findOneAndUpdate(
      { guestId },
      updateData,
      { new: true }
    );
  }

  /**
   * Add feedback to stay history
   */
  async addStayFeedback(
    guestId: string,
    reservationId: string,
    feedback: {
      rating: number;
      comment?: string;
    }
  ): Promise<IGuestTwin | null> {
    const guest = await GuestTwin.findOne({ guestId });
    if (!guest) return null;

    const stayIndex = guest.stayHistory.findIndex(s => s.reservationId === reservationId);
    if (stayIndex === -1) return null;

    guest.stayHistory[stayIndex].feedback = feedback;
    await guest.save();

    // Update sentiment from feedback
    await this.updateSentiment(guestId, feedback.rating, 'feedback');

    return guest;
  }

  /**
   * Update guest sentiment score
   */
  async updateSentiment(
    guestId: string,
    score: number,
    source: string
  ): Promise<IGuestTwin | null> {
    const guest = await GuestTwin.findOne({ guestId });
    if (!guest) return null;

    // Calculate weighted average sentiment
    const weights = { feedback: 0.6, brandpulse: 0.4 };
    const currentSentiment = guest.sentiment.overall;

    let newSentiment: number;
    if (guest.sentiment.sources.length === 0) {
      newSentiment = score;
    } else if (guest.sentiment.sources.includes(source)) {
      // Update existing source weight
      newSentiment = currentSentiment * 0.5 + score * 0.5;
    } else {
      // Add new source
      newSentiment = currentSentiment * 0.7 + score * 0.3;
    }

    const sources = guest.sentiment.sources.includes(source)
      ? guest.sentiment.sources
      : [...guest.sentiment.sources, source];

    return GuestTwin.findOneAndUpdate(
      { guestId },
      {
        $set: {
          'sentiment.overall': Math.round(newSentiment * 10) / 10,
          'sentiment.lastUpdated': new Date(),
          'sentiment.sources': sources
        }
      },
      { new: true }
    );
  }

  /**
   * Get guest sentiment from BrandPulse
   */
  async fetchBrandPulseSentiment(guestId: string, email: string): Promise<number | null> {
    try {
      const response = await axios.get(`${this.brandPulseUrl}/api/sentiment/guest`, {
        params: { guestId, email },
        timeout: 5000,
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
        }
      });

      if (response.data?.sentiment) {
        await this.updateSentiment(guestId, response.data.sentiment, 'brandpulse');
        return response.data.sentiment;
      }
    } catch (error) {
      logger.warn('Failed to fetch BrandPulse sentiment', { guestId, error });
    }
    return null;
  }

  /**
   * Get guest preferences for room setup
   */
  async getRoomPreferences(guestId: string): Promise<{
    temperature: number;
    lighting: number;
    amenities: string[];
  } | null> {
    const guest = await GuestTwin.findOne({ guestId }).select(
      'preferences.room.temperature preferences.room.lighting preferences.amenities'
    );

    if (!guest) return null;

    return {
      temperature: guest.preferences.room.temperature,
      lighting: guest.preferences.room.lighting,
      amenities: guest.preferences.amenities
    };
  }

  /**
   * Get guest loyalty info
   */
  async getGuestLoyalty(guestId: string): Promise<{
    tier: string;
    points: number;
    lifetimePoints: number;
    memberSince: Date;
  } | null> {
    const guest = await GuestTwin.findOne({ guestId }).select(
      'loyalty.tier loyalty.points loyalty.lifetimePoints loyalty.memberSince'
    );

    if (!guest) return null;

    return {
      tier: guest.loyalty.tier,
      points: guest.loyalty.points,
      lifetimePoints: guest.loyalty.lifetimePoints,
      memberSince: guest.loyalty.memberSince
    };
  }

  /**
   * Sync guest data to Guest Memory service
   */
  private async syncToGuestMemory(guest: IGuestTwin): Promise<void> {
    try {
      await axios.post(
        `${this.guestMemoryUrl}/api/memory/sync`,
        {
          guestId: guest.guestId,
          profile: guest.profile,
          preferences: guest.preferences,
          loyalty: guest.loyalty,
          sentiment: guest.sentiment
        },
        {
          timeout: 5000,
          headers: {
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
          }
        }
      );
      logger.debug('Guest synced to Guest Memory', { guestId: guest.guestId });
    } catch (error) {
      logger.warn('Failed to sync guest to Guest Memory', {
        guestId: guest.guestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get top guests by loyalty points
   */
  async getTopLoyaltyGuests(limit: number = 10): Promise<IGuestTwin[]> {
    return GuestTwin.find()
      .sort({ 'loyalty.lifetimePoints': -1 })
      .limit(limit);
  }

  /**
   * Get guests by sentiment score
   */
  async getGuestsBySentiment(
    minScore: number,
    maxScore: number
  ): Promise<IGuestTwin[]> {
    return GuestTwin.find({
      'sentiment.overall': { $gte: minScore, $lte: maxScore }
    }).sort({ 'sentiment.overall': -1 });
  }

  /**
   * Delete guest twin
   */
  async deleteGuestTwin(guestId: string): Promise<boolean> {
    const result = await GuestTwin.deleteOne({ guestId });
    return result.deletedCount > 0;
  }
}

export const guestTwinService = new GuestTwinService();
