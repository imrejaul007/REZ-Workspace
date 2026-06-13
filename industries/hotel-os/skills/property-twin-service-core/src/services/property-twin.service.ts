import { PropertyTwin } from '../models/property-twin.model';
import {
  CreatePropertyTwinRequest,
  CreatePropertyTwinResponse,
  GetPropertyTwinResponse,
  UpdateVenueRequest,
  UpdateRevenueRequest,
  defaultStaff,
  defaultServices,
  defaultRevenue,
  defaultSettings
} from '../schemas/property-twin.schema';
import { logger } from '../utils/logger';
import { messageBroker } from '../utils/message-broker';
import { rezPOSClient } from '../utils/rez-pos-client';
import { upsellEngineClient } from '../utils/upsell-engine-client';

export class PropertyTwinService {
  /**
   * Create a new Property Twin
   */
  async createPropertyTwin(request: CreatePropertyTwinRequest): Promise<CreatePropertyTwinResponse> {
    const twinId = `twin.hotel.property.${request.propertyId}`;
    const twinOsEntityId = twinId;

    logger.info('Creating Property Twin', { propertyId: request.propertyId, twinId });

    // Check if twin already exists
    const existingTwin = await PropertyTwin.findByPropertyId(request.propertyId);
    if (existingTwin) {
      throw new Error(`Property Twin already exists for propertyId: ${request.propertyId}`);
    }

    // Create the property twin document
    const propertyTwin = new PropertyTwin({
      twinId,
      propertyId: request.propertyId,
      brand: request.brand,
      name: request.name,
      location: request.location,
      inventory: request.inventory,
      venues: request.venues || [],
      staff: request.staff || defaultStaff,
      services: request.services || defaultServices,
      revenue: defaultRevenue,
      settings: request.settings || defaultSettings
    });

    await propertyTwin.save();

    // Publish event to TwinOS
    await messageBroker.publish('hotel.property.created', {
      twinId,
      propertyId: request.propertyId,
      twinOsEntityId,
      brand: request.brand,
      name: request.name,
      timestamp: new Date().toISOString()
    });

    // Sync venues with REZ POS
    if (request.venues && request.venues.length > 0) {
      for (const venue of request.venues) {
        await rezPOSClient.syncVenue(request.propertyId, venue);
      }
    }

    logger.info('Property Twin created successfully', { twinId, propertyId: request.propertyId });

    return {
      twinId,
      propertyId: request.propertyId,
      twinOsEntityId,
      createdAt: propertyTwin.createdAt.toISOString()
    };
  }

  /**
   * Get Property Twin by ID
   */
  async getPropertyTwin(propertyId: string): Promise<GetPropertyTwinResponse> {
    logger.info('Fetching Property Twin', { propertyId });

    const propertyTwin = await PropertyTwin.findByPropertyId(propertyId);
    if (!propertyTwin) {
      throw new Error(`Property Twin not found for propertyId: ${propertyId}`);
    }

    return propertyTwin.toJSON() as GetPropertyTwinResponse;
  }

  /**
   * Update Property Twin venues
   */
  async updateVenue(
    propertyId: string,
    request: UpdateVenueRequest
  ): Promise<PropertyTwin> {
    logger.info('Updating venue', { propertyId, venueId: request.venueId });

    const propertyTwin = await PropertyTwin.findByPropertyId(propertyId);
    if (!propertyTwin) {
      throw new Error(`Property Twin not found for propertyId: ${propertyId}`);
    }

    const venueIndex = propertyTwin.venues.findIndex(v => v.venueId === request.venueId);
    if (venueIndex === -1) {
      throw new Error(`Venue not found: ${request.venueId}`);
    }

    propertyTwin.venues[venueIndex] = {
      ...propertyTwin.venues[venueIndex],
      ...request.venue
    };
    await propertyTwin.save();

    // Sync with REZ POS
    await rezPOSClient.syncVenue(propertyId, propertyTwin.venues[venueIndex]);

    // Publish venue update event
    await messageBroker.publish('hotel.property.venue.update', {
      twinId: propertyTwin.twinId,
      propertyId,
      venueId: request.venueId,
      venue: propertyTwin.venues[venueIndex],
      timestamp: new Date().toISOString()
    });

    logger.info('Venue updated', { twinId: propertyTwin.twinId, propertyId, venueId: request.venueId });

    return propertyTwin;
  }

