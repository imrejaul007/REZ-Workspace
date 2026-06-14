import { CTVCampaign } from '../types/index.js';

// Mock data for testing
export const mockCampaign: Partial<CTVCampaign> = {
  campaignId: 'test-campaign-123',
  advertiserId: 'advertiser-456',
  name: 'Test CTV Campaign',
  status: 'active',
  format: 'preroll',
  budget: {
    daily: 1000,
    total: 30000,
    spent: 500,
  },
  bid: {
    type: 'cpm',
    amount: 10,
    maxBid: 15,
  },
  targeting: {
    geo: ['IN', 'US'],
    deviceTypes: ['smarttv', 'settop'],
    apps: ['app-1', 'app-2'],
    contentCategories: ['sports', 'news'],
  },
  creatives: [
    {
      creativeId: 'creative-001',
      name: 'Test Creative 1',
      videoUrl: 'https://cdn.example.com/video1.mp4',
      duration: 30,
      clickUrl: 'https://example.com/click',
      mimeType: 'video/mp4',
      bitrate: 2000,
      width: 1920,
      height: 1080,
    },
    {
      creativeId: 'creative-002',
      name: 'Test Creative 2',
      videoUrl: 'https://cdn.example.com/video2.mp4',
      duration: 15,
      clickUrl: 'https://example.com/click2',
      mimeType: 'video/mp4',
      bitrate: 1500,
      width: 1920,
      height: 1080,
    },
  ],
  pacing: {
    type: 'even',
    dailyPacingPercent: 100,
  },
  frequency: {
    maxImpressions: 4,
    windowHours: 24,
  },
  metrics: {
    impressions: 10000,
    views: 8500,
    completions: 7000,
    clicks: 500,
    skips: 1000,
    revenue: 100,
  },
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
};

export const mockDecisionRequest = {
  placementId: 'preroll_001',
  deviceType: 'smarttv',
  deviceId: 'device-abc-123',
  appId: 'streaming-app-1',
  geo: 'IN',
  contentCategory: 'sports',
  videoDuration: 1800,
  skipOffset: 5,
};

export const mockPodDecisionRequest = {
  placementId: 'midroll_001',
  deviceType: 'smarttv',
  deviceId: 'device-xyz-456',
  appId: 'streaming-app-2',
  geo: 'US',
  contentCategory: 'news',
  videoDuration: 3600,
  skipOffset: 5,
  maxAds: 3,
};

export const mockPacingAdjustment = {
  type: 'increase' as const,
  percent: 20,
  reason: 'Testing pacing adjustment',
};

export const mockCampaignCreation = {
  name: 'New Test Campaign',
  format: 'preroll' as const,
  budget: {
    daily: 500,
    total: 15000,
  },
  bid: {
    type: 'cpm' as const,
    amount: 8,
    maxBid: 12,
  },
  targeting: {
    geo: ['IN'],
    deviceTypes: ['smarttv'],
  },
  creatives: [
    {
      name: 'New Creative',
      videoUrl: 'https://cdn.example.com/new-video.mp4',
      duration: 15,
      clickUrl: 'https://example.com/new-click',
    },
  ],
  pacing: {
    type: 'even' as const,
  },
  frequency: {
    maxImpressions: 3,
    windowHours: 24,
  },
  startDate: new Date().toISOString(),
};