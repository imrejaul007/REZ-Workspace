/**
 * Store Visit API Service Tests
 *
 * Tests the StoreVisitService methods that power the core habit loop:
 *   visit store → earn coins/cashback → see reward → level up
 *
 * Covers: scheduling a visit, joining the queue, checking store availability,
 * cancelling a visit, and the offline-aware scheduling path.
 */

import storeVisitService, {
  ScheduleVisitRequest,
  GetQueueNumberRequest,
} from '@/services/storeVisitApi';

// Mock apiClient so no network calls are made
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    setAuthToken: jest.fn(),
    getAuthToken: jest.fn(() => null),
    getBaseURL: jest.fn(() => 'https://api.test.com'),
  },
}));

const mockApiClient = require('@/services/apiClient').default;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validVisitRequest: ScheduleVisitRequest = {
  storeId: 'store-abc',
  visitDate: '2026-04-10',
  visitTime: '02:00 PM',
  customerName: 'Rez User',
  customerPhone: '+919876543210',
  paymentMethod: 'pay_at_store',
};

const validQueueRequest: GetQueueNumberRequest = {
  storeId: 'store-abc',
  customerName: 'Rez User',
  customerPhone: '+919876543210',
};

// ---------------------------------------------------------------------------

describe('StoreVisitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // scheduleStoreVisit
  // =========================================================================

  describe('scheduleStoreVisit', () => {
    it('posts to /store-visits/schedule with the full request body', async () => {
      const mockResponse = {
        success: true,
        data: {
          visitNumber: 'VIS-001',
          visitDate: '2026-04-10',
          visitTime: '02:00 PM',
          storeName: 'Test Store',
          message: 'Visit scheduled successfully',
        },
      };
      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await storeVisitService.scheduleStoreVisit(validVisitRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/store-visits/schedule',
        validVisitRequest
      );
      expect(result.success).toBe(true);
      expect(result.data?.visitNumber).toBe('VIS-001');
      expect(result.data?.storeName).toBe('Test Store');
    });

    it('propagates API failure response to the caller', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        success: false,
        error: 'Store is closed',
      });

      const result = await storeVisitService.scheduleStoreVisit(validVisitRequest);

      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // getQueueNumber
  // =========================================================================

  describe('getQueueNumber', () => {
    it('posts to /store-visits/queue and returns queue position', async () => {
      const mockResponse = {
        success: true,
        data: {
          queueNumber: 5,
          estimatedWaitTime: '10 minutes',
          currentQueueSize: 4,
          message: 'You are number 5 in the queue',
        },
      };
      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await storeVisitService.getQueueNumber(validQueueRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/store-visits/queue',
        validQueueRequest
      );
      expect(result.success).toBe(true);
      expect(result.data?.queueNumber).toBe(5);
      expect(result.data?.estimatedWaitTime).toBe('10 minutes');
    });

    it('returns the queue number alongside crowd metrics', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: { queueNumber: 1, estimatedWaitTime: '2 minutes', currentQueueSize: 0, message: 'Next' },
      });

      const result = await storeVisitService.getQueueNumber(validQueueRequest);

      expect(result.data?.currentQueueSize).toBe(0);
    });
  });

  // =========================================================================
  // checkStoreAvailability
  // =========================================================================

  describe('checkStoreAvailability', () => {
    it('fetches availability for a given storeId', async () => {
      const mockAvailability = {
        success: true,
        data: {
          storeId: 'store-abc',
          storeName: 'Test Store',
          crowdStatus: 'Low' as const,
          currentVisitors: 3,
          isOpen: true,
          nextAvailableSlot: '03:00 PM',
          recommendedAction: 'Visit now — low wait time',
        },
      };
      mockApiClient.get.mockResolvedValueOnce(mockAvailability);

      const result = await storeVisitService.checkStoreAvailability('store-abc');

      expect(mockApiClient.get).toHaveBeenCalledWith('/store-visits/availability/store-abc');
      expect(result.success).toBe(true);
      expect(result.data?.isOpen).toBe(true);
      expect(result.data?.crowdStatus).toBe('Low');
    });

    it('indicates when the store is closed', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: {
          storeId: 'store-abc',
          storeName: 'Test Store',
          crowdStatus: 'Low',
          currentVisitors: 0,
          isOpen: false,
          nextAvailableSlot: '10:00 AM',
          recommendedAction: 'Store is closed — come back tomorrow',
        },
      });

      const result = await storeVisitService.checkStoreAvailability('store-abc');

      expect(result.data?.isOpen).toBe(false);
    });
  });

  // =========================================================================
  // getUserVisits
  // =========================================================================

  describe('getUserVisits', () => {
    it('fetches the authenticated user scheduled visits', async () => {
      const mockVisits = {
        success: true,
        data: [
          {
            id: 'visit-1',
            visitNumber: 'VIS-001',
            visitDate: '2026-04-10',
            visitTime: '02:00 PM',
            store: { id: 'store-abc', name: 'Test Store' },
            status: 'pending' as const,
          },
        ],
      };
      mockApiClient.get.mockResolvedValueOnce(mockVisits);

      const result = await storeVisitService.getUserVisits();

      expect(mockApiClient.get).toHaveBeenCalledWith('/store-visits/user');
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.[0].visitNumber).toBe('VIS-001');
      expect(result.data?.[0].status).toBe('pending');
    });

    it('returns an empty list when the user has no visits', async () => {
      mockApiClient.get.mockResolvedValueOnce({ success: true, data: [] });

      const result = await storeVisitService.getUserVisits();

      expect(result.data).toHaveLength(0);
    });
  });

  // =========================================================================
  // cancelVisit
  // =========================================================================

  describe('cancelVisit', () => {
    it('sends PUT to the correct endpoint with the visitId', async () => {
      mockApiClient.put.mockResolvedValueOnce({
        success: true,
        data: { message: 'Visit cancelled' },
      });

      const result = await storeVisitService.cancelVisit('visit-1');

      expect(mockApiClient.put).toHaveBeenCalledWith(
        '/store-visits/visit-1/cancel',
        {}
      );
      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Visit cancelled');
    });
  });

  // =========================================================================
  // getQueueStatus
  // =========================================================================

  describe('getQueueStatus', () => {
    it('retrieves live crowd level for a store', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: {
          currentQueueSize: 12,
          averageWaitTime: '15 minutes',
          crowdLevel: 'High' as const,
        },
      });

      const result = await storeVisitService.getQueueStatus('store-abc');

      expect(mockApiClient.get).toHaveBeenCalledWith('/store-visits/queue-status/store-abc');
      expect(result.data?.crowdLevel).toBe('High');
      expect(result.data?.currentQueueSize).toBe(12);
    });
  });

  // =========================================================================
  // scheduleStoreVisitOffline — online path
  // =========================================================================

  describe('scheduleStoreVisitOffline', () => {
    it('calls scheduleStoreVisit directly when the device is online', async () => {
      // Stub NetInfo to report connected
      jest.doMock('@react-native-community/netinfo', () => ({
        __esModule: true,
        default: {
          fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
        },
      }));

      const mockResponse = {
        success: true,
        data: {
          visitNumber: 'VIS-002',
          visitDate: '2026-04-10',
          visitTime: '04:00 PM',
          storeName: 'Test Store',
          message: 'Scheduled',
        },
      };
      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await storeVisitService.scheduleStoreVisitOffline(validVisitRequest);

      // Should have reached the real API (not queued)
      expect('queued' in result).toBe(false);
    });
  });
});
