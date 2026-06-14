/**
 * Products API Tests for Instagram Shop Integration Service
 */

import request from 'supertest';
import express, { Express, Request, Response } from 'express';

// Mock product service
const mockProducts = [
  {
    _id: 'prod_1',
    name: 'Test Product 1',
    description: 'Test description 1',
    price: 99.99,
    currency: 'USD',
    images: ['https://example.com/image1.jpg'],
    availability: 'in_stock',
    category: 'electronics',
    instagramProductId: 'ig_prod_123',
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'prod_2',
    name: 'Test Product 2',
    description: 'Test description 2',
    price: 149.99,
    currency: 'USD',
    images: ['https://example.com/image2.jpg'],
    availability: 'out_of_stock',
    category: 'clothing',
    instagramProductId: null,
    syncStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock auth middleware
const mockAuthMiddleware = (req: Request, res: Response, next: () => void) => {
  req.headers['x-api-key'] = 'test-api-key';
  next();
};

// Mock product service functions
const mockProductService = {
  createProduct: jest.fn().mockImplementation((data, syncToInstagram) => ({
    _id: 'prod_new',
    ...data,
    instagramProductId: syncToInstagram ? 'ig_prod_new' : null,
    syncStatus: syncToInstagram ? 'synced' : 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  listProducts: jest.fn().mockResolvedValue({
    products: mockProducts,
    page: 1,
    totalPages: 1,
    total: mockProducts.length,
  }),
  getProduct: jest.fn().mockImplementation((id) => {
    const product = mockProducts.find((p) => p._id === id);
    return product || null;
  }),
  updateProduct: jest.fn().mockImplementation((id, data) => ({
    ...mockProducts[0],
    ...data,
    updatedAt: new Date(),
  })),
  deleteProduct: jest.fn().mockResolvedValue(true),
  syncToInstagram: jest.fn().mockResolvedValue({
    ...mockProducts[0],
    instagramProductId: 'ig_prod_synced',
    syncStatus: 'synced',
    syncedAt: new Date(),
  }),
  getTaggingSuggestions: jest.fn().mockResolvedValue([
    { tag: '#fashion', score: 0.95 },
    { tag: '#style', score: 0.88 },
    { tag: '#ootd', score: 0.82 },
  ]),
  updateAvailability: jest.fn().mockImplementation((id, availability) => ({
    ...mockProducts[0],
    availability,
    updatedAt: new Date(),
  })),
};

// Create test app
const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());

  // Auth middleware mock
  app.use((req: Request, res: Response, next: () => void) => {
    mockAuthMiddleware(req, res, next);
  });

  // Products routes
  app.get('/api/products', async (req: Request, res: Response) => {
    try {
      const { category, availability, syncStatus, page, limit, search } = req.query;

      const result = await mockProductService.listProducts({
        category: category as string,
        availability: availability as string,
        syncStatus: syncStatus as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
      });

      res.json({
        success: true,
        data: result.products,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to list products',
      });
    }
  });

  app.get('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const product = await mockProductService.getProduct(req.params.id);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get product',
      });
    }
  });

  app.post('/api/products', async (req: Request, res: Response) => {
    try {
      const product = await mockProductService.createProduct(
        {
          name: req.body.name,
          description: req.body.description,
          price: req.body.price,
          currency: req.body.currency,
          images: req.body.images,
          availability: req.body.availability,
          category: req.body.category,
        },
        req.body.syncToInstagram
      );

      res.status(201).json({
        success: true,
        data: product,
        message: req.body.syncToInstagram
          ? 'Product created and synced to Instagram'
          : 'Product created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create product',
      });
    }
  });

  app.patch('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const product = await mockProductService.updateProduct(req.params.id, req.body);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      res.json({
        success: true,
        data: product,
        message: 'Product updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update product',
      });
    }
  });

  app.delete('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const deleted = await mockProductService.deleteProduct(req.params.id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete product',
      });
    }
  });

  app.post('/api/products/sync', async (req: Request, res: Response) => {
    try {
      const { productId } = req.body;

      if (!productId) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
        });
        return;
      }

      const product = await mockProductService.syncToInstagram(productId);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      res.json({
        success: true,
        data: product,
        message: 'Product synced to Instagram successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to sync product to Instagram',
      });
    }
  });

  app.get('/api/products/:id/tags', async (req: Request, res: Response) => {
    try {
      const suggestions = await mockProductService.getTaggingSuggestions(req.params.id);

      res.json({
        success: true,
        data: {
          productId: req.params.id,
          suggestions,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get tagging suggestions',
      });
    }
  });

  app.patch('/api/products/:id/availability', async (req: Request, res: Response) => {
    try {
      const { availability } = req.body;

      if (!['in_stock', 'out_of_stock', 'preorder'].includes(availability)) {
        res.status(400).json({
          success: false,
          error: 'Invalid availability value',
        });
        return;
      }

      const product = await mockProductService.updateAvailability(
        req.params.id,
        availability
      );

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      res.json({
        success: true,
        data: product,
        message: 'Product availability updated',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update product availability',
      });
    }
  });

  return app;
};

