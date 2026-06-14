/**
 * Mock Models for Unit Testing
 * Provides mock factory functions for MongoDB models
 */
import { vi } from 'vitest';
import { Types } from 'mongoose';

// Helper to create mock document with _id
export const createMockId = () => new Types.ObjectId().toString();

export const createMockCampaign = (overrides = {}) => ({
  _id: createMockId(),
  name: 'Test Campaign',
  exchange: 'google_adx' as const,
  budget: 10000,
  dailyLimit: 1000,
  bidStrategy: 'dynamic' as const,
  maxBidPrice: 50,
  targeting: {
    geo: ['IN'],
    screenTypes: ['billboard_led'],
    locations: ['Mumbai'],
  },
  status: 'active' as const,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockBudgetTracker = (overrides = {}) => ({
  _id: createMockId(),
  campaignId: createMockId(),
  date: new Date(),
  totalSpent: 0,
  totalImpressions: 0,
  totalBids: 0,
  totalWins: 0,
  avgBidPrice: 0,
  avgWinPrice: 0,
  ...overrides,
});

export const createMockCreative = (overrides = {}) => ({
  _id: createMockId(),
  id: 'creative-123',
  campaignId: createMockId(),
  url: 'https://example.com/creative.jpg',
  width: 1920,
  height: 1080,
  mimeType: 'image/jpeg',
  status: 'active' as const,
  createdAt: new Date(),
  ...overrides,
});

export const createMockBidLog = (overrides = {}) => ({
  _id: createMockId(),
  requestId: 'req-123',
  campaignId: createMockId(),
  exchange: 'google_adx',
  impressionId: 'imp-123',
  floor: 10,
  bidPrice: 11,
  winPrice: 11,
  won: true,
  spent: 11,
  timestamp: new Date(),
  latency: 50,
  ...overrides,
});

// Mock CampaignModel factory
export const createMockCampaignModel = () => {
  const mockCampaigns: ReturnType<typeof createMockCampaign>[] = [];

  return {
    create: vi.fn().mockImplementation((data) => {
      const campaign = createMockCampaign(data);
      mockCampaigns.push(campaign);
      return Promise.resolve(campaign);
    }),
    find: vi.fn().mockImplementation(() => ({
      sort: vi.fn().mockResolvedValue(mockCampaigns),
    })),
    findById: vi.fn().mockImplementation((id: string) => {
      const campaign = mockCampaigns.find(c => c._id.toString() === id) || createMockCampaign();
      return Promise.resolve(campaign);
    }),
    findByIdAndUpdate: vi.fn().mockImplementation((id: string, updates: Record<string, unknown>, _options: Record<string, unknown>) => {
      const index = mockCampaigns.findIndex(c => c._id.toString() === id);
      if (index >= 0) {
        mockCampaigns[index] = { ...mockCampaigns[index], ...updates };
        return Promise.resolve(mockCampaigns[index]);
      }
      return Promise.resolve(null);
    }),
    findByIdAndDelete: vi.fn().mockImplementation((id: string) => {
      const index = mockCampaigns.findIndex(c => c._id.toString() === id);
      if (index >= 0) {
        mockCampaigns.splice(index, 1);
        return Promise.resolve(createMockCampaign());
      }
      return Promise.resolve(null);
    }),
    // For direct access to mock data (useful for test assertions)
    _mockData: mockCampaigns,
    _clear: vi.fn().mockImplementation(() => {
      mockCampaigns.length = 0;
    }),
    _add: vi.fn().mockImplementation((campaign: ReturnType<typeof createMockCampaign>) => {
      mockCampaigns.push(campaign);
    }),
  };
};

// Mock BudgetTrackerModel factory
export const createMockBudgetTrackerModel = () => {
  const mockTrackers: ReturnType<typeof createMockBudgetTracker>[] = [];

  return {
    create: vi.fn().mockImplementation((data) => {
      const tracker = createMockBudgetTracker(data);
      mockTrackers.push(tracker);
      return Promise.resolve(tracker);
    }),
    find: vi.fn().mockImplementation((query: Record<string, unknown>) => {
      let results = [...mockTrackers];
      if (query.campaignId) {
        results = results.filter(t => t.campaignId === query.campaignId);
      }
      return Promise.resolve(results);
    }),
    findOne: vi.fn().mockImplementation((query: Record<string, unknown>) => {
      let result = mockTrackers[0];
      if (query.campaignId) {
        result = mockTrackers.find(t => t.campaignId === query.campaignId);
      }
      return Promise.resolve(result || null);
    }),
    findOneAndUpdate: vi.fn().mockImplementation((query: Record<string, unknown>, updates: Record<string, unknown>, options: Record<string, unknown>) => {
      const tracker = mockTrackers[0] || createMockBudgetTracker();
      return Promise.resolve({ ...tracker, ...updates });
    }),
    // For direct access to mock data
    _mockData: mockTrackers,
    _clear: vi.fn().mockImplementation(() => {
      mockTrackers.length = 0;
    }),
    _add: vi.fn().mockImplementation((tracker: ReturnType<typeof createMockBudgetTracker>) => {
      mockTrackers.push(tracker);
    }),
  };
};

// Mock CreativeModel factory
export const createMockCreativeModel = () => {
  const mockCreatives: ReturnType<typeof createMockCreative>[] = [];

  return {
    create: vi.fn().mockImplementation((data) => {
      const creative = createMockCreative(data);
      mockCreatives.push(creative);
      return Promise.resolve(creative);
    }),
    find: vi.fn().mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(mockCreatives),
    })),
    findById: vi.fn().mockImplementation((id: string) => {
      const creative = mockCreatives.find(c => c._id.toString() === id);
      return Promise.resolve(creative || null);
    }),
    // For direct access to mock data
    _mockData: mockCreatives,
    _clear: vi.fn().mockImplementation(() => {
      mockCreatives.length = 0;
    }),
  };
};

// Mock BidLogModel factory
export const createMockBidLogModel = () => {
  const mockBidLogs: ReturnType<typeof createMockBidLog>[] = [];

  return {
    create: vi.fn().mockImplementation((data) => {
      const bidLog = createMockBidLog(data);
      mockBidLogs.push(bidLog);
      return Promise.resolve(bidLog);
    }),
    find: vi.fn().mockImplementation(() => ({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockBidLogs),
    })),
    // For direct access to mock data
    _mockData: mockBidLogs,
    _clear: vi.fn().mockImplementation(() => {
      mockBidLogs.length = 0;
    }),
  };
};
