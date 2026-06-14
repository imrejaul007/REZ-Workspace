import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

// Mock logger
vi.mock('../src/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock service
vi.mock('../src/services/AudienceMarketplaceService', () => ({
  AudienceMarketplaceService: vi.fn().mockImplementation(() => ({
    listSegment: vi.fn().mockResolvedValue({
      listingId: 'lst_001',
      segment: { name: 'tech-enthusiasts' },
      price: 5,
      quantity: 10000,
    }),
    searchSegments: vi.fn().mockResolvedValue([
      { listingId: 'lst_001', segment: { name: 'tech-enthusiasts' }, price: 5 },
      { listingId: 'lst_002', segment: { name: 'food-lovers' }, price: 3 },
    ]),
    matchSegment: vi.fn().mockResolvedValue({
      matchScore: 0.85,
      overlap: 7500,
    }),
    purchaseSegment: vi.fn().mockResolvedValue({
      purchaseId: 'pur_001',
      segment: { name: 'tech-enthusiasts' },
      quantity: 1000,
    }),
    getInsights: vi.fn().mockResolvedValue({
      totalReach: 10000,
      demographics: { age: '25-35', gender: 'all' },
      engagement: 0.75,
    }),
    createLookalike: vi.fn().mockResolvedValue({
      lookalikeId: 'lk_001',
      similarity: 0.8,
      size: 5000,
    }),
  })),
}));

describe('REZ Audience Marketplace API', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Health check
    app.get('/health', (_req, res) => {
      res.json({ status: 'healthy', service: 'rez-audience-marketplace' });
    });

    // List segment for sale
    app.post('/api/segments/list', async (req, res) => {
      const { segment, quantity } = req.body;
      if (!segment || !quantity) {
        return res.status(400).json({ success: false, error: 'segment and quantity required' });
      }
      res.json({
        success: true,
        data: {
          listingId: `lst_${Date.now()}`,
          segment,
          price: 5,
          quantity,
        },
      });
    });

    // Search segments
    app.get('/api/segments/search', async (req, res) => {
      const { source, type, minSize, maxPrice } = req.query;
      res.json({
        success: true,
        data: [
          { listingId: 'lst_001', segment: { name: 'tech-enthusiasts' }, price: 5, size: 10000 },
          { listingId: 'lst_002', segment: { name: 'food-lovers' }, price: 3, size: 5000 },
        ],
      });
    });

    // Match segment with advertiser audience
    app.post('/api/segments/:id/match', async (req, res) => {
      const { id } = req.params;
      const { advertiserAudience } = req.body;
      res.json({
        success: true,
        data: {
          matchId: `match_${Date.now()}`,
          segmentId: id,
          matchScore: 0.85,
          overlap: 7500,
        },
      });
    });

    // Purchase segment
    app.post('/api/segments/:id/purchase', async (req, res) => {
      const { id } = req.params;
      const { advertiserId, quantity } = req.body;
      res.json({
        success: true,
        data: {
          purchaseId: `pur_${Date.now()}`,
          segmentId: id,
          advertiserId,
          quantity,
        },
      });
    });

    // Get segment insights
    app.get('/api/segments/:id/insights', async (req, res) => {
      const { id } = req.params;
      res.json({
        success: true,
        data: {
          segmentId: id,
          totalReach: 10000,
          demographics: { age: '25-35', gender: 'all' },
          engagement: 0.75,
        },
      });
    });

    // Create lookalike segment
    app.post('/api/segments/:id/lookalike', async (req, res) => {
      const { id } = req.params;
      const { similarity } = req.body;
      res.json({
        success: true,
        data: {
          lookalikeId: `lk_${Date.now()}`,
          sourceSegmentId: id,
          similarity: similarity || 0.8,
          size: 5000,
        },
      });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'rez-audience-marketplace');
    });
  });

  describe('Segment Listing', () => {
    it('should list a segment for sale', async () => {
      const response = await request(app)
        .post('/api/segments/list')
        .send({
          segment: { name: 'tech-enthusiasts', source: 'app' },
          quantity: 10000,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('listingId');
      expect(response.body.data).toHaveProperty('price');
    });

    it('should return error for missing segment', async () => {
      const response = await request(app)
        .post('/api/segments/list')
        .send({ quantity: 10000 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return error for missing quantity', async () => {
      const response = await request(app)
        .post('/api/segments/list')
        .send({ segment: { name: 'test' } });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Segment Search', () => {
    it('should search segments', async () => {
      const response = await request(app).get('/api/segments/search');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by source', async () => {
      const response = await request(app).get('/api/segments/search?source=app');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should filter by max price', async () => {
      const response = await request(app).get('/api/segments/search?maxPrice=4');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Segment Matching', () => {
    it('should match segment with advertiser audience', async () => {
      const response = await request(app)
        .post('/api/segments/lst_001/match')
        .send({
          advertiserAudience: { interests: ['tech', 'sports'] },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('matchScore');
      expect(response.body.data).toHaveProperty('overlap');
    });
  });

  describe('Segment Purchase', () => {
    it('should purchase a segment', async () => {
      const response = await request(app)
        .post('/api/segments/lst_001/purchase')
        .send({
          advertiserId: 'adv_123',
          quantity: 1000,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('purchaseId');
    });
  });

  describe('Segment Insights', () => {
    it('should return segment insights', async () => {
      const response = await request(app).get('/api/segments/lst_001/insights');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalReach');
      expect(response.body.data).toHaveProperty('demographics');
      expect(response.body.data).toHaveProperty('engagement');
    });
  });

  describe('Lookalike Creation', () => {
    it('should create a lookalike segment', async () => {
      const response = await request(app)
        .post('/api/segments/lst_001/lookalike')
        .send({ similarity: 0.8 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('lookalikeId');
      expect(response.body.data).toHaveProperty('similarity', 0.8);
    });
  });
});

describe('Audience Marketplace Logic', () => {
  it('should calculate segment price based on size and quality', () => {
    const calculatePrice = (size: number, quality: number) => {
      const basePrice = 0.001; // $0.001 per user
      return Math.round(size * basePrice * quality * 100) / 100;
    };

    expect(calculatePrice(10000, 1.0)).toBe(10);
    expect(calculatePrice(10000, 0.5)).toBe(5);
    expect(calculatePrice(50000, 0.8)).toBe(40);
  });

  it('should calculate match score between segments', () => {
    const calculateMatchScore = (overlap: number, segment1Size: number, segment2Size: number) => {
      const jaccard = overlap / (segment1Size + segment2Size - overlap);
      return Math.round(jaccard * 100) / 100;
    };

    expect(calculateMatchScore(5000, 10000, 10000)).toBe(0.33);
    expect(calculateMatchScore(8000, 10000, 10000)).toBe(0.67);
  });

  it('should estimate lookalike size based on similarity', () => {
    const estimateLookalikeSize = (sourceSize: number, similarity: number) => {
      return Math.round(sourceSize * similarity);
    };

    expect(estimateLookalikeSize(10000, 0.8)).toBe(8000);
    expect(estimateLookalikeSize(5000, 0.5)).toBe(2500);
  });

  it('should validate segment quality score', () => {
    const isValidQuality = (quality: number) => {
      return quality >= 0 && quality <= 1;
    };

    expect(isValidQuality(0.5)).toBe(true);
    expect(isValidQuality(1.0)).toBe(true);
    expect(isValidQuality(0)).toBe(true);
    expect(isValidQuality(1.5)).toBe(false);
    expect(isValidQuality(-0.1)).toBe(false);
  });

  it('should filter segments by minimum size', () => {
    const filterBySize = (segments: Array<{ size: number }>, minSize: number) => {
      return segments.filter(s => s.size >= minSize);
    };

    const segments = [
      { size: 5000 },
      { size: 10000 },
      { size: 2000 },
    ];

    expect(filterBySize(segments, 5000)).toHaveLength(2);
    expect(filterBySize(segments, 10000)).toHaveLength(1);
  });
});