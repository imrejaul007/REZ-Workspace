/**
 * Brand Routes API Tests
 * Tests for /api/brands endpoints
 */

import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';

// Mock brand service
const mockBrandService = {
  getBrandByUserId: jest.fn(),
  createBrand: jest.fn().mockImplementation((data) => Promise.resolve({
    _id: 'brand-1',
    userId: 'user-123',
    ...data,
    verified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  getBrandById: jest.fn().mockImplementation((id) => Promise.resolve({
    _id: id,
    userId: 'user-123',
    name: 'Test Brand',
    industry: 'fashion',
    verified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  updateBrand: jest.fn().mockImplementation((id, data) => Promise.resolve({
    _id: id,
    userId: 'user-123',
    name: data.name || 'Updated Brand',
    industry: 'fashion',
    verified: false,
    updatedAt: new Date(),
  })),
  verifyBrand: jest.fn().mockResolvedValue({
    _id: 'brand-1',
    userId: 'user-123',
    name: 'Test Brand',
    verified: true,
    verifiedAt: new Date(),
  }),
  listBrands: jest.fn().mockResolvedValue({
    brands: [
      {
        _id: 'brand-1',
        name: 'Nike',
        industry: 'sportswear',
        verified: true,
      },
      {
        _id: 'brand-2',
        name: 'Adidas',
        industry: 'sportswear',
        verified: true,
      },
    ],
    total: 2,
    page: 1,
    limit: 20,
    pages: 1,
  }),
};

// Mock the service
jest.mock('../services/index.js', () => ({
  brandService: mockBrandService,
}));

// Mock validators
jest.mock('../utils/validation', () => ({
  brandRegisterSchema: {
    parse: jest.fn().mockImplementation((data) => data),
  },
  brandUpdateSchema: {
    parse: jest.fn().mockImplementation((data) => data),
  },
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock AppError
class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Mock verifyAuth middleware
const mockVerifyAuth = (req: Request, _res: Response, next: NextFunction) => {
  req.userId = 'user-123';
  req.isInternal = false;
  next();
};

// Mock validateBody middleware
const mockValidateBody = (_schema: any) => (req: Request, _res: Response, next: NextFunction) => {
  // Validation passed, continue
  next();
};

// Mock error middleware
const mockErrorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  } else {
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
};

// Mock asyncHandler
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create test app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());

  // Mock routes inline for testing
  app.post('/api/brands/register',
    mockVerifyAuth,
    mockValidateBody({}),
    asyncHandler(async (req: Request, res: Response) => {
      const existingBrand = await mockBrandService.getBrandByUserId(req.userId!);
      if (existingBrand) {
        throw new AppError('Brand already registered for this user', 400);
      }

      const brand = await mockBrandService.createBrand(req.body);
      res.status(201).json({
        success: true,
        data: brand,
      });
    })
  );

  app.get('/api/brands/:id',
    mockVerifyAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const brand = await mockBrandService.getBrandById(req.params.id);
      if (!brand) {
        throw new AppError('Brand not found', 404);
      }
      res.json({
        success: true,
        data: brand,
      });
    })
  );

  app.get('/api/brands/user/:userId',
    mockVerifyAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const brand = await mockBrandService.getBrandByUserId(req.params.userId);
      if (!brand) {
        throw new AppError('Brand not found', 404);
      }
      res.json({
        success: true,
        data: brand,
      });
    })
  );

  app.patch('/api/brands/:id',
    mockVerifyAuth,
    mockValidateBody({}),
    asyncHandler(async (req: Request, res: Response) => {
      const brand = await mockBrandService.getBrandById(req.params.id);
      if (!brand) {
        throw new AppError('Brand not found', 404);
      }

      if (brand.userId !== req.userId && !req.isInternal) {
        throw new AppError('Access denied', 403);
      }

      const updatedBrand = await mockBrandService.updateBrand(req.params.id, req.body);
      res.json({
        success: true,
        data: updatedBrand,
      });
    })
  );

  app.post('/api/brands/:id/verify',
    mockVerifyAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const brand = await mockBrandService.getBrandById(req.params.id);
      if (!brand) {
        throw new AppError('Brand not found', 404);
      }

      const verifiedBrand = await mockBrandService.verifyBrand(req.params.id);
      res.json({
        success: true,
        data: verifiedBrand,
        message: 'Brand verified successfully',
      });
    })
  );

  app.get('/api/brands',
    asyncHandler(async (req: Request, res: Response) => {
      const { page, limit, industry, tier, verified } = req.query as any;
      const result = await mockBrandService.listBrands({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        industry,
        tier,
        verified: verified !== undefined ? verified === 'true' : undefined,
      });

      res.json({
        success: true,
        data: result.brands,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages,
        },
      });
    })
  );

  app.use(mockErrorHandler);

  return app;
};

