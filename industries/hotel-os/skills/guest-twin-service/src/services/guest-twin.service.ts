import { v4 as uuidv4 } from 'uuid';
import { GuestTwin } from '../models/guest-twin.model';
import {
  CreateGuestTwinRequest,
  CreateGuestTwinResponse,
  GetGuestTwinResponse,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
  defaultLoyalty,
  defaultPreferences,
  defaultSentiment,
  defaultLifetimeValue
} from '../schemas/guest-twin.schema';
import { logger } from '../utils/logger';
import { messageBroker } from '../utils/message-broker';
import { guestMemoryClient } from '../utils/guest-memory-client';
import { brandPulseClient } from '../utils/brand-pulse-client';

export class GuestTwinService {
  /**
   * Create a new Guest Twin
   */
  async createGuestTwin(request: CreateGuestTwinRequest): Promise<CreateGuestTwinResponse> {
    const twinId = `twin.hotel.guest.${request.guestId}`;
    const twinOsEntityId = twinId;

    logger.info('Creating Guest Twin', { guestId: request.guestId, twinId });

    // Check if twin already exists
    const existingTwin = await GuestTwin.findByGuestId(request.guestId);
    if (existingTwin) {
      throw new Error(`Guest Twin already exists for guestId: ${request.guestId}`);
    }

    // Create the guest twin document
    const guestTwin = new GuestTwin({
      twinId,
      guestId: request.guestId,
      profile: request.profile,
      loyalty: {
        ...defaultLoyalty,
        ...request.loyalty
      },
      preferences: {
        ...defaultPreferences,
        ...request.preferences
      },
      stayPatterns: request.stayPatterns,
      sentiment: defaultSentiment,
      lifetimeValue: defaultLifetimeValue,
      stayHistory: [],
      propertyIds: request.propertyId ? [request.propertyId] : []
    });

    await guestTwin.save();

    // Publish event to TwinOS
    await messageBroker.publish('hotel.guest.created', {
      twinId,
      guestId: request.guestId,
      twinOsEntityId,
      profile: request.profile,
      timestamp: new Date().toISOString()
    });

    // Sync with Guest Memory
    await guestMemoryClient.syncGuest(request.guestId, {
      profile: request.profile,
      preferences: request.preferences
    });

    logger.info('Guest Twin created successfully', { twinId, guestId: request.guestId });

    return {
      twinId,
      guestId: request.guestId,
      twinOsEntityId,
      createdAt: guestTwin.createdAt.toISOString()
    };
  }

  /**
   * Get Guest Twin by ID
   */
  async getGuestTwin(guestId: string): Promise<GetGuestTwinResponse> {
    logger.info('Fetching Guest Twin', { guestId });

    const guestTwin = await GuestTwin.findByGuestId(guestId);
    if (!guestTwin) {
      throw new Error(`Guest Twin not found for guestId: ${guestId}`);
    }

    return guestTwin.toJSON() as GetGuestTwinResponse;
  }

  /**
   * Update Guest Twin preferences
   */
  async updatePreferences(
    guestId: string,
    request: UpdatePreferencesRequest
  ): Promise<UpdatePreferencesResponse> {
    logger.info('Updating Guest Twin preferences', { guestId });

    const guestTwin = await GuestTwin.findByGuestId(guestId);
    if (!guestTwin) {
      throw new Error(`Guest Twin not found for guestId: ${guestId}`);
    }

    // Merge preferences
    const updatedPreferences = {
      ...guestTwin.preferences,
      room: {
        ...guestTwin.preferences.room,
        ...request.preferences.room
      },
      dining: {
        ...guestTwin.preferences.dining,
        ...request.preferences.dining
      },
      amenities: {
        ...guestTwin.preferences.amenities,
        ...request.preferences.amenities
      },
      communication: {
        ...guestTwin.preferences.communication,
        ...request.preferences.communication
      }
    };

    guestTwin.preferences = updatedPreferences;
    await guestTwin.save();

    // Publish preference update event
    await messageBroker.publish('hotel.guest.preference.update', {
      twinId: guestTwin.twinId,
      guestId,
      preferences: updatedPreferences,
      timestamp: new Date().toISOString()
    });

    // Sync with Guest Memory
    await guestMemoryClient.updatePreferences(guestId, updatedPreferences);

    logger.info('Guest Twin preferences updated', { twinId: guestTwin.twinId, guestId });

    return {
      twinId: guestTwin.twinId,
      guestId,
      preferences: updatedPreferences,
      updatedAt: guestTwin.updatedAt.toISOString()
    };
  }

  /**
   * Update Guest Twin current stay
   */
  async updateCurrentStay(
    guestId: string,
    stay: {
      roomId: string;
      checkIn: string;
      checkOut: string;
      adults?: number;
      children?: number;
      rateCode?: string;
      specialRequests?: string[];
      occasion?: string | null;
    }
  ): Promise<void> {
    logger.info('Updating Guest Twin current stay', { guestId, roomId: stay.roomId });

    const guestTwin = await GuestTwin.findByGuestId(guestId);
    if (!guestTwin) {
      throw new Error(`Guest Twin not found for guestId: ${guestId}`);
    }

    guestTwin.currentStay = stay;
    await guestTwin.save();

    // Publish check-in event
    await messageBroker.publish('hotel.guest.checkin', {
      twinId: guestTwin.twinId,
      guestId,
      roomId: stay.roomId,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      timestamp: new Date().toISOString()
    });

    logger.info('Guest Twin current stay updated', { twinId: guestTwin.twinId, guestId });
  }

