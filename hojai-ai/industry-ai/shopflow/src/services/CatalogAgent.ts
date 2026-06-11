/**
 * CATALOG AGENT - ShopFlow AI
 * Product enrichment, AI descriptions, attribute extraction, classification
 */

import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface ProductEnrichment {
  productId: string;
  enrichedData: {
    description: string;
    shortDescription: string;
    highlights: string[];
    specifications: Record<string, string>;
    category: string;
    subcategory: string;
    tags: string[];
    searchKeywords: string[];
    brand: string;
  };
  qualityScore: number;
  suggestions: string[];
}

export interface ProductClassification {
  productId: string;
  category: {
    primary: string;
    secondary: string;
    confidence: number;
  };
  attributes: {
    name: string;
    value: string;
    type: 'color' | 'size' | 'material' | 'brand' | 'other';
    extractedConfidence: number;
  }[];
  variants: {
    type: string;
    values: string[];
  }[];
}

export interface ProductComparison {
  products: string[];
  comparison: {
    sharedAttributes: string[];
    differences: {
      attribute: string;
      values: Record<string, string>;
    }[];
    recommendation: string;
  };
}

export class CatalogAgent {
  /**
   * Enrich product data with AI-generated content
   */
  async enrichProduct(productId: string): Promise<ProductEnrichment> {
    try {
      // Fetch product from Retail Service
      const product = await this.fetchProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Generate AI content
      const enrichment = this.generateEnrichment(product);

      logger.info('Product enriched', { productId, qualityScore: enrichment.qualityScore });

      return enrichment;
    } catch (error) {
      logger.error('Product enrichment failed', { error, productId });
      throw error;
    }
  }

  /**
   * Batch enrich multiple products
   */
  async enrichBatch(productIds: string[]): Promise<{
    enriched: ProductEnrichment[];
    failed: string[];
    summary: { total: number; success: number; failed: number };
  }> {
    const results: ProductEnrichment[] = [];
    const failed: string[] = [];

    for (const productId of productIds) {
      try {
        const enrichment = await this.enrichProduct(productId);
        results.push(enrichment);
      } catch {
        failed.push(productId);
      }
    }

    return {
      enriched: results,
      failed,
      summary: {
        total: productIds.length,
        success: results.length,
        failed: failed.length,
      },
    };
  }

  /**
   * Classify product into categories
   */
  async classifyProduct(productId: string): Promise<ProductClassification> {
    try {
      const product = await this.fetchProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Extract attributes from product data
      const attributes = this.extractAttributes(product);

      // Classify into category
      const category = this.classifyCategory(product.name, product.description || '', attributes);

      // Find variants
      const variants = this.findVariants(product);

      const classification: ProductClassification = {
        productId,
        category,
        attributes,
        variants,
      };

      logger.info('Product classified', {
        productId,
        category: category.primary,
        confidence: category.confidence,
      });

      return classification;
    } catch (error) {
      logger.error('Product classification failed', { error, productId });
      throw error;
    }
  }

  /**
   * Compare multiple products
   */
  async compareProducts(productIds: string[]): Promise<ProductComparison> {
    const products: any[] = [];
    for (const id of productIds) {
      const product = await this.fetchProduct(id);
      if (product) products.push(product);
    }

    if (products.length < 2) {
      throw new Error('Need at least 2 products to compare');
    }

    // Find shared attributes
    const allAttributes = products.map(p => new Set(Object.keys(p.attributes || {})));
    const sharedAttributes = [...allAttributes[0]].filter(attr =>
      allAttributes.every(set => set.has(attr))
    );

    // Find differences
    const differences = [];
    for (const attr of sharedAttributes) {
      const values: Record<string, string> = {};
      products.forEach(p => {
        values[p._id] = String(p.attributes?.[attr] || 'N/A');
      });
      if (new Set(Object.values(values)).size > 1) {
        differences.push({ attribute: attr, values });
      }
    }

    return {
      products: productIds,
      comparison: {
        sharedAttributes,
        differences,
        recommendation: this.generateComparisonRecommendation(products, differences),
      },
    };
  }

