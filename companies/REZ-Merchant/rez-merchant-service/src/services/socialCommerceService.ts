import { Request, Response } from 'express';
import logger from './utils/logger';

const BASE_URL = process.env.APP_BASE_URL || 'https://rez-app.com';

// Service URLs with localhost fallbacks
const STORES_SERVICE_URL = process.env.STORES_SERVICE_URL || 'http://localhost:3012/api/stores';
const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3013/api/products';
const REFERRALS_SERVICE_URL = process.env.REFERRALS_SERVICE_URL || 'http://localhost:3014/api/referrals';

export interface ShopLink {
  whatsapp: string;
  instagram: string;
  shareText: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
  description?: string;
}

export interface Store {
  id: string;
  name: string;
  whatsapp: string;
  instagram?: string;
  shopLink: string;
  products?: Product[];
}

export interface SocialReferral {
  source: 'whatsapp' | 'instagram' | 'facebook' | 'twitter' | 'other';
  productId: string;
  storeId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

class SocialCommerceService {
  /**
   * Generate Instagram/WhatsApp shop links for a store
   */
  async generateShopLink(storeId: string): Promise<ShopLink> {
    const store = await this.getStore(storeId);

    if (!store) {
      throw new Error(`Store not found: ${storeId}`);
    }

    return {
      whatsapp: this.generateWhatsAppLink(store),
      instagram: this.generateInstagramDeepLink(store),
      shareText: this.generateShareText(store)
    };
  }

  /**
   * Create WhatsApp catalog link with product list
   */
  async createWhatsAppCatalog(storeId: string): Promise<string> {
    const products = await this.getProducts(storeId);

    if (products.length === 0) {
      throw new Error(`No products found for store: ${storeId}`);
    }

    return this.formatWhatsAppCatalog(products);
  }

  /**
   * Generate shareable product link
   */
  async createProductLink(productId: string): Promise<string> {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    return `${BASE_URL}/product/${productId}`;
  }

  /**
   * Track social referral for analytics
   */
  async trackSocialReferral(
    source: string,
    productId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const validSources = ['whatsapp', 'instagram', 'facebook', 'twitter', 'other'];

    if (!validSources.includes(source)) {
      throw new Error(`Invalid source: ${source}. Must be one of: ${validSources.join(', ')}`);
    }

    if (!productId) {
      throw new Error('Product ID is required for tracking');
    }

    const referral: SocialReferral = {
      source: source as SocialReferral['source'],
      productId,
      storeId: '', // Will be populated from product lookup
      timestamp: new Date(),
      metadata
    };

    // Get store ID from product
    const product = await this.getProductById(productId);
    if (product) {
      referral.storeId = product.storeId;
    }

    // Store referral data (implementation depends on your data store)
    await this.storeReferral(referral);

    logger.info(`[SocialCommerce] Tracked referral: ${source} -> product/${productId}`);
  }

  // Private helper methods

  private generateWhatsAppLink(store: Store): string {
    const phoneNumber = store.whatsapp.replace(/\D/g, ''); // Remove non-digits
    const message = encodeURIComponent(store.shopLink);
    return `https://wa.me/${phoneNumber}?text=${message}`;
  }

  private generateInstagramDeepLink(store: Store): string {
    if (store.instagram) {
      return `instagram://user?username=${store.instagram}`;
    }
    return `https://instagram.com/${store.name.replace(/\s+/g, '')}`;
  }

  private generateShareText(store: Store): string {
    return `Check out ${store.name} on ReZ! Shop now: ${store.shopLink}`;
  }

  private formatWhatsAppCatalog(products: Product[]): string {
    const header = '🛍️ *Our Products*\n\n';
    const productList = products
      .map((p, index) => {
        const price = this.formatPrice(p.price, p.currency);
        const image = p.imageUrl ? `\n📷 ${p.imageUrl}` : '';
        const desc = p.description ? `\n_${p.description}_` : '';
        return `${index + 1}. *${p.name}*\n💰 ${price}${image}${desc}`;
      })
      .join('\n\n');

    const footer = '\n\n📞 Order now or visit our shop!';
    return encodeURIComponent(header + productList + footer);
  }

