/**
 * RendererService
 * Renders dynamic product ads based on templates and products
 */

import { v4 as uuidv4 } from 'uuid';
import { campaignService, feedService } from '../services';
import type {
  Product,
  AdTemplate,
  TemplateElement,
  RenderContext,
  RenderedAd,
  BatchRenderRequest,
  BatchRenderResponse,
  IDPACampaign,
} from '../types';
import logger from '../utils/logger';
import config from '../config';

// Element type to product field mapping
const ELEMENT_FIELD_MAP: Record<string, string> = {
  product_image: 'imageUrl',
  product_name: 'name',
  price: 'price',
  original_price: 'originalPrice',
  discount: 'discount',
  brand: 'brand',
  description: 'description',
  rating: 'rating',
  availability: 'availability',
};

export class RendererService {
  /**
   * Calculate discount percentage
   */
  private calculateDiscount(originalPrice: number, currentPrice: number): number {
    if (!originalPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  /**
   * Format price with currency
   */
  private formatPrice(price: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Get dynamic content for an element
   */
  private getElementContent(element: TemplateElement, product: Product): string {
    const field = ELEMENT_FIELD_MAP[element.type];

    if (field && product[field as keyof Product] !== undefined) {
      const value = product[field as keyof Product];

      if (element.type === 'price' || element.type === 'original_price') {
        return this.formatPrice(Number(value), product.currency);
      }

      if (element.type === 'discount') {
        return `${this.calculateDiscount(product.originalPrice || product.price, product.price)}% OFF`;
      }

      if (element.type === 'availability') {
        const availabilityLabels: Record<string, string> = {
          in_stock: 'In Stock',
          out_of_stock: 'Out of Stock',
          limited: 'Limited Stock',
        };
        return availabilityLabels[value as string] || value;
      }

      if (element.type === 'rating') {
        return `${value} (${product.reviewCount || 0} reviews)`;
      }

      return String(value);
    }

    return element.content || '';
  }

  /**
   * Generate CSS for element styles
   */
  private generateElementCSS(element: TemplateElement): string {
    const { style } = element;
    const cssProps: string[] = [];

    if (style.position) {
      cssProps.push(`left: ${element.position.x}px`);
      cssProps.push(`top: ${element.position.y}px`);
      cssProps.push(`width: ${element.position.width}px`);
      cssProps.push(`height: ${element.position.height}px`);
    }

    if (style.fontFamily) cssProps.push(`font-family: ${style.fontFamily}`);
    if (style.fontSize) cssProps.push(`font-size: ${style.fontSize}px`);
    if (style.fontWeight) cssProps.push(`font-weight: ${style.fontWeight}`);
    if (style.color) cssProps.push(`color: ${style.color}`);
    if (style.backgroundColor) cssProps.push(`background-color: ${style.backgroundColor}`);
    if (style.borderRadius !== undefined) cssProps.push(`border-radius: ${style.borderRadius}px`);
    if (style.borderWidth !== undefined) cssProps.push(`border: ${style.borderWidth}px solid ${style.borderColor || '#000'}`);
    if (style.padding !== undefined) cssProps.push(`padding: ${style.padding}px`);
    if (style.margin !== undefined) cssProps.push(`margin: ${style.margin}px`);
    if (style.textAlign) cssProps.push(`text-align: ${style.textAlign}`);
    if (style.lineHeight) cssProps.push(`line-height: ${style.lineHeight}`);
    if (style.opacity !== undefined) cssProps.push(`opacity: ${style.opacity}`);
    if (style.zIndex !== undefined) cssProps.push(`z-index: ${style.zIndex}`);

    return cssProps.join('; ');
  }

  /**
   * Render a single element to HTML
   */
  private renderElement(element: TemplateElement, product: Product): string {
    const content = this.getElementContent(element, product);
    const css = this.generateElementCSS(element);
    const position = element.position;

    switch (element.type) {
      case 'product_image':
        return `<img
          src="${product.imageUrl}"
          alt="${product.name}"
          style="${css}; position: absolute; object-fit: cover;"
          loading="lazy"
        />`;

      case 'cta':
        return `<a
          href="${product.url}"
          target="_blank"
          rel="noopener noreferrer"
          style="${css}; position: absolute; display: inline-block; text-decoration: none;"
        >${content || 'Shop Now'}</a>`;

      case 'logo':
        return `<div style="${css}; position: absolute; display: flex; align-items: center; justify-content: center;">
          <img src="${config.IMAGE_CDN_URL}/logo.png" alt="Logo" style="max-height: 100%;" />
        </div>`;

      case 'badge':
        return `<div style="${css}; position: absolute; background: #ff4444; color: white; border-radius: 4px; padding: 4px 8px; font-size: 12px;">
          ${content}
        </div>`;

      case 'discount':
        return `<div style="${css}; position: absolute; background: #4CAF50; color: white; border-radius: 4px; padding: 4px 8px; font-weight: bold;">
          ${content}
        </div>`;

      default:
        return `<div style="${css}; position: absolute; overflow: hidden;">
          ${content}
        </div>`;
    }
  }

  /**
   * Render full ad HTML from template and product
   */
  private renderAdHTML(template: AdTemplate, product: Product): string {
    const { dimensions, elements, backgroundColor, borderRadius, spacing } = template;

    const elementsHTML = elements
      .map(element => this.renderElement(element, product))
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body>
  <div style="
    position: relative;
    width: ${dimensions.width}px;
    height: ${dimensions.height}px;
    background-color: ${backgroundColor || '#ffffff'};
    border-radius: ${borderRadius || 0}px;
    overflow: hidden;
    margin: 0 auto;
  ">
    ${elementsHTML}
  </div>
</body>
</html>`;
  }

  /**
   * Generate click URL with tracking
   */
  private generateClickUrl(productUrl: string, campaignId: string, productId: string, context?: RenderContext): string {
    const baseParams = new URLSearchParams({
      campaign: campaignId,
      product: productId,
      click_id: uuidv4().slice(0, 12),
    });

    if (context?.userId) {
      baseParams.set('user', context.userId);
    }
    if (context?.sessionId) {
      baseParams.set('session', context.sessionId);
    }

    // Append to existing URL params
    const url = new URL(productUrl);
    Object.entries(Object.fromEntries(baseParams)).forEach(([key, value]) => {
      url.searchParams.set(`dpa_${key}`, value);
    });

    return url.toString();
  }

  /**
   * Generate impression tracking URL
   */
  private generateImpressionUrl(campaignId: string, productId: string, context?: RenderContext): string {
    const params = new URLSearchParams({
      campaign: campaignId,
      product: productId,
      event: 'impression',
      ts: Date.now().toString(),
    });

    if (context?.userId) {
      params.set('user', context.userId);
    }

    return `${config.IMAGE_CDN_URL}/track?${params.toString()}`;
  }

  /**
   * Check if product matches targeting criteria
   */
  private matchesTargeting(campaign: IDPACampaign, product: Product, context?: RenderContext): boolean {
    const { rules, targeting } = campaign;

    // Price range check
    if (rules.minPrice !== undefined && product.price < rules.minPrice) return false;
    if (rules.maxPrice !== undefined && product.price > rules.maxPrice) return false;

    // Category check
    if (rules.categories && rules.categories.length > 0) {
      if (!rules.categories.includes(product.category)) return false;
    }

    // Exclude products check
    if (rules.excludeProducts && rules.excludeProducts.includes(product.productId)) return false;

    // Discount threshold check
    if (rules.discountThreshold !== undefined && product.originalPrice) {
      const discount = this.calculateDiscount(product.originalPrice, product.price);
      if (discount < rules.discountThreshold) return false;
    }

    // In stock only check
    if (rules.inStockOnly && product.availability === 'out_of_stock') return false;

    // Brand blacklist check
    if (rules.brandBlacklist && rules.brandBlacklist.length > 0) {
      if (product.brand && rules.brandBlacklist.includes(product.brand)) return false;
    }

    // User segment check (if userSegments specified in targeting)
    if (targeting.userSegments && targeting.userSegments.length > 0) {
      if (!context?.userSegments || context.userSegments.length === 0) {
        // If targeting requires specific segments but user has none, exclude
        return false;
      }
      // Check if user has any of the required segments
      const hasSegment = targeting.userSegments.some(seg => context.userSegments!.includes(seg));
      if (!hasSegment) return false;
    }

    // Cart abandoners check
    if (targeting.cartAbandoners && context?.cartItems) {
      if (!context.cartItems.includes(product.productId)) {
        // For cart abandonment targeting, only show products in cart
        // This is a simple implementation - could be more sophisticated
      }
    }

    return true;
  }

  /**
   * Select a product for rendering based on targeting and context
   */
  async selectProduct(campaignId: string, context?: RenderContext): Promise<Product | null> {
    const campaign = await campaignService.getCampaign(campaignId);
    if (!campaign || campaign.status !== 'active') {
      return null;
    }

    const products = await campaignService.getFilteredProducts(campaignId);
    if (products.length === 0) {
      return null;
    }

    // Filter by targeting rules
    const matchingProducts = products.filter(p => this.matchesTargeting(campaign, p, context));

    if (matchingProducts.length === 0) {
      return null;
    }

    // Simple random selection - could be enhanced with ML-based selection
    const randomIndex = Math.floor(Math.random() * matchingProducts.length);
    return matchingProducts[randomIndex];
  }

  /**
   * Render a single ad for a specific product
   */
  async renderAd(campaignId: string, productId: string, context?: RenderContext): Promise<RenderedAd | null> {
    const campaign = await campaignService.getCampaign(campaignId);
    if (!campaign) {
      logger.warn('Campaign not found for rendering', { campaignId });
      return null;
    }

    const product = await feedService.getProduct(campaign.feedId, productId);
    if (!product) {
      logger.warn('Product not found for rendering', { campaignId, productId });
      return null;
    }

    const html = this.renderAdHTML(campaign.template, product);
    const clickUrl = this.generateClickUrl(product.url, campaignId, productId, context);
    const impressionUrl = this.generateImpressionUrl(campaignId, productId, context);

    const ad: RenderedAd = {
      adId: `ad-${uuidv4().slice(0, 12)}`,
      campaignId,
      product,
      html,
      clickUrl,
      impressionUrl,
      timestamp: new Date(),
    };

    // Record impression
    await campaignService.recordImpression(campaignId);

    logger.debug('Ad rendered', { adId: ad.adId, campaignId, productId });
    return ad;
  }

  /**
   * Preview an ad without recording metrics
   */
  async previewAd(campaignId: string, productId?: string, context?: RenderContext): Promise<RenderedAd | null> {
    const campaign = await campaignService.getCampaign(campaignId);
    if (!campaign) {
      return null;
    }

    let product: Product | null = null;

    if (productId) {
      product = await feedService.getProduct(campaign.feedId, productId);
    }

    // If no product specified, select one
    if (!product) {
      const products = await campaignService.getFilteredProducts(campaignId);
      if (products.length > 0) {
        product = products[0];
      }
    }

    if (!product) {
      return null;
    }

    const html = this.renderAdHTML(campaign.template, product);
    const clickUrl = this.generateClickUrl(product.url, campaignId, product.productId, context);

    return {
      adId: `preview-${uuidv4().slice(0, 12)}`,
      campaignId,
      product,
      html,
      clickUrl,
      timestamp: new Date(),
    };
  }

  /**
   * Render multiple ads for a campaign
   */
  async renderBatch(request: BatchRenderRequest): Promise<BatchRenderResponse> {
    const { campaignId, productIds, count, context } = request;
    const ads: RenderedAd[] = [];
    const errors: string[] = [];

    const campaign = await campaignService.getCampaign(campaignId);
    if (!campaign) {
      return { ads: [], totalRendered: 0, errors: ['Campaign not found'] };
    }

    let productsToRender: Product[];

    if (productIds && productIds.length > 0) {
      // Get specific products
      for (const pid of productIds) {
        const product = await feedService.getProduct(campaign.feedId, pid);
        if (product) {
          productsToRender = productsToRender || [];
          productsToRender.push(product);
        }
      }
    } else {
      // Get filtered products
      productsToRender = await campaignService.getFilteredProducts(campaignId);
    }

    if (!productsToRender || productsToRender.length === 0) {
      return { ads: [], totalRendered: 0, errors: ['No products available'] };
    }

    // Limit to requested count
    const limitedProducts = productsToRender.slice(0, count);

    for (const product of limitedProducts) {
      try {
        const ad: RenderedAd = {
          adId: `ad-${uuidv4().slice(0, 12)}`,
          campaignId,
          product,
          html: this.renderAdHTML(campaign.template, product),
          clickUrl: this.generateClickUrl(product.url, campaignId, product.productId, context),
          impressionUrl: this.generateImpressionUrl(campaignId, product.productId, context),
          timestamp: new Date(),
        };
        ads.push(ad);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to render product ${product.productId}: ${errorMsg}`);
      }
    }

    return {
      ads,
      totalRendered: ads.length,
      errors,
    };
  }