  /**
   * Add venue to property
   */
  async addVenue(
    propertyId: string,
    venue: {
      venueId: string;
      name: string;
      type: string;
      capacity: number;
      hours?: Record<string, { open: string; close: string } | null>;
      posRevenueCenterId?: string;
    }
  ): Promise<PropertyTwin> {
    logger.info('Adding venue', { propertyId, venueId: venue.venueId });

    const propertyTwin = await PropertyTwin.findByPropertyId(propertyId);
    if (!propertyTwin) {
      throw new Error(`Property Twin not found for propertyId: ${propertyId}`);
    }

    // Check if venue already exists
    const existingVenue = propertyTwin.venues.find(v => v.venueId === venue.venueId);
    if (existingVenue) {
      throw new Error(`Venue already exists: ${venue.venueId}`);
    }

    propertyTwin.venues.push({
      venueId: venue.venueId,
      name: venue.name,
      type: venue.type as any,
      capacity: venue.capacity,
      hours: venue.hours || {},
      posRevenueCenterId: venue.posRevenueCenterId || '',
      isActive: true
    });
    await propertyTwin.save();

    // Sync with REZ POS
    await rezPOSClient.syncVenue(propertyId, propertyTwin.venues[propertyTwin.venues.length - 1]);

    // Publish venue add event
    await messageBroker.publish('hotel.property.venue.add', {
      twinId: propertyTwin.twinId,
      propertyId,
      venueId: venue.venueId,
      timestamp: new Date().toISOString()
    });

    logger.info('Venue added', { twinId: propertyTwin.twinId, propertyId, venueId: venue.venueId });

    return propertyTwin;
  }

  /**
   * Update revenue
   */
  async updateRevenue(
    propertyId: string,
    request: UpdateRevenueRequest
  ): Promise<PropertyTwin> {
    logger.info('Updating revenue', { propertyId });

    const propertyTwin = await PropertyTwin.findByPropertyId(propertyId);
    if (!propertyTwin) {
      throw new Error(`Property Twin not found for propertyId: ${propertyId}`);
    }

    propertyTwin.revenue = {
      ...propertyTwin.revenue,
      ...request.revenue
    };
    await propertyTwin.save();

    // Publish revenue update event
    await messageBroker.publish('hotel.property.revenue.update', {
      twinId: propertyTwin.twinId,
      propertyId,
      revenue: propertyTwin.revenue,
      timestamp: new Date().toISOString()
    });

    logger.info('Revenue updated', { twinId: propertyTwin.twinId, propertyId });

    return propertyTwin;
  }

  /**
   * Update inventory
   */
  async updateInventory(
    propertyId: string,
    inventory: {
      totalRooms?: number;
      byType?: Record<string, number>;
      availableToday?: number;
      availableTomorrow?: number;
    }
  ): Promise<PropertyTwin> {
    logger.info('Updating inventory', { propertyId });

    const propertyTwin = await PropertyTwin.findByPropertyId(propertyId);
    if (!propertyTwin) {
      throw new Error(`Property Twin not found for propertyId: ${propertyId}`);
    }

    propertyTwin.inventory = {
      ...propertyTwin.inventory,
      ...inventory
    };
    await propertyTwin.save();

    // Publish inventory update event
    await messageBroker.publish('hotel.property.inventory.update', {
      twinId: propertyTwin.twinId,
      propertyId,
      inventory: propertyTwin.inventory,
      timestamp: new Date().toISOString()
    });

    logger.info('Inventory updated', { twinId: propertyTwin.twinId, propertyId });

    return propertyTwin;
  }