  /**
   * Generate product recommendations for similar products
   */
  async findSimilarProducts(productId: string, limit: number = 5): Promise<{
    productId: string;
    similarProducts: {
      productId: string;
      name: string;
      similarity: number;
      reason: string;
    }[];
  }> {
    const product = await this.fetchProduct(productId);
    if (!product) throw new Error('Product not found');

    const similarProducts: any[] = [];

    // In production, this would use ML embeddings or collaborative filtering
    // For now, return simulated results based on category
    const categoryProducts = await this.fetchProductsByCategory(product.category, limit + 1);

    for (const p of categoryProducts) {
      if (p._id !== productId) {
        similarProducts.push({
          productId: p._id,
          name: p.name,
          similarity: 0.7 + Math.random() * 0.3,
          reason: `Same category: ${p.category}`,
        });
      }
    }

    return {
      productId,
      similarProducts: similarProducts.slice(0, limit),
    };
  }

  /**
   * Generate SEO-optimized content
   */
  async generateSEOContent(productId: string): Promise<{
    metaTitle: string;
    metaDescription: string;
    seoKeywords: string[];
    urlSlug: string;
  }> {
    const product = await this.fetchProduct(productId);
    if (!product) throw new Error('Product not found');

    const category = product.category || 'Product';
    const brand = product.brand || '';
    const name = product.name;

    return {
      metaTitle: `${name} | ${brand} ${category} | Shop Now`,
      metaDescription: `Buy ${name} online. ${product.description?.slice(0, 120) || 'Premium quality ' + category + ' at best prices.'} Free delivery available.`,
      seoKeywords: [
        name,
        brand,
        category,
        product.subcategory || '',
        ...this.generateKeywords(product),
      ].filter(Boolean),
      urlSlug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    };
  }

