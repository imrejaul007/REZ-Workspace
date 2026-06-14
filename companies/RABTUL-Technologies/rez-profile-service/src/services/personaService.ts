/**
 * Persona Service
 * Handles multi-persona operations for REZ Profile Service
 */

import { MultiPersonaProfile } from '../models/multiPersonaProfile';
import {
  PersonaType,
  PersonaActivationRequest,
  PersonaVerificationRequirements,
  createDefaultPersonaMetadata,
} from '../types/persona';
import { cache } from './cache';

const PERSONA_CACHE_TTL = 300; // 5 minutes

export class PersonaService {
  /**
   * Get all personas for a user
   */
  async getPersonas(userId: string) {
    const cacheKey = `personas:${userId}`;
    const cached = await cache.get<{
      primaryPersona: PersonaType;
      secondaryPersonas: PersonaType[];
      activePersona: PersonaType;
      personas: Record<string, unknown>;
    }>(cacheKey);

    if (cached) return cached;

    const profile = await MultiPersonaProfile.findOne({ userId }).lean();

    if (!profile) {
      return null;
    }

    const result = {
      primaryPersona: profile.primaryPersona,
      secondaryPersonas: profile.secondaryPersonas,
      activePersona: profile.activePersona,
      personas: Object.fromEntries(profile.personas || new Map()),
    };

    await cache.set(cacheKey, result, PERSONA_CACHE_TTL);
    return result;
  }

  /**
   * Get full profile with persona extensions
   */
  async getProfileWithPersona(userId: string) {
    const cacheKey = `profile-persona:${userId}`;
    const cached = await cache.get<unknown>(cacheKey);

    if (cached) return cached;

    const profile = await MultiPersonaProfile.findOne({ userId }).lean();

    if (!profile) {
      return null;
    }

    await cache.set(cacheKey, profile, PERSONA_CACHE_TTL);
    return profile;
  }

  /**
   * Activate a secondary persona
   */
  async activatePersona(userId: string, request: PersonaActivationRequest): Promise<{
    success: boolean;
    persona?: PersonaType;
    error?: string;
    verificationRequired?: string[];
  }> {
    const { persona, verificationData } = request;

    // Validate persona type
    if (!['student', 'employee', 'creator', 'business', 'freelancer', 'premium', 'normal'].includes(persona)) {
      return { success: false, error: 'Invalid persona type' };
    }

    // Find or create profile
    let profile = await MultiPersonaProfile.findOne({ userId });

    if (!profile) {
      // Create new profile with persona
      profile = new MultiPersonaProfile({
        userId,
        primaryPersona: persona,
        secondaryPersonas: [],
        activePersona: persona,
        personas: {
          [persona]: createDefaultPersonaMetadata(persona),
        },
      });

      if (verificationData) {
        profile.personas.get(persona)!.verificationData = verificationData;
      }

      await profile.save();
      await this.invalidateCache(userId);

      return { success: true, persona };
    }

    // Check if persona already exists
    if (profile.primaryPersona === persona || profile.secondaryPersonas.includes(persona)) {
      // Just switch to it
      profile.activatePersona(persona);
      await profile.save();
      await this.invalidateCache(userId);

      return { success: true, persona };
    }

    // Check max secondary personas (3)
    if (profile.secondaryPersonas.length >= 3) {
      return {
        success: false,
        error: 'Maximum 3 secondary personas allowed. Deactivate one first.',
      };
    }

    // Check verification requirements
    const requirements = PersonaVerificationRequirements[persona];
    const missingVerification: string[] = [];

    if (requirements.required.length > 0) {
      for (const req of requirements.required) {
        if (!verificationData || !verificationData[req as keyof typeof verificationData]) {
          missingVerification.push(req);
        }
      }
    }

    // Activate persona
    profile.activatePersona(persona, verificationData?.eduEmail ? 'insight-campus' : undefined);

    // Add to secondary personas if not primary
    if (profile.primaryPersona !== persona) {
      profile.secondaryPersonas.push(persona);
    }

    // Update verification data
    if (verificationData && profile.personas.get(persona)) {
      profile.personas.get(persona)!.verificationData = verificationData;

      // Auto-verify if all requirements met
      if (missingVerification.length === 0) {
        profile.personas.get(persona)!.verified = true;
      }
    }

    await profile.save();
    await this.invalidateCache(userId);

    if (missingVerification.length > 0) {
      return {
        success: true,
        persona,
        verificationRequired: missingVerification,
      };
    }

    return { success: true, persona };
  }

