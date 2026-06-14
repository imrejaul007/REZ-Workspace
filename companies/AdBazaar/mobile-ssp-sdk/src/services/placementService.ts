import { v4 as uuidv4 } from 'uuid';
import { PlacementModel, PlacementDocument } from '../models/index.js';
import { config } from '../config/index.js';
import type { Placement, AdFormat, PlacementTargeting } from '../types/index.js';

export class PlacementService {
  /**
   * Create a new placement
   */
  async create(data: {
    appId: string;
    name: string;
    adFormat: AdFormat;
    width?: number;
    height?: number;
    position?: 'top' | 'bottom' | 'center' | 'interstitial';
    refreshInterval?: number;
    ecpm?: number;
    targeting?: PlacementTargeting;
  }): Promise<Placement> {
    const placementId = `plc_${uuidv4().replace(/-/g, '').substring(0, 12)}`;

    const placement = await PlacementModel.create({
      placementId,
      appId: data.appId,
      name: data.name,
      adFormat: data.adFormat,
      width: data.width,
      height: data.height,
      position: data.position || 'bottom',
      refreshInterval: data.refreshInterval || 30,
      ecpm: data.ecpm || config.ssp.defaultECPM,
      status: 'active',
      targeting: data.targeting,
    });

    return this.toPlacement(placement);
  }

  /**
   * Get placement by ID
   */
  async getById(placementId: string): Promise<Placement | null> {
    const placement = await PlacementModel.findOne({ placementId });
    return placement ? this.toPlacement(placement) : null;
  }

  /**
   * Get placements by app ID
   */
  async getByAppId(appId: string): Promise<Placement[]> {
    const placements = await PlacementModel.find({ appId, status: 'active' });
    return placements.map((p) => this.toPlacement(p));
  }

  /**
   * Update placement
   */
  async update(
    placementId: string,
    data: Partial<{
      name: string;
      adFormat: AdFormat;
      width: number;
      height: number;
      position: 'top' | 'bottom' | 'center' | 'interstitial';
      refreshInterval: number;
      ecpm: number;
      status: 'active' | 'paused' | 'disabled';
      targeting: PlacementTargeting;
    }>
  ): Promise<Placement | null> {
    const placement = await PlacementModel.findOneAndUpdate(
      { placementId },
      { $set: data },
      { new: true }
    );

    return placement ? this.toPlacement(placement) : null;
  }

  /**
   * Update placement status
   */
  async updateStatus(
    placementId: string,
    status: 'active' | 'paused' | 'disabled'
  ): Promise<Placement | null> {
    const placement = await PlacementModel.findOneAndUpdate(
      { placementId },
      { $set: { status } },
      { new: true }
    );

    return placement ? this.toPlacement(placement) : null;
  }

  /**
   * Update placement ECPM
   */
  async updateECPM(placementId: string, ecpm: number): Promise<Placement | null> {
    // Clamp ECPM to allowed range
    const clampedECPM = Math.max(
      config.ssp.minECPM,
      Math.min(config.ssp.maxECPM, ecpm)
    );

    const placement = await PlacementModel.findOneAndUpdate(
      { placementId },
      { $set: { ecpm: clampedECPM } },
      { new: true }
    );

    return placement ? this.toPlacement(placement) : null;
  }

  /**
   * Delete placement
   */
  async delete(placementId: string): Promise<boolean> {
    const result = await PlacementModel.deleteOne({ placementId });
    return result.deletedCount > 0;
  }

  /**
   * Get all placements (admin)
   */
  async getAll(options: {
    page?: number;
    limit?: number;
    appId?: string;
    adFormat?: AdFormat;
    status?: 'active' | 'paused' | 'disabled';
  }): Promise<{ placements: Placement[]; total: number }> {
    const { page = 1, limit = 20, appId, adFormat, status } = options;

    const query: Record<string, unknown> = {};
    if (appId) query.appId = appId;
    if (adFormat) query.adFormat = adFormat;
    if (status) query.status = status;

    const [placements, total] = await Promise.all([
      PlacementModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PlacementModel.countDocuments(query),
    ]);

    return {
      placements: placements.map((p) => this.toPlacement(p)),
      total,
    };
  }

  /**
   * Check if placement matches targeting criteria
   */
  checkTargetingMatch(placement: Placement, criteria: {
    country?: string;
    device?: string;
    osVersion?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
  }): boolean {
    if (!placement.targeting) return true;

    const { targeting } = placement;

    // Check country
    if (targeting.countries && targeting.countries.length > 0) {
      if (!targeting.countries.includes(criteria.country || '')) {
        return false;
      }
    }

    // Check excluded countries
    if (targeting.excludedCountries && targeting.excludedCountries.length > 0) {
      if (targeting.excludedCountries.includes(criteria.country || '')) {
        return false;
      }
    }

    // Check device
    if (targeting.devices && targeting.devices.length > 0) {
      if (!targeting.devices.includes(criteria.device || '')) {
        return false;
      }
    }

    // Check OS version
    if (targeting.osVersions && targeting.osVersions.length > 0) {
      if (!targeting.osVersions.includes(criteria.osVersion || '')) {
        return false;
      }
    }

    // Check demographics
    if (targeting.demographics) {
      const { ageMin, ageMax, gender } = targeting.demographics;
      if (ageMin !== undefined && criteria.age !== undefined && criteria.age < ageMin) {
        return false;
      }
      if (ageMax !== undefined && criteria.age !== undefined && criteria.age > ageMax) {
        return false;
      }
      if (gender !== undefined && criteria.gender !== undefined && criteria.gender !== gender) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert document to Placement type
   */
  private toPlacement(doc: PlacementDocument): Placement {
    return {
      placementId: doc.placementId,
      appId: doc.appId,
      name: doc.name,
      adFormat: doc.adFormat,
      width: doc.width,
      height: doc.height,
      position: doc.position,
      refreshInterval: doc.refreshInterval,
      ecpm: doc.ecpm,
      status: doc.status,
      targeting: doc.targeting?.toObject(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

export const placementService = new PlacementService();