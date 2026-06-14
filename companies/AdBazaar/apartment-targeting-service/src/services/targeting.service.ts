import { v4 as uuidv4 } from 'uuid';
import { TargetingConfigModel, ITargetingConfigDocument } from '../models/index.js';
import { apartmentService } from './apartment.service.js';
import { redisService } from './redis.service.js';
import type {
  CreateTargetingConfigInput,
  TargetingConfig,
  Apartment,
  BuzzLocalIntegrationConfig,
} from '../types/index.js';
import axios from 'axios';
import { config } from '../config/index.js';

export class TargetingService {
  private buzzLocalConfig: BuzzLocalIntegrationConfig = {
    enabled: false,
    buzzLocalUrl: '',
    syncInterval: 60,
  };

  // Create targeting configuration for an apartment
  async createConfig(
    apartmentId: string,
    input: CreateTargetingConfigInput
  ): Promise<TargetingConfig | null> {
    // Verify apartment exists
    const apartment = await apartmentService.getById(apartmentId);
    if (!apartment) return null;

    // Check if config already exists
    const existing = await TargetingConfigModel.findOne({ apartmentId });
    if (existing) {
      // Update existing config
      Object.assign(existing, input);
      await existing.save();
      const doc = existing.toJSON() as unknown as TargetingConfig;
      await this.invalidateTargetingCache(apartmentId);
      return doc;
    }

    // Create new config
    const targetingId = `TGT-${uuidv4().substring(0, 8).toUpperCase()}`;
    const targetingConfig = new TargetingConfigModel({
      targetingId,
      apartmentId,
      ...input,
    });

    await targetingConfig.save();

    // Update apartment targeting enabled status
    if (input.enabled !== undefined) {
      await apartmentService.update(apartmentId, {
        targeting: { enabled: input.enabled },
      });
    }

    const doc = targetingConfig.toJSON() as unknown as TargetingConfig;
    await this.invalidateTargetingCache(apartmentId);

    return doc;
  }

  // Get targeting config for an apartment
  async getConfig(apartmentId: string): Promise<TargetingConfig | null> {
    const cacheKey = `targeting:${apartmentId}`;
    const cached = await redisService.get(cacheKey);
    if (cached) return cached as TargetingConfig;

    const config = await TargetingConfigModel.findOne({ apartmentId });
    if (!config) return null;

    const doc = config.toJSON() as unknown as TargetingConfig;
    await redisService.set(cacheKey, doc, 1800); // 30 min TTL

    return doc;
  }

  // Get all targeting configs
  async getAllConfigs(limit: number = 100, offset: number = 0): Promise<TargetingConfig[]> {
    const configs = await TargetingConfigModel.find()
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
    return configs as unknown as TargetingConfig[];
  }

  // Update targeting config
  async updateConfig(
    apartmentId: string,
    input: Partial<CreateTargetingConfigInput>
  ): Promise<TargetingConfig | null> {
    const config = await TargetingConfigModel.findOne({ apartmentId });
    if (!config) return null;

    Object.assign(config, input);
    await config.save();

    const doc = config.toJSON() as unknown as TargetingConfig;
    await this.invalidateTargetingCache(apartmentId);

    // Update apartment targeting if enabled changed
    if (input.enabled !== undefined) {
      await apartmentService.update(apartmentId, {
        targeting: { enabled: input.enabled },
      });
    }

    return doc;
  }

  // Delete targeting config
  async deleteConfig(apartmentId: string): Promise<boolean> {
    const result = await TargetingConfigModel.deleteOne({ apartmentId });
    if (result.deletedCount > 0) {
      await this.invalidateTargetingCache(apartmentId);
      return true;
    }
    return false;
  }

  // Check if user/target matches targeting criteria
  async isTargetMatch(
    apartmentId: string,
    criteria: {
      age?: number;
      income?: string;
      interests?: string[];
    }
  ): Promise<boolean> {
    const targeting = await this.getConfig(apartmentId);
    if (!targeting || !targeting.enabled) return false;

    // Check age range
    if (targeting.minAge !== undefined && criteria.age !== undefined) {
      if (criteria.age < targeting.minAge) return false;
    }
    if (targeting.maxAge !== undefined && criteria.age !== undefined) {
      if (criteria.age > targeting.maxAge) return false;
    }

    // Check income brackets
    if (
      targeting.incomeBrackets &&
      targeting.incomeBrackets.length > 0 &&
      criteria.income
    ) {
      if (!targeting.incomeBrackets.includes(criteria.income)) return false;
    }

    // Check interests (at least one match)
    if (
      targeting.interests &&
      targeting.interests.length > 0 &&
      criteria.interests &&
      criteria.interests.length > 0
    ) {
      const hasMatch = targeting.interests.some((interest) =>
        criteria.interests!.includes(interest)
      );
      if (!hasMatch) return false;
    }

    return true;
  }

