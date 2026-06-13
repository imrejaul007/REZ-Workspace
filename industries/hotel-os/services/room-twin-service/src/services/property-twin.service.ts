import { PropertyTwin, IPropertyTwin } from '../models/types';
import { CreatePropertyTwinInput } from '../schemas';
import { logger } from '../utils/logger';

export class PropertyTwinService {
  /**
   * Create a new property twin
   */
  async createPropertyTwin(input: CreatePropertyTwinInput): Promise<IPropertyTwin> {
    logger.info('Creating new property twin', { propertyId: input.propertyId });

    // Check if property already exists
    const existingProperty = await PropertyTwin.findOne({ propertyId: input.propertyId });
    if (existingProperty) {
      throw new Error(`Property with ID ${input.propertyId} already exists`);
    }

    const propertyTwin = new PropertyTwin({
      propertyId: input.propertyId,
      name: input.name,
      brand: input.brand,
      type: input.type || 'hotel',
      address: input.address,
      contact: input.contact,
      venues: input.venues || [],
      amenities: input.amenities || [],
      policies: {
        checkInTime: input.policies?.checkInTime || '15:00',
        checkOutTime: input.policies?.checkOutTime || '11:00',
        cancellationPolicy: input.policies?.cancellationPolicy || 'flexible',
        petPolicy: input.policies?.petPolicy || 'not-allowed',
        smokingPolicy: input.policies?.smokingPolicy || 'not-allowed',
        paymentMethods: input.policies?.paymentMethods || ['credit_card', 'debit_card'],
        depositRequired: input.policies?.depositRequired ?? true,
        depositAmount: input.policies?.depositAmount || 0
      },
      revenueCenters: input.revenueCenters || [],
      stats: {
        totalRooms: 0,
        availableRooms: 0,
        occupancyRate: 0,
        avgDailyRate: 0,
        revPAR: 0
      }
    });

    await propertyTwin.save();

    logger.info('Property twin created successfully', { propertyId: input.propertyId });
    return propertyTwin;
  }

  /**
   * Get property twin by ID
   */
  async getPropertyTwin(propertyId: string): Promise<IPropertyTwin | null> {
    logger.debug('Fetching property twin', { propertyId });
    return PropertyTwin.findOne({ propertyId });
  }

