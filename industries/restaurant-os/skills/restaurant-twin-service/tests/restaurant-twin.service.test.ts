import { RestaurantTwinService } from '../src/services/restaurant-twin.service';
import { RestaurantTwin } from '../src/models/restaurant-twin.model';
import { messageBroker } from '../src/utils/message-broker';
import { rezPOSClient } from '../src/utils/rez-pos-client';
import { rezDashboardClient } from '../src/utils/rez-dashboard-client';
import { RestaurantStatus, CuisineType } from '../src/schemas/restaurant-twin.schema';

// Mock the RestaurantTwin model
jest.mock('../src/models/restaurant-twin.model');

describe('RestaurantTwinService', () => {
  let service: RestaurantTwinService;

  const mockRestaurantTwin = {
    twinId: 'twin.restaurant.res123',
    restaurantId: 'res123',
    merchantId: 'merch123',
    name: 'Test Restaurant',
    description: 'A test restaurant',
    cuisineType: [CuisineType.INDIAN],
    location: {
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'India',
      coordinates: { lat: 0, lng: 0 }
    },
    contact: {
      phone: '1234567890',
      email: 'test@test.com'
    },
    totalTables: 10,
    totalSeats: 40,
    operatingHours: [],
    features: {
      delivery: true,
      takeaway: true,
      dineIn: true,
      driveThru: false,
      qrOrdering: true,
      selfKiosk: false,
      onlineOrdering: true,
      reservations: true,
      buffet: false,
      liveCooking: false,
      outdoorSeating: false,
      wifi: true,
      parking: true,
      wheelchairAccessible: true
    },
    currentMetrics: {
      currentCovers: 0,
      pendingOrders: 0,
      avgWaitTime: 0,
      tableTurnover: 0,
      activeStaff: 0,
      kitchenUtilization: 0,
      revenueToday: 0,
      ordersToday: 0
    },
    status: RestaurantStatus.CLOSED,
    lastUpdated: '2026-06-12T00:00:00.000Z',
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
    save: jest.fn().mockResolvedValue(true),
    toJSON: jest.fn().mockReturnValue({
      twinId: 'twin.restaurant.res123',
      restaurantId: 'res123',
      merchantId: 'merch123',
      name: 'Test Restaurant',
      status: RestaurantStatus.CLOSED
    })
  };

  beforeEach(() => {
    service = new RestaurantTwinService();
    jest.clearAllMocks();
  });

  describe('createRestaurantTwin', () => {
    const createRequest = {
      restaurantId: 'res123',
      merchantId: 'merch123',
      name: 'Test Restaurant',
      cuisineType: [CuisineType.INDIAN],
      location: {
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'India',
        coordinates: { lat: 0, lng: 0 }
      },
      contact: {
        phone: '1234567890',
        email: 'test@test.com'
      },
      totalTables: 10,
      totalSeats: 40,
      operatingHours: []
    };

    it('should create a new restaurant twin successfully', async () => {
      (RestaurantTwin.findByRestaurantId as jest.Mock).mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(true);
      (RestaurantTwin as jest.Mock).mockImplementation(() => ({
        ...mockRestaurantTwin,
        save: mockSave
      }));

      const result = await service.createRestaurantTwin(createRequest);

      expect(result.twinId).toBe('twin.restaurant.res123');
      expect(result.restaurantId).toBe('res123');
      expect(result.twinOsEntityId).toBe('twin.restaurant.res123');
      expect(mockSave).toHaveBeenCalled();
      expect(messageBroker.publish).toHaveBeenCalledWith(
        'restaurant.twin.created',
        expect.any(Object)
      );
      expect(rezPOSClient.syncRestaurant).toHaveBeenCalled();
    });

    it('should throw error if restaurant twin already exists', async () => {
      (RestaurantTwin.findByRestaurantId as jest.Mock).mockResolvedValue(mockRestaurantTwin);

      await expect(service.createRestaurantTwin(createRequest)).rejects.toThrow(
        'Restaurant Twin already exists for restaurantId: res123'
      );
    });
  });

  describe('getRestaurantTwin', () => {
    it('should return restaurant twin if found', async () => {
      (RestaurantTwin.findByRestaurantId as jest.Mock).mockResolvedValue(mockRestaurantTwin);

      const result = await service.getRestaurantTwin('res123');

      expect(result.restaurantId).toBe('res123');
      expect(RestaurantTwin.findByRestaurantId).toHaveBeenCalledWith('res123');
    });

    it('should throw error if restaurant twin not found', async () => {
      (RestaurantTwin.findByRestaurantId as jest.Mock).mockResolvedValue(null);

      await expect(service.getRestaurantTwin('nonexistent')).rejects.toThrow(
        'Restaurant Twin not found for restaurantId: nonexistent'
      );
    });
  });

  describe('updateRestaurantStatus', () => {
    it('should update restaurant status successfully', async () => {
      const mockTwin = {
        ...mockRestaurantTwin,
        save: jest.fn().mockResolvedValue(true)
      };
      (RestaurantTwin.findByRestaurantId as jest.Mock).mockResolvedValue(mockTwin);

      const result = await service.updateRestaurantStatus('res123', {
        status: RestaurantStatus.OPEN
      });

      expect(result.status).toBe(RestaurantStatus.OPEN);
      expect(messageBroker.publish).toHaveBeenCalledWith(
        'restaurant.twin.status.changed',
        expect.any(Object)
      );
      expect(rezDashboardClient.notifyStatusChange).toHaveBeenCalled();
    });

    it('should throw error if restaurant twin not found', async () => {
      (RestaurantTwin.findByRestaurantId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateRestaurantStatus('nonexistent', { status: RestaurantStatus.OPEN })
      ).rejects.toThrow('Restaurant Twin not found for restaurantId: nonexistent');
    });
  });

  describe('updateMetrics', () => {
    it('should update restaurant metrics successfully', async () => {
      const mockTwin = {
        ...mockRestaurantTwin,
        save: jest.fn().mockResolvedValue(true)
      };
      (RestaurantTwin.findByRestaurantId as jest.Mock).mockResolvedValue(mockTwin);

      const result = await service.updateMetrics('res123', {
        currentCovers: 20,
        pendingOrders: 5
      });

      expect(result.metrics.currentCovers).toBe(20);
      expect(result.metrics.pendingOrders).toBe(5);
      expect(messageBroker.publish).toHaveBeenCalledWith(
        'restaurant.twin.metrics.updated',
        expect.any(Object)
      );
    });
  });

  describe('listRestaurants', () => {
    it('should list restaurants with pagination', async () => {
      const mockRestaurants = [mockRestaurantTwin];
      (RestaurantTwin.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockRestaurants)
      });
      (RestaurantTwin.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.listRestaurants({
        merchantId: 'merch123',
        limit: 10,
        offset: 0
      });

      expect(result.total).toBe(1);
      expect(result.restaurants).toHaveLength(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });
  });

  describe('deleteRestaurantTwin', () => {
    it('should delete restaurant twin successfully', async () => {
      (RestaurantTwin.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await service.deleteRestaurantTwin('res123');

      expect(RestaurantTwin.deleteOne).toHaveBeenCalledWith({ restaurantId: 'res123' });
      expect(messageBroker.publish).toHaveBeenCalledWith(
        'restaurant.twin.deleted',
        expect.any(Object)
      );
    });

    it('should throw error if restaurant twin not found', async () => {
      (RestaurantTwin.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      await expect(service.deleteRestaurantTwin('nonexistent')).rejects.toThrow(
        'Restaurant Twin not found for restaurantId: nonexistent'
      );
    });
  });
});