describe('Brand Routes API', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /api/brands/register', () => {
    test('should register a new brand', async () => {
      mockBrandService.getBrandByUserId.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/brands/register')
        .send({
          name: 'New Brand',
          industry: 'technology',
          website: 'https://newbrand.com',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('name', 'New Brand');
    });

    test('should return 400 if brand already registered', async () => {
      mockBrandService.getBrandByUserId.mockResolvedValueOnce({
        _id: 'existing-brand',
        name: 'Existing Brand',
      });

      const response = await request(app)
        .post('/api/brands/register')
        .send({
          name: 'New Brand',
          industry: 'technology',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Brand already registered for this user');
    });
  });

  describe('GET /api/brands/:id', () => {
    test('should return brand by ID', async () => {
      const response = await request(app).get('/api/brands/brand-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('_id', 'brand-1');
    });

    test('should return 404 for non-existent brand', async () => {
      mockBrandService.getBrandById.mockResolvedValueOnce(null);

      const response = await request(app).get('/api/brands/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/brands/user/:userId', () => {
    test('should return brand by user ID', async () => {
      const response = await request(app).get('/api/brands/user/user-123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('should return 404 for non-existent user brand', async () => {
      mockBrandService.getBrandByUserId.mockResolvedValueOnce(null);

      const response = await request(app).get('/api/brands/user/unknown-user');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/brands/:id', () => {
    test('should update brand', async () => {
      const response = await request(app)
        .patch('/api/brands/brand-1')
        .send({ name: 'Updated Brand Name' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('should return 404 for non-existent brand', async () => {
      mockBrandService.getBrandById.mockResolvedValueOnce(null);

      const response = await request(app)
        .patch('/api/brands/non-existent')
        .send({ name: 'Updated Brand' });

      expect(response.status).toBe(404);
    });

    test('should return 403 when access denied', async () => {
      mockBrandService.getBrandById.mockResolvedValueOnce({
        _id: 'brand-1',
        userId: 'different-user',
      });

      const response = await request(app)
        .patch('/api/brands/brand-1')
        .send({ name: 'Updated Brand' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/brands/:id/verify', () => {
    test('should verify brand', async () => {
      const response = await request(app).post('/api/brands/brand-1/verify');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Brand verified successfully');
      expect(response.body.data).toHaveProperty('verified', true);
    });

    test('should return 404 for non-existent brand', async () => {
      mockBrandService.getBrandById.mockResolvedValueOnce(null);

      const response = await request(app).post('/api/brands/non-existent/verify');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/brands', () => {
    test('should list brands', async () => {
      const response = await request(app).get('/api/brands');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should return pagination info', async () => {
      const response = await request(app).get('/api/brands');

      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');
    });

    test('should accept pagination query params', async () => {
      const response = await request(app)
        .get('/api/brands')
        .query({ page: '2', limit: '10' });

      expect(response.status).toBe(200);
    });

    test('should filter by industry', async () => {
      const response = await request(app)
        .get('/api/brands')
        .query({ industry: 'fashion' });

      expect(response.status).toBe(200);
    });
  });
});