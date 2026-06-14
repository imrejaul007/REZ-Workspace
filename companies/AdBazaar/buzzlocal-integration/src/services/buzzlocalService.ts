/**
 * BuzzLocal Integration Service
 *
 * Hyperlocal community targeting for AdBazaar.
 * Enables targeting based on:
 * - Society/Apartment communities
 * - Neighborhood demographics
 * - Community events
 * - Local business patterns
 *
 * Port: 4545
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema, Document, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// MODELS
// ============================================================================

/**
 * Community/Society profile
 */
interface ICommunity extends Document {
  communityId: string;
  name: string;
  type: 'apartment' | 'society' | 'residential' | 'standalone';

  // Location
  address: {
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };

  // Demographics
  totalHouses: number;
  occupancyRate: number;
  avgFamilySize: number;
  demographicProfile: {
    youngFamilies: number;    // 25-35
    middleAged: number;      // 35-50
    seniors: number;         // 50+
    workingProfessionals: number;
  };

  // Screens
  screens: Array<{
    screenId: string;
    location: string;
    type: 'lobby' | 'elevator' | 'common_area' | 'parking';
    size: 'small' | 'medium' | 'large';
    active: boolean;
  }>;

  // Behavior
  avgVisitors: number;
  peakHours: number[];
  eventDays: string[];

  // Business nearby
  nearbyBusinesses: string[];

  // Ad metrics
  avgImpressions: number;
  avgEngagement: number;
  conversionRate: number;

  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const communitySchema = new Schema<ICommunity>({
  communityId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['apartment', 'society', 'residential', 'standalone'] },

  address: {
    street: String,
    area: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    state: String,
    pincode: String,
  },
  coordinates: {
    lat: Number,
    lng: Number,
  },

  totalHouses: Number,
  occupancyRate: Number,
  avgFamilySize: Number,
  demographicProfile: {
    youngFamilies: Number,
    middleAged: Number,
    seniors: Number,
    workingProfessionals: Number,
  },

  screens: [{
    screenId: String,
    location: String,
    type: String,
    size: String,
    active: Boolean,
  }],

  avgVisitors: Number,
  peakHours: [Number],
  eventDays: [String],

  nearbyBusinesses: [String],

  avgImpressions: { type: Number, default: 0 },
  avgEngagement: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },

  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

communitySchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });
communitySchema.index({ 'address.city': 1, 'address.area': 1 });

const Community = model<ICommunity>('Community', communitySchema);

/**
 * Community resident profile
 */
interface IResident extends Document {
  residentId: string;
  userId?: string;

  // Household
  communityId: string;
  flatNumber: string;
  tower?: string;

  // Demographics
  age?: number;
  occupation?: string;
  income?: 'low' | 'middle' | 'high';

  // Behavior
  preferences: {
    food: string[];
    shopping: string[];
    services: string[];
  };
  engagement: {
    screenViews: number;
    adClicks: number;
    offersUsed: number;
  };

  // Targeting
  tags: string[];
  lastActive: Date;

  createdAt: Date;
}

const residentSchema = new Schema<IResident>({
  residentId: { type: String, required: true, unique: true, index: true },
  userId: String,

  communityId: { type: String, required: true, index: true },
  flatNumber: String,
  tower: String,

  age: Number,
  occupation: String,
  income: String,

  preferences: {
    food: [String],
    shopping: [String],
    services: [String],
  },
  engagement: {
    screenViews: { type: Number, default: 0 },
    adClicks: { type: Number, default: 0 },
    offersUsed: { type: Number, default: 0 },
  },

  tags: [String],
  lastActive: Date,

  createdAt: { type: Date, default: Date.now },
});

residentSchema.index({ communityId: 1, residentId: 1 });

const Resident = model<IResident>('Resident', residentSchema);

// ============================================================================
// SERVICES
// ============================================================================