  /**
   * Update staff
   */
  async updateStaff(
    propertyId: string,
    staff: {
      totalCount?: number;
      byDepartment?: Record<string, number>;
      onDutyNow?: number;
    }
  ): Promise<PropertyTwin> {
    logger.info('Updating staff', { propertyId });

    const propertyTwin = await PropertyTwin.findByPropertyId(propertyId);
    if (!propertyTwin) {
      throw new Error(`Property Twin not found for propertyId: ${propertyId}`);
    }

    propertyTwin.staff = {
      ...propertyTwin.staff,
      ...staff
    };
    await propertyTwin.save();

    logger.info('Staff updated', { twinId: propertyTwin.twinId, propertyId });

    return propertyTwin;
  }

  /**
   * Update settings
   */
  async updateSettings(
    propertyId: string,
    settings: {
      brandStandardsVersion?: string;
      upsellConfig?: {
        enabledUpgradeTypes?: string[];
        maxUpgradeDiscount?: number;
        upgradeProbabilityThreshold?: number;
      };
      pricingRules?: {
        seasonalPricing?: boolean;
        weekendPricing?: boolean;
        lastMinuteDiscount?: number;
        earlyBirdDiscount?: number;
      };
    }
  ): Promise<PropertyTwin> {
    logger.info('Updating settings', { propertyId });

    const propertyTwin = await PropertyTwin.findByPropertyId(propertyId);
    if (!propertyTwin) {
      throw new Error(`Property Twin not found for propertyId: ${propertyId}`);
    }

    propertyTwin.settings = {
      ...propertyTwin.settings,
      ...settings,
      upsellConfig: {
        ...propertyTwin.settings.upsellConfig,
        ...(settings.upsellConfig || {})
      },
      pricingRules: {
        ...propertyTwin.settings.pricingRules,
        ...(settings.pricingRules || {})
      }
    };
    await propertyTwin.save();

    // Sync upsell config with Upsell Engine
    if (settings.upsellConfig) {
      await upsellEngineClient.updatePropertyConfig(propertyId, settings.upsellConfig);
    }

    logger.info('Settings updated', { twinId: propertyTwin.twinId, propertyId });

    return propertyTwin;
  }

  /**
   * Get property performance summary
   */
  async getPerformanceSummary(propertyId: string): Promise<{
    revenue: {
      today: number;
      mtd: number;
      ytd: number;
      revpar: number;
      adr: number;
    };
    occupancy: {
      current: number;
      availableToday: number;
      availableTomorrow: number;
    };
    venues: {
      total: number;
      active: number;
    };
  }> {
    const propertyTwin = await PropertyTwin.findByPropertyId(propertyId);
    if (!propertyTwin) {
      throw new Error(`Property Twin not found for propertyId: ${propertyId}`);
    }

    const activeVenues = propertyTwin.venues.filter(v => v.isActive);

    return {
      revenue: {
        today: propertyTwin.revenue.todayRevenue,
        mtd: propertyTwin.revenue.mtdRevenue,
        ytd: propertyTwin.revenue.ytdRevenue,
        revpar: propertyTwin.revenue.revpar,
        adr: propertyTwin.revenue.adr
      },
      occupancy: {
        current: propertyTwin.revenue.occupancyRate,
        availableToday: propertyTwin.inventory.availableToday,
        availableTomorrow: propertyTwin.inventory.availableTomorrow
      },
      venues: {
        total: propertyTwin.venues.length,
        active: activeVenues.length
      }
    };
  }

  /**
   * Delete Property Twin
   */
  async deletePropertyTwin(propertyId: string): Promise<void> {
    logger.info('Deleting Property Twin', { propertyId });

    const result = await PropertyTwin.deleteOne({ propertyId });
    if (result.deletedCount === 0) {
      throw new Error(`Property Twin not found for propertyId: ${propertyId}`);
    }

    // Publish deletion event
    await messageBroker.publish('hotel.property.deleted', {
      propertyId,
      timestamp: new Date().toISOString()
    });

    logger.info('Property Twin deleted', { propertyId });
  }
}

// Export singleton instance
export const propertyTwinService = new PropertyTwinService();
