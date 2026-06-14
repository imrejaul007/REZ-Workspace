/**
 * Validation tests for Catalog service Zod schemas.
 * Tests all critical paths for product validation.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  ProductPricingSchema,
  ProductImageSchema,
  CreateProductSchema,
  UpdateProductSchema,
  ProductListQuerySchema,
  FeaturedProductsQuerySchema,
  MerchantProductsQuerySchema,
} = require('../dist/validation/productSchemas');

test('ProductPricingSchema - valid pricing', () => {
  const validPricing = {
    selling: 99.99,
    mrp: 149.99,
    discount: 33,
    currency: 'USD',
  };
  const result = ProductPricingSchema.safeParse(validPricing);
  assert.equal(result.success, true);
  assert.deepEqual(result.data, validPricing);
});

test('ProductPricingSchema - all optional fields', () => {
  const emptyPricing = {};
  const result = ProductPricingSchema.safeParse(emptyPricing);
  assert.equal(result.success, true);
  assert.deepEqual(result.data, {});
});

test('ProductPricingSchema - rejects zero selling price', () => {
  const invalidPricing = {
    selling: 0,
  };
  const result = ProductPricingSchema.safeParse(invalidPricing);
  assert.equal(result.success, false);
});

test('ProductPricingSchema - rejects negative selling price', () => {
  const invalidPricing = {
    selling: -50,
  };
  const result = ProductPricingSchema.safeParse(invalidPricing);
  assert.equal(result.success, false);
});

test('ProductPricingSchema - rejects zero MRP', () => {
  const invalidPricing = {
    mrp: 0,
  };
  const result = ProductPricingSchema.safeParse(invalidPricing);
  assert.equal(result.success, false);
});

test('ProductPricingSchema - rejects negative MRP', () => {
  const invalidPricing = {
    mrp: -100,
  };
  const result = ProductPricingSchema.safeParse(invalidPricing);
  assert.equal(result.success, false);
});

test('ProductPricingSchema - discount between 0 and 100', () => {
  const validDiscounts = [0, 25, 50, 75, 100];
  validDiscounts.forEach((discount) => {
    const pricing = { discount };
    const result = ProductPricingSchema.safeParse(pricing);
    assert.equal(result.success, true, `Discount ${discount} should be valid`);
  });
});

test('ProductPricingSchema - rejects discount above 100', () => {
  const invalidPricing = {
    discount: 101,
  };
  const result = ProductPricingSchema.safeParse(invalidPricing);
  assert.equal(result.success, false);
});

test('ProductPricingSchema - rejects negative discount', () => {
  const invalidPricing = {
    discount: -10,
  };
  const result = ProductPricingSchema.safeParse(invalidPricing);
  assert.equal(result.success, false);
});

test('ProductImageSchema - valid image with URL', () => {
  const validImage = {
    url: 'https://example.com/image.jpg',
    alt: 'Product image',
    isPrimary: true,
  };
  const result = ProductImageSchema.safeParse(validImage);
  assert.equal(result.success, true);
});

test('ProductImageSchema - all optional fields', () => {
  const emptyImage = {};
  const result = ProductImageSchema.safeParse(emptyImage);
  assert.equal(result.success, true);
});

test('ProductImageSchema - rejects invalid URL', () => {
  const invalidImage = {
    url: 'not-a-valid-url',
  };
  const result = ProductImageSchema.safeParse(invalidImage);
  assert.equal(result.success, false);
});

test('ProductImageSchema - accepts various URL formats', () => {
  const urls = [
    'https://example.com/image.jpg',
    'http://cdn.example.com/img.png',
    'https://s3.amazonaws.com/bucket/key.gif',
  ];
  urls.forEach((url) => {
    const image = { url };
    const result = ProductImageSchema.safeParse(image);
    assert.equal(result.success, true, `URL ${url} should be valid`);
  });
});

test('CreateProductSchema - valid product creation', () => {
  const validProduct = {
    name: 'Premium Widget',
    price: 99.99,
    category: 'Electronics',
    description: 'A high-quality widget',
    stock: 150,
    merchantId: 'merchant-123',
    storeId: 'store-456',
  };
  const result = CreateProductSchema.safeParse(validProduct);
  assert.equal(result.success, true);
  assert.deepEqual(result.data, validProduct);
});

test('CreateProductSchema - required fields only', () => {
  const minimalProduct = {
    name: 'Basic Widget',
    price: 19.99,
    merchantId: 'merchant-123',
  };
  const result = CreateProductSchema.safeParse(minimalProduct);
  assert.equal(result.success, true);
});

test('CreateProductSchema - rejects empty name', () => {
  const invalidProduct = {
    name: '',
    price: 10,
    merchantId: 'merchant-123',
  };
  const result = CreateProductSchema.safeParse(invalidProduct);
  assert.equal(result.success, false);
});

test('CreateProductSchema - rejects name exceeding 200 characters', () => {
  const longName = 'A'.repeat(201);
  const invalidProduct = {
    name: longName,
    price: 10,
    merchantId: 'merchant-123',
  };
  const result = CreateProductSchema.safeParse(invalidProduct);
  assert.equal(result.success, false);
});

test('CreateProductSchema - accepts name at 200 characters', () => {
  const maxName = 'A'.repeat(200);
  const validProduct = {
    name: maxName,
    price: 10,
    merchantId: 'merchant-123',
  };
  const result = CreateProductSchema.safeParse(validProduct);
  assert.equal(result.success, true);
});

test('CreateProductSchema - rejects zero price', () => {
  const invalidProduct = {
    name: 'Widget',
    price: 0,
    merchantId: 'merchant-123',
  };
  const result = CreateProductSchema.safeParse(invalidProduct);
  assert.equal(result.success, false);
});

test('CreateProductSchema - rejects negative price', () => {
  const invalidProduct = {
    name: 'Widget',
    price: -50,
    merchantId: 'merchant-123',
  };
  const result = CreateProductSchema.safeParse(invalidProduct);
  assert.equal(result.success, false);
});

test('CreateProductSchema - rejects empty merchantId', () => {
  const invalidProduct = {
    name: 'Widget',
    price: 10,
    merchantId: '',
  };
  const result = CreateProductSchema.safeParse(invalidProduct);
  assert.equal(result.success, false);
});

test('CreateProductSchema - rejects missing merchantId', () => {
  const invalidProduct = {
    name: 'Widget',
    price: 10,
  };
  const result = CreateProductSchema.safeParse(invalidProduct);
  assert.equal(result.success, false);
});

test('CreateProductSchema - allows zero stock', () => {
  const product = {
    name: 'Widget',
    price: 10,
    merchantId: 'merchant-123',
    stock: 0,
  };
  const result = CreateProductSchema.safeParse(product);
  assert.equal(result.success, true);
});

test('CreateProductSchema - rejects negative stock', () => {
  const invalidProduct = {
    name: 'Widget',
    price: 10,
    merchantId: 'merchant-123',
    stock: -5,
  };
  const result = CreateProductSchema.safeParse(invalidProduct);
  assert.equal(result.success, false);
});

test('UpdateProductSchema - all fields optional for update', () => {
  const partialUpdate = {
    merchantId: 'merchant-123',
    name: 'Updated Widget',
  };
  const result = UpdateProductSchema.safeParse(partialUpdate);
  assert.equal(result.success, true);
});

test('UpdateProductSchema - merchantId required', () => {
  const noMerchant = {
    name: 'Updated Widget',
  };
  const result = UpdateProductSchema.safeParse(noMerchant);
  assert.equal(result.success, false);
});

test('UpdateProductSchema - valid image array', () => {
  const updateWithImages = {
    merchantId: 'merchant-123',
    images: [
      'https://example.com/image1.jpg',
      { url: 'https://example.com/image2.jpg', alt: 'alt text', isPrimary: true },
    ],
  };
  const result = UpdateProductSchema.safeParse(updateWithImages);
  assert.equal(result.success, true);
});

test('UpdateProductSchema - tags array', () => {
  const updateWithTags = {
    merchantId: 'merchant-123',
    tags: ['bestseller', 'limited-edition', 'on-sale'],
  };
  const result = UpdateProductSchema.safeParse(updateWithTags);
  assert.equal(result.success, true);
});

test('UpdateProductSchema - variants array', () => {
  const updateWithVariants = {
    merchantId: 'merchant-123',
    variants: [
      { color: 'red', size: 'M' },
      { color: 'blue', size: 'L' },
    ],
  };
  const result = UpdateProductSchema.safeParse(updateWithVariants);
  assert.equal(result.success, true);
});

test('UpdateProductSchema - valid non-negative weight', () => {
  const updateWithWeight = {
    merchantId: 'merchant-123',
    weight: 2.5,
  };
  const result = UpdateProductSchema.safeParse(updateWithWeight);
  assert.equal(result.success, true);
});

test('UpdateProductSchema - rejects negative weight', () => {
  const invalidUpdate = {
    merchantId: 'merchant-123',
    weight: -1,
  };
  const result = UpdateProductSchema.safeParse(invalidUpdate);
  assert.equal(result.success, false);
});

test('UpdateProductSchema - valid discount range', () => {
  const updateWithDiscount = {
    merchantId: 'merchant-123',
    discount: 45,
  };
  const result = UpdateProductSchema.safeParse(updateWithDiscount);
  assert.equal(result.success, true);
});

test('UpdateProductSchema - rejects invalid thumbnail URL', () => {
  const invalidThumbnail = {
    merchantId: 'merchant-123',
    thumbnail: 'not-a-url',
  };
  const result = UpdateProductSchema.safeParse(invalidThumbnail);
  assert.equal(result.success, false);
});

test('ProductListQuerySchema - valid query with filters', () => {
  const validQuery = {
    storeId: 'store-123',
    category: 'Electronics',
    search: 'wireless headphones',
    page: 2,
    limit: 25,
  };
  const result = ProductListQuerySchema.safeParse(validQuery);
  assert.equal(result.success, true);
});

test('ProductListQuerySchema - default pagination', () => {
  const minimalQuery = {};
  const result = ProductListQuerySchema.safeParse(minimalQuery);
  assert.equal(result.success, true);
  assert.equal(result.data.page, 1);
  assert.equal(result.data.limit, 20);
});

test('ProductListQuerySchema - rejects page less than 1', () => {
  const invalidQuery = {
    page: 0,
  };
  const result = ProductListQuerySchema.safeParse(invalidQuery);
  assert.equal(result.success, false);
});

test('ProductListQuerySchema - rejects limit exceeding 100', () => {
  const invalidQuery = {
    limit: 150,
  };
  const result = ProductListQuerySchema.safeParse(invalidQuery);
  assert.equal(result.success, false);
});

test('ProductListQuerySchema - accepts string page with coercion', () => {
  const queryWithString = {
    page: '3',
  };
  const result = ProductListQuerySchema.safeParse(queryWithString);
  assert.equal(result.success, true);
  assert.equal(result.data.page, 3);
});

test('FeaturedProductsQuerySchema - valid coordinates', () => {
  const validQuery = {
    lat: 40.7128,
    lng: -74.006,
    limit: 10,
  };
  const result = FeaturedProductsQuerySchema.safeParse(validQuery);
  assert.equal(result.success, true);
});

test('FeaturedProductsQuerySchema - default limit', () => {
  const minimalQuery = {};
  const result = FeaturedProductsQuerySchema.safeParse(minimalQuery);
  assert.equal(result.success, true);
  assert.equal(result.data.limit, 20);
});

test('FeaturedProductsQuerySchema - limit exceeds max (50)', () => {
  const invalidQuery = {
    limit: 51,
  };
  const result = FeaturedProductsQuerySchema.safeParse(invalidQuery);
  assert.equal(result.success, false);
});

test('FeaturedProductsQuerySchema - accepts string coordinates', () => {
  const queryWithStrings = {
    lat: '40.7128',
    lng: '-74.006',
  };
  const result = FeaturedProductsQuerySchema.safeParse(queryWithStrings);
  assert.equal(result.success, true);
  assert.equal(result.data.lat, 40.7128);
  assert.equal(result.data.lng, -74.006);
});

test('MerchantProductsQuerySchema - valid merchant products query', () => {
  const validQuery = {
    page: 2,
    limit: 50,
    search: 'bestseller',
  };
  const result = MerchantProductsQuerySchema.safeParse(validQuery);
  assert.equal(result.success, true);
});

test('MerchantProductsQuerySchema - default pagination', () => {
  const minimalQuery = {};
  const result = MerchantProductsQuerySchema.safeParse(minimalQuery);
  assert.equal(result.success, true);
  assert.equal(result.data.page, 1);
  assert.equal(result.data.limit, 20);
});

test('MerchantProductsQuerySchema - rejects page zero', () => {
  const invalidQuery = {
    page: 0,
  };
  const result = MerchantProductsQuerySchema.safeParse(invalidQuery);
  assert.equal(result.success, false);
});

test('MerchantProductsQuerySchema - rejects limit exceeding 100', () => {
  const invalidQuery = {
    limit: 200,
  };
  const result = MerchantProductsQuerySchema.safeParse(invalidQuery);
  assert.equal(result.success, false);
});