  /**
   * Deactivate a persona (secondary only, primary cannot be deactivated)
   */
  async deactivatePersona(
    userId: string,
    persona: PersonaType
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const profile = await MultiPersonaProfile.findOne({ userId });

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    // Cannot deactivate primary persona
    if (profile.primaryPersona === persona) {
      return {
        success: false,
        error: 'Cannot deactivate primary persona. Switch to another persona first.',
      };
    }

    // Remove from secondary personas
    profile.secondaryPersonas = profile.secondaryPersonas.filter((p) => p !== persona);
    profile.deactivatePersona(persona);

    await profile.save();
    await this.invalidateCache(userId);

    return { success: true };
  }

  /**
   * Switch active persona
   */
  async switchPersona(
    userId: string,
    newPersona: PersonaType
  ): Promise<{
    success: boolean;
    activePersona?: PersonaType;
    error?: string;
  }> {
    const profile = await MultiPersonaProfile.findOne({ userId });

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    // Check if persona exists
    if (
      profile.primaryPersona !== newPersona &&
      !profile.secondaryPersonas.includes(newPersona)
    ) {
      return {
        success: false,
        error: 'Persona not activated. Please activate it first.',
      };
    }

    profile.activatePersona(newPersona);
    await profile.save();
    await this.invalidateCache(userId);

    return { success: true, activePersona: newPersona };
  }

  /**
   * Update persona extension data
   */
  async updatePersonaExtension(
    userId: string,
    persona: PersonaType,
    extensionData: unknown
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const profile = await MultiPersonaProfile.findOne({ userId });

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    // Check if persona exists
    const hasPersona =
      profile.primaryPersona === persona || profile.secondaryPersonas.includes(persona);

    if (!hasPersona) {
      return { success: false, error: 'Persona not activated' };
    }

    // Update extension based on persona type
    const extensionMap: Record<PersonaType, string> = {
      student: 'studentExtension',
      employee: 'employeeExtension',
      creator: 'creatorExtension',
      business: 'businessExtension',
      freelancer: 'freelancerExtension',
      premium: 'premiumExtension',
      normal: 'normal',
    };

    const extensionField = extensionMap[persona];
    if (extensionField && extensionField !== 'normal') {
      profile[extensionField] = {
        ...profile[extensionField as keyof typeof profile],
        ...extensionData,
      };
    }

    await profile.save();
    await this.invalidateCache(userId);

    return { success: true };
  }

  /**
   * Verify persona (update verification status)
   */
  async verifyPersona(
    userId: string,
    persona: PersonaType,
    verified: boolean
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const profile = await MultiPersonaProfile.findOne({ userId });

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    if (profile.personas.get(persona)) {
      profile.personas.get(persona)!.verified = verified;
      await profile.save();
      await this.invalidateCache(userId);
    }

    return { success: true };
  }

  /**
   * Get users by persona type (for talent matching, etc.)
   */
  async getUsersByPersona(persona: PersonaType, options?: {
    verifiedOnly?: boolean;
    limit?: number;
    skip?: number;
  }): Promise<{
    users: string[];
    total: number;
  }> {
    const query: unknown = {
      $or: [
        { primaryPersona: persona },
        { secondaryPersonas: persona },
      ],
    };

    if (options?.verifiedOnly) {
      [`personas.${persona}.verified`]: true;
    }

    const total = await MultiPersonaProfile.countDocuments(query);

    const users = await MultiPersonaProfile.find(query)
      .select('userId')
      .limit(options?.limit || 100)
      .skip(options?.skip || 0)
      .lean();

    return {
      users: users.map((u) => u.userId),
      total,
    };
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache(userId: string): Promise<void> {
    await cache.del(`personas:${userId}`);
    await cache.del(`profile-persona:${userId}`);
    await cache.del(`profile:${userId}`);
  }
}

// Export singleton instance
export const personaService = new PersonaService();
