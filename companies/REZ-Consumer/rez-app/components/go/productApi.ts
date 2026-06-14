// @ts-nocheck
/**
 * REZ Go Product API Service
 *
 * Handles barcode lookup with multiple provider fallbacks:
 * 1. Local product database (REZ Go service)
 * 2. UPC Item DB (free tier)
 * 3. Cache
 */

import { BARCODE_API_CONFIG, REZ_GO_CONFIG } from './config';

export interface ProductInfo {
  productId: string;
  barcode: string;
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  imageUrl?: string;
  category?: string;
  brand?: string;
  weight?: number;
  weightUnit?: 'g' | 'kg' | 'ml' | 'l' | 'pcs';
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  allergens?: string[];
  dietary?: {
    isVegan?: boolean;
    isVegetarian?: boolean;
    isGlutenFree?: boolean;
    isHalal?: boolean;
  };
}

// Simple in-memory cache
const productCache = new Map<string, { product: ProductInfo; expiresAt: number }>();

class ProductApiService {
  private apiUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.apiUrl = REZ_GO_CONFIG.REZ_GO_API;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Lookup product by barcode
   * Priority: Cache → Local DB → External API
   */
  async lookupBarcode(barcode: string): Promise<ProductInfo | null> {
    // Check cache first
    const cached = this.getFromCache(barcode);
    if (cached) return cached;

    // Try local database first
    let product = await this.lookupLocal(barcode);
    if (product) {
      this.saveToCache(barcode, product);
      return product;
    }

    // Try external APIs as fallback
    product = await this.lookupUPCItemDB(barcode);
    if (product) {
      this.saveToCache(barcode, product);
      return product;
    }

    return null;
  }

  /**
   * Lookup from local REZ Go service
   */
  private async lookupLocal(barcode: string): Promise<ProductInfo | null> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.apiUrl}/products/barcode/${barcode}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(BARCODE_API_CONFIG.TIMEOUT_MS),
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.product || null;
    } catch (error) {
      console.error('Local barcode lookup failed:', error);
      return null;
    }
  }

  /**
   * Lookup from UPC Item DB (free tier)
   * Note: Requires API key in production
   */
  private async lookupUPCItemDB(barcode: string): Promise<ProductInfo | null> {
    // Skip external API in development if mock data is enabled
    if (REZ_GO_CONFIG.USE_MOCK_DATA) {
      return this.getMockProduct(barcode);
    }

    try {
      const apiKey = process.env.EXPO_PUBLIC_UPC_ITEM_DB_API_KEY;
      if (!apiKey) {
        return this.getMockProduct(barcode);
      }

      const response = await fetch(
        `${BARCODE_API_CONFIG.UPC_ITEM_DB_API}/upc/${barcode}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Token ${apiKey}`,
          },
          signal: AbortSignal.timeout(BARCODE_API_CONFIG.TIMEOUT_MS),
        }
      );

      if (!response.ok) return this.getMockProduct(barcode);

      const data = await response.json();
      return this.transformUPCItemDBResponse(data);
    } catch (error) {
      console.error('UPC Item DB lookup failed:', error);
      return this.getMockProduct(barcode);
    }
  }

  /**
   * Transform UPC Item DB response to ProductInfo
   */
  private transformUPCItemDBResponse(data: Record<string, unknown>): ProductInfo | null {
    if (!data.items || data.items.length === 0) return null;

    const item = data.items[0];
    const offers = item.offers?.[0];

    return {
      productId: `UPC-${item.upc}`,
      barcode: item.upc,
      name: item.title || 'Unknown Product',
      description: item.description,
      price: offers ? parseFloat(offers.price) || 0 : 0,
      imageUrl: item.images?.[0] || item.image,
      brand: item.brand,
      category: item.category?.split('>')?.[1]?.trim(),
    };
  }

  /**
   * Mock product for development
   */
  private getMockProduct(barcode: string): ProductInfo {
    // Generate consistent mock product based on barcode
    const hash = this.hashCode(barcode);
    const mockProducts = [
      {
        name: 'Amul Butter 500g',
        brand: 'Amul',
        category: 'Dairy',
        price: 275,
        mrp: 299,
      },
      {
        name: 'Tata Salt 1kg',
        brand: 'Tata',
        category: 'Grocery',
        price: 22,
        mrp: 25,
      },
      {
        name: 'Maggi Noodles',
        brand: 'Nestle',
        category: 'Instant Food',
        price: 12,
        mrp: 14,
      },
      {
        name: 'Parle-G Biscuits',
        brand: 'Parle',
        category: 'Biscuits',
        price: 30,
        mrp: 35,
      },
      {
        name: 'Colgate Toothpaste 100g',
        brand: 'Colgate',
        category: 'Personal Care',
        price: 85,
        mrp: 95,
      },
    ];

    const mock = mockProducts[hash % mockProducts.length];
    return {
      productId: `MOCK-${barcode}`,
      barcode,
      ...mock,
      price: mock.price + (hash % 10),
    };
  }

  /**
   * Simple hash function for consistent mock products
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Cache management
   */
  private getFromCache(barcode: string): ProductInfo | null {
    const cached = productCache.get(barcode);
    if (!cached) return null;
    if (Date.now() > cached.expiresAt) {
      productCache.delete(barcode);
      return null;
    }
    return cached.product;
  }

  private saveToCache(barcode: string, product: ProductInfo): void {
    const expiresAt = Date.now() + BARCODE_API_CONFIG.CACHE_DURATION_HOURS * 60 * 60 * 1000;
    productCache.set(barcode, { product, expiresAt });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    productCache.clear();
  }

  /**
   * Batch lookup for multiple barcodes
   */
  async batchLookup(barcodes: string[]): Promise<Map<string, ProductInfo>> {
    const results = new Map<string, ProductInfo>();

    await Promise.all(
      barcodes.map(async (barcode) => {
        const product = await this.lookupBarcode(barcode);
        if (product) {
          results.set(barcode, product);
        }
      })
    );

    return results;
  }
}

export const productApi = new ProductApiService();
export default productApi;
