/**
 * Product Service Tests
 */

import { productService } from '../services/productService';
import { Product } from '../models';

describe('ProductService', () => {
  beforeAll(async () => {
    // Setup test database connection if needed
  });

  afterAll(async () => {
    // Cleanup after tests
  });

  describe('createProduct', () => {
    it('should create a product with valid data', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product description',
        price: 999,
        images: ['https://example.com/image.jpg'],
        category: 'Electronics',
      };

      const product = await productService.createProduct(productData, false);

      expect(product).toBeDefined();
      expect(product.name).toBe(productData.name);
      expect(product.description).toBe(productData.description);
      expect(product.price).toBe(productData.price);
      expect(product.syncStatus).toBe('pending');

      // Cleanup
      await Product.findByIdAndDelete(product._id);
    });

    it('should set default values correctly', async () => {
      const productData = {
        name: 'Test Product 2',
        description: 'Description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
      };

      const product = await productService.createProduct(productData);

      expect(product.currency).toBe('INR');
      expect(product.availability).toBe('in_stock');
      expect(product.syncStatus).toBe('pending');

      // Cleanup
      await Product.findByIdAndDelete(product._id);
    });
  });

  describe('getProduct', () => {
    it('should return product by ID', async () => {
      const productData = {
        name: 'Test Product 3',
        description: 'Description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
      };

      const created = await productService.createProduct(productData, false);
      const found = await productService.getProduct(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);

      // Cleanup
      await Product.findByIdAndDelete(created._id);
    });

    it('should return null for non-existent product', async () => {
      const found = await productService.getProduct('nonexistent123');
      expect(found).toBeNull();
    });
  });

  describe('updateProduct', () => {
    it('should update product fields', async () => {
      const productData = {
        name: 'Original Name',
        description: 'Original Description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
      };

      const created = await productService.createProduct(productData, false);
      const updated = await productService.updateProduct(created.id, {
        name: 'Updated Name',
        price: 200,
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.price).toBe(200);
      expect(updated?.description).toBe('Original Description');

      // Cleanup
      await Product.findByIdAndDelete(created._id);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product', async () => {
      const productData = {
        name: 'Product to Delete',
        description: 'Will be deleted',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
      };

      const created = await productService.createProduct(productData, false);
      const deleted = await productService.deleteProduct(created.id);

      expect(deleted).toBe(true);

      const found = await productService.getProduct(created.id);
      expect(found).toBeNull();
    });
  });

  describe('listProducts', () => {
    it('should list products with pagination', async () => {
      const result = await productService.listProducts({
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(result.products).toBeDefined();
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBeGreaterThanOrEqual(0);
    });

    it('should filter by category', async () => {
      const result = await productService.listProducts({
        category: 'NonExistentCategory',
        page: 1,
        limit: 10,
      });

      expect(result.products.length).toBe(0);
    });
  });
});
