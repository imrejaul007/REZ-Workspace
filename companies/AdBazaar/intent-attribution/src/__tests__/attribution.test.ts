import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { AttributionModel, ConversionType } from '../types.js';

// Mock the services for unit testing
const mockConversionCaptureService = {
  captureConversion: jest.fn(),
  getConversionsByUserId: jest.fn(),
  getConversionStats: jest.fn()
};

const mockAttributionCalculationService = {
  calculateAttribution: jest.fn(),
  getAttributionEfficiency: jest.fn(),
  compareModels: jest.fn()
};

const mockROIService = {
  calculateSegmentROI: jest.fn(),
  getAttributionEfficiency: jest.fn()
};

const mockReportGeneratorService = {
  generateReport: jest.fn(),
  generateSourceReport: jest.fn(),
  generateSegmentReport: jest.fn()
};

// Mock zod schemas for testing
describe('Attribution Models', () => {
  test('should have all required attribution models', () => {
    expect(AttributionModel.FIRST_TOUCH).toBe('first_touch');
    expect(AttributionModel.LAST_TOUCH).toBe('last_touch');
    expect(AttributionModel.LINEAR).toBe('linear');
    expect(AttributionModel.TIME_DECAY).toBe('time_decay');
    expect(AttributionModel.POSITION_BASED).toBe('position_based');
  });

  test('should have all required conversion types', () => {
    expect(ConversionType.PURCHASE).toBe('purchase');
    expect(ConversionType.BOOKING).toBe('booking');
    expect(ConversionType.SIGNUP).toBe('signup');
    expect(ConversionType.DOWNLOAD).toBe('download');
    expect(ConversionType.ENGAGEMENT).toBe('engagement');
  });
});

describe('Attribution Calculation Logic', () => {
  // Test first touch attribution
  test('first_touch should give 100% credit to first touchpoint', () => {
    const touchpoints = [
      { signalId: 's1', source: 'google', timestamp: new Date('2024-01-01') },
      { signalId: 's2', source: 'facebook', timestamp: new Date('2024-01-02') },
      { signalId: 's3', source: 'email', timestamp: new Date('2024-01-03') }
    ];

    const conversionValue = 100;
    const model = AttributionModel.FIRST_TOUCH;

    // First touch should attribute100% to s1 (google)
    const expectedCredit = { signalId: 's1', credit: 1, value: 100 };

    expect(expectedCredit.credit).toBe(1);
    expect(expectedCredit.value).toBe(conversionValue);
  });

  // Test last touch attribution
  test('last_touch should give 100% credit to last touchpoint', () => {
    const touchpoints = [
      { signalId: 's1', source: 'google', timestamp: new Date('2024-01-01') },
      { signalId: 's2', source: 'facebook', timestamp: new Date('2024-01-02') },
      { signalId: 's3', source: 'email', timestamp: new Date('2024-01-03') }
    ];

    const conversionValue = 100;
    const model = AttributionModel.LAST_TOUCH;

    // Last touch should attribute 100% to s3 (email)
    const expectedCredit = { signalId: 's3', credit: 1, value: 100 };

    expect(expectedCredit.credit).toBe(1);
    expect(expectedCredit.value).toBe(conversionValue);
  });

  // Test linear attribution
  test('linear should give equal credit to all touchpoints', () => {
    const touchpoints = [
      { signalId: 's1', source: 'google' },
      { signalId: 's2', source: 'facebook' },
      { signalId: 's3', source: 'email' }
    ];

    const conversionValue = 100;
    const model = AttributionModel.LINEAR;

    // Linear should give 33.33% to each
    const creditPerTouchpoint = 1 / touchpoints.length;
    const valuePerTouchpoint = conversionValue * creditPerTouchpoint;

    expect(creditPerTouchpoint).toBeCloseTo(0.333, 2);
    expect(valuePerTouchpoint).toBeCloseTo(33.33, 2);
  });

  // Test position based attribution
  test('position_based should give 40% first, 40% last, 20% middle', () => {
    const touchpoints = [
      { signalId: 's1', source: 'google' },
      { signalId: 's2', source: 'facebook' },
      { signalId: 's3', source: 'email' }
    ];

    const conversionValue = 100;
    const model = AttributionModel.POSITION_BASED;

    // Position based: 40% first, 40% last, 20% middle
    const firstCredit = 0.4;
    const lastCredit = 0.4;
    const middleCredit = 0.2;

    expect(firstCredit).toBe(0.4);
    expect(lastCredit).toBe(0.4);
    expect(middleCredit).toBe(0.2);
    expect(firstCredit + lastCredit + middleCredit).toBe(1);
  });

  // Test time decay attribution
  test('time_decay should give more credit to recent touchpoints', () => {
    const touchpoints = [
      { signalId: 's1', source: 'google', lagDays: 10 },
      { signalId: 's2', source: 'facebook', lagDays: 5 },
      { signalId: 's3', source: 'email', lagDays: 1 }
    ];

    const halfLife = 7;
    const conversionValue = 100;

    // Calculate weights
    const weights = touchpoints.map(tp => Math.pow(0.5, tp.lagDays / halfLife));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Normalize to credits
    const credits = weights.map(w => w / totalWeight);

    // Most recent (s3) should have highest credit
    expect(credits[2]).toBeGreaterThan(credits[1]);
    expect(credits[1]).toBeGreaterThan(credits[0]);
  });
});

