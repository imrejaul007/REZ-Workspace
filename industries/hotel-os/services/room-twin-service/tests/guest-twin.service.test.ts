import { GuestTwinService } from '../src/services/guest-twin.service';
import { GuestTwin } from '../src/models/types';

describe('GuestTwinService', () => {
  let service: GuestTwinService;

  beforeEach(() => {
    service = new GuestTwinService();
  });

  afterEach(async () => {
    await GuestTwin.deleteMany({});
  });

  describe('createGuestTwin', () => {
    it('should create a new guest twin', async () => {
      const input = {
        guestId: 'GUEST-001',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890'
        },
        loyalty: {
          tier: 'gold' as const,
          points: 5000
        },
        preferences: {
          room: {
            temperature: 22,
            lighting: 60
          }
        }
      };

      const result = await service.createGuestTwin(input);

      expect(result).toBeDefined();
      expect(result.guestId).toBe('GUEST-001');
      expect(result.profile.firstName).toBe('John');
      expect(result.loyalty.tier).toBe('gold');
      expect(result.loyalty.points).toBe(5000);
      expect(result.preferences.room.temperature).toBe(22);
    });

    it('should throw error if guest already exists', async () => {
      const input = {
        guestId: 'GUEST-002',
        profile: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
          phone: '+1234567891'
        }
      };

      await service.createGuestTwin(input);

      await expect(service.createGuestTwin(input)).rejects.toThrow('already exists');
    });

    it('should set default values for missing fields', async () => {
      const input = {
        guestId: 'GUEST-003',
        profile: {
          firstName: 'Bob',
          lastName: 'Smith',
          email: 'bob.smith@example.com',
          phone: '+1234567892'
        }
      };

      const result = await service.createGuestTwin(input);

      expect(result.loyalty.tier).toBe('bronze');
      expect(result.loyalty.points).toBe(0);
      expect(result.preferences.room.temperature).toBe(22);
      expect(result.preferences.room.lighting).toBe(50);
      expect(result.sentiment.overall).toBe(0);
    });
  });

  describe('getGuestTwin', () => {
    it('should retrieve a guest twin by ID', async () => {
      const input = {
        guestId: 'GUEST-004',
        profile: {
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@example.com',
          phone: '+1234567893'
        }
      };

      await service.createGuestTwin(input);
      const result = await service.getGuestTwin('GUEST-004');

      expect(result).toBeDefined();
      expect(result?.guestId).toBe('GUEST-004');
      expect(result?.profile.firstName).toBe('Alice');
    });

    it('should return null for non-existent guest', async () => {
      const result = await service.getGuestTwin('NON-EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('updateGuestPreferences', () => {
    it('should update room preferences', async () => {
      await service.createGuestTwin({
        guestId: 'GUEST-005',
        profile: {
          firstName: 'Charlie',
          lastName: 'Brown',
          email: 'charlie@example.com',
          phone: '+1234567894'
        }
      });

      const result = await service.updateGuestPreferences('GUEST-005', {
        preferences: {
          room: {
            temperature: 25,
            lighting: 80
          }
        }
      });

      expect(result).toBeDefined();
      expect(result?.preferences.room.temperature).toBe(25);
      expect(result?.preferences.room.lighting).toBe(80);
    });

    it('should update dietary preferences', async () => {
      await service.createGuestTwin({
        guestId: 'GUEST-006',
        profile: {
          firstName: 'David',
          lastName: 'Lee',
          email: 'david@example.com',
          phone: '+1234567895'
        }
      });

      const result = await service.updateGuestPreferences('GUEST-006', {
        preferences: {
          dietary: ['vegetarian', 'gluten-free']
        }
      });

      expect(result?.preferences.dietary).toContain('vegetarian');
      expect(result?.preferences.dietary).toContain('gluten-free');
    });

    it('should return null for non-existent guest', async () => {
      const result = await service.updateGuestPreferences('NON-EXISTENT', {
        preferences: { room: { temperature: 22 } }
      });

      expect(result).toBeNull();
    });
  });

  describe('addStayHistory', () => {
    it('should add stay to guest history', async () => {
      await service.createGuestTwin({
        guestId: 'GUEST-007',
        profile: {
          firstName: 'Emma',
          lastName: 'Wilson',
          email: 'emma@example.com',
          phone: '+1234567896'
        }
      });

      const result = await service.addStayHistory('GUEST-007', {
        reservationId: 'RES-001',
        propertyId: 'PROP-001',
        roomId: 'ROOM-101',
        checkIn: new Date('2024-01-15'),
        checkOut: new Date('2024-01-18'),
        totalSpend: 500
      });

      expect(result).toBeDefined();
      expect(result?.stayHistory).toHaveLength(1);
      expect(result?.stayHistory[0].reservationId).toBe('RES-001');
      expect(result?.stayHistory[0].totalSpend).toBe(500);
      // Check that loyalty points were added (10 points per dollar)
      expect(result?.loyalty.lifetimePoints).toBe(50);
    });
  });

  describe('addStayFeedback', () => {
    it('should add feedback to stay history', async () => {
      await service.createGuestTwin({
        guestId: 'GUEST-008',
        profile: {
          firstName: 'Frank',
          lastName: 'Miller',
          email: 'frank@example.com',
          phone: '+1234567897'
        }
      });

      await service.addStayHistory('GUEST-008', {
        reservationId: 'RES-002',
        propertyId: 'PROP-001',
        roomId: 'ROOM-102',
        checkIn: new Date('2024-01-20'),
        checkOut: new Date('2024-01-22')
      });

      const result = await service.addStayFeedback('GUEST-008', 'RES-002', {
        rating: 5,
        comment: 'Great stay!'
      });

      expect(result).toBeDefined();
      expect(result?.stayHistory[0].feedback?.rating).toBe(5);
      expect(result?.stayHistory[0].feedback?.comment).toBe('Great stay!');
      expect(result?.sentiment.overall).toBe(5);
      expect(result?.sentiment.sources).toContain('feedback');
    });
  });

  describe('getGuestLoyalty', () => {
    it('should return guest loyalty info', async () => {
      await service.createGuestTwin({
        guestId: 'GUEST-009',
        profile: {
          firstName: 'Grace',
          lastName: 'Taylor',
          email: 'grace@example.com',
          phone: '+1234567898'
        },
        loyalty: {
          tier: 'platinum',
          points: 10000,
          lifetimePoints: 50000
        }
      });

      const loyalty = await service.getGuestLoyalty('GUEST-009');

      expect(loyalty).toBeDefined();
      expect(loyalty?.tier).toBe('platinum');
      expect(loyalty?.points).toBe(10000);
      expect(loyalty?.lifetimePoints).toBe(50000);
    });
  });

  describe('getRoomPreferences', () => {
    it('should return room preferences for guest setup', async () => {
      await service.createGuestTwin({
        guestId: 'GUEST-010',
        profile: {
          firstName: 'Henry',
          lastName: 'Anderson',
          email: 'henry@example.com',
          phone: '+1234567899'
        },
        preferences: {
          room: {
            temperature: 24,
            lighting: 70
          },
          amenities: ['late-checkout', 'extra-pillows']
        }
      });

      const prefs = await service.getRoomPreferences('GUEST-010');

      expect(prefs).toBeDefined();
      expect(prefs?.temperature).toBe(24);
      expect(prefs?.lighting).toBe(70);
      expect(prefs?.amenities).toContain('late-checkout');
    });
  });

  describe('getTopLoyaltyGuests', () => {
    it('should return guests sorted by lifetime points', async () => {
      await service.createGuestTwin({
        guestId: 'GUEST-011',
        profile: { firstName: 'Ivy', lastName: 'Thomas', email: 'ivy@example.com', phone: '+111' },
        loyalty: { tier: 'gold', points: 1000, lifetimePoints: 10000 }
      });

      await service.createGuestTwin({
        guestId: 'GUEST-012',
        profile: { firstName: 'Jack', lastName: 'White', email: 'jack@example.com', phone: '+112' },
        loyalty: { tier: 'diamond', points: 5000, lifetimePoints: 50000 }
      });

      await service.createGuestTwin({
        guestId: 'GUEST-013',
        profile: { firstName: 'Kate', lastName: 'Black', email: 'kate@example.com', phone: '+113' },
        loyalty: { tier: 'silver', points: 500, lifetimePoints: 5000 }
      });

      const topGuests = await service.getTopLoyaltyGuests(3);

      expect(topGuests).toHaveLength(3);
      expect(topGuests[0].guestId).toBe('GUEST-012'); // Diamond has most points
      expect(topGuests[1].guestId).toBe('GUEST-011'); // Gold has second most
      expect(topGuests[2].guestId).toBe('GUEST-013'); // Silver has least
    });
  });

  describe('getGuestsBySentiment', () => {
    it('should return guests within sentiment range', async () => {
      await service.createGuestTwin({
        guestId: 'GUEST-014',
        profile: { firstName: 'Leo', lastName: 'Green', email: 'leo@example.com', phone: '+114' }
      });

      await service.createGuestTwin({
        guestId: 'GUEST-015',
        profile: { firstName: 'Mia', lastName: 'Brown', email: 'mia@example.com', phone: '+115' }
      });

      await service.addStayFeedback('GUEST-014', 'RES-003', { rating: 4 });
      await service.addStayFeedback('GUEST-015', 'RES-004', { rating: 2 });

      const happyGuests = await service.getGuestsBySentiment(3, 5);

      expect(happyGuests).toHaveLength(1);
      expect(happyGuests[0].guestId).toBe('GUEST-014');
    });
  });
});
