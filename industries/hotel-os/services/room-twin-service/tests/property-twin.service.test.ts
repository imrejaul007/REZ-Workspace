import { PropertyTwinService } from '../src/services/property-twin.service';
import { PropertyTwin } from '../src/models/types';

describe('PropertyTwinService', () => {
  let service: PropertyTwinService;

  beforeEach(() => {
    service = new PropertyTwinService();
  });

  afterEach(async () => {
    await PropertyTwin.deleteMany({});
  });

  describe('createPropertyTwin', () => {
    it('should create a new property twin', async () => {
      const input = {
        propertyId: 'PROP-001',
        name: 'The Grand Hotel',
        brand: 'Luxury Collection',
        type: 'hotel' as const,
        address: {
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        contact: {
          phone: '+1-212-555-0100',
          email: 'info@grandhotel.com',
          website: 'https://grandhotel.com'
        },
        venues: [
          {
            venueId: 'VEN-001',
            name: 'The Restaurant',
            type: 'restaurant' as const,
            capacity: 100
          }
        ],
        amenities: ['pool', 'spa', 'gym', 'wifi'],
        policies: {
          checkInTime: '15:00',
          checkOutTime: '11:00'
        }
      };

      const result = await service.createPropertyTwin(input);

      expect(result).toBeDefined();
      expect(result.propertyId).toBe('PROP-001');
      expect(result.name).toBe('The Grand Hotel');
      expect(result.venues).toHaveLength(1);
      expect(result.amenities).toContain('pool');
      expect(result.policies.checkInTime).toBe('15:00');
    });

    it('should throw error if property already exists', async () => {
      const input = {
        propertyId: 'PROP-002',
        name: 'City Hotel',
        brand: 'Budget Stays',
        address: {
          street: '456 Oak Ave',
          city: 'Boston',
          state: 'MA',
          country: 'USA',
          postalCode: '02101'
        },
        contact: {
          phone: '+1-617-555-0200',
          email: 'info@cityhotel.com'
        }
      };

      await service.createPropertyTwin(input);

      await expect(service.createPropertyTwin(input)).rejects.toThrow('already exists');
    });

    it('should set default policies', async () => {
      const input = {
        propertyId: 'PROP-003',
        name: 'Minimal Hotel',
        brand: 'Minimal',
        address: {
          street: '789 Pine St',
          city: 'Seattle',
          state: 'WA',
          country: 'USA',
          postalCode: '98101'
        },
        contact: {
          phone: '+1-206-555-0300',
          email: 'info@minimal.com'
        }
      };

      const result = await service.createPropertyTwin(input);

      expect(result.policies.checkInTime).toBe('15:00');
      expect(result.policies.checkOutTime).toBe('11:00');
      expect(result.policies.depositRequired).toBe(true);
      expect(result.policies.paymentMethods).toContain('credit_card');
    });
  });

  describe('getPropertyTwin', () => {
    it('should retrieve a property twin by ID', async () => {
      await service.createPropertyTwin({
        propertyId: 'PROP-004',
        name: 'Beach Resort',
        brand: 'Ocean View',
        address: {
          street: '100 Beach Rd',
          city: 'Miami',
          state: 'FL',
          country: 'USA',
          postalCode: '33101'
        },
        contact: {
          phone: '+1-305-555-0400',
          email: 'info@beachresort.com'
        }
      });

      const result = await service.getPropertyTwin('PROP-004');

      expect(result).toBeDefined();
      expect(result?.propertyId).toBe('PROP-004');
      expect(result?.name).toBe('Beach Resort');
    });

    it('should return null for non-existent property', async () => {
      const result = await service.getPropertyTwin('NON-EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('updatePropertyTwin', () => {
    it('should update property details', async () => {
      await service.createPropertyTwin({
        propertyId: 'PROP-005',
        name: 'Mountain Lodge',
        brand: 'Nature Stays',
        address: {
          street: '200 Mountain Way',
          city: 'Denver',
          state: 'CO',
          country: 'USA',
          postalCode: '80201'
        },
        contact: {
          phone: '+1-303-555-0500',
          email: 'info@mountainlodge.com'
        }
      });

      const result = await service.updatePropertyTwin('PROP-005', {
        name: 'Grand Mountain Lodge',
        amenities: ['ski-in/ski-out', 'hot tub', 'fireplace']
      });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Grand Mountain Lodge');
      expect(result?.amenities).toContain('ski-in/ski-out');
    });
  });

  describe('addVenue', () => {
    it('should add a venue to property', async () => {
      await service.createPropertyTwin({
        propertyId: 'PROP-006',
        name: 'Urban Hotel',
        brand: 'City Living',
        address: {
          street: '300 Downtown Blvd',
          city: 'Chicago',
          state: 'IL',
          country: 'USA',
          postalCode: '60601'
        },
        contact: {
          phone: '+1-312-555-0600',
          email: 'info@urbanhotel.com'
        }
      });

      const result = await service.addVenue('PROP-006', {
        venueId: 'VEN-002',
        name: 'Rooftop Bar',
        type: 'bar' as const,
        capacity: 50,
        amenities: ['live music', 'cocktails']
      });

      expect(result).toBeDefined();
      expect(result?.venues).toHaveLength(1);
      expect(result?.venues[0].name).toBe('Rooftop Bar');
      expect(result?.venues[0].type).toBe('bar');
    });
  });

  describe('updateVenue', () => {
    it('should update venue details', async () => {
      await service.createPropertyTwin({
        propertyId: 'PROP-007',
        name: 'Spa Resort',
        brand: 'Wellness',
        address: {
          street: '400 Wellness Way',
          city: 'Phoenix',
          state: 'AZ',
          country: 'USA',
          postalCode: '85001'
        },
        contact: {
          phone: '+1-480-555-0700',
          email: 'info@sparesort.com'
        },
        venues: [
          {
            venueId: 'VEN-003',
            name: 'Main Spa',
            type: 'spa' as const,
            capacity: 20
          }
        ]
      });

      const result = await service.updateVenue('PROP-007', 'VEN-003', {
        capacity: 30,
        amenities: ['massage', 'yoga', 'meditation']
      });

      expect(result?.venues[0].capacity).toBe(30);
      expect(result?.venues[0].amenities).toContain('yoga');
    });
  });

  describe('removeVenue', () => {
    it('should remove a venue from property', async () => {
      await service.createPropertyTwin({
        propertyId: 'PROP-008',
        name: 'Conference Center',
        brand: 'Business',
        address: {
          street: '500 Business Park',
          city: 'Atlanta',
          state: 'GA',
          country: 'USA',
          postalCode: '30301'
        },
        contact: {
          phone: '+1-404-555-0800',
          email: 'info@conference.com'
        },
        venues: [
          { venueId: 'VEN-004', name: 'Main Hall', type: 'conference' as const },
          { venueId: 'VEN-005', name: 'Lounge', type: 'lounge' as const }
        ]
      });

      const result = await service.removeVenue('PROP-008', 'VEN-004');

      expect(result?.venues).toHaveLength(1);
      expect(result?.venues[0].venueId).toBe('VEN-005');
    });
  });

  describe('addRevenueCenter', () => {
    it('should add a revenue center', async () => {
      await service.createPropertyTwin({
        propertyId: 'PROP-009',
        name: 'Full Service Hotel',
        brand: 'Hospitality Group',
        address: {
          street: '600 Service Rd',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          postalCode: '94102'
        },
        contact: {
          phone: '+1-415-555-0900',
          email: 'info@fullservice.com'
        }
      });

      const result = await service.addRevenueCenter('PROP-009', {
        centerId: 'RC-001',
        name: 'Restaurant Revenue',
        type: 'fnb' as const,
        revenue: 50000,
        target: 60000
      });

      expect(result?.revenueCenters).toHaveLength(1);
      expect(result?.revenueCenters[0].revenue).toBe(50000);
      expect(result?.revenueCenters[0].currency).toBe('USD');
    });
  });

  describe('updateRevenueCenter', () => {
    it('should update revenue center revenue', async () => {
      await service.createPropertyTwin({
        propertyId: 'PROP-010',
        name: 'Revenue Test Hotel',
        brand: 'Test',
        address: {
          street: '700 Test St',
          city: 'Austin',
          state: 'TX',
          country: 'USA',
          postalCode: '78701'
        },
        contact: {
          phone: '+1-512-555-1000',
          email: 'info@test.com'
        },
        revenueCenters: [
          { centerId: 'RC-002', name: 'Spa Revenue', type: 'spa' as const, revenue: 0 }
        ]
      });

      const result = await service.updateRevenueCenter('PROP-010', 'RC-002', 25000, 30000);

      expect(result?.revenueCenters[0].revenue).toBe(25000);
      expect(result?.revenueCenters[0].target).toBe(30000);
    });
  });

  describe('updateStats', () => {
    it('should update property statistics', async () => {
      await service.createPropertyTwin({
        propertyId: 'PROP-011',
        name: 'Stats Hotel',
        brand: 'Metrics',
        address: {
          street: '800 Stats Ave',
          city: 'Portland',
          state: 'OR',
          country: 'USA',
          postalCode: '97201'
        },
        contact: {
          phone: '+1-503-555-1100',
          email: 'info@statshotel.com'
        }
      });

      const result = await service.updateStats('PROP-011', {
        totalRooms: 200,
        availableRooms: 150,
        occupancyRate: 75,
        avgDailyRate: 199,
        revPAR: 149.25
      });

      expect(result?.stats.totalRooms).toBe(200);
      expect(result?.stats.occupancyRate).toBe(75);
      expect(result?.stats.revPAR).toBe(149.25);
    });
  });

  describe('updatePolicies', () => {
    it('should update property policies', async () => {
      await service.createPropertyTwin({
        propertyId: 'PROP-012',
        name: 'Policy Hotel',
        brand: 'Flexible',
        address: {
          street: '900 Policy Blvd',
          city: 'Nashville',
          state: 'TN',
          country: 'USA',
          postalCode: '37201'
        },
        contact: {
          phone: '+1-615-555-1200',
          email: 'info@policyhotel.com'
        }
      });

      const result = await service.updatePolicies('PROP-012', {
        checkInTime: '16:00',
        checkOutTime: '12:00',
        cancellationPolicy: 'free-cancellation-24h',
        petPolicy: 'pets-allowed'
      });

      expect(result?.policies.checkInTime).toBe('16:00');
      expect(result?.policies.checkOutTime).toBe('12:00');
      expect(result?.policies.cancellationPolicy).toBe('free-cancellation-24h');
      expect(result?.policies.petPolicy).toBe('pets-allowed');
    });
  });

  describe('getTotalRevenue', () => {
    it('should return total revenue across all centers', async () => {
      await service.createPropertyTwin({
        propertyId: 'PROP-013',
        name: 'Revenue Hotel',
        brand: 'Money Makers',
        address: {
          street: '1000 Money Ln',
          city: 'Las Vegas',
          state: 'NV',
          country: 'USA',
          postalCode: '89101'
        },
        contact: {
          phone: '+1-702-555-1300',
          email: 'info@revenuehotel.com'
        },
        revenueCenters: [
          { centerId: 'RC-003', name: 'Restaurant', type: 'fnb' as const, revenue: 100000 },
          { centerId: 'RC-004', name: 'Spa', type: 'spa' as const, revenue: 50000 },
          { centerId: 'RC-005', name: 'Parking', type: 'parking' as const, revenue: 10000 }
        ]
      });

      const revenue = await service.getTotalRevenue('PROP-013');

      expect(revenue?.total).toBe(160000);
      expect(revenue?.byCenter.Restaurant).toBe(100000);
      expect(revenue?.byType.fnb).toBe(100000);
      expect(revenue?.byType.spa).toBe(50000);
      expect(revenue?.byType.parking).toBe(10000);
    });
  });

  describe('getPropertiesByBrand', () => {
    it('should return properties by brand', async () => {
      await service.createPropertyTwin({
        propertyId: 'PROP-014',
        name: 'Brand Hotel 1',
        brand: 'Famous Brand',
        address: { street: '1 Main', city: 'NYC', state: 'NY', country: 'USA', postalCode: '10001' },
        contact: { phone: '111', email: 'a@test.com' }
      });

      await service.createPropertyTwin({
        propertyId: 'PROP-015',
        name: 'Brand Hotel 2',
        brand: 'Famous Brand',
        address: { street: '2 Main', city: 'LA', state: 'CA', country: 'USA', postalCode: '90001' },
        contact: { phone: '222', email: 'b@test.com' }
      });

      await service.createPropertyTwin({
        propertyId: 'PROP-016',
        name: 'Other Hotel',
        brand: 'Different Brand',
        address: { street: '3 Main', city: 'Miami', state: 'FL', country: 'USA', postalCode: '33101' },
        contact: { phone: '333', email: 'c@test.com' }
      });

      const properties = await service.getPropertiesByBrand('Famous Brand');

      expect(properties).toHaveLength(2);
      expect(properties.every(p => p.brand === 'Famous Brand')).toBe(true);
    });
  });

  describe('getPropertySummary', () => {
    it('should return property summary', async () => {
      await service.createPropertyTwin({
        propertyId: 'PROP-017',
        name: 'Summary Hotel',
        brand: 'Summary Brand',
        type: 'resort' as const,
        address: {
          street: '400 Summary St',
          city: 'Orlando',
          state: 'FL',
          country: 'USA',
          postalCode: '32801'
        },
        contact: {
          phone: '+1-407-555-1400',
          email: 'info@summary.com'
        },
        amenities: ['theme-park-shuttle', 'golf'],
        revenueCenters: [
          { centerId: 'RC-006', name: 'Golf Course', type: 'fnb' as const, revenue: 80000, target: 100000 }
        ],
        stats: {
          totalRooms: 500,
          availableRooms: 400,
          occupancyRate: 80,
          avgDailyRate: 299,
          revPAR: 239.2
        }
      });

      const summary = await service.getPropertySummary('PROP-017');

      expect(summary).toBeDefined();
      expect(summary?.propertyId).toBe('PROP-017');
      expect(summary?.name).toBe('Summary Hotel');
      expect(summary?.type).toBe('resort');
      expect(summary?.location).toBe('Orlando, USA');
      expect(summary?.stats.totalRooms).toBe(500);
      expect(summary?.stats.occupancyRate).toBe(80);
      expect(summary?.revenueCenters).toHaveLength(1);
    });
  });
});