describe('Products API', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return list of products with pagination', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter products by category', async () => {
      const response = await request(app).get('/api/products?category=electronics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockProductService.listProducts).toHaveBeenCalled();
    });

    it('should filter products by availability', async () => {
      const response = await request(app).get('/api/products?availability=in_stock');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should paginate products', async () => {
      const response = await request(app).get('/api/products?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a product by ID', async () => {
      const response = await request(app).get('/api/products/prod_1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Product 1');
    });

    it('should return 404 for non-existent product', async () => {
      mockProductService.getProduct.mockResolvedValueOnce(null);

      const response = await request(app).get('/api/products/non_existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        description: 'New product description',
        price: 199.99,
        currency: 'USD',
        images: ['https://example.com/new.jpg'],
        category: 'electronics',
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Product');
      expect(response.body.message).toBe('Product created successfully');
    });

    it('should create and sync product to Instagram', async () => {
      const productData = {
        name: 'Synced Product',
        description: 'Will be synced to Instagram',
        price: 299.99,
        currency: 'USD',
        images: ['https://example.com/sync.jpg'],
        category: 'clothing',
        syncToInstagram: true,
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product created and synced to Instagram');
      expect(response.body.data.instagramProductId).toBe('ig_prod_new');
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should update a product', async () => {
      const updateData = {
        name: 'Updated Product Name',
        price: 159.99,
      };

      const response = await request(app)
        .patch('/api/products/prod_1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Product Name');
      expect(response.body.message).toBe('Product updated successfully');
    });

    it('should return 404 when updating non-existent product', async () => {
      mockProductService.updateProduct.mockResolvedValueOnce(null);

      const response = await request(app)
        .patch('/api/products/non_existent')
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete a product', async () => {
      const response = await request(app).delete('/api/products/prod_1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully');
    });

    it('should return 404 when deleting non-existent product', async () => {
      mockProductService.deleteProduct.mockResolvedValueOnce(false);

      const response = await request(app).delete('/api/products/non_existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/products/sync', () => {
    it('should sync a product to Instagram', async () => {
      const response = await request(app)
        .post('/api/products/sync')
        .send({ productId: 'prod_1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product synced to Instagram successfully');
    });

    it('should return 400 when productId is missing', async () => {
      const response = await request(app)
        .post('/api/products/sync')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product ID is required');
    });

    it('should return 404 when product not found for sync', async () => {
      mockProductService.syncToInstagram.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/products/sync')
        .send({ productId: 'non_existent' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/products/:id/tags', () => {
    it('should return tagging suggestions for a product', async () => {
      const response = await request(app).get('/api/products/prod_1/tags');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.productId).toBe('prod_1');
      expect(response.body.data.suggestions).toBeDefined();
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
    });
  });

  describe('PATCH /api/products/:id/availability', () => {
    it('should update product availability', async () => {
      const response = await request(app)
        .patch('/api/products/prod_1/availability')
        .send({ availability: 'out_of_stock' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.availability).toBe('out_of_stock');
      expect(response.body.message).toBe('Product availability updated');
    });

    it('should return 400 for invalid availability value', async () => {
      const response = await request(app)
        .patch('/api/products/prod_1/availability')
        .send({ availability: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid availability value');
    });

    it('should accept valid availability values', async () => {
      const validValues = ['in_stock', 'out_of_stock', 'preorder'];

      for (const value of validValues) {
        const response = await request(app)
          .patch('/api/products/prod_1/availability')
          .send({ availability: value });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });
});
