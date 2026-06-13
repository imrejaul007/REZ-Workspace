/**
 * AI Concierge Agent - Guest Twin Service
 * Manages guest digital twin operations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GuestTwin,
  GuestPreferences,
  ApiResponse,
  CurrentStay,
} from '../types';
import {
  CreateGuestTwinSchema,
  UpdateGuestPreferencesSchema,
  CreateGuestTwinInput,
  UpdateGuestPreferencesInput,
} from '../schemas';
import { ValidationError, TwinNotFoundError, TwinAlreadyExistsError } from '../utils/errors';
import { logger } from '../utils/logger';
import { GuestMemoryClient } from './guest-memory.client';

export class GuestTwinService {
  private twins: Map<string, GuestTwin> = new Map();
  private guestMemoryClient: GuestMemoryClient;

  constructor(guestMemoryUrl: string) {
    this.guestMemoryClient = new GuestMemoryClient(guestMemoryUrl);
  }

  /**
   * Create a new Guest Twin
   */
  async createGuestTwin(input: CreateGuestTwinInput): Promise<ApiResponse<GuestTwin>> {
    const twinId = `twin.hotel.guest.${input.guest_id}`;

    // Check if twin already exists
    if (this.twins.has(twinId)) {
      throw new TwinAlreadyExistsError('Guest', twinId);
    }

    // Validate input
    const validatedInput = CreateGuestTwinSchema.parse(input);

    const now = new Date().toISOString();
    const guestTwin: GuestTwin = {
      twin_id: twinId,
      guest_id: validatedInput.guest_id,
      profile: validatedInput.profile,
      loyalty: validatedInput.loyalty || {
        tier: 'bronze',
        points_balance: 0,
        member_since: now,
        total_stays: 0,
        total_spend: 0,
      },
      preferences: validatedInput.preferences || this.getDefaultPreferences(),
      stay_patterns: validatedInput.stay_patterns || {
        typical_check_in_time: '15:00',
        typical_check_out_time: '11:00',
        weekend_vs_weekday: 'mixed',
        seasonal_patterns: [],
        booking_lead_time: 7,
      },
      sentiment: validatedInput.sentiment || {
        current_score: 75,
        trend: 'stable',
        last_feedback_date: now,
        key_topics: [],
      },
      lifetime_value: validatedInput.lifetime_value || {
        clv: 0,
        potential_clv: 0,
        churn_risk: 'low',
        recommendation_eligibility: true,
      },
      current_stay: validatedInput.current_stay,
      created_at: now,
      updated_at: now,
      version: 1,
    };

    this.twins.set(twinId, guestTwin);

    // Sync with Guest Memory
    try {
      await this.guestMemoryClient.syncGuestTwin(guestTwin);
    } catch (error) {
      logger.warn('Failed to sync with Guest Memory', { twinId, error: (error as Error).message });
    }

    logger.info('Guest Twin created', { twinId, guestId: input.guest_id });

    return {
      success: true,
      data: guestTwin,
      meta: {
        timestamp: now,
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Get a Guest Twin by ID
   */
  async getGuestTwin(guestId: string): Promise<ApiResponse<GuestTwin>> {
    const twinId = `twin.hotel.guest.${guestId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Guest', twinId);
    }

    return {
      success: true,
      data: twin,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Update guest preferences
   */
  async updatePreferences(
    guestId: string,
    input: UpdateGuestPreferencesInput
  ): Promise<ApiResponse<GuestTwin>> {
    const twinId = `twin.hotel.guest.${guestId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Guest', twinId);
    }

    // Validate input
    const validatedInput = UpdateGuestPreferencesSchema.parse(input);

    // Merge preferences
    const updatedPreferences: GuestPreferences = {
      room: {
        ...twin.preferences.room,
        ...validatedInput.room,
      },
      dining: {
        ...twin.preferences.dining,
        ...validatedInput.dining,
      },
      amenities: {
        ...twin.preferences.amenities,
        ...validatedInput.amenities,
      },
      communication: {
        ...twin.preferences.communication,
        ...validatedInput.communication,
      },
    };

    twin.preferences = updatedPreferences;
    twin.updated_at = new Date().toISOString();
    twin.version += 1;

    // Sync with Guest Memory
    try {
      await this.guestMemoryClient.syncPreferences(guestId, updatedPreferences);
    } catch (error) {
      logger.warn('Failed to sync preferences with Guest Memory', { twinId, error: (error as Error).message });
    }

    logger.info('Guest preferences updated', { twinId });

    return {
      success: true,
      data: twin,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Update current stay information
   */
  async updateCurrentStay(
    guestId: string,
    stay: CurrentStay
  ): Promise<ApiResponse<GuestTwin>> {
    const twinId = `twin.hotel.guest.${guestId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Guest', twinId);
    }

    twin.current_stay = stay;
    twin.updated_at = new Date().toISOString();
    twin.version += 1;

    logger.info('Guest current stay updated', { twinId, roomId: stay.room_id });

    return {
      success: true,
      data: twin,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Update sentiment score
   */
  async updateSentiment(
    guestId: string,
    score: number,
    trend: 'improving' | 'stable' | 'declining',
    keyTopics: string[] = []
  ): Promise<ApiResponse<GuestTwin>> {
    const twinId = `twin.hotel.guest.${guestId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Guest', twinId);
    }

    twin.sentiment = {
      current_score: Math.max(0, Math.min(100, score)),
      trend,
      last_feedback_date: new Date().toISOString(),
      key_topics: keyTopics,
    };
    twin.updated_at = new Date().toISOString();
    twin.version += 1;

    // Sync with BrandPulse
    try {
      await this.guestMemoryClient.syncSentiment(guestId, twin.sentiment);
    } catch (error) {
      logger.warn('Failed to sync sentiment', { twinId, error: (error as Error).message });
    }

    logger.info('Guest sentiment updated', { twinId, score, trend });

    return {
      success: true,
      data: twin,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Delete a Guest Twin
   */
  async deleteGuestTwin(guestId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const twinId = `twin.hotel.guest.${guestId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Guest', twinId);
    }

    this.twins.delete(twinId);

    logger.info('Guest Twin deleted', { twinId });

    return {
      success: true,
      data: { deleted: true },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Get all Guest Twins
   */
  async getAllGuestTwins(): Promise<ApiResponse<GuestTwin[]>> {
    const twins = Array.from(this.twins.values());

    return {
      success: true,
      data: twins,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Get default preferences for a new guest
   */
  private getDefaultPreferences(): GuestPreferences {
    return {
      room: {
        floor_preference: undefined,
        view_preference: undefined,
        bed_configuration: undefined,
        temperature_setting: { default: 72, range: { min: 65, max: 80 } },
        lighting_preference: 'standard',
        noise_tolerance: 5,
      },
      dining: {
        dietary_restrictions: [],
        allergies: [],
        favorite_items: [],
        beverage_preferences: [],
      },
      amenities: {
        spa_interests: [],
        fitness_habits: false,
        pool_usage: false,
        business_amenities: [],
      },
      communication: {
        preferred_channel: 'app_push',
        opt_ins: [],
      },
    };
  }
}