class BuzzLocalService {
  /**
   * Get community by ID
   */
  async getCommunity(communityId: string): Promise<ICommunity | null> {
    return Community.findOne({ communityId, active: true });
  }

  /**
   * Get communities in area
   */
  async getCommunitiesInArea(params: {
    city?: string;
    area?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
  }): Promise<ICommunity[]> {
    const query: Record<string, unknown> = { active: true };

    if (params.city) query['address.city'] = params.city;
    if (params.area) query['address.area'] = params.area;

    if (params.lat && params.lng && params.radiusKm) {
      const radius = params.radiusKm / 111; // Approximate degrees
      query['coordinates.lat'] = { $gte: params.lat - radius, $lte: params.lat + radius };
      query['coordinates.lng'] = { $gte: params.lng - radius, $lte: params.lng + radius };
    }

    return Community.find(query).limit(100);
  }

  /**
   * Get residents in community
   */
  async getResidents(communityId: string, limit: number = 100): Promise<IResident[]> {
    return Resident.find({ communityId }).limit(limit);
  }

  /**
   * Get residents by preferences
   */
  async getResidentsByPreference(params: {
    city: string;
    preferenceType: 'food' | 'shopping' | 'services';
    preference: string;
  }): Promise<IResident[]> {
    const communities = await this.getCommunitiesInArea({ city: params.city });
    const communityIds = communities.map(c => c.communityId);

    const query: Record<string, unknown> = {
      communityId: { $in: communityIds },
    };
    query[`preferences.${params.preferenceType}`] = params.preference;

    return Resident.find(query).limit(100);
  }

  /**
   * Get available screen inventory
   */
  async getScreenInventory(params: {
    city?: string;
    area?: string;
    screenType?: string;
    minEngagement?: number;
  }): Promise<Array<{
    community: { id: string; name: string };
    screens: Array<{
      id: string;
      location: string;
      type: string;
      size: string;
      engagement: number;
    }>;
  }>> {
    const communities = await this.getCommunitiesInArea(params as Parameters<typeof this.getCommunitiesInArea>[0]);

    const result = [];
    for (const community of communities) {
      let screens = community.screens.filter(s => s.active);

      if (params.screenType) {
        screens = screens.filter(s => s.type === params.screenType);
      }

      if (params.minEngagement) {
        // Sort by engagement
        screens.sort((a, b) => (b as unknown as { engagement: number }).engagement - (a as unknown as { engagement: number }).engagement);
      }

      if (screens.length > 0) {
        result.push({
          community: { id: community.communityId, name: community.name },
          screens: screens.map(s => ({
            id: s.screenId,
            location: s.location,
            type: s.type,
            size: s.size,
            engagement: community.avgEngagement,
          })),
        });
      }
    }

    return result;
  }

  /**
   * Get hyperlocal audience (for targeting)
   */
  async getHyperlocalAudience(params: {
    city: string;
    area?: string;
    demographic?: 'young_families' | 'middle_aged' | 'seniors' | 'professionals';
  }): Promise<{
    communities: string[];
    estimatedReach: number;
    demographics: Record<string, number>;
  }> {
    const communities = await this.getCommunitiesInArea(params);

    let demographicFilter = '';
    if (params.demographic) {
      const map: Record<string, string> = {
        young_families: 'youngFamilies',
        middle_aged: 'middleAged',
        seniors: 'seniors',
        professionals: 'workingProfessionals',
      };
      demographicFilter = map[params.demographic] || '';
    }

    const demographics: Record<string, number> = {};
    let totalHouses = 0;
    let totalReach = 0;

    for (const community of communities) {
      totalHouses += community.totalHouses || 0;
      totalReach += (community.totalHouses || 0) * (community.occupancyRate || 0.8);

      if (demographicFilter) {
        const value = (community.demographicProfile as Record<string, number>)[demographicFilter] || 0;
        demographics[community.communityId] = value;
      }
    }

    return {
      communities: communities.map(c => c.communityId),
      estimatedReach: Math.round(totalReach),
      demographics,
    };
  }

