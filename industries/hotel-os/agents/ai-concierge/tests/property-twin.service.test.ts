/**
 * Property Twin Service Tests
 */

import { PropertyTwinService } from '../src/services';

describe('PropertyTwinService', () => {
  let service: PropertyTwinService;

  beforeEach(() => {
    service = new PropertyTwinService();
  });

  describe('createPropertyTwin', () => {
    it('should create a new property twin with required fields', async () => {
      const input = {
        property_id: 'TEST-PROP-001',
        brand: 'Test Brand',
        name: 'Test Hotel & Spa',
        location: {
          address: '123 Test Street',
          city: 'Test City',
          country: 'Test Country',
          coordinates: { lat: 40.7128, lng: -74.006 },
          timezone: 'America/New_York',
        },
        inventory: {
          total_rooms: 100,
          available_today: 25,
          available_tomorrow: 30,
        },
      };

      const result = await service.createPropertyTwin(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.twin_id).toBe('twin.hotel.property.TEST-PROP-001');
      expect(result.data?.property_id).toBe('TEST-PROP-001');
      expect(result.data?.name).toBe('Test Hotel & Spa');
      expect(result.data?.services.check_in_24h).toBe(true);
      expect(result.data?.version).toBe(1);
    });

    it('should create a property twin with all optional fields', async () => {
      const input = {
        property_id: 'TEST-PROP-002',
        brand: 'Luxury Brand',
        name: 'Grand Luxury Hotel',
        location: {
          address: '456 Luxury Avenue',
          city: 'New York',
          country: 'USA',
          coordinates: { lat: 40.758, lng: -73.9855 },
          timezone: 'America/New_York',
        },
        inventory: {
          total_rooms: 200,
          by_type: {
            standard: 80,
            deluxe: 60,
            suite: 40,
            penthouse: 10,
            accessible: 10,
          },
          available_today: 40,
          available_tomorrow: 45,
        },
        venues: [
          {
            venue_id: 'VENUE-001',
            name: 'Fine Dining Restaurant',
            type: 'restaurant' as const,
            capacity: 80,
            hours: {
              monday: { open: '07:00', close: '23:00' },
              tuesday: { open: '07:00', close: '23:00' },
              wednesday: { open: '07:00', close: '23:00' },
              thursday: { open: '07:00', close: '23:00' },
              friday: { open: '07:00', close: '00:00' },
              saturday: { open: '07:00', close: '00:00' },
              sunday: { open: '08:00', close: '22:00' },
            },
            pos_revenue_center_id: 'POS-RESTAURANT',
          },
          {
            venue_id: 'VENUE-002',
            name: 'Sky Bar',
            type: 'bar' as const,
            capacity: 50,
            hours: {
              monday: { open: '17:00', close: '00:00' },
              tuesday: { open: '17:00', close: '00:00' },
              wednesday: { open: '17:00', close: '00:00' },
              thursday: { open: '17:00', close: '00:00' },
              friday: { open: '16:00', close: '02:00' },
              saturday: { open: '16:00', close: '02:00' },
              sunday: { open: '16:00', close: '23:00' },
            },
          },
        ],
        staff: {
          total_count: 120,
          by_department: {
            front_desk: 15,
            housekeeping: 30,
            f_and_b: 25,
            maintenance: 10,
            management: 8,
            spa: 20,
            concierge: 12,
          },
          on_duty_now: 55,
        },
        services: {
          check_in_24h: true,
          concierge_available: true,
          room_service_hours: { start: '06:00', end: '23:00' },
          housekeeping_schedule: { start: '07:00', end: '19:00' },
        },
        revenue: {
          today_revenue: 65000,
          mtd_revenue: 1850000,
          ytd_revenue: 22000000,
          revpar: 245.5,
          adr: 298,
          occupancy_rate: 82.3,
        },
        settings: {
          brand_standards_version: '3.0.0',
          upsell_config: {
            upgrade_probability_threshold: 0.65,
            max_upgrade_discount: 0.2,
          },
          pricing_rules: {
            weekend_multiplier: 1.2,
            off_peak_discount: 0.8,
          },
        },
      };

      const result = await service.createPropertyTwin(input);

      expect(result.success).toBe(true);
      expect(result.data?.inventory.by_type.standard).toBe(80);
      expect(result.data?.venues.length).toBe(2);
      expect(result.data?.staff.total_count).toBe(120);
      expect(result.data?.services.room_service_hours.start).toBe('06:00');
      expect(result.data?.revenue.occupancy_rate).toBe(82.3);
    });

    it('should throw TwinAlreadyExistsError for duplicate property', async () => {
      const input = {
        property_id: 'TEST-PROP-003',
        brand: 'Test Brand',
        name: 'Duplicate Test Hotel',
        location: {
          address: '789 Duplicate Street',
          city: 'Test City',
          country: 'Test Country',
          coordinates: { lat: 40.7, lng: -74.0 },
          timezone: 'America/New_York',
        },
        inventory: {
          total_rooms: 50,
          available_today: 10,
          available_tomorrow: 15,
        },
      };

      await service.createPropertyTwin(input);

      await expect(service.createPropertyTwin(input)).rejects.toThrow(
        'Property Twin already exists'
      );
    });
  });

  describe('getPropertyTwin', () => {
    it('should retrieve an existing property twin', async () => {
      const createResult = await service.createPropertyTwin({
        property_id: 'TEST-PROP-004',
        brand: 'Test Brand',
        name: 'Retrieve Test Hotel',
        location: {
          address: '111 Retrieve Street',
          city: 'Test City',
          country: 'Test Country',
          coordinates: { lat: 40.7, lng: -74.0 },
          timezone: 'America/New_York',
        },
        inventory: {
          total_rooms: 75,
          available_today: 20,
          available_tomorrow: 25,
        },
      });

      const propertyId = createResult.data?.property_id || 'TEST-PROP-004';
      const result = await service.getPropertyTwin(propertyId);

      expect(result.success).toBe(true);
      expect(result.data?.property_id).toBe(propertyId);
      expect(result.data?.name).toBe('Retrieve Test Hotel');
    });

    it('should throw TwinNotFoundError for non-existent property', async () => {
      await expect(service.getPropertyTwin('NON-EXISTENT')).rejects.toThrow(
        'Property Twin not found'
      );
    });
  });

  describe('updateInventory', () => {
    it('should update property inventory', async () => {
      await service.createPropertyTwin({
        property_id: 'TEST-PROP-005',
        brand: 'Test Brand',
        name: 'Inventory Test Hotel',
        location: {
          address: '222 Inventory Street',
          city: 'Test City',
          country: 'Test Country',
          coordinates: { lat: 40.7, lng: -74.0 },
          timezone: 'America/New_York',
        },
        inventory: {
          total_rooms: 100,
          available_today: 30,
          available_tomorrow: 35,
        },
      });

      const result = await service.updateInventory('TEST-PROP-005', {
        available_today: 25,
        available_tomorrow: 28,
      });

      expect(result.success).toBe(true);
      expect(result.data?.inventory.available_today).toBe(25);
      expect(result.data?.inventory.available_tomorrow).toBe(28);
      expect(result.data?.version).toBe(2);
    });
  });

  describe('updateVenue', () => {
    it('should add a new venue', async () => {
      await service.createPropertyTwin({
        property_id: 'TEST-PROP-006',
        brand: 'Test Brand',
        name: 'Venue Test Hotel',
        location: {
          address: '333 Venue Street',
          city: 'Test City',
          country: 'Test Country',
          coordinates: { lat: 40.7, lng: -74.0 },
          timezone: 'America/New_York',
        },
        inventory: {
          total_rooms: 80,
          available_today: 15,
          available_tomorrow: 20,
        },
        venues: [],
      });

      const newVenue = {
        venue_id: 'NEW-VENUE-001',
        name: 'New Spa & Wellness',
        type: 'spa' as const,
        capacity: 25,
        hours: {
          monday: { open: '09:00', close: '21:00' },
          tuesday: { open: '09:00', close: '21:00' },
          wednesday: { open: '09:00', close: '21:00' },
          thursday: { open: '09:00', close: '21:00' },
          friday: { open: '09:00', close: '21:00' },
          saturday: { open: '08:00', close: '21:00' },
          sunday: { open: '08:00', close: '20:00' },
        },
      };

      const result = await service.updateVenue('TEST-PROP-006', newVenue);

      expect(result.success).toBe(true);
      expect(result.data?.venues.length).toBe(1);
      expect(result.data?.venues[0].name).toBe('New Spa & Wellness');
    });

    it('should update an existing venue', async () => {
      await service.createPropertyTwin({
        property_id: 'TEST-PROP-007',
        brand: 'Test Brand',
        name: 'Venue Update Hotel',
        location: {
          address: '444 Venue Update Street',
          city: 'Test City',
          country: 'Test Country',
          coordinates: { lat: 40.7, lng: -74.0 },
          timezone: 'America/New_York',
        },
        inventory: {
          total_rooms: 60,
          available_today: 10,
          available_tomorrow: 12,
        },
        venues: [
          {
            venue_id: 'EXISTING-VENUE',
            name: 'Restaurant',
            type: 'restaurant' as const,
            capacity: 50,
            hours: {
              monday: { open: '07:00', close: '22:00' },
              tuesday: { open: '07:00', close: '22:00' },
              wednesday: { open: '07:00', close: '22:00' },
              thursday: { open: '07:00', close: '22:00' },
              friday: { open: '07:00', close: '23:00' },
              saturday: { open: '07:00', close: '23:00' },
              sunday: { open: '08:00', close: '21:00' },
            },
          },
        ],
      });

      const result = await service.updateVenue('TEST-PROP-007', {
        venue_id: 'EXISTING-VENUE',
        name: 'Updated Restaurant',
        type: 'restaurant' as const,
        capacity: 60,
        hours: {
          monday: { open: '06:00', close: '23:00' },
          tuesday: { open: '06:00', close: '23:00' },
          wednesday: { open: '06:00', close: '23:00' },
          thursday: { open: '06:00', close: '23:00' },
          friday: { open: '06:00', close: '00:00' },
          saturday: { open: '06:00', close: '00:00' },
          sunday: { open: '07:00', close: '22:00' },
        },
      });

      expect(result.data?.venues[0].name).toBe('Updated Restaurant');
      expect(result.data?.venues[0].capacity).toBe(60);
    });
  });

  describe('updateRevenue', () => {
    it('should update revenue metrics', async () => {
      await service.createPropertyTwin({
        property_id: 'TEST-PROP-008',
        brand: 'Test Brand',
        name: 'Revenue Test Hotel',
        location: {
          address: '555 Revenue Street',
          city: 'Test City',
          country: 'Test Country',
          coordinates: { lat: 40.7, lng: -74.0 },
          timezone: 'America/New_York',
        },
        inventory: {
          total_rooms: 90,
          available_today: 22,
          available_tomorrow: 27,
        },
      });

      const result = await service.updateRevenue('TEST-PROP-008', {
        today_revenue: 55000,
        mtd_revenue: 1500000,
        occupancy_rate: 85.5,
      });

      expect(result.success).toBe(true);
      expect(result.data?.revenue.today_revenue).toBe(55000);
      expect(result.data?.revenue.mtd_revenue).toBe(1500000);
      expect(result.data?.revenue.occupancy_rate).toBe(85.5);
    });
  });

  describe('updateStaff', () => {
    it('should update staff information', async () => {
      await service.createPropertyTwin({
        property_id: 'TEST-PROP-009',
        brand: 'Test Brand',
        name: 'Staff Test Hotel',
        location: {
          address: '666 Staff Street',
          city: 'Test City',
          country: 'Test Country',
          coordinates: { lat: 40.7, lng: -74.0 },
          timezone: 'America/New_York',
        },
        inventory: {
          total_rooms: 70,
          available_today: 18,
          available_tomorrow: 22,
        },
      });

      const result = await service.updateStaff('TEST-PROP-009', {
        on_duty_now: 60,
        by_department: {
          housekeeping: 35,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.staff.on_duty_now).toBe(60);
      expect(result.data?.staff.by_department.housekeeping).toBe(35);
    });
  });

  describe('deletePropertyTwin', () => {
    it('should delete an existing property twin', async () => {
      await service.createPropertyTwin({
        property_id: 'TEST-PROP-DELETE',
        brand: 'Test Brand',
        name: 'Delete Test Hotel',
        location: {
          address: '777 Delete Street',
          city: 'Test City',
          country: 'Test Country',
          coordinates: { lat: 40.7, lng: -74.0 },
          timezone: 'America/New_York',
        },
        inventory: {
          total_rooms: 40,
          available_today: 8,
          available_tomorrow: 10,
        },
      });

      const result = await service.deletePropertyTwin('TEST-PROP-DELETE');

      expect(result.success).toBe(true);
      expect(result.data?.deleted).toBe(true);

      // Verify property is deleted
      await expect(service.getPropertyTwin('TEST-PROP-DELETE')).rejects.toThrow(
        'Property Twin not found'
      );
    });
  });

  describe('getAllPropertyTwins', () => {
    it('should return all property twins', async () => {
      const result = await service.getAllPropertyTwins();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
    });
  });
});