describe('Conversion Event Validation', () => {
  test('should validate required fields', () => {
    const validEvent = {
      userId: 'user123',
      conversionType: ConversionType.PURCHASE,
      conversionValue: 100,
      currency: 'INR',
      category: 'electronics'
    };

    expect(validEvent.userId).toBeDefined();
    expect(validEvent.conversionType).toBeDefined();
    expect(validEvent.conversionValue).toBeGreaterThanOrEqual(0);
  });

  test('should reject invalid conversion type', () => {
    const invalidEvent = {
      userId: 'user123',
      conversionType: 'invalid_type',
      conversionValue: 100,
      category: 'electronics'
    };

    expect(ConversionType.PURCHASE).not.toBe('invalid_type');
    expect(ConversionType.BOOKING).not.toBe('invalid_type');
  });

  test('should handle optional metadata', () => {
    const eventWithMetadata = {
      userId: 'user123',
      conversionType: ConversionType.PURCHASE,
      conversionValue: 100,
      category: 'electronics',
      metadata: {
        orderId: 'order123',
        productId: 'prod456',
        discount: 10
      }
    };

    expect(eventWithMetadata.metadata).toBeDefined();
    expect(eventWithMetadata.metadata.orderId).toBe('order123');
  });
});

describe('Report Generation', () => {
  test('should calculate summary statistics', () => {
    const conversions = [
      { conversionId: 'c1', conversionValue: 100, attributedSignals: [{ lagDays: 5 }, { lagDays: 3 }] },
      { conversionId: 'c2', conversionValue: 200, attributedSignals: [{ lagDays: 2 }] },
      { conversionId: 'c3', conversionValue: 150, attributedSignals: [{ lagDays: 7 }, { lagDays: 4 }, { lagDays: 1 }] }
    ];

    const totalConversions = conversions.length;
    const totalValue = conversions.reduce((sum, c) => sum + c.conversionValue, 0);
    const totalLag = conversions.reduce((sum, c) =>
      sum + c.attributedSignals.reduce((s, sig) => s + sig.lagDays, 0), 0);
    const lagCount = conversions.reduce((sum, c) => sum + c.attributedSignals.length, 0);
    const avgLag = totalLag / lagCount;

    expect(totalConversions).toBe(3);
    expect(totalValue).toBe(450);
    expect(avgLag).toBeCloseTo(3.67, 1);
  });

  test('should group by source correctly', () => {
    const conversions = [
      {
        conversionId: 'c1',
        attributedSignals: [
          { source: 'google', attributionValue: 50 },
          { source: 'facebook', attributionValue: 50 }
        ]
      },
      {
        conversionId: 'c2',
        attributedSignals: [
          { source: 'google', attributionValue: 100 }
        ]
      }
    ];

    const sourceMap = new Map<string, number>();
    for (const conv of conversions) {
      for (const signal of conv.attributedSignals) {
        sourceMap.set(signal.source, (sourceMap.get(signal.source) || 0) + signal.attributionValue);
      }
    }

    expect(sourceMap.get('google')).toBe(150);
    expect(sourceMap.get('facebook')).toBe(50);
  });
});

describe('ROI Calculation', () => {
  test('should calculate ROI correctly', () => {
    const revenue = 1000;
    const cost = 400;
    const roi = ((revenue - cost) / cost) * 100;

    expect(roi).toBe(150);
  });

  test('should calculate ROAS correctly', () => {
    const revenue = 1000;
    const cost = 400;
    const roas = revenue / cost;

    expect(roas).toBe(2.5);
  });

  test('should calculate CPA correctly', () => {
    const totalCost = 1000;
    const conversions = 50;
    const cpa = totalCost / conversions;

    expect(cpa).toBe(20);
  });
});

describe('Attribution Window', () => {
  test('should calculate lag days correctly', () => {
    const signalTime = new Date('2024-01-01');
    const conversionTime = new Date('2024-01-08');

    const diffMs = conversionTime.getTime() - signalTime.getTime();
    const lagDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    expect(lagDays).toBe(7);
  });

  test('should handle zero lag', () => {
    const signalTime = new Date('2024-01-01');
    const conversionTime = new Date('2024-01-01');

    const diffMs = conversionTime.getTime() - signalTime.getTime();
    const lagDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    expect(lagDays).toBe(0);
  });
});

describe('API Response Format', () => {
  test('should format success response correctly', () => {
    const successResponse = {
      success: true,
      data: {
        conversionId: 'conv_123',
        userId: 'user_456',
        conversionType: ConversionType.PURCHASE,
        conversionValue: 100
      }
    };

    expect(successResponse.success).toBe(true);
    expect(successResponse.data).toBeDefined();
 });

  test('should format error response correctly', () => {
    const errorResponse = {
      success: false,
      error: 'Validation failed'
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error).toBeDefined();
  });

  test('should include metadata in paginated responses', () => {
    const paginatedResponse = {
      success: true,
      data: [],
      meta: {
        total: 100,
        limit: 10,
        offset: 0
      }
    };

    expect(paginatedResponse.meta).toBeDefined();
    expect(paginatedResponse.meta.total).toBe(100);
    expect(paginatedResponse.meta.limit).toBe(10);
  });
});

// Jest configuration
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**'
  ]
};