  /**
   * Get personalized product selection for a user
   */
  async getPersonalizedProducts(campaignId: string, context: RenderContext, limit: number = 10): Promise<Product[]> {
    const campaign = await campaignService.getCampaign(campaignId);
    if (!campaign) {
      return [];
    }

    const products = await campaignService.getFilteredProducts(campaignId);

    // Score products based on user context
    const scoredProducts = products.map(product => {
      let score = 0;

      // Boost products in browsing history
      if (context.browsingHistory?.includes(product.productId)) {
        score += 10;
      }

      // Boost products in cart
      if (context.cartItems?.includes(product.productId)) {
        score += 20;
      }

      // Boost matching categories from browsing history
      if (context.browsingHistory && context.browsingHistory.length > 0) {
        // Simple category matching - could be enhanced
        score += 1;
      }

      // Boost discounted products
      if (product.originalPrice && product.originalPrice > product.price) {
        score += 5;
      }

      // Boost in-stock products
      if (product.availability === 'in_stock') {
        score += 3;
      }

      return { product, score };
    });

    // Sort by score descending and return top products
    scoredProducts.sort((a, b) => b.score - a.score);
    return scoredProducts.slice(0, limit).map(sp => sp.product);
  }
}

export const rendererService = new RendererService();

export default rendererService;