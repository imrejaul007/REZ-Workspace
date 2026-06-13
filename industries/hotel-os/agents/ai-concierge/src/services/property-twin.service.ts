/**
 * AI Concierge Agent - Property Twin Service
 * Manages property digital twin operations
 */

import { v4 as uuidv4 } from 'uuid';
import { PropertyTwin, ApiResponse, Venue } from '../types';
import { CreatePropertyTwinSchema, CreatePropertyTwinInput } from '../schemas';
import { TwinNotFoundError, TwinAlreadyExistsError } from '../utils/errors';
import { logger } from '../utils/logger';

export class PropertyTwinService {
  private twins: Map<string, PropertyTwin> = new Map();

  constructor() {
    // Initialize with sample property for demo
    this.initializeSampleProperty();
  }

  /**
   * Create a new Property Twin
   */
  async createPropertyTwin(input: CreatePropertyTwinInput): Promise<ApiResponse<PropertyTwin>> {
    const twinId = `twin.hotel.property.${input.property_id}`;

    // Check if twin already exists
    if (this.twins.has(twinId)) {
      throw new TwinAlreadyExistsError('Property', twinId);
    }

    // Validate input
    const validatedInput = CreatePropertyTwinSchema.parse(input);

    const now = new Date().toISOString();
    const propertyTwin: PropertyTwin = {
      twin_id: twinId,
      property_id: validatedInput.property_id,
      brand: validatedInput.brand,
      name: validatedInput.name,
      location: validatedInput.location,
      inventory: validatedInput.inventory,
      venues: validatedInput.venues || [],
      staff: validatedInput.staff || {
        total_count: 0,
        by_department: {},
        on_duty_now: 0,
      },
      services: validatedInput.services || {
        check_in_24h: true,
        concierge_available: true,
        room_service_hours: { start: '07:00', end: '22:00' },
        housekeeping_schedule: { start: '06:00', end: '18:00' },
      },
      revenue: validatedInput.revenue || {
        today_revenue: 0,
        mtd_revenue: 0,
        ytd_revenue: 0,
        revpar: 0,
        adr: 0,
        occupancy_rate: 0,
      },
      settings: validatedInput.settings || {
        brand_standards_version: '1.0.0',
        upsell_config: {},
        pricing_rules: {},
      },
      created_at: now,
      updated_at: now,
      version: 1,
    };

    this.twins.set(twinId, propertyTwin);

    logger.info('Property Twin created', { twinId, propertyId: input.property_id });

    return {
      success: true,
      data: propertyTwin,
      meta: {
        timestamp: now,
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Get a Property Twin by ID
   */
  async getPropertyTwin(propertyId: string): Promise<ApiResponse<PropertyTwin>> {
    const twinId = `twin.hotel.property.${propertyId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Property', twinId);
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
   * Update property inventory
   */
  async updateInventory(
    propertyId: string,
    inventory: {
      total_rooms?: number;
      by_type?: { [key: string]: number };
      available_today?: number;
      available_tomorrow?: number;
    }
  ): Promise<ApiResponse<PropertyTwin>> {
    const twinId = `twin.hotel.property.${propertyId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Property', twinId);
    }

    twin.inventory = {
      ...twin.inventory,
      ...inventory,
    };
    twin.updated_at = new Date().toISOString();
    twin.version += 1;

    logger.info('Property inventory updated', { twinId });

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
   * Add or update a venue
   */
  async updateVenue(
    propertyId: string,
    venue: Venue
  ): Promise<ApiResponse<PropertyTwin>> {
    const twinId = `twin.hotel.property.${propertyId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Property', twinId);
    }

    const existingIndex = twin.venues.findIndex((v) => v.venue_id === venue.venue_id);
    if (existingIndex >= 0) {
      twin.venues[existingIndex] = venue;
    } else {
      twin.venues.push(venue);
    }

    twin.updated_at = new Date().toISOString();
    twin.version += 1;

    logger.info('Property venue updated', { twinId, venueId: venue.venue_id });

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
   * Update revenue metrics
   */
  async updateRevenue(
    propertyId: string,
    revenue: {
      today_revenue?: number;
      mtd_revenue?: number;
      ytd_revenue?: number;
      revpar?: number;
      adr?: number;
      occupancy_rate?: number;
    }
  ): Promise<ApiResponse<PropertyTwin>> {
    const twinId = `twin.hotel.property.${propertyId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Property', twinId);
    }

    twin.revenue = {
      ...twin.revenue,
      ...revenue,
    };
    twin.updated_at = new Date().toISOString();
    twin.version += 1;

    logger.info('Property revenue updated', { twinId });

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
   * Update staff information
   */
  async updateStaff(
    propertyId: string,
    staff: {
      total_count?: number;
      by_department?: { [key: string]: number };
      on_duty_now?: number;
    }
  ): Promise<ApiResponse<PropertyTwin>> {
    const twinId = `twin.hotel.property.${propertyId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Property', twinId);
    }

    twin.staff = {
      ...twin.staff,
      ...staff,
    };
    twin.updated_at = new Date().toISOString();
    twin.version += 1;

    logger.info('Property staff updated', { twinId });

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
   * Update services
   */
  async updateServices(
    propertyId: string,
    services: {
      check_in_24h?: boolean;
      concierge_available?: boolean;
      room_service_hours?: { start: string; end: string };
      housekeeping_schedule?: { start: string; end: string };
    }
  ): Promise<ApiResponse<PropertyTwin>> {
    const twinId = `twin.hotel.property.${propertyId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Property', twinId);
    }

    twin.services = {
      ...twin.services,
      ...services,
    };
    twin.updated_at = new Date().toISOString();
    twin.version += 1;

    logger.info('Property services updated', { twinId });

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
   * Get all Property Twins
   */
  async getAllPropertyTwins(): Promise<ApiResponse<PropertyTwin[]>> {
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
   * Delete a Property Twin
   */
  async deletePropertyTwin(propertyId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const twinId = `twin.hotel.property.${propertyId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Property', twinId);
    }

    this.twins.delete(twinId);

    logger.info('Property Twin deleted', { twinId });

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
   * Initialize sample property for demo
   */
  private initializeSampleProperty() {
    const now = new Date().toISOString();
    const twinId = 'twin.hotel.property.PROP-001';

    this.twins.set(twinId, {
      twin_id: twinId,
      property_id: 'PROP-001',
      brand: 'The Invisible Hotel',
      name: 'Grand Plaza Hotel & Spa',
      location: {
        address: '123 Main Street',
        city: 'New York',
        country: 'USA',
        coordinates: { lat: 40.7128, lng: -74.006 },
        timezone: 'America/New_York',
      },
      inventory: {
        total_rooms: 250,
        by_type: {
          standard: 100,
          deluxe: 80,
          suite: 50,
          penthouse: 10,
          accessible: 10,
        },
        available_today: 45,
        available_tomorrow: 52,
      },
      venues: [
        {
          venue_id: 'VENUE-001',
          name: 'The Grand Restaurant',
          type: 'restaurant',
          capacity: 120,
          hours: {
            monday: { open: '07:00', close: '23:00' },
            tuesday: { open: '07:00', close: '23:00' },
            wednesday: { open: '07:00', close: '23:00' },
            thursday: { open: '07:00', close: '23:00' },
            friday: { open: '07:00', close: '00:00' },
            saturday: { open: '07:00', close: '00:00' },
            sunday: { open: '08:00', close: '22:00' },
          },
          pos_revenue_center_id: 'POS-001',
        },
        {
          venue_id: 'VENUE-002',
          name: 'Skyline Bar',
          type: 'bar',
          capacity: 60,
          hours: {
            monday: { open: '16:00', close: '00:00' },
            tuesday: { open: '16:00', close: '00:00' },
            wednesday: { open: '16:00', close: '00:00' },
            thursday: { open: '16:00', close: '00:00' },
            friday: { open: '14:00', close: '02:00' },
            saturday: { open: '14:00', close: '02:00' },
            sunday: { open: '14:00', close: '23:00' },
          },
          pos_revenue_center_id: 'POS-002',
        },
        {
          venue_id: 'VENUE-003',
          name: 'Serenity Spa',
          type: 'spa',
          capacity: 30,
          hours: {
            monday: { open: '09:00', close: '21:00' },
            tuesday: { open: '09:00', close: '21:00' },
            wednesday: { open: '09:00', close: '21:00' },
            thursday: { open: '09:00', close: '21:00' },
            friday: { open: '09:00', close: '21:00' },
            saturday: { open: '08:00', close: '21:00' },
            sunday: { open: '08:00', close: '20:00' },
          },
        },
        {
          venue_id: 'VENUE-004',
          name: 'Fitness Center',
          type: 'gym',
          capacity: 40,
          hours: {
            monday: { open: '05:00', close: '23:00' },
            tuesday: { open: '05:00', close: '23:00' },
            wednesday: { open: '05:00', close: '23:00' },
            thursday: { open: '05:00', close: '23:00' },
            friday: { open: '05:00', close: '23:00' },
            saturday: { open: '06:00', close: '22:00' },
            sunday: { open: '06:00', close: '22:00' },
          },
        },
        {
          venue_id: 'VENUE-005',
          name: 'Rooftop Pool',
          type: 'pool',
          capacity: 50,
          hours: {
            monday: { open: '08:00', close: '20:00' },
            tuesday: { open: '08:00', close: '20:00' },
            wednesday: { open: '08:00', close: '20:00' },
            thursday: { open: '08:00', close: '20:00' },
            friday: { open: '08:00', close: '21:00' },
            saturday: { open: '07:00', close: '21:00' },
            sunday: { open: '07:00', close: '20:00' },
          },
        },
      ],
      staff: {
        total_count: 150,
        by_department: {
          front_desk: 20,
          housekeeping: 40,
          f_and_b: 35,
          maintenance: 15,
          management: 10,
          spa: 20,
          concierge: 10,
        },
        on_duty_now: 65,
      },
      services: {
        check_in_24h: true,
        concierge_available: true,
        room_service_hours: { start: '07:00', end: '22:00' },
        housekeeping_schedule: { start: '06:00', end: '18:00' },
      },
      revenue: {
        today_revenue: 45230,
        mtd_revenue: 1234567,
        ytd_revenue: 15678900,
        revpar: 187.5,
        adr: 225,
        occupancy_rate: 82.5,
      },
      settings: {
        brand_standards_version: '2.1.0',
        upsell_config: {
          upgrade_probability_threshold: 0.6,
          max_upgrade_discount: 0.25,
        },
        pricing_rules: {
          weekend_multiplier: 1.15,
          off_peak_discount: 0.85,
        },
      },
      created_at: now,
      updated_at: now,
      version: 1,
    });
  }
}
