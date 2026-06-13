import { DriverTwinService } from '../src/services/driver-twin.service.js';
import { DriverTwinModel } from '../src/models/index.js';
import { resetEventEmitter } from '../src/events/index.js';

describe('DriverTwinService', () => {
  let service: DriverTwinService;

  beforeEach(() => {
    service = new DriverTwinService();
    resetEventEmitter();
  });

  afterEach(async () => {
    await DriverTwinModel.deleteMany({});
  });

  describe('create', () => {
    it('should create a new driver twin', async () => {
      const data = {
        driver_id: 'DRV-001',
        profile: {
          name: { first: 'John', last: 'Doe' },
          email: 'john.doe@example.com',
          phone: '+1234567890',
          language: 'en',
        },
        licensing: {
          license_number: 'DL-123456',
          license_type: 'commercial',
          license_expiry: '2027-12-31',
        },
        fleet_id: 'FLEET-001',
      };

      const result = await service.create(data);

      expect(result).toBeDefined();
      expect(result.driver_id).toBe('DRV-001');
      expect(result.twin_id).toBe('twin.transport.driver.DRV-001');
      expect(result.profile.name.first).toBe('John');
      expect(result.profile.name.last).toBe('Doe');
      expect(result.status.current).toBe('offline');
      expect(result.performance.avg_rating).toBe(5);
    });

    it('should throw error if driver already exists', async () => {
      const data = {
        driver_id: 'DRV-002',
        profile: {
          name: { first: 'Jane', last: 'Doe' },
          email: 'jane.doe@example.com',
          phone: '+1234567891',
        },
        licensing: {
          license_number: 'DL-123457',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);

      await expect(service.create(data)).rejects.toThrow('already exists');
    });

    it('should create with custom performance data', async () => {
      const data = {
        driver_id: 'DRV-003',
        profile: {
          name: { first: 'Top', last: 'Driver' },
          email: 'top.driver@example.com',
          phone: '+1234567892',
        },
        licensing: {
          license_number: 'DL-123458',
          license_expiry: '2027-12-31',
        },
        fleet_id: 'FLEET-002',
      };

      const result = await service.create(data);

      expect(result.status.current).toBe('offline');
      expect(result.performance.total_trips).toBe(0);
      expect(result.earnings.today_earnings).toBe(0);
      expect(result.schedule.regulatory_hours_remaining).toBe(12);
    });
  });

  describe('getById', () => {
    it('should return driver twin by driver_id', async () => {
      const data = {
        driver_id: 'DRV-004',
        profile: {
          name: { first: 'Get', last: 'Test' },
          email: 'get@example.com',
          phone: '+1234567893',
        },
        licensing: {
          license_number: 'DL-123459',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);
      const result = await service.getById('DRV-004');

      expect(result).toBeDefined();
      expect(result?.driver_id).toBe('DRV-004');
    });

    it('should return null for non-existent driver', async () => {
      const result = await service.getById('NON-EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('getByTwinId', () => {
    it('should return driver twin by twin_id', async () => {
      const data = {
        driver_id: 'DRV-005',
        profile: {
          name: { first: 'Twin', last: 'Test' },
          email: 'twintest@example.com',
          phone: '+1234567894',
        },
        licensing: {
          license_number: 'DL-123460',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);
      const result = await service.getByTwinId('twin.transport.driver.DRV-005');

      expect(result).toBeDefined();
      expect(result?.driver_id).toBe('DRV-005');
    });
  });

  describe('update', () => {
    it('should update driver twin', async () => {
      const data = {
        driver_id: 'DRV-006',
        profile: {
          name: { first: 'Original', last: 'Name' },
          email: 'original@example.com',
          phone: '+1234567895',
        },
        licensing: {
          license_number: 'DL-123461',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);

      const result = await service.update('DRV-006', {
        profile: {
          name: { first: 'Updated', last: 'Name' },
          email: 'original@example.com',
          phone: '+1234567895',
        },
      });

      expect(result).toBeDefined();
      expect(result?.profile.name.first).toBe('Updated');
    });
  });

  describe('updateStatus', () => {
    it('should update driver status to online', async () => {
      const data = {
        driver_id: 'DRV-007',
        profile: {
          name: { first: 'Status', last: 'Test' },
          email: 'status@example.com',
          phone: '+1234567896',
        },
        licensing: {
          license_number: 'DL-123462',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);

      const result = await service.updateStatus('DRV-007', {
        current: 'online',
        location: {
          lat: 25.2048,
          lng: 55.2708,
          updated_at: new Date().toISOString(),
        },
      });

      expect(result).toBeDefined();
      expect(result?.status.current).toBe('online');
      expect(result?.status.location?.lat).toBe(25.2048);
    });

    it('should update status to busy', async () => {
      const data = {
        driver_id: 'DRV-008',
        profile: {
          name: { first: 'Busy', last: 'Test' },
          email: 'busy@example.com',
          phone: '+1234567897',
        },
        licensing: {
          license_number: 'DL-123463',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);
      await service.updateStatus('DRV-008', { current: 'online' });

      const result = await service.updateStatus('DRV-008', {
        current: 'busy',
        current_order_id: 'ORD-001',
      });

      expect(result?.status.current).toBe('busy');
      expect(result?.status.current_order_id).toBe('ORD-001');
    });
  });

  describe('updateLocation', () => {
    it('should update driver location', async () => {
      const data = {
        driver_id: 'DRV-009',
        profile: {
          name: { first: 'Location', last: 'Test' },
          email: 'location@example.com',
          phone: '+1234567898',
        },
        licensing: {
          license_number: 'DL-123464',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);
      await service.updateStatus('DRV-009', { current: 'online' });

      const result = await service.updateLocation('DRV-009', {
        lat: 25.276987,
        lng: 55.296249,
      });

      expect(result).toBeDefined();
      expect(result?.status.location?.lat).toBe(25.276987);
      expect(result?.status.location?.lng).toBe(55.296249);
    });
  });

  describe('updatePerformance', () => {
    it('should update performance metrics', async () => {
      const data = {
        driver_id: 'DRV-010',
        profile: {
          name: { first: 'Performance', last: 'Test' },
          email: 'performance@example.com',
          phone: '+1234567899',
        },
        licensing: {
          license_number: 'DL-123465',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);

      const result = await service.updatePerformance('DRV-010', {
        total_trips: 100,
        total_distance_km: 500,
        total_earnings: 2500,
      });

      expect(result?.performance.total_trips).toBe(100);
      expect(result?.performance.total_distance_km).toBe(500);
      expect(result?.performance.total_earnings).toBe(2500);
    });
  });

  describe('updateEarnings', () => {
    it('should update earnings', async () => {
      const data = {
        driver_id: 'DRV-011',
        profile: {
          name: { first: 'Earnings', last: 'Test' },
          email: 'earnings@example.com',
          phone: '+1234567900',
        },
        licensing: {
          license_number: 'DL-123466',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);

      const result = await service.updateEarnings('DRV-011', {
        today_earnings: 150,
        week_earnings: 800,
        pending_payout: 800,
      });

      expect(result?.earnings.today_earnings).toBe(150);
      expect(result?.earnings.week_earnings).toBe(800);
      expect(result?.earnings.pending_payout).toBe(800);
    });
  });

  describe('startShift', () => {
    it('should start a driver shift', async () => {
      const data = {
        driver_id: 'DRV-012',
        profile: {
          name: { first: 'Shift', last: 'Start' },
          email: 'shiftstart@example.com',
          phone: '+1234567901',
        },
        licensing: {
          license_number: 'DL-123467',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);

      const result = await service.startShift('DRV-012', { vehicle_id: 'VEH-001' });

      expect(result?.status.current).toBe('online');
      expect(result?.status.vehicle_id).toBe('VEH-001');
      expect(result?.vehicle_id).toBe('VEH-001');
      expect(result?.schedule.shift_start).toBeDefined();
    });

    it('should throw error if driver is already online', async () => {
      const data = {
        driver_id: 'DRV-013',
        profile: {
          name: { first: 'Already', last: 'Online' },
          email: 'alreadyonline@example.com',
          phone: '+1234567902',
        },
        licensing: {
          license_number: 'DL-123468',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);
      await service.startShift('DRV-013', { vehicle_id: 'VEH-002' });

      await expect(
        service.startShift('DRV-013', { vehicle_id: 'VEH-003' })
      ).rejects.toThrow('already online');
    });
  });

  describe('endShift', () => {
    it('should end a driver shift', async () => {
      const data = {
        driver_id: 'DRV-014',
        profile: {
          name: { first: 'Shift', last: 'End' },
          email: 'shiftend@example.com',
          phone: '+1234567903',
        },
        licensing: {
          license_number: 'DL-123469',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);
      await service.startShift('DRV-014', { vehicle_id: 'VEH-004' });

      const result = await service.endShift('DRV-014', { end_reason: 'end_of_day' });

      expect(result?.status.current).toBe('offline');
      expect(result?.status.vehicle_id).toBeNull();
      expect(result?.schedule.shift_end).toBeDefined();
    });

    it('should throw error if driver is not on a shift', async () => {
      const data = {
        driver_id: 'DRV-015',
        profile: {
          name: { first: 'Not', last: 'Online' },
          email: 'notonline@example.com',
          phone: '+1234567904',
        },
        licensing: {
          license_number: 'DL-123470',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);

      await expect(
        service.endShift('DRV-015', { end_reason: 'end_of_day' })
      ).rejects.toThrow('not on a shift');
    });
  });

  describe('recordRating', () => {
    it('should record driver rating', async () => {
      const data = {
        driver_id: 'DRV-016',
        profile: {
          name: { first: 'Rating', last: 'Test' },
          email: 'rating@example.com',
          phone: '+1234567905',
        },
        licensing: {
          license_number: 'DL-123471',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);

      const result = await service.recordRating('DRV-016', {
        rating: 5,
        trip_id: 'TRIP-001',
      });

      expect(result?.performance.rating_count).toBe(1);
      expect(result?.performance.avg_rating).toBe(5);
    });

    it('should calculate correct average rating', async () => {
      const data = {
        driver_id: 'DRV-017',
        profile: {
          name: { first: 'Multiple', last: 'Ratings' },
          email: 'multipleratings@example.com',
          phone: '+1234567906',
        },
        licensing: {
          license_number: 'DL-123472',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);

      await service.recordRating('DRV-017', { rating: 5 });
      await service.recordRating('DRV-017', { rating: 4 });

      const result = await service.recordRating('DRV-017', { rating: 3 });

      expect(result?.performance.rating_count).toBe(3);
      expect(result?.performance.avg_rating).toBe(4); // (5+4+3)/3 = 4
    });
  });

  describe('acceptOrder', () => {
    it('should accept an order', async () => {
      const data = {
        driver_id: 'DRV-018',
        profile: {
          name: { first: 'Accept', last: 'Order' },
          email: 'acceptorder@example.com',
          phone: '+1234567907',
        },
        licensing: {
          license_number: 'DL-123473',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);
      await service.startShift('DRV-018', { vehicle_id: 'VEH-005' });

      const result = await service.acceptOrder('DRV-018', 'ORD-002');

      expect(result?.status.current).toBe('busy');
      expect(result?.status.current_order_id).toBe('ORD-002');
    });

    it('should throw error if driver is not online', async () => {
      const data = {
        driver_id: 'DRV-019',
        profile: {
          name: { first: 'Not', last: 'Available' },
          email: 'notavailable@example.com',
          phone: '+1234567908',
        },
        licensing: {
          license_number: 'DL-123474',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);

      await expect(
        service.acceptOrder('DRV-019', 'ORD-003')
      ).rejects.toThrow('not available');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const data = {
        driver_id: 'DRV-020',
        profile: {
          name: { first: 'Cancel', last: 'Order' },
          email: 'cancelorder@example.com',
          phone: '+1234567909',
        },
        licensing: {
          license_number: 'DL-123475',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);
      await service.startShift('DRV-020', { vehicle_id: 'VEH-006' });
      await service.acceptOrder('DRV-020', 'ORD-004');

      const result = await service.cancelOrder('DRV-020', 'ORD-004', 'Customer cancelled');

      expect(result?.status.current).toBe('online');
      expect(result?.status.current_order_id).toBeNull();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      const drivers = [
        { driver_id: 'DRV-021', profile: { name: { first: 'List', last: '1' }, email: 'list1@example.com', phone: '+1234567910' }, licensing: { license_number: 'DL-123476', license_expiry: '2027-12-31' }, fleet_id: 'FLEET-001' },
        { driver_id: 'DRV-022', profile: { name: { first: 'List', last: '2' }, email: 'list2@example.com', phone: '+1234567911' }, licensing: { license_number: 'DL-123477', license_expiry: '2027-12-31' }, fleet_id: 'FLEET-001' },
        { driver_id: 'DRV-023', profile: { name: { first: 'List', last: '3' }, email: 'list3@example.com', phone: '+1234567912' }, licensing: { license_number: 'DL-123478', license_expiry: '2027-12-31' }, fleet_id: 'FLEET-002' },
      ];

      for (const driver of drivers) {
        await service.create(driver);
      }
    });

    it('should list all drivers with pagination', async () => {
      const result = await service.list({ page: 1, limit: 10 });

      expect(result.total).toBe(3);
      expect(result.twins).toHaveLength(3);
      expect(result.page).toBe(1);
    });

    it('should filter by fleet_id', async () => {
      const result = await service.list({ fleet_id: 'FLEET-001' });

      expect(result.total).toBe(2);
      expect(result.twins.every(t => t.fleet_id === 'FLEET-001')).toBe(true);
    });

    it('should paginate correctly', async () => {
      const result = await service.list({ page: 1, limit: 2 });

      expect(result.total).toBe(3);
      expect(result.twins).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    it('should return driver statistics', async () => {
      const data = {
        driver_id: 'DRV-024',
        profile: {
          name: { first: 'Stats', last: 'Test' },
          email: 'stats@example.com',
          phone: '+1234567913',
        },
        licensing: {
          license_number: 'DL-123479',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);
      await service.startShift('DRV-024', { vehicle_id: 'VEH-007' });

      const stats = await service.getStats();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.by_status).toBeDefined();
      expect(stats.by_status.online).toBeGreaterThan(0);
    });
  });

  describe('delete', () => {
    it('should delete driver twin', async () => {
      const data = {
        driver_id: 'DRV-025',
        profile: {
          name: { first: 'Delete', last: 'Test' },
          email: 'delete@example.com',
          phone: '+1234567914',
        },
        licensing: {
          license_number: 'DL-123480',
          license_expiry: '2027-12-31',
        },
      };

      await service.create(data);

      const deleted = await service.delete('DRV-025');
      expect(deleted).toBe(true);

      const result = await service.getById('DRV-025');
      expect(result).toBeNull();
    });

    it('should return false for non-existent driver', async () => {
      const deleted = await service.delete('NON-EXISTENT');
      expect(deleted).toBe(false);
    });
  });
});
