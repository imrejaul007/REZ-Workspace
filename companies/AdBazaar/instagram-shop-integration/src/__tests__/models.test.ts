/**
 * Model Tests for Instagram Shop Integration
 * Tests MongoDB schemas and model validation
 */

import mongoose from 'mongoose';
import { Product, IProduct, ProductAvailability } from '../models/Product';
import { ShopOrder, IShopOrder } from '../models/ShopOrder';
import { Analytics, IAnalytics } from '../models/Analytics';

describe('Product Model', () => {
  describe('Schema Validation', () => {
    it('should require name field', () => {
      const product = new Product({
        description: 'Test description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        catalogId: 'catalog-123',
      });

      const error = product.validateSync();
      expect(error?.errors.name).toBeDefined();
    });

    it('should require description field', () => {
      const product = new Product({
        name: 'Test Product',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        catalogId: 'catalog-123',
      });

      const error = product.validateSync();
      expect(error?.errors.description).toBeDefined();
    });

    it('should require price field', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        catalogId: 'catalog-123',
      });

      const error = product.validateSync();
      expect(error?.errors.price).toBeDefined();
    });

    it('should require at least one image', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        images: [],
        category: 'Test',
        catalogId: 'catalog-123',
      });

      const error = product.validateSync();
      expect(error?.errors.images).toBeDefined();
    });

    it('should limit images to 20', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        images: Array(21).fill('https://example.com/image.jpg'),
        category: 'Test',
        catalogId: 'catalog-123',
      });

      const error = product.validateSync();
      expect(error?.errors.images).toBeDefined();
    });

    it('should require category field', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        catalogId: 'catalog-123',
      });

      const error = product.validateSync();
      expect(error?.errors.category).toBeDefined();
    });

    it('should require catalogId field', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
      });

      const error = product.validateSync();
      expect(error?.errors.catalogId).toBeDefined();
    });

    it('should set default currency to INR', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        catalogId: 'catalog-123',
      });

      expect(product.currency).toBe('INR');
    });

    it('should set default availability to in_stock', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        catalogId: 'catalog-123',
      });

      expect(product.availability).toBe('in_stock');
    });

    it('should set default syncStatus to pending', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        catalogId: 'catalog-123',
      });

      expect(product.syncStatus).toBe('pending');
    });

    it('should accept valid availability values', () => {
      const validValues: ProductAvailability[] = ['in_stock', 'out_of_stock', 'preorder'];

      validValues.forEach((value) => {
        const product = new Product({
          name: 'Test Product',
          description: 'Test description',
          price: 100,
          images: ['https://example.com/image.jpg'],
          category: 'Test',
          catalogId: 'catalog-123',
          availability: value,
        });

        const error = product.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid availability values', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        catalogId: 'catalog-123',
        availability: 'invalid_status' as ProductAvailability,
      });

      const error = product.validateSync();
      expect(error?.errors.availability).toBeDefined();
    });

    it('should reject negative price', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: -100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        catalogId: 'catalog-123',
      });

      const error = product.validateSync();
      expect(error?.errors.price).toBeDefined();
    });

    it('should accept zero price', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 0,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        catalogId: 'catalog-123',
      });

      const error = product.validateSync();
      expect(error).toBeUndefined();
    });

    it('should limit name to 500 characters', () => {
      const product = new Product({
        name: 'A'.repeat(501),
        description: 'Test description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        catalogId: 'catalog-123',
      });

      const error = product.validateSync();
      expect(error?.errors.name).toBeDefined();
    });

    it('should limit description to 2000 characters', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'A'.repeat(2001),
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        catalogId: 'catalog-123',
      });

      const error = product.validateSync();
      expect(error?.errors.description).toBeDefined();
    });
  });

  describe('toJSON transformation', () => {
    it('should transform _id to id', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        catalogId: 'catalog-123',
      });

      const json = product.toJSON();
      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
    });

    it('should remove __v from JSON', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        catalogId: 'catalog-123',
      });

      const json = product.toJSON();
      expect(json.__v).toBeUndefined();
    });
  });

  describe('Indexes', () => {
    it('should have catalogId index', () => {
      const indexes = Product.schema.indexes();
      expect(indexes).toContainEqual(['catalogId', 1]);
    });

    it('should have instagramProductId sparse index', () => {
      const indexes = Product.schema.indexes();
      const igIndex = indexes.find(
        (idx) => idx[0] && typeof idx[0] === 'object' && 'instagramProductId' in idx[0]
      );
      expect(igIndex).toBeDefined();
    });

    it('should have category index', () => {
      const indexes = Product.schema.indexes();
      expect(indexes).toContainEqual(['category', 1]);
    });

    it('should have text index on name and description', () => {
      const indexes = Product.schema.indexes();
      const textIndex = indexes.find(
        (idx) => idx[0] && typeof idx[0] === 'object' && '$text' in idx[0]
      );
      expect(textIndex).toBeDefined();
    });
  });
});

