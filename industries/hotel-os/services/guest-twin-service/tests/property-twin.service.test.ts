import { PropertyTwinService } from '../src/services/property-twin.service.js';
import { PropertyTwinModel } from '../src/models/index.js';
import { resetEventEmitter } from '../src/events/index.js';

describe('PropertyTwinService', () => {
  let service: PropertyTwinService;

  beforeEach(() => {
    service = new PropertyTwinService();
    resetEventEmitter();
  });

  afterEach(async () => {
    await PropertyTwinModel.deleteMany({});
  });

  describe('create', () => {
    it('should create a new property twin', async () => {
      const data = {
        property_id: 'PROP-001',
        brand: 'Luxury Hotels',
        name: 'Grand Plaza Hotel',
        location: {
          address: '123 Main Street',
          city: 'New York',
          country: 'USA',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          timezone: 'America/New_York',
        },
        inventory: {
          total_rooms: 500,
          by_type: {
            standard: 200,
            deluxe: 150,
            suite: 100,
            penthouse: 30,
            accessible: 20,
          },
          available_today: 350,
          available_tomorrow: 340,
        },
        venues: [
          {
            venue_id: 'VEN-001',
            name: 'The Golden Spoon Restaurant',
            type: 'restaurant' as const,
            capacity: 150,
          },
          {
            venue_id: 'VEN-002',
            name: 'Sky Lounge',
            type: 'bar' as const,
            capacity: 80,
          },
        ],
        services: {
          check_in_24h: true,
          concierge_available: true,
        },
      };

      const result = await service.create(data);

      expect(result).toBeDefined();
      expect(result.property_id).toBe('PROP-001');
      expect(result.twin_id).toBe('twin.hotel.property.PROP-001');
      expect(result.brand).toBe('Luxury Hotels');
      expect(result.name).toBe('Grand Plaza Hotel');
      expect(result.venues).toHaveLength(2);
      expect(result.services.check_in_24h).toBe(true);
    });

    it('should throw error if property already exists', async () => {
      const data = {
        property_id: 'PROP-002',
        brand: 'Test Brand',
        name: 'Test Hotel',
        location: {
          address: '456 Test St',
          city: 'Test City',
          country: 'USA',
          coordinates: { lat: 0, lng: 0 },
        },
        inventory: { total_rooms: 100, available_today: 50, available_tomorrow: 60 },
      };

      await service.create(data);

      await expect(service.create(data)).rejects.toThrow('already exists');
    });
  });

  describe('getById', () => {
    it('should return property twin by property_id', async () => {
      const data = {
        property_id: 'PROP-003',
        brand: 'Test Brand',
        name: 'Test Hotel',
        location: {
          address: '789 Test Ave',
          city: 'Test City',
          country: 'USA',
          coordinates: { lat: 0, lng: 0 },
        },
        inventory: { total_rooms: 100, available_today: 50, available_tomorrow: 60 },
      };

      await service.create(data);
      const result = await service.getById('PROP-003');

      expect(result).toBeDefined();
      expect(result?.property_id).toBe('PROP-003');
    });

    it('should return null for non-existent property', async () => {
      const result = await service.getById('NON-EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update property twin', async () => {
      const data = {
        property_id: 'PROP-004',
        brand: 'Test Brand',
        name: 'Original Name',
        location: {
          address: '111 Test Blvd',
          city: 'Test City',
          country: 'USA',
          coordinates: { lat: 0, lng: 0 },
        },
        inventory: { total_rooms: 100, available_today: 50, available_tomorrow: 60 },
      };

      await service.create(data);

      const result = await service.update('PROP-004', { name: 'Updated Name' });

      expect(result?.name).toBe('Updated Name');
    });
  });

  describe('updateInventory', () => {
    it('should update inventory', async () => {
      const data = {
        property_id: 'PROP-005',
        brand: 'Test Brand',
        name: 'Inventory Test Hotel',
        location: {
          address: '222 Test Lane',
          city: 'Test City',
          country: 'USA',
          coordinates: { lat: 0, lng: 0 },
        },
        inventory: {
          total_rooms: 200,
          available_today: 150,
          available_tomorrow: 140,
        },
      };

      await service.create(data);

      const result = await service.updateInventory('PROP-005', {
        available_today: 120,
        available_tomorrow: 130,
      });

      expect(result?.inventory.available_today).toBe(120);
      expect(result?.inventory.available_tomorrow).toBe(130);
    });
  });

  describe('updateRevenue', () => {
    it('should update revenue metrics', async () => {
      const data = {
        property_id: 'PROP-006',
        brand: 'Test Brand',
        name: 'Revenue Test Hotel',
        location: {
          address: '333 Test Drive',
          city: 'Test City',
          country: 'USA',
          coordinates: { lat: 0, lng: 0 },
        },
        inventory: { total_rooms: 100, available_today: 50, available_tomorrow: 60 },
        revenue: {
          today_revenue: 10000,
          mtd_revenue: 300000,
          ytd_revenue: 3600000,
        },
      };

      await service.create(data);

      const result = await service.updateRevenue('PROP-006', {
        today_revenue: 15000,
        occupancy_rate: 75,
      });

      expect(result?.revenue.today_revenue).toBe(15000);
      expect(result?.revenue.occupancy_rate).toBe(75);
    });
  });

  describe('upsertVenue', () => {
    it('should add a new venue', async () => {
      const data = {
        property_id: 'PROP-007',
        brand: 'Test Brand',
        name: 'Venue Test Hotel',
        location: {
          address: '444 Test Way',
          city: 'Test City',
          country: 'USA',
          coordinates: { lat: 0, lng: 0 },
        },
        inventory: { total_rooms: 100, available_today: 50, available_tomorrow: 60 },
        venues: [],
      };

      await service.create(data);

      const result = await service.upsertVenue('PROP-007', {
        venue_id: 'VEN-101',
        name: 'Test Spa',
        type: 'spa',
        capacity: 30,
      });

      expect(result?.venues).toHaveLength(1);
      expect(result?.venues[0].name).toBe('Test Spa');
    });

    it('should update existing venue', async () => {
      const data = {
        property_id: 'PROP-008',
        brand: 'Test Brand',
        name: 'Venue Update Hotel',
        location: {
          address: '555 Test Court',
          city: 'Test City',
          country: 'USA',
          coordinates: { lat: 0, lng: 0 },
        },
        inventory: { total_rooms: 100, available_today: 50, available_tomorrow: 60 },
        venues: [
          {
            venue_id: 'VEN-102',
            name: 'Original Name',
            type: 'restaurant' as const,
            capacity: 100,
          },
        ],
      };

      await service.create(data);

      const result = await service.upsertVenue('PROP-008', {
        venue_id: 'VEN-102',
        name: 'Updated Name',
        type: 'restaurant',
        capacity: 150,
      });

      expect(result?.venues).toHaveLength(1);
      expect(result?.venues[0].name).toBe('Updated Name');
      expect(result?.venues[0].capacity).toBe(150);
    });
  });

  describe('removeVenue', () => {
    it('should remove a venue', async () => {
      const data = {
        property_id: 'PROP-009',
        brand: 'Test Brand',
        name: 'Remove Venue Hotel',
        location: {
          address: '666 Test Circle',
          city: 'Test City',
          country: 'USA',
          coordinates: { lat: 0, lng: 0 },
        },
        inventory: { total_rooms: 100, available_today: 50, available_tomorrow: 60 },
        venues: [
          {
            venue_id: 'VEN-103',
            name: 'Venue to Remove',
            type: 'restaurant' as const,
            capacity: 50,
          },
        ],
      };

      await service.create(data);

      const result = await service.removeVenue('PROP-009', 'VEN-103');

      expect(result?.venues).toHaveLength(0);
    });
  });

  describe('updateStaff', () => {
    it('should update staff counts', async () => {
      const data = {
        property_id: 'PROP-010',
        brand: 'Test Brand',
        name: 'Staff Test Hotel',
        location: {
          address: '777 Test Plaza',
          city: 'Test City',
          country: 'USA',
          coordinates: { lat: 0, lng: 0 },
        },
        inventory: { total_rooms: 100, available_today: 50, available_tomorrow: 60 },
        staff: {
          total_count: 100,
          by_department: {
            front_desk: 20,
            housekeeping: 30,
            f_and_b: 25,
          },
          on_duty_now: 45,
        },
      };

      await service.create(data);

      const result = await service.updateStaff('PROP-010', {
        on_duty_now: 50,
        by_department: {
          front_desk: 25,
        },
      });

      expect(result?.staff.on_duty_now).toBe(50);
      expect(result?.staff.by_department.front_desk).toBe(25);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      const properties = [
        { property_id: 'PROP-011', brand: 'Brand A', name: 'Hotel A', location: { address: '1 A St', city: 'City A', country: 'USA', coordinates: { lat: 0, lng: 0 } }, inventory: { total_rooms: 100, available_today: 50, available_tomorrow: 60 } },
        { property_id: 'PROP-012', brand: 'Brand A', name: 'Hotel B', location: { address: '2 B St', city: 'City A', country: 'USA', coordinates: { lat: 0, lng: 0 } }, inventory: { total_rooms: 150, available_today: 80, available_tomorrow: 75 } },
        { property_id: 'PROP-013', brand: 'Brand B', name: 'Hotel C', location: { address: '3 C St', city: 'City B', country: 'USA', coordinates: { lat: 0, lng: 0 } }, inventory: { total_rooms: 200, available_today: 120, available_tomorrow: 115 } },
      ];

      for (const prop of properties) {
        await service.create(prop);
      }
    });

    it('should list all properties', async () => {
      const result = await service.list({});

      expect(result.total).toBe(3);
      expect(result.twins).toHaveLength(3);
    });

    it('should filter by brand', async () => {
      const result = await service.list({ brand: 'Brand A' });

      expect(result.total).toBe(2);
      expect(result.twins.every(p => p.brand === 'Brand A')).toBe(true);
    });

    it('should filter by city', async () => {
      const result = await service.list({ city: 'City A' });

      expect(result.total).toBe(2);
      expect(result.twins.every(p => p.location.city === 'City A')).toBe(true);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      const properties = [
        { property_id: 'PROP-014', brand: 'Brand X', name: 'Hotel X', location: { address: '1 X St', city: 'City X', country: 'USA', coordinates: { lat: 0, lng: 0 } }, inventory: { total_rooms: 100, available_today: 80 }, revenue: { occupancy_rate: 70 } },
        { property_id: 'PROP-015', brand: 'Brand X', name: 'Hotel Y', location: { address: '2 Y St', city: 'City Y', country: 'USA', coordinates: { lat: 0, lng: 0 } }, inventory: { total_rooms: 200, available_today: 150 }, revenue: { occupancy_rate: 80 } },
        { property_id: 'PROP-016', brand: 'Brand Z', name: 'Hotel Z', location: { address: '3 Z St', city: 'City Z', country: 'USA', coordinates: { lat: 0, lng: 0 } }, inventory: { total_rooms: 150, available_today: 100 }, revenue: { occupancy_rate: 75 } },
      ];

      for (const prop of properties) {
        await service.create(prop);
      }
    });

    it('should calculate property statistics', async () => {
      const result = await service.getStats();

      expect(result.total).toBe(3);
      expect(result.by_brand['Brand X']).toBe(2);
      expect(result.by_brand['Brand Z']).toBe(1);
      expect(result.total_rooms).toBe(450);
      expect(result.avg_occupancy).toBeCloseTo(75, 0);
    });
  });

  describe('delete', () => {
    it('should delete property twin', async () => {
      const data = {
        property_id: 'PROP-017',
        brand: 'Test Brand',
        name: 'Delete Test Hotel',
        location: {
          address: '888 Test Blvd',
          city: 'Test City',
          country: 'USA',
          coordinates: { lat: 0, lng: 0 },
        },
        inventory: { total_rooms: 100, available_today: 50, available_tomorrow: 60 },
      };

      await service.create(data);

      const deleted = await service.delete('PROP-017');
      expect(deleted).toBe(true);

      const result = await service.getById('PROP-017');
      expect(result).toBeNull();
    });
  });
});