  // Get estimated reach for a targeting config
  async getEstimatedReach(apartmentId: string): Promise<{
    households: number;
    devices: number;
    residents: number;
  } | null> {
    const apartment = await apartmentService.getById(apartmentId);
    if (!apartment) return null;

    const targeting = await this.getConfig(apartmentId);

    // Base calculations
    const households = apartment.demographics.occupiedFlats;
    const devices = households * 2; // ~2 devices per household
    let residents = apartment.demographics.estimatedResidents;

    // Apply targeting filters
    if (targeting?.targetFamilies) {
      residents = Math.min(residents, targeting.targetFamilies * apartment.demographics.avgFamilySize);
    }
    if (targeting?.targetDevices) {
      const deviceReach = Math.min(devices, targeting.targetDevices);
      return {
        households: Math.round((deviceReach / devices) * households),
        devices: deviceReach,
        residents: Math.round((deviceReach / devices) * residents),
      };
    }

    return { households, devices, residents };
  }

  // Initialize BuzzLocal integration
  async initBuzzLocalIntegration(): Promise<void> {
    this.buzzLocalConfig = {
      enabled: config.buzzLocal.syncEnabled,
      buzzLocalUrl: config.buzzLocal.url,
      syncInterval: config.buzzLocal.syncInterval,
    };
  }

  // Sync apartments from BuzzLocal
  async syncFromBuzzLocal(): Promise<{ synced: number; errors: number }> {
    if (!this.buzzLocalConfig.enabled) {
      return { synced: 0, errors: 0 };
    }

    let synced = 0;
    let errors = 0;

    try {
      const response = await axios.get(`${this.buzzLocalConfig.buzzLocalUrl}/api/societies`, {
        headers: {
          'x-api-key': config.buzzLocal.apiKey,
        },
        timeout: config.buzzLocal.timeout,
      });

      const societies = response.data.data || [];

      for (const society of societies) {
        try {
          await apartmentService.create({
            name: society.name,
            type: 'gated_community',
            address: {
              street: society.address?.street || '',
              area: society.address?.area || '',
              city: society.address?.city || '',
              state: society.address?.state || '',
              pincode: society.address?.pincode || '',
              country: 'India',
            },
            location: {
              lat: society.location?.lat || 0,
              lng: society.location?.lng || 0,
            },
            demographics: {
              totalFlats: society.totalFlats || 0,
              occupiedFlats: society.occupiedFlats || 0,
              avgFamilySize: 4,
              estimatedResidents: (society.occupiedFlats || 0) * 4,
              incomeLevel: 'middle',
            },
            amenities: [],
            nearbyPOIs: [],
            targeting: { enabled: true },
          });
          synced++;
        } catch (err) {
          logger.error(`Error syncing society ${society.id}:`, err);
          errors++;
        }
      }
    } catch (err) {
      logger.error('BuzzLocal sync error:', err);
      errors++;
    }

    return { synced, errors };
  }

  // Get apartments matching specific targeting criteria
  async findMatchingApartments(
    criteria: {
      incomeLevel?: string;
      minResidents?: number;
      amenities?: string[];
      interests?: string[];
    },
    limit: number = 100
  ): Promise<Apartment[]> {
    const query: Record<string, unknown> = {
      status: 'active',
      'targeting.enabled': true,
    };

    if (criteria.incomeLevel) {
      query['demographics.incomeLevel'] = criteria.incomeLevel;
    }
    if (criteria.minResidents) {
      query['demographics.estimatedResidents'] = { $gte: criteria.minResidents };
    }
    if (criteria.amenities && criteria.amenities.length > 0) {
      query.amenities = { $all: criteria.amenities };
    }

    const apartments = await apartmentService.list({
      page: 1,
      limit,
      ...(criteria.incomeLevel ? { incomeLevel: criteria.incomeLevel as 'low' | 'middle' | 'upper_middle' | 'high' } : {}),
    });

    // Filter by interests if targeting configs exist
    if (criteria.interests && criteria.interests.length > 0) {
      const matchingIds = new Set<string>();
      for (const apt of apartments.data) {
        const targeting = await this.getConfig(apt.apartmentId);
        if (
          targeting?.interests &&
          targeting.interests.some((i) => criteria.interests!.includes(i))
        ) {
          matchingIds.add(apt.apartmentId);
        }
      }
      return apartments.data.filter((a) => matchingIds.has(a.apartmentId));
    }

    return apartments.data;
  }

  // Invalidate targeting cache
  private async invalidateTargetingCache(apartmentId: string): Promise<void> {
    await redisService.del(`targeting:${apartmentId}`);
  }
}

export const targetingService = new TargetingService();