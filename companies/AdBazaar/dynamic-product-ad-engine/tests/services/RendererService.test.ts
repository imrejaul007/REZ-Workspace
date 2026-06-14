/**
 * RendererService Unit Tests
 */

import { RendererService } from '../../src/services/RendererService';
import type { AdTemplate, Product, RenderContext, IDPACampaign } from '../../src/types';

describe('RendererService', () => {
  let rendererService: RendererService;

  beforeEach(() => {
    rendererService = new RendererService();
  });

  describe('calculateDiscount', () => {
    it('should calculate discount percentage correctly', () => {
      const discount = rendererService['calculateDiscount'](100, 80);
      expect(discount).toBe(20);
    });

    it('should return 0 when original price is less than current price', () => {
      const discount = rendererService['calculateDiscount'](80, 100);
      expect(discount).toBe(0);
    });

    it('should return 0 when prices are equal', () => {
      const discount = rendererService['calculateDiscount'](100, 100);
      expect(discount).toBe(0);
    });

    it('should round discount to nearest integer', () => {
      const discount = rendererService['calculateDiscount'](100, 67);
      expect(discount).toBe(33);
    });
  });

  describe('formatPrice', () => {
    it('should format price in INR', () => {
      const formatted = rendererService['formatPrice'](1000, 'INR');
      expect(formatted).toContain('1,000');
    });

    it('should format price without decimals', () => {
      const formatted = rendererService['formatPrice'](999, 'INR');
      expect(formatted).toContain('999');
    });
  });

  describe('getElementContent', () => {
    const mockProduct: Product = {
      productId: 'prod-001',
      name: 'Test Product',
      category: 'Electronics',
      price: 999,
      originalPrice: 1299,
      currency: 'INR',
      imageUrl: 'https://example.com/image.jpg',
      url: 'https://example.com/product',
      availability: 'in_stock',
      lastUpdated: new Date(),
    };

    it('should return product name for product_name type', () => {
      const element = { type: 'product_name' as const, position: { x: 0, y: 0, width: 100, height: 50 }, style: {} };
      const content = rendererService['getElementContent'](element, mockProduct);
      expect(content).toBe('Test Product');
    });

    it('should return formatted price for price type', () => {
      const element = { type: 'price' as const, position: { x: 0, y: 0, width: 100, height: 50 }, style: {} };
      const content = rendererService['getElementContent'](element, mockProduct);
      expect(content).toContain('999');
    });

    it('should return discount percentage for discount type', () => {
      const element = { type: 'discount' as const, position: { x: 0, y: 0, width: 100, height: 50 }, style: {} };
      const content = rendererService['getElementContent'](element, mockProduct);
      expect(content).toContain('%');
    });

    it('should return availability label for availability type', () => {
      const element = { type: 'availability' as const, position: { x: 0, y: 0, width: 100, height: 50 }, style: {} };
      const content = rendererService['getElementContent'](element, mockProduct);
      expect(content).toBe('In Stock');
    });

    it('should return out of stock label', () => {
      const outOfStockProduct = { ...mockProduct, availability: 'out_of_stock' as const };
      const element = { type: 'availability' as const, position: { x: 0, y: 0, width: 100, height: 50 }, style: {} };
      const content = rendererService['getElementContent'](element, outOfStockProduct);
      expect(content).toBe('Out of Stock');
    });

    it('should return fallback content when field is missing', () => {
      const element = {
        type: 'product_name' as const,
        position: { x: 0, y: 0, width: 100, height: 50 },
        style: {},
        content: 'Default Name',
      };
      const content = rendererService['getElementContent'](element, {} as Product);
      expect(content).toBe('Default Name');
    });
  });

  describe('generateElementCSS', () => {
    it('should generate CSS from position', () => {
      const element = {
        type: 'product_name' as const,
        position: { x: 10, y: 20, width: 100, height: 50 },
        style: {},
      };
      const css = rendererService['generateElementCSS'](element);
      expect(css).toContain('left: 10px');
      expect(css).toContain('top: 20px');
      expect(css).toContain('width: 100px');
      expect(css).toContain('height: 50px');
    });

    it('should include style properties', () => {
      const element = {
        type: 'product_name' as const,
        position: { x: 0, y: 0, width: 100, height: 50 },
        style: {
          fontSize: 16,
          color: '#333',
          fontWeight: 'bold',
        },
      };
      const css = rendererService['generateElementCSS'](element);
      expect(css).toContain('font-size: 16px');
      expect(css).toContain('color: #333');
      expect(css).toContain('font-weight: bold');
    });

    it('should handle optional style properties', () => {
      const element = {
        type: 'product_name' as const,
        position: { x: 0, y: 0, width: 100, height: 50 },
        style: {
          padding: 10,
          margin: 5,
          borderRadius: 4,
        },
      };
      const css = rendererService['generateElementCSS'](element);
      expect(css).toContain('padding: 10px');
      expect(css).toContain('margin: 5px');
      expect(css).toContain('border-radius: 4px');
    });
  });

  describe('renderAdHTML', () => {
    it('should generate valid HTML', () => {
      const template: AdTemplate = {
        layout: 'single',
        dimensions: { width: 1200, height: 628 },
        elements: [
          {
            type: 'product_image',
            position: { x: 0, y: 0, width: 600, height: 628 },
            style: {},
          },
          {
            type: 'product_name',
            position: { x: 620, y: 100, width: 560, height: 50 },
            style: { fontSize: 24 },
          },
        ],
 backgroundColor: '#ffffff',
      };

      const product: Product = {
        productId: 'prod-001',
        name: 'Test Product',
        category: 'Electronics',
        price: 999,
        imageUrl: 'https://example.com/image.jpg',
        url: 'https://example.com/product',
        availability: 'in_stock',
        lastUpdated: new Date(),
      };

      const html = rendererService['renderAdHTML'](template, product);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('width: 1200px');
      expect(html).toContain('height: 628px');
      expect(html).toContain('background-color: #ffffff');
      expect(html).toContain('Test Product');
      expect(html).toContain('https://example.com/image.jpg');
    });

    it('should handle different layouts', () => {
      const template: AdTemplate = {
        layout: 'hero',
        dimensions: { width: 800, height: 400 },
        elements: [],
      };

      const product: Product = {
        productId: 'prod-001',
        name: 'Test',
        category: 'Test',
        price: 100,
        imageUrl: 'https://example.com/img.jpg',
        url: 'https://example.com',
        availability: 'in_stock',
        lastUpdated: new Date(),
      };

      const html = rendererService['renderAdHTML'](template, product);
      expect(html).toContain('width: 800px');
      expect(html).toContain('height: 400px');
    });
  });

  describe('generateClickUrl', () => {
    it('should append tracking parameters to URL', () => {
      const clickUrl = rendererService['generateClickUrl'](
        'https://example.com/product',
        'campaign-001',
        'prod-001'
      );

      expect(clickUrl).toContain('campaign=campaign-001');
      expect(clickUrl).toContain('product=prod-001');
      expect(clickUrl).toContain('dpa_click_id');
    });

    it('should include user ID when provided', () => {
      const context: RenderContext = {
        userId: 'user-123',
        sessionId: 'session-456',
      };

      const clickUrl = rendererService['generateClickUrl'](
        'https://example.com/product',
        'campaign-001',
        'prod-001',
        context
      );

      expect(clickUrl).toContain('user=user-123');
      expect(clickUrl).toContain('session=session-456');
    });
  });

  describe('matchesTargeting', () => {
    const mockCampaign = {
      rules: {
        minPrice: 100,
        maxPrice: 1000,
        categories: ['Electronics'],
        inStockOnly: true,
      },
      targeting: {},
    } as unknown as IDPACampaign;

    it('should return true for matching product', () => {
      const product: Product = {
        productId: 'prod-001',
        name: 'Test Product',
        category: 'Electronics',
        price: 500,
        imageUrl: 'https://example.com/img.jpg',
        url: 'https://example.com',
        availability: 'in_stock',
        lastUpdated: new Date(),
      };

      const matches = rendererService['matchesTargeting'](mockCampaign, product);
      expect(matches).toBe(true);
    });

    it('should return false for price below minimum', () => {
      const product: Product = {
        productId: 'prod-001',
        name: 'Test Product',
        category: 'Electronics',
        price: 50,
        imageUrl: 'https://example.com/img.jpg',
        url: 'https://example.com',
        availability: 'in_stock',
        lastUpdated: new Date(),
      };

      const matches = rendererService['matchesTargeting'](mockCampaign, product);
      expect(matches).toBe(false);
    });

    it('should return false for out of stock when inStockOnly is true', () => {
      const product: Product = {
        productId: 'prod-001',
        name: 'Test Product',
        category: 'Electronics',
        price: 500,
        imageUrl: 'https://example.com/img.jpg',
        url: 'https://example.com',
        availability: 'out_of_stock',
        lastUpdated: new Date(),
      };

      const matches = rendererService['matchesTargeting'](mockCampaign, product);
      expect(matches).toBe(false);
    });

    it('should return false for excluded product', () => {
      const campaignWithExclusion = {
        ...mockCampaign,
        rules: {
          ...mockCampaign.rules,
          excludeProducts: ['prod-001'],
        },
      };

      const product: Product = {
        productId: 'prod-001',
        name: 'Test Product',
        category: 'Electronics',
        price: 500,
        imageUrl: 'https://example.com/img.jpg',
        url: 'https://example.com',
        availability: 'in_stock',
        lastUpdated: new Date(),
      };

      const matches = rendererService['matchesTargeting'](campaignWithExclusion, product);
      expect(matches).toBe(false);
    });

    it('should check discount threshold', () => {
      const campaignWithDiscount = {
        ...mockCampaign,
        rules: {
          ...mockCampaign.rules,
          discountThreshold: 50,
        },
      };

      const productWithDiscount: Product = {
        productId: 'prod-001',
        name: 'Test Product',
        category: 'Electronics',
        price: 500,
        originalPrice: 1000,
        imageUrl: 'https://example.com/img.jpg',
        url: 'https://example.com',
        availability: 'in_stock',
        lastUpdated: new Date(),
      };

      const matches = rendererService['matchesTargeting'](campaignWithDiscount, productWithDiscount);
      expect(matches).toBe(true); // 50% discount meets threshold
    });
  });
});