  /**
   * Fetch product from Retail Service
   */
  private async fetchProduct(productId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${config.integrations.retail}/api/products/${productId}`,
        { timeout: 5000 }
      );
      return response.data.data;
    } catch {
      return null;
    }
  }

  /**
   * Fetch products by category
   */
  private async fetchProductsByCategory(category: string, limit: number): Promise<any[]> {
    try {
      const response = await axios.get(
        `${config.integrations.retail}/api/products?category=${encodeURIComponent(category)}&limit=${limit}`,
        { timeout: 5000 }
      );
      return response.data.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Generate enrichment data
   */
  private generateEnrichment(product: any): ProductEnrichment {
    const name = product.name || '';
    const category = product.category || 'Product';

    // Simulated AI content generation
    const description = `Premium quality ${name} designed for modern lifestyles. ${product.description || 'Features exceptional craftsmanship and superior materials.'} Perfect for everyday use.`;

    const highlights = [
      `Premium ${category} quality`,
      'Durable and long-lasting',
      'Modern design',
      'Easy to use',
    ];

    const specifications: Record<string, string> = {};
    if (product.brand) specifications['Brand'] = product.brand;
    if (product.category) specifications['Category'] = product.category;
    if (product.sku) specifications['SKU'] = product.sku;
    specifications['Warranty'] = '1 Year Manufacturer Warranty';

    const tags = [
      category.toLowerCase(),
      product.brand?.toLowerCase() || '',
      'bestseller',
      'premium',
    ].filter(Boolean);

    return {
      productId: product._id,
      enrichedData: {
        description,
        shortDescription: description.slice(0, 100) + '...',
        highlights,
        specifications,
        category,
        subcategory: product.subcategory || '',
        tags,
        searchKeywords: this.generateKeywords(product),
        brand: product.brand || '',
      },
      qualityScore: 0.85,
      suggestions: [
        'Add more product images for better engagement',
        'Include size/variant information',
        'Add customer reviews section',
      ],
    };
  }

  /**
   * Generate keywords
   */
  private generateKeywords(product: any): string[] {
    const keywords: string[] = [];
    if (product.name) keywords.push(...product.name.split(' '));
    if (product.category) keywords.push(product.category);
    if (product.brand) keywords.push(product.brand);
    keywords.push('online', 'shop', 'buy');
    return [...new Set(keywords)].slice(0, 10);
  }

  /**
   * Extract attributes from product
   */
  private extractAttributes(product: any): ProductClassification['attributes'] {
    const attributes: ProductClassification['attributes'] = [];

    if (product.brand) {
      attributes.push({
        name: 'brand',
        value: product.brand,
        type: 'brand',
        extractedConfidence: 0.95,
      });
    }

    if (product.attributes) {
      for (const [key, value] of Object.entries(product.attributes)) {
        const type = this.detectAttributeType(key);
        attributes.push({
          name: key,
          value: String(value),
          type,
          extractedConfidence: 0.8,
        });
      }
    }

    return attributes;
  }

  /**
   * Detect attribute type
   */
  private detectAttributeType(name: string): 'color' | 'size' | 'material' | 'brand' | 'other' {
    const lower = name.toLowerCase();
    if (lower.includes('color') || lower.includes('colour')) return 'color';
    if (lower.includes('size')) return 'size';
    if (lower.includes('material') || lower.includes('fabric')) return 'material';
    if (lower.includes('brand')) return 'brand';
    return 'other';
  }

  /**
   * Classify product category
   */
  private classifyCategory(name: string, description: string, attributes: any[]): ProductClassification['category'] {
    // Simple rule-based classification
    const text = `${name} ${description}`.toLowerCase();

    let primary = 'General';
    let confidence = 0.5;

    if (text.includes('shirt') || text.includes('dress') || text.includes('pant')) {
      primary = 'Clothing';
      confidence = 0.9;
    } else if (text.includes('shoe') || text.includes('sneaker') || text.includes('sandal')) {
      primary = 'Footwear';
      confidence = 0.9;
    } else if (text.includes('phone') || text.includes('laptop') || text.includes('electronic')) {
      primary = 'Electronics';
      confidence = 0.85;
    } else if (text.includes('food') || text.includes('snack') || text.includes('beverage')) {
      primary = 'Food & Beverages';
      confidence = 0.8;
    } else if (text.includes('cosmetic') || text.includes('makeup') || text.includes('skincare')) {
      primary = 'Beauty';
      confidence = 0.85;
    }

    return {
      primary,
      secondary: this.getSecondaryCategory(primary),
      confidence,
    };
  }

  /**
   * Get secondary category
   */
  private getSecondaryCategory(primary: string): string {
    const mapping: Record<string, string> = {
      'Clothing': 'Fashion',
      'Footwear': 'Fashion',
      'Electronics': 'Tech',
      'Food & Beverages': 'Grocery',
      'Beauty': 'Personal Care',
      'General': 'Shop',
    };
    return mapping[primary] || 'Shop';
  }

  /**
   * Find product variants
   */
  private findVariants(product: any): ProductClassification['variants'] {
    const variants: ProductClassification['variants'] = [];

    // Look for common variant types in attributes
    const attributes = product.attributes || {};

    if (attributes.color || attributes.colour) {
      variants.push({ type: 'Color', values: String(attributes.color || attributes.colour).split(',') });
    }

    if (attributes.size) {
      variants.push({ type: 'Size', values: String(attributes.size).split(',') });
    }

    return variants;
  }

  /**
   * Generate comparison recommendation
   */
  private generateComparisonRecommendation(products: any[], differences: any[]): string {
    if (differences.length === 0) {
      return 'Products are very similar. Consider differentiating based on price or brand.';
    }

    const prices = products.map(p => p.price).sort((a, b) => a - b);
    const cheapest = products.find(p => p.price === prices[0]);

    return `${cheapest?.name || 'The cheaper option'} offers the best value for money with similar features.`;
  }
}

export const catalogAgent = new CatalogAgent();
export default catalogAgent;