describe('ShopOrder Model', () => {
  describe('Schema Validation', () => {
    it('should require orderId field', () => {
      const order = new ShopOrder({
        shopOrderId: 'shop-123',
        customerId: 'cust-123',
        products: [{ productId: 'prod-1', quantity: 1, price: 100 }],
        totalAmount: 100,
      });

      const error = order.validateSync();
      expect(error?.errors.orderId).toBeDefined();
    });

    it('should require shopOrderId field', () => {
      const order = new ShopOrder({
        orderId: 'IG-ORDER-123',
        customerId: 'cust-123',
        products: [{ productId: 'prod-1', quantity: 1, price: 100 }],
        totalAmount: 100,
      });

      const error = order.validateSync();
      expect(error?.errors.shopOrderId).toBeDefined();
    });

    it('should require customerId field', () => {
      const order = new ShopOrder({
        orderId: 'IG-ORDER-123',
        shopOrderId: 'shop-123',
        products: [{ productId: 'prod-1', quantity: 1, price: 100 }],
        totalAmount: 100,
      });

      const error = order.validateSync();
      expect(error?.errors.customerId).toBeDefined();
    });

    it('should require products array', () => {
      const order = new ShopOrder({
        orderId: 'IG-ORDER-123',
        shopOrderId: 'shop-123',
        customerId: 'cust-123',
        totalAmount: 100,
      });

      const error = order.validateSync();
      expect(error?.errors.products).toBeDefined();
    });

    it('should require totalAmount field', () => {
      const order = new ShopOrder({
        orderId: 'IG-ORDER-123',
        shopOrderId: 'shop-123',
        customerId: 'cust-123',
        products: [{ productId: 'prod-1', quantity: 1, price: 100 }],
      });

      const error = order.validateSync();
      expect(error?.errors.totalAmount).toBeDefined();
    });

    it('should set default status to pending', () => {
      const order = new ShopOrder({
        orderId: 'IG-ORDER-123',
        shopOrderId: 'shop-123',
        customerId: 'cust-123',
        products: [{ productId: 'prod-1', quantity: 1, price: 100 }],
        totalAmount: 100,
      });

      expect(order.status).toBe('pending');
    });

    it('should set default currency to INR', () => {
      const order = new ShopOrder({
        orderId: 'IG-ORDER-123',
        shopOrderId: 'shop-123',
        customerId: 'cust-123',
        products: [{ productId: 'prod-1', quantity: 1, price: 100 }],
        totalAmount: 100,
      });

      expect(order.currency).toBe('INR');
    });

    it('should accept valid status values', () => {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

      validStatuses.forEach((status) => {
        const order = new ShopOrder({
          orderId: 'IG-ORDER-123',
          shopOrderId: 'shop-123',
          customerId: 'cust-123',
          products: [{ productId: 'prod-1', quantity: 1, price: 100 }],
          totalAmount: 100,
          status: status as IShopOrder['status'],
        });

        const error = order.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid status values', () => {
      const order = new ShopOrder({
        orderId: 'IG-ORDER-123',
        shopOrderId: 'shop-123',
        customerId: 'cust-123',
        products: [{ productId: 'prod-1', quantity: 1, price: 100 }],
        totalAmount: 100,
        status: 'invalid_status' as IShopOrder['status'],
      });

      const error = order.validateSync();
      expect(error?.errors.status).toBeDefined();
    });

    it('should reject negative totalAmount', () => {
      const order = new ShopOrder({
        orderId: 'IG-ORDER-123',
        shopOrderId: 'shop-123',
        customerId: 'cust-123',
        products: [{ productId: 'prod-1', quantity: 1, price: 100 }],
        totalAmount: -100,
      });

      const error = order.validateSync();
      expect(error?.errors.totalAmount).toBeDefined();
    });
  });

  describe('Product Item Validation', () => {
    it('should require productId in each product item', () => {
      const order = new ShopOrder({
        orderId: 'IG-ORDER-123',
        shopOrderId: 'shop-123',
        customerId: 'cust-123',
        products: [{ quantity: 1, price: 100 }],
        totalAmount: 100,
      });

      const error = order.validateSync();
      expect(error?.errors['products.0.productId']).toBeDefined();
    });

    it('should require quantity in each product item', () => {
      const order = new ShopOrder({
        orderId: 'IG-ORDER-123',
        shopOrderId: 'shop-123',
        customerId: 'cust-123',
        products: [{ productId: 'prod-1', price: 100 }],
        totalAmount: 100,
      });

      const error = order.validateSync();
      expect(error?.errors['products.0.quantity']).toBeDefined();
    });

    it('should require price in each product item', () => {
      const order = new ShopOrder({
        orderId: 'IG-ORDER-123',
        shopOrderId: 'shop-123',
        customerId: 'cust-123',
        products: [{ productId: 'prod-1', quantity: 1 }],
        totalAmount: 100,
      });

      const error = order.validateSync();
      expect(error?.errors['products.0.price']).toBeDefined();
    });

    it('should reject negative quantity', () => {
      const order = new ShopOrder({
        orderId: 'IG-ORDER-123',
        shopOrderId: 'shop-123',
        customerId: 'cust-123',
        products: [{ productId: 'prod-1', quantity: -1, price: 100 }],
        totalAmount: 100,
      });

      const error = order.validateSync();
      expect(error?.errors['products.0.quantity']).toBeDefined();
    });

    it('should reject negative price', () => {
      const order = new ShopOrder({
        orderId: 'IG-ORDER-123',
        shopOrderId: 'shop-123',
        customerId: 'cust-123',
        products: [{ productId: 'prod-1', quantity: 1, price: -100 }],
        totalAmount: 100,
      });

      const error = order.validateSync();
      expect(error?.errors['products.0.price']).toBeDefined();
    });
  });
});

describe('Analytics Model', () => {
  describe('Schema Validation', () => {
    it('should require accountId field', () => {
      const analytics = new Analytics({
        date: new Date(),
        impressions: 1000,
        reach: 800,
        clicks: 100,
        engagement: 50,
        orders: 10,
        revenue: 5000,
      });

      const error = analytics.validateSync();
      expect(error?.errors.accountId).toBeDefined();
    });

    it('should require date field', () => {
      const analytics = new Analytics({
        accountId: 'acc-123',
        impressions: 1000,
        reach: 800,
        clicks: 100,
        engagement: 50,
        orders: 10,
        revenue: 5000,
      });

      const error = analytics.validateSync();
      expect(error?.errors.date).toBeDefined();
    });

    it('should reject negative impressions', () => {
      const analytics = new Analytics({
        accountId: 'acc-123',
        date: new Date(),
        impressions: -100,
        reach: 800,
        clicks: 100,
        engagement: 50,
        orders: 10,
        revenue: 5000,
      });

      const error = analytics.validateSync();
      expect(error?.errors.impressions).toBeDefined();
    });

    it('should reject negative reach', () => {
      const analytics = new Analytics({
        accountId: 'acc-123',
        date: new Date(),
        impressions: 1000,
        reach: -800,
        clicks: 100,
        engagement: 50,
        orders: 10,
        revenue: 5000,
      });

      const error = analytics.validateSync();
      expect(error?.errors.reach).toBeDefined();
    });

    it('should reject negative clicks', () => {
      const analytics = new Analytics({
        accountId: 'acc-123',
        date: new Date(),
        impressions: 1000,
        reach: 800,
        clicks: -100,
        engagement: 50,
        orders: 10,
        revenue: 5000,
      });

      const error = analytics.validateSync();
      expect(error?.errors.clicks).toBeDefined();
    });

    it('should accept zero values', () => {
      const analytics = new Analytics({
        accountId: 'acc-123',
        date: new Date(),
        impressions: 0,
        reach: 0,
        clicks: 0,
        engagement: 0,
        orders: 0,
        revenue: 0,
      });

      const error = analytics.validateSync();
      expect(error).toBeUndefined();
    });

    it('should set default values to 0', () => {
      const analytics = new Analytics({
        accountId: 'acc-123',
        date: new Date(),
      });

      expect(analytics.impressions).toBe(0);
      expect(analytics.reach).toBe(0);
      expect(analytics.clicks).toBe(0);
      expect(analytics.engagement).toBe(0);
      expect(analytics.orders).toBe(0);
      expect(analytics.revenue).toBe(0);
    });
  });

  describe('Compound Indexes', () => {
    it('should have accountId and date compound index', () => {
      const indexes = Analytics.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) =>
          idx[0] &&
          typeof idx[0] === 'object' &&
          'accountId' in idx[0] &&
          'date' in idx[0]
      );
      expect(compoundIndex).toBeDefined();
    });
  });
});