  /**
   * Update property twin
   */
  async updatePropertyTwin(
    propertyId: string,
    updates: Partial<CreatePropertyTwinInput>
  ): Promise<IPropertyTwin | null> {
    logger.info('Updating property twin', { propertyId, updates });

    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.brand !== undefined) updateData.brand = updates.brand;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.contact !== undefined) updateData.contact = updates.contact;
    if (updates.venues !== undefined) updateData.venues = updates.venues;
    if (updates.amenities !== undefined) updateData.amenities = updates.amenities;
    if (updates.policies !== undefined) updateData.policies = updates.policies;
    if (updates.revenueCenters !== undefined) updateData.revenueCenters = updates.revenueCenters;

    return PropertyTwin.findOneAndUpdate(
      { propertyId },
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Add venue to property
   */
  async addVenue(
    propertyId: string,
    venue: {
      venueId: string;
      name: string;
      type: 'restaurant' | 'bar' | 'spa' | 'gym' | 'pool' | 'conference' | 'lounge';
      capacity?: number;
      operatingHours?: {
        open: string;
        close: string;
        days: number[];
      };
      amenities?: string[];
    }
  ): Promise<IPropertyTwin | null> {
    return PropertyTwin.findOneAndUpdate(
      { propertyId },
      {
        $push: {
          venues: venue
        }
      },
      { new: true }
    );
  }

  /**
   * Update venue
   */
  async updateVenue(
    propertyId: string,
    venueId: string,
    updates: Partial<{
      name: string;
      capacity: number;
      operatingHours: {
        open: string;
        close: string;
        days: number[];
      };
      amenities: string[];
    }>
  ): Promise<IPropertyTwin | null> {
    const updateData: Record<string, unknown> = {};
    Object.entries(updates).forEach(([key, value]) => {
      updateData[`venues.$.${key}`] = value;
    });

    return PropertyTwin.findOneAndUpdate(
      { propertyId, 'venues.venueId': venueId },
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Remove venue from property
   */
  async removeVenue(propertyId: string, venueId: string): Promise<IPropertyTwin | null> {
    return PropertyTwin.findOneAndUpdate(
      { propertyId },
      {
        $pull: {
          venues: { venueId }
        }
      },
      { new: true }
    );
  }

  /**
   * Update revenue center
   */
  async updateRevenueCenter(
    propertyId: string,
    centerId: string,
    revenue: number,
    target?: number
  ): Promise<IPropertyTwin | null> {
    const updateData: Record<string, unknown> = {
      'revenueCenters.$.revenue': revenue
    };
    if (target !== undefined) {
      updateData['revenueCenters.$.target'] = target;
    }

    return PropertyTwin.findOneAndUpdate(
      { propertyId, 'revenueCenters.centerId': centerId },
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Add revenue center
   */
  async addRevenueCenter(
    propertyId: string,
    center: {
      centerId: string;
      name: string;
      type: 'fnb' | 'spa' | 'retail' | 'parking' | 'laundry' | 'business';
      revenue?: number;
      target?: number;
      currency?: string;
    }
  ): Promise<IPropertyTwin | null> {
    return PropertyTwin.findOneAndUpdate(
      { propertyId },
      {
        $push: {
          revenueCenters: {
            ...center,
            revenue: center.revenue || 0,
            target: center.target || 0,
            currency: center.currency || 'USD'
          }
        }
      },
      { new: true }
    );
  }

  /**
   * Update property statistics
   */
  async updateStats(
    propertyId: string,
    stats: {
      totalRooms?: number;
      availableRooms?: number;
      occupancyRate?: number;
      avgDailyRate?: number;
      revPAR?: number;
    }
  ): Promise<IPropertyTwin | null> {
    const updateData: Record<string, unknown> = {};
    Object.entries(stats).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[`stats.${key}`] = value;
      }
    });

    return PropertyTwin.findOneAndUpdate(
      { propertyId },
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Update policies
   */
  async updatePolicies(
    propertyId: string,
    policies: Partial<{
      checkInTime: string;
      checkOutTime: string;
      cancellationPolicy: string;
      petPolicy: string;
      smokingPolicy: string;
      paymentMethods: string[];
      depositRequired: boolean;
      depositAmount: number;
    }>
  ): Promise<IPropertyTwin | null> {
    const updateData: Record<string, unknown> = {};
    Object.entries(policies).forEach(([key, value]) => {
      updateData[`policies.${key}`] = value;
    });

    return PropertyTwin.findOneAndUpdate(
      { propertyId },
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Get all properties by brand
   */
  async getPropertiesByBrand(brand: string): Promise<IPropertyTwin[]> {
    return PropertyTwin.find({ brand });
  }

  /**
   * Get property by city
   */
  async getPropertiesByCity(city: string): Promise<IPropertyTwin[]> {
    return PropertyTwin.find({ 'address.city': city });
  }

  /**
   * Get property summary
   */
  async getPropertySummary(propertyId: string): Promise<{
    propertyId: string;
    name: string;
    type: string;
    location: string;
    stats: {
      totalRooms: number;
      occupancyRate: number;
      avgDailyRate: number;
      revPAR: number;
    };
    revenueCenters: {
      name: string;
      type: string;
      revenue: number;
      target: number;
    }[];
    amenities: string[];
  } | null> {
    const property = await PropertyTwin.findOne({ propertyId });

    if (!property) return null;

    return {
      propertyId: property.propertyId,
      name: property.name,
      type: property.type,
      location: `${property.address.city}, ${property.address.country}`,
      stats: property.stats,
      revenueCenters: property.revenueCenters.map(rc => ({
        name: rc.name,
        type: rc.type,
        revenue: rc.revenue,
        target: rc.target
      })),
      amenities: property.amenities
    };
  }

  /**
   * Delete property twin
   */
  async deletePropertyTwin(propertyId: string): Promise<boolean> {
    const result = await PropertyTwin.deleteOne({ propertyId });
    return result.deletedCount > 0;
  }

  /**
   * Get total revenue across all revenue centers
   */
  async getTotalRevenue(propertyId: string): Promise<{
    total: number;
    byCenter: Record<string, number>;
    byType: Record<string, number>;
  } | null> {
    const property = await PropertyTwin.findOne({ propertyId });

    if (!property) return null;

    const byCenter: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let total = 0;

    property.revenueCenters.forEach(center => {
      byCenter[center.name] = center.revenue;
      byType[center.type] = (byType[center.type] || 0) + center.revenue;
      total += center.revenue;
    });

    return { total, byCenter, byType };
  }
}

export const propertyTwinService = new PropertyTwinService();