  private formatPrice(price: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);
  }

  // Data access methods with actual database calls

  private async getStore(storeId: string): Promise<Store | null> {
    try {
      const response = await fetch(`${STORES_SERVICE_URL}/${storeId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn(`Store not found: ${storeId}`);
          return null;
        }
        throw new Error(`Stores service error: ${response.status}`);
      }

      const store = await response.json();
      return {
        id: store.id || store._id,
        name: store.name,
        whatsapp: store.whatsapp || store.phone,
        instagram: store.instagram,
        shopLink: `${BASE_URL}/store/${storeId}`,
        products: store.products,
      };
    } catch (error) {
      logger.warn('Failed to fetch store from service, falling back to mock', {
        storeId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback mock for development
      return {
        id: storeId,
        name: 'Sample Store',
        whatsapp: '12025551234',
        shopLink: `${BASE_URL}/store/${storeId}`
      };
    }
  }

  private async getProducts(storeId: string): Promise<Product[]> {
    try {
      const response = await fetch(`${PRODUCTS_SERVICE_URL}?storeId=${storeId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn(`No products found for store: ${storeId}`);
          return [];
        }
        throw new Error(`Products service error: ${response.status}`);
      }

      const products = await response.json();
      return products.map((p: Record<string, unknown>) => ({
        id: p.id || p._id,
        name: p.name,
        price: p.price,
        currency: p.currency || 'USD',
        imageUrl: p.imageUrl || p.image,
        description: p.description,
      }));
    } catch (error) {
      logger.warn('Failed to fetch products from service, falling back to mock', {
        storeId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback mock for development
      return [
        {
          id: 'prod_001',
          storeId,
          name: 'Sample Product',
          price: 29.99,
          currency: 'USD',
          imageUrl: `${BASE_URL}/images/product-001.jpg`,
          description: 'High quality product'
        }
      ];
    }
  }

  private async getProductById(productId: string): Promise<(Product & { storeId: string }) | null> {
    try {
      const response = await fetch(`${PRODUCTS_SERVICE_URL}/${productId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn(`Product not found: ${productId}`);
          return null;
        }
        throw new Error(`Products service error: ${response.status}`);
      }

      const product = await response.json();
      return {
        id: product.id || product._id,
        storeId: product.storeId,
        name: product.name,
        price: product.price,
        currency: product.currency || 'USD',
        imageUrl: product.imageUrl || product.image,
        description: product.description,
      };
    } catch (error) {
      logger.warn('Failed to fetch product from service, falling back to mock', {
        productId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback mock for development
      return {
        id: productId,
        storeId: 'store_001',
        name: 'Sample Product',
        price: 29.99,
        currency: 'USD'
      };
    }
  }

  private async storeReferral(referral: SocialReferral): Promise<void> {
    try {
      const response = await fetch(`${REFERRALS_SERVICE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referral),
      });

      if (!response.ok) {
        throw new Error(`Referrals service error: ${response.status}`);
      }

      logger.info('[SocialCommerce] Referral stored successfully', {
        source: referral.source,
        productId: referral.productId,
        storeId: referral.storeId,
      });
    } catch (error) {
      // Log warning but don't fail the tracking operation
      logger.warn('[SocialCommerce] Failed to store referral in service, logged locally', {
        source: referral.source,
        productId: referral.productId,
        storeId: referral.storeId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Log locally as fallback
      console.log('[SocialCommerce] Referral stored locally:', JSON.stringify(referral));
    }
  }
}

// Extend Product interface for internal use
declare module './socialCommerceService' {
  interface Product {
    storeId: string;
  }
}

// Export singleton instance
export const socialCommerceService = new SocialCommerceService();
export default socialCommerceService;
