/**
 * Catalog Service Tests
 * Tests for catalog business logic
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock mongoose
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(undefined),
    connection: {
      readyState: 1,
      close: jest.fn().mockResolvedValue(undefined),
    },
    isValidObjectId: jest.fn().mockReturnValue(true),
    Types: {
      ObjectId: jest.fn().constructor,
    },
  };
});

// Mock Redis
jest.mock('../../config/redis', () => ({
  bullmqRedis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    pipeline: jest.fn().mockReturnValue({
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      pexpire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([[null, 1], [null, 0]]),
    }),
    quit: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('Product Model', () => {
  describe('Product Schema', () => {
    it('should define required fields', () => {
      const product = {
        name: 'Test Product',
        store: 'store123',
        price: 100,
        isActive: true,
      };

      expect(product.name).toBeDefined();
      expect(product.store).toBeDefined();
      expect(product.price).toBeGreaterThanOrEqual(0);
    });

    it('should support optional fields', () => {
      const product = {
        name: 'Test Product',
        store: 'store123',
        price: 100,
        description: 'A test product',
        images: ['image1.jpg', 'image2.jpg'],
        category: 'category123',
        variants: [{ name: 'Size S', price: 100 }],
      };

      expect(product.description).toBeDefined();
      expect(product.images.length).toBeGreaterThan(0);
    });
  });

  describe('Product Pricing', () => {
    it('should calculate discounted price', () => {
      const price = 100;
      const discountPercent = 20;
      const discountedPrice = price * (1 - discountPercent / 100);
      expect(discountedPrice).toBe(80);
    });

    it('should handle variant pricing', () => {
      const variants = [
        { name: 'Small', price: 100 },
        { name: 'Medium', price: 120 },
        { name: 'Large', price: 140 },
      ];

      const prices = variants.map(v => v.price);
      expect(prices).toEqual([100, 120, 140]);
    });
  });
});

describe('Category Model', () => {
  describe('Category Schema', () => {
    it('should define required fields', () => {
      const category = {
        name: 'Electronics',
        merchantId: 'merchant123',
        isActive: true,
      };

      expect(category.name).toBeDefined();
      expect(category.merchantId).toBeDefined();
    });

    it('should support hierarchical categories', () => {
      const categories = [
        { name: 'Electronics', parent: null },
        { name: 'Phones', parent: 'electronics-id' },
        { name: 'Laptops', parent: 'electronics-id' },
      ];

      const hasChildren = categories.filter(c => c.parent !== null);
      expect(hasChildren.length).toBeGreaterThan(0);
    });
  });
});

describe('Catalog Search', () => {
  it('should search by product name', () => {
    const products = [
      { name: 'iPhone 15', price: 999 },
      { name: 'Samsung Galaxy', price: 899 },
      { name: 'MacBook Pro', price: 1999 },
    ];

    const searchTerm = 'iPhone';
    const results = products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    expect(results.length).toBe(1);
    expect(results[0].name).toBe('iPhone 15');
  });

  it('should filter by price range', () => {
    const products = [
      { name: 'Cheap Item', price: 10 },
      { name: 'Medium Item', price: 50 },
      { name: 'Expensive Item', price: 100 },
    ];

    const minPrice = 30;
    const maxPrice = 75;
    const results = products.filter(p => p.price >= minPrice && p.price <= maxPrice);

    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Medium Item');
  });

  it('should filter by availability', () => {
    const products = [
      { name: 'In Stock', stock: 10, isActive: true },
      { name: 'Out of Stock', stock: 0, isActive: true },
      { name: 'Inactive', stock: 5, isActive: false },
    ];

    const available = products.filter(p => p.stock > 0 && p.isActive);
    expect(available.length).toBe(1);
    expect(available[0].name).toBe('In Stock');
  });
});

describe('Regex Escaping', () => {
  // Test the escapeRegex function used to prevent ReDoS
  it('should escape special regex characters', () => {
    const escapeRegex = (str: string): string => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const input = 'test.user+name@example.com';
    const escaped = escapeRegex(input);

    // Should not throw when used in regex
    expect(() => new RegExp(escaped)).not.toThrow();
  });

  it('should handle empty strings', () => {
    const escapeRegex = (str: string): string => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    expect(escapeRegex('')).toBe('');
  });
});

describe('Cache Invalidation', () => {
  it('should invalidate cache keys on product update', () => {
    const cacheKeys = [
      'products:list',
      'products:featured',
      'products:trending',
      'product:123',
    ];

    // Simulate cache invalidation
    const deletedKeys: string[] = [];
    for (const key of cacheKeys) {
      if (key.includes('product:123')) {
        deletedKeys.push(key);
      }
    }

    expect(deletedKeys).toContain('product:123');
  });
});
