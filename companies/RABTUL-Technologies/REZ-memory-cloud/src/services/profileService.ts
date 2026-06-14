/**
 * REZ Memory Cloud - Profile Service
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Profile,
  UpdatePreferenceInput,
  AddFactInput,
  UpdateProfileInput,
  IProfile,
} from '../models/Profile.js';
import { logger } from '../utils/logger.js';

export class ProfileService {
  /**
   * Get or create a profile for a user
   */
  async getOrCreate(userId: string): Promise<IProfile> {
    let profile = await Profile.findOne({ userId });

    if (!profile) {
      const profileId = `prof_${uuidv4()}`;
      profile = new Profile({
        profileId,
        userId,
        preferences: [],
        behavioralPatterns: [],
        facts: [],
        interests: [],
        dislikes: [],
        tags: [],
        segments: [],
        memoryCount: 0,
      });
      await profile.save();
      logger.info({ msg: 'Profile created', profileId, userId });
    }

    return profile;
  }

  /**
   * Get a profile by user ID
   */
  async get(userId: string): Promise<IProfile | null> {
    return Profile.findOne({ userId });
  }

  /**
   * Update a profile
   */
  async update(userId: string, input: UpdateProfileInput): Promise<IProfile | null> {
    const updateData: Record<string, unknown> = {};

    if (input.interests !== undefined) updateData.interests = input.interests;
    if (input.dislikes !== undefined) updateData.dislikes = input.dislikes;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.segments !== undefined) updateData.segments = input.segments;

    const profile = await Profile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    );

    if (profile) {
      logger.info({ msg: 'Profile updated', userId });
    }

    return profile;
  }

  /**
   * Add or update a preference
   */
  async setPreference(userId: string, input: UpdatePreferenceInput): Promise<IProfile | null> {
    const profile = await this.getOrCreate(userId);

    const existingIndex = profile.preferences.findIndex((p) => p.key === input.key);

    const preference = {
      key: input.key,
      value: input.value,
      confidence: input.confidence ?? 1.0,
      source: input.source,
      updatedAt: new Date(),
    };

    if (existingIndex >= 0) {
      // Merge with existing, use higher confidence
      const existing = profile.preferences[existingIndex];
      if (input.confidence !== undefined && input.confidence > (existing.confidence || 0)) {
        profile.preferences[existingIndex] = preference;
      }
    } else {
      profile.preferences.push(preference);
    }

    await profile.save();
    logger.info({ msg: 'Preference set', userId, key: input.key });

    return profile;
  }

  /**
   * Get preferences by key prefix
   */
  async getPreferences(userId: string, keyPrefix?: string): Promise<Record<string, unknown>> {
    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return {};
    }

    const preferences: Record<string, unknown> = {};

    for (const pref of profile.preferences) {
      if (!keyPrefix || pref.key.startsWith(keyPrefix)) {
        preferences[pref.key] = pref.value;
      }
    }

    return preferences;
  }

  /**
   * Add a fact to the profile
   */
  async addFact(userId: string, input: AddFactInput): Promise<IProfile | null> {
    const profile = await this.getOrCreate(userId);

    // Add fact (avoiding duplicates)
    if (!profile.facts.includes(input.fact)) {
      profile.facts.push(input.fact);
    }

    await profile.save();
    logger.info({ msg: 'Fact added', userId, fact: input.fact.slice(0, 50) });

    return profile;
  }

  /**
   * Record a behavioral pattern
   */
  async recordPattern(userId: string, pattern: string, context?: string): Promise<void> {
    const profile = await this.getOrCreate(userId);

    const existing = profile.behavioralPatterns.find((p) => p.pattern === pattern);

    if (existing) {
      existing.frequency += 1;
      existing.lastSeen = new Date();
      if (context) existing.context = context;
    } else {
      profile.behavioralPatterns.push({
        pattern,
        frequency: 1,
        lastSeen: new Date(),
        context,
      });
    }

    await profile.save();
  }

  /**
   * Increment memory count
   */
  async incrementMemoryCount(userId: string): Promise<void> {
    await Profile.findOneAndUpdate(
      { userId },
      {
        $inc: { memoryCount: 1 },
        $set: { lastMemoryAt: new Date() },
      }
    );
  }

  /**
   * Get profiles by segment
   */
  async getBySegment(segment: string, limit = 100): Promise<IProfile[]> {
    return Profile.find({ segments: segment }).limit(limit);
  }

  /**
   * Get profiles by tag
   */
  async getByTag(tag: string, limit = 100): Promise<IProfile[]> {
    return Profile.find({ tags: tag }).limit(limit);
  }

  /**
   * Get top interests
   */
  async getTopInterests(userId: string, limit = 10): Promise<string[]> {
    const profile = await Profile.findOne({ userId });

    if (!profile || !profile.interests) {
      return [];
    }

    return profile.interests.slice(0, limit);
  }

  /**
   * Delete a profile
   */
  async delete(userId: string): Promise<boolean> {
    const result = await Profile.deleteOne({ userId });
    return result.deletedCount > 0;
  }
}

export const profileService = new ProfileService();