  /**
   * Update Guest Twin sentiment
   */
  async updateSentiment(
    guestId: string,
    sentiment: {
      currentScore: number;
      trend: 'improving' | 'stable' | 'declining';
      lastFeedbackDate?: string;
      keyTopics?: string[];
    }
  ): Promise<void> {
    logger.info('Updating Guest Twin sentiment', { guestId, score: sentiment.currentScore });

    const guestTwin = await GuestTwin.findByGuestId(guestId);
    if (!guestTwin) {
      throw new Error(`Guest Twin not found for guestId: ${guestId}`);
    }

    guestTwin.sentiment = {
      ...guestTwin.sentiment,
      ...sentiment
    };
    await guestTwin.save();

    // Publish sentiment change event
    await messageBroker.publish('hotel.guest.sentiment.change', {
      twinId: guestTwin.twinId,
      guestId,
      sentiment: guestTwin.sentiment,
      timestamp: new Date().toISOString()
    });

    // Sync with BrandPulse
    await brandPulseClient.updateSentiment(guestId, sentiment.currentScore);

    logger.info('Guest Twin sentiment updated', { twinId: guestTwin.twinId, guestId });
  }

  /**
   * Update Guest Twin loyalty information
   */
  async updateLoyalty(
    guestId: string,
    loyalty: {
      tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
      pointsBalance?: number;
      totalStays?: number;
      totalSpend?: number;
    }
  ): Promise<void> {
    logger.info('Updating Guest Twin loyalty', { guestId, tier: loyalty.tier });

    const guestTwin = await GuestTwin.findByGuestId(guestId);
    if (!guestTwin) {
      throw new Error(`Guest Twin not found for guestId: ${guestId}`);
    }

    guestTwin.loyalty = {
      ...guestTwin.loyalty,
      ...loyalty
    };
    await guestTwin.save();

    // Publish loyalty update event
    await messageBroker.publish('hotel.guest.loyalty.update', {
      twinId: guestTwin.twinId,
      guestId,
      loyalty: guestTwin.loyalty,
      timestamp: new Date().toISOString()
    });

    logger.info('Guest Twin loyalty updated', { twinId: guestTwin.twinId, guestId });
  }

  /**
   * Add stay to history
   */
  async addStayToHistory(
    guestId: string,
    stay: {
      stayId: string;
      propertyId: string;
      checkIn: string;
      checkOut: string;
      roomId: string;
    }
  ): Promise<void> {
    logger.info('Adding stay to Guest Twin history', { guestId, stayId: stay.stayId });

    const guestTwin = await GuestTwin.findByGuestId(guestId);
    if (!guestTwin) {
      throw new Error(`Guest Twin not found for guestId: ${guestId}`);
    }

    if (!guestTwin.stayHistory) {
      guestTwin.stayHistory = [];
    }

    guestTwin.stayHistory.push(stay);
    await guestTwin.save();

    logger.info('Stay added to history', { twinId: guestTwin.twinId, guestId, stayId: stay.stayId });
  }

  /**
   * Get upsell eligibility
   */
  async getUpsellEligibility(guestId: string): Promise<{
    eligible: boolean;
    currentTier: string;
    upgradeRecommendation?: string;
    probability?: number;
  }> {
    const guestTwin = await GuestTwin.findByGuestId(guestId);
    if (!guestTwin) {
      throw new Error(`Guest Twin not found for guestId: ${guestId}`);
    }

    const { tier, totalStays, totalSpend } = guestTwin.loyalty;
    const lifetimeValue = guestTwin.lifetimeValue;

    // Simple eligibility logic
    let eligible = false;
    let upgradeRecommendation: string | undefined;
    let probability: number | undefined;

    if (tier === 'bronze' && totalStays && totalStays >= 3) {
      eligible = true;
      upgradeRecommendation = 'silver';
      probability = 0.75;
    } else if (tier === 'silver' && totalStays && totalStays >= 5) {
      eligible = true;
      upgradeRecommendation = 'gold';
      probability = 0.65;
    } else if (tier === 'gold' && totalStays && totalStays >= 8) {
      eligible = true;
      upgradeRecommendation = 'platinum';
      probability = 0.55;
    }

    return {
      eligible,
      currentTier: tier,
      upgradeRecommendation,
      probability
    };
  }

  /**
   * Delete Guest Twin
   */
  async deleteGuestTwin(guestId: string): Promise<void> {
    logger.info('Deleting Guest Twin', { guestId });

    const result = await GuestTwin.deleteOne({ guestId });
    if (result.deletedCount === 0) {
      throw new Error(`Guest Twin not found for guestId: ${guestId}`);
    }

    // Publish deletion event
    await messageBroker.publish('hotel.guest.deleted', {
      guestId,
      timestamp: new Date().toISOString()
    });

    logger.info('Guest Twin deleted', { guestId });
  }
}

// Export singleton instance
export const guestTwinService = new GuestTwinService();
