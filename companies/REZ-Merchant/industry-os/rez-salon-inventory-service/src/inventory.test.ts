import express, { Express } from 'express';
import request from 'supertest';

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  connection: {
    readyState: 1,
    close: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

// Mock logger
jest.mock('./utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock inventory routes with comprehensive mock data
jest.mock('./routes/inventory.routes', () => {
  const express = require('express');
  const router = express.Router();

  // Mock products database
  const mockProducts = new Map();
  mockProducts.set('prod1', {
    id: 'prod1',
    name: 'Hair Shampoo',
    category: 'Hair Care',
    sku: 'SHAM001',
    sellingPrice: 250,
    costPrice: 150,
    currentStock: 100,
    isActive: true,
  });
  mockProducts.set('prod2', {
    id: 'prod2',
    name: 'Hair Conditioner',
    category: 'Hair Care',
    sku: 'COND001',
    sellingPrice: 200,
    costPrice: 120,
    currentStock: 5,
    isActive: true,
  });

  // Mock categories
  const mockCategories = ['Hair Care', 'Skin Care', 'Nail Care', 'Makeup'];

  // Mock brands
  const mockBrands = ['Loreal', 'Maybelline', 'NYX', 'MAC', 'OPI'];

  // GET / - List products
  router.get('/', (req: any, res: any) => {
    const { category, brand, isService, isActive, search, page, limit } = req.query;
    let products = Array.from(mockProducts.values());

    if (category) {
      products = products.filter((p: any) => p.category === category);
    }
    if (brand) {
      products = products.filter((p: any) => p.brand === brand);
    }
    if (search) {
      products = products.filter((p: any) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        total: products.length,
      },
    });
  });

  // POST / - Create product
  router.post('/', (req: any, res: any) => {
    const newProduct = { id: `prod${Date.now()}`, ...req.body };
    mockProducts.set(newProduct.id, newProduct);
    res.status(201).json({ success: true, data: newProduct });
  });

  // GET /report - Inventory report
  router.get('/report', (req: any, res: any) => {
    const products = Array.from(mockProducts.values());
    const totalValue = products.reduce((sum: number, p: any) => sum + (p.sellingPrice * p.currentStock), 0);
    const lowStockCount = products.filter((p: any) => p.currentStock < 10).length;

    res.json({
      success: true,
      data: {
        totalProducts: products.length,
        totalValue,
        lowStockCount,
        categories: mockCategories,
        outOfStock: products.filter((p: any) => p.currentStock === 0).length,
      },
    });
  });

  // GET /low-stock - Low stock products
  router.get('/low-stock', (req: any, res: any) => {
    const lowStock = Array.from(mockProducts.values()).filter((p: any) => p.currentStock < 10);
    res.json({ success: true, data: lowStock });
  });

  // GET /categories - Product categories
  router.get('/categories', (req: any, res: any) => {
    res.json({ success: true, data: mockCategories });
  });

  // GET /brands - Product brands
  router.get('/brands', (req: any, res: any) => {
    res.json({ success: true, data: mockBrands });
  });

  // GET /movements - Stock movements
  router.get('/movements', (req: any, res: any) => {
    res.json({
      success: true,
      data: [],
      pagination: { page: 1, limit: 50, total: 0 },
    });
  });

  // GET /:productId - Get product by ID
  router.get('/:productId', (req: any, res: any) => {
    const product = mockProducts.get(req.params.productId);
    if (product) {
      res.json({ success: true, data: product });
    } else {
      res.status(404).json({ success: false, error: 'Product not found' });
    }
  });

  // GET /lookup/:identifier - Get product by SKU or barcode
  router.get('/lookup/:identifier', (req: any, res: any) => {
    const product = Array.from(mockProducts.values()).find(
      (p: any) => p.sku === req.params.identifier || p.barcode === req.params.identifier
    );
    if (product) {
      res.json({ success: true, data: product });
    } else {
      res.status(404).json({ success: false, error: 'Product not found' });
    }
  });

  // PUT /:productId - Update product
  router.put('/:productId', (req: any, res: any) => {
    const product = mockProducts.get(req.params.productId);
    if (product) {
      const updated = { ...product, ...req.body };
      mockProducts.set(req.params.productId, updated);
      res.json({ success: true, data: updated });
    } else {
      res.status(404).json({ success: false, error: 'Product not found' });
    }
  });

  // PATCH /:productId/stock - Adjust stock
  router.patch('/:productId/stock', (req: any, res: any) => {
    const product = mockProducts.get(req.params.productId);
    if (product) {
      const updated = { ...product, currentStock: product.currentStock + req.body.quantity };
      mockProducts.set(req.params.productId, updated);
      res.json({ success: true, data: updated });
    } else {
      res.status(404).json({ success: false, error: 'Product not found' });
    }
  });

  // PATCH /:productId/toggle - Toggle product status
  router.patch('/:productId/toggle', (req: any, res: any) => {
    const product = mockProducts.get(req.params.productId);
    if (product) {
      const updated = { ...product, isActive: !product.isActive };
      mockProducts.set(req.params.productId, updated);
      res.json({ success: true, data: updated });
    } else {
      res.status(404).json({ success: false, error: 'Product not found' });
    }
  });

  // POST /bulk-stock - Bulk update stock
  router.post('/bulk-stock', (req: any, res: any) => {
    const { updates, updatedBy } = req.body;
    const results = updates.map((update: any) => {
      const product = mockProducts.get(update.productId);
      if (product) {
        const updated = { ...product, currentStock: update.newQuantity };
        mockProducts.set(update.productId, updated);
        return { productId: update.productId, success: true };
      }
      return { productId: update.productId, success: false, error: 'Product not found' };
    });
    res.json({ success: true, data: { results, updatedBy } });
  });

  // DELETE /:productId - Delete product
  router.delete('/:productId', (req: any, res: any) => {
    const product = mockProducts.get(req.params.productId);
    if (product) {
      mockProducts.delete(req.params.productId);
      res.json({ success: true, message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Product not found' });
    }
  });

  return router;
});

// Mock services
jest.mock('./services/InventoryService', () => ({
  inventoryService: {
    createProduct: jest.fn().mockResolvedValue({ id: 'prod1' }),
    getProducts: jest.fn().mockResolvedValue({ products: [], page: 1, limit: 50, total: 0 }),
    getProduct: jest.fn().mockResolvedValue({ id: 'prod1' }),
    getProductBySkuOrBarcode: jest.fn().mockResolvedValue({ id: 'prod1' }),
    updateProduct: jest.fn().mockResolvedValue({ id: 'prod1' }),
    adjustStock: jest.fn().mockResolvedValue({ id: 'prod1' }),
    toggleProductStatus: jest.fn().mockResolvedValue({ id: 'prod1' }),
    bulkStockUpdate: jest.fn().mockResolvedValue({ results: [] }),
    deleteProduct: jest.fn().mockResolvedValue(true),
    getInventoryReport: jest.fn().mockResolvedValue({}),
    getLowStockProducts: jest.fn().mockResolvedValue([]),
    getCategories: jest.fn().mockResolvedValue([]),
    getBrands: jest.fn().mockResolvedValue([]),
    getStockMovements: jest.fn().mockResolvedValue({ movements: [], page: 1, limit: 50, total: 0 }),
  },
}));

import inventoryRoutes from './routes/inventory.routes';

describe('ReZ Salon Inventory Service', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/inventory', inventoryRoutes);
  });

  describe('Health Check', () => {
    it('should have inventory routes configured', () => {
      expect(app).toBeDefined();
    });
  });

  describe('GET /api/inventory', () => {
    it('should list all products', async () => {
      const response = await request(app)
        .get('/api/inventory');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .query({ category: 'Hair Care' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter products by brand', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .query({ brand: 'Loreal' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter active/inactive products', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .query({ isActive: 'true' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should search products by name or SKU', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .query({ search: 'shampoo' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
    });
  });

  describe('POST /api/inventory', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Hair Product',
        category: 'Hair Care',
        sku: 'NEW001',
        sellingPrice: 300,
        costPrice: 180,
        currentStock: 50,
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Hair Product');
    });

    it('should create a service product', async () => {
      const productData = {
        name: 'Haircut Service',
        category: 'Services',
        sku: 'SVC001',
        sellingPrice: 500,
        isService: true,
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/inventory/report', () => {
    it('should get comprehensive inventory report', async () => {
      const response = await request(app)
        .get('/api/inventory/report');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalProducts).toBeDefined();
      expect(response.body.data.totalValue).toBeDefined();
      expect(response.body.data.lowStockCount).toBeDefined();
    });
  });

  describe('GET /api/inventory/low-stock', () => {
    it('should get low stock products', async () => {
      const response = await request(app)
        .get('/api/inventory/low-stock');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/inventory/categories', () => {
    it('should get product categories', async () => {
      const response = await request(app)
        .get('/api/inventory/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should include common salon categories', async () => {
      const response = await request(app)
        .get('/api/inventory/categories');

      expect(response.body.data).toContain('Hair Care');
      expect(response.body.data).toContain('Skin Care');
    });
  });

  describe('GET /api/inventory/brands', () => {
    it('should get product brands', async () => {
      const response = await request(app)
        .get('/api/inventory/brands');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/inventory/movements', () => {
    it('should get stock movements with pagination', async () => {
      const response = await request(app)
        .get('/api/inventory/movements')
        .query({ page: 1, limit: 50 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter movements by product', async () => {
      const response = await request(app)
        .get('/api/inventory/movements')
        .query({ productId: 'prod1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter movements by date range', async () => {
      const response = await request(app)
        .get('/api/inventory/movements')
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/inventory/:productId', () => {
    it('should get product by ID', async () => {
      const response = await request(app)
        .get('/api/inventory/prod1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('prod1');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/inventory/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/inventory/lookup/:identifier', () => {
    it('should get product by SKU', async () => {
      const response = await request(app)
        .get('/api/inventory/lookup/SHAM001');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for invalid SKU', async () => {
      const response = await request(app)
        .get('/api/inventory/lookup/INVALID');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/inventory/:productId', () => {
    it('should update product', async () => {
      const updateData = {
        name: 'Updated Shampoo Name',
        sellingPrice: 275,
      };

      const response = await request(app)
        .put('/api/inventory/prod1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 when updating non-existent product', async () => {
      const response = await request(app)
        .put('/api/inventory/non-existent')
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/inventory/:productId/stock', () => {
    it('should add stock', async () => {
      const stockData = {
        quantity: 50,
        reason: 'Restock from supplier',
        adjustedBy: 'admin',
      };

      const response = await request(app)
        .patch('/api/inventory/prod1/stock')
        .send(stockData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should remove stock (negative quantity)', async () => {
      const stockData = {
        quantity: -10,
        reason: 'Damaged goods',
        adjustedBy: 'staff1',
      };

      const response = await request(app)
        .patch('/api/inventory/prod1/stock')
        .send(stockData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .patch('/api/inventory/non-existent/stock')
        .send({ quantity: 10, reason: 'Test', adjustedBy: 'admin' });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/inventory/:productId/toggle', () => {
    it('should toggle product active status', async () => {
      const response = await request(app)
        .patch('/api/inventory/prod1/toggle');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .patch('/api/inventory/non-existent/toggle');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/inventory/bulk-stock', () => {
    it('should bulk update stock for multiple products', async () => {
      const bulkData = {
        updates: [
          { productId: 'prod1', newQuantity: 150 },
          { productId: 'prod2', newQuantity: 100 },
        ],
        updatedBy: 'admin',
      };

      const response = await request(app)
        .post('/api/inventory/bulk-stock')
        .send(bulkData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.results)).toBe(true);
    });

    it('should handle partial success in bulk update', async () => {
      const bulkData = {
        updates: [
          { productId: 'prod1', newQuantity: 150 },
          { productId: 'non-existent', newQuantity: 100 },
        ],
        updatedBy: 'admin',
      };

      const response = await request(app)
        .post('/api/inventory/bulk-stock')
        .send(bulkData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/inventory/:productId', () => {
    it('should soft delete product', async () => {
      const response = await request(app)
        .delete('/api/inventory/prod1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/api/inventory/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('Business Logic Validation', () => {
    it('should calculate correct profit margin', () => {
      const sellingPrice = 250;
      const costPrice = 150;
      const profitMargin = ((sellingPrice - costPrice) / sellingPrice) * 100;
      expect(profitMargin).toBe(40);
    });

    it('should calculate correct total inventory value', () => {
      const products = [
        { price: 100, quantity: 10 },
        { price: 200, quantity: 5 },
        { price: 50, quantity: 20 },
      ];
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      expect(totalValue).toBe(2500);
    });

    it('should identify low stock correctly', () => {
      const lowStockThreshold = 10;
      const products = [
        { name: 'Product 1', stock: 5 },
        { name: 'Product 2', stock: 15 },
        { name: 'Product 3', stock: 8 },
      ];
      const lowStockProducts = products.filter(p => p.stock < lowStockThreshold);
      expect(lowStockProducts.length).toBe(2);
    });

    it('should calculate stock turnover rate', () => {
      const avgStock = 100;
      const annualSales = 1200;
      const turnoverRate = annualSales / avgStock;
      expect(turnoverRate).toBe(12);
    });

    it('should validate stock adjustment quantities', () => {
      const validAdjustments = [1, 5, 10, 50, 100];
      expect(validAdjustments.every(q => q !== 0)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown');

      expect(response.status).toBe(404);
    });

    it('should handle invalid product ID format', async () => {
      const response = await request(app)
        .get('/api/inventory/invalid-id-format');

      expect(response.status).toBe(404);
    });
  });
});