  /**
   * Get nearby businesses for local targeting
   */
  async getNearbyBusinesses(communityId: string): Promise<string[]> {
    const community = await this.getCommunity(communityId);
    return community?.nearbyBusinesses || [];
  }

  /**
   * Get community engagement metrics
   */
  async getCommunityMetrics(communityId: string): Promise<{
    avgImpressions: number;
    avgEngagement: number;
    conversionRate: number;
    peakHours: number[];
  } | null> {
    const community = await this.getCommunity(communityId);

    if (!community) return null;

    return {
      avgImpressions: community.avgImpressions,
      avgEngagement: community.avgEngagement,
      conversionRate: community.conversionRate,
      peakHours: community.peakHours,
    };
  }
}

const buzzLocalService = new BuzzLocalService();

// ============================================================================
// APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4545', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal-integration';

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'buzzlocal-integration', version: '1.0.0' });
});

/**
 * GET /api/community/:id
 * Get community by ID
 */
app.get('/api/community/:id', async (req, res) => {
  try {
    const community = await buzzLocalService.getCommunity(req.params.id);

    if (!community) {
      res.status(404).json({ success: false, error: 'COMMUNITY_NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: community });
  } catch (error) {
    logger.error('Get community error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/communities
 * Get communities in area
 */
app.get('/api/communities', async (req, res) => {
  try {
    const { city, area, lat, lng, radiusKm } = req.query;

    const communities = await buzzLocalService.getCommunitiesInArea({
      city: city as string,
      area: area as string,
      lat: lat ? parseFloat(lat as string) : undefined,
      lng: lng ? parseFloat(lng as string) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm as string) : undefined,
    });

    res.json({
      success: true,
      data: {
        count: communities.length,
        communities: communities.map(c => ({
          id: c.communityId,
          name: c.name,
          type: c.type,
          city: c.address.city,
          area: c.address.area,
          houses: c.totalHouses,
          screens: c.screens.filter(s => s.active).length,
          engagement: c.avgEngagement,
        })),
      },
    });
  } catch (error) {
    logger.error('Get communities error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/screens/inventory
 * Get screen inventory
 */
app.get('/api/screens/inventory', async (req, res) => {
  try {
    const { city, area, screenType, minEngagement } = req.query;

    const inventory = await buzzLocalService.getScreenInventory({
      city: city as string,
      area: area as string,
      screenType: screenType as string,
      minEngagement: minEngagement ? parseFloat(minEngagement as string) : undefined,
    });

    res.json({
      success: true,
      data: {
        locations: inventory.length,
        totalScreens: inventory.reduce((sum, loc) => sum + loc.screens.length, 0),
        inventory,
      },
    });
  } catch (error) {
    logger.error('Get screen inventory error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/audience/hyperlocal
 * Get hyperlocal audience
 */
app.get('/api/audience/hyperlocal', async (req, res) => {
  try {
    const { city, area, demographic } = req.query;

    if (!city) {
      res.status(400).json({ success: false, error: 'CITY_REQUIRED' });
      return;
    }

    const audience = await buzzLocalService.getHyperlocalAudience({
      city: city as string,
      area: area as string,
      demographic: demographic as 'young_families' | 'middle_aged' | 'seniors' | 'professionals',
    });

    res.json({ success: true, data: audience });
  } catch (error) {
    logger.error('Get audience error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/community/:id/metrics
 * Get community engagement metrics
 */
app.get('/api/community/:id/metrics', async (req, res) => {
  try {
    const metrics = await buzzLocalService.getCommunityMetrics(req.params.id);

    if (!metrics) {
      res.status(404).json({ success: false, error: 'COMMUNITY_NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error('Get metrics error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('[BuzzLocal Integration] Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`[BuzzLocal Integration] Running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('[BuzzLocal Integration] Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
