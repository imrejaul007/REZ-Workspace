import { Product, ProductSearchResult, FacetBucket } from '../schemas/product.schema';
import { ProductModel } from '../models/product.model';
import Redis from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

export class ProductService {
  private redisClient: Redis.RedisType | null = null;
  private products: Map<string, Product> = new Map();
  private skuIndex: Map<string, string> = new Map();
  private slugIndex: Map<string, string> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private brandIndex: Map<string, Set<string>> = new Map();

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redisClient = Redis.createClient({ url: redisUrl });
    }
  }

  async initialize(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.connect();
      logger.info('Product twin connected to Redis');
    }
  }

  async createProduct(data: any): Promise<Product> {
    const existingSku = this.skuIndex.get(data.sku);
    if (existingSku) {
      throw new Error(`Product with SKU ${data.sku} already exists`);
    }

    const existingSlug = this.slugIndex.get(data.slug || ProductModel.generateSlug(data.name));
    if (existingSlug) {
      throw new Error(`Product with slug ${data.slug} already exists`);
    }

    const product = ProductModel.createProduct(data);
    this.indexProduct(product);
    logger.info(`Created product: ${product.id} (${product.sku})`);
    return product;
  }

  async getProduct(id: string): Promise<Product | null> {
    const cached = await this.getFromCache(id);
    if (cached) return cached;

    const product = this.products.get(id);
    if (product) {
      await this.setCache(id, product);
      return product;
    }
    return null;
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    const id = this.skuIndex.get(sku);
    if (!id) return null;
    return this.getProduct(id);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const id = this.slugIndex.get(slug);
    if (!id) return null;
    return this.getProduct(id);
  }

  async updateProduct(id: string, updates: any): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updated = ProductModel.updateProduct(product, updates);
    this.products.set(id, updated);
    this.reindexProduct(updated);
    await this.invalidateCache(id);
    logger.info(`Updated product: ${id}`);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const product = this.products.get(id);
    if (product) {
      this.removeFromIndexes(product);
      this.products.delete(id);
      await this.invalidateCache(id);
      logger.info(`Deleted product: ${id}`);
      return true;
    }
    return false;
  }

  async listProducts(filter?: {
    category?: string;
    brand?: string;
    status?: string;
    visibility?: string;
    inStock?: boolean;
  }): Promise<Product[]> {
    let products = Array.from(this.products.values());

    if (filter?.category) {
      const ids = this.categoryIndex.get(filter.category);
      if (ids) {
        products = products.filter(p => ids.has(p.id));
      } else {
        return [];
      }
    }
    if (filter?.brand) {
      const ids = this.brandIndex.get(filter.brand);
      if (ids) {
        products = products.filter(p => ids.has(p.id));
      } else {
        return [];
      }
    }
    if (filter?.status) {
      products = products.filter(p => p.status === filter.status);
    }
    if (filter?.visibility) {
      products = products.filter(p => p.visibility === filter.visibility);
    }
    if (filter?.inStock !== undefined) {
      products = products.filter(p =>
        filter.inStock ? ProductModel.isInStock(p) : !ProductModel.isInStock(p)
      );
    }

    return products;
  }

  async search(query: string, options?: {
    page?: number;
    pageSize?: number;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'name' | 'price' | 'createdAt' | 'relevance';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ProductSearchResult> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;

    let products = Array.from(this.products.values())
      .filter(p => p.status === 'active' && p.visibility !== 'hidden');

    if (query) {
      products = products.filter(p => ProductModel.searchMatch(p, query));
    }

    if (options?.category) {
      products = products.filter(p => p.category === options.category);
    }
    if (options?.brand) {
      products = products.filter(p => p.brand === options.brand);
    }
    if (options?.minPrice !== undefined) {
      products = products.filter(p => p.pricing.basePrice >= options.minPrice!);
    }
    if (options?.maxPrice !== undefined) {
      products = products.filter(p => p.pricing.basePrice <= options.maxPrice!);
    }

    const sortBy = options?.sortBy || 'relevance';
    const sortOrder = options?.sortOrder || 'desc';

    if (sortBy === 'name') {
      products.sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    } else if (sortBy === 'price') {
      products.sort((a, b) => {
        const priceA = ProductModel.getCurrentPrice(a);
        const priceB = ProductModel.getCurrentPrice(b);
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    } else if (sortBy === 'createdAt') {
      products.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    const total = products.length;
    const start = (page - 1) * pageSize;
    const paginatedProducts = products.slice(start, start + pageSize);

    const facets = this.calculateFacets(products);

    return {
      products: paginatedProducts,
      total,
      page,
      pageSize,
      facets,
    };
  }

  private calculateFacets(products: Product[]): ProductSearchResult['facets'] {
    const categories = new Map<string, number>();
    const brands = new Map<string, number>();
    const tags = new Map<string, number>();
    const priceRanges = [
      { key: '0-25', label: 'Under $25', min: 0, max: 25, count: 0 },
      { key: '25-50', label: '$25 - $50', min: 25, max: 50, count: 0 },
      { key: '50-100', label: '$50 - $100', min: 50, max: 100, count: 0 },
      { key: '100-200', label: '$100 - $200', min: 100, max: 200, count: 0 },
      { key: '200+', label: '$200+', min: 200, max: Infinity, count: 0 },
    ];

    products.forEach(p => {
      categories.set(p.category, (categories.get(p.category) || 0) + 1);
      brands.set(p.brand, (brands.get(p.brand) || 0) + 1);
      p.tags.forEach(tag => tags.set(tag, (tags.get(tag) || 0) + 1));

      priceRanges.forEach(range => {
        if (p.pricing.basePrice >= range.min && p.pricing.basePrice < range.max) {
          range.count++;
        }
      });
    });

    return {
      categories: this.mapToFacets(categories),
      brands: this.mapToFacets(brands),
      priceRanges: priceRanges.map(r => ({ key: r.key, label: r.label, count: r.count })),
      tags: this.mapToFacets(tags).slice(0, 20),
    };
  }

  private mapToFacets(map: Map<string, number>): FacetBucket[] {
    return Array.from(map.entries())
      .map(([key, count]) => ({ key, label: key, count }))
      .sort((a, b) => b.count - a.count);
  }

  async updatePricing(id: string, pricing: any): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updated = ProductModel.updatePricing(product, pricing);
    this.products.set(id, updated);
    await this.invalidateCache(id);
    return updated;
  }

  async adjustInventory(id: string, quantity: number, warehouseId?: string): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updated = ProductModel.adjustQuantity(product, quantity, warehouseId);
    this.products.set(id, updated);
    await this.invalidateCache(id);
    logger.info(`Adjusted inventory for ${id}: ${quantity > 0 ? '+' : ''}${quantity}`);
    return updated;
  }

  async setWarehouseStock(id: string, warehouseId: string, location: string, quantity: number): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updated = ProductModel.setWarehouseStock(product, warehouseId, location, quantity);
    this.products.set(id, updated);
    await this.invalidateCache(id);
    return updated;
  }

  async addImage(id: string, image: any): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updated = ProductModel.addImage(product, image);
    this.products.set(id, updated);
    await this.invalidateCache(id);
    return updated;
  }

  async removeImage(id: string, imageId: string): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updated = ProductModel.removeImage(product, imageId);
    this.products.set(id, updated);
    await this.invalidateCache(id);
    return updated;
  }

  async setPrimaryImage(id: string, imageId: string): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updated = ProductModel.setPrimaryImage(product, imageId);
    this.products.set(id, updated);
    await this.invalidateCache(id);
    return updated;
  }

  async addVariant(id: string, variant: any): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updated = ProductModel.addVariant(product, variant);
    this.products.set(id, updated);
    await this.invalidateCache(id);
    return updated;
  }

  async updateVariant(id: string, variantId: string, updates: any): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updated = ProductModel.updateVariant(product, variantId, updates);
    this.products.set(id, updated);
    await this.invalidateCache(id);
    return updated;
  }

  async removeVariant(id: string, variantId: string): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updated = ProductModel.removeVariant(product, variantId);
    this.products.set(id, updated);
    await this.invalidateCache(id);
    return updated;
  }

  async activateProduct(id: string): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updated = ProductModel.activate(product);
    this.products.set(id, updated);
    await this.invalidateCache(id);
    logger.info(`Activated product: ${id}`);
    return updated;
  }

  async discontinueProduct(id: string): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updated = ProductModel.discontinue(product);
    this.products.set(id, updated);
    await this.invalidateCache(id);
    logger.info(`Discontinued product: ${id}`);
    return updated;
  }

  async archiveProduct(id: string): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updated = ProductModel.archive(product);
    this.products.set(id, updated);
    await this.invalidateCache(id);
    logger.info(`Archived product: ${id}`);
    return updated;
  }

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p =>
      p.status === 'active' && ProductModel.isLowStock(p)
    );
  }

  async getOutOfStockProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p =>
      p.status === 'active' && !ProductModel.isInStock(p)
    );
  }

  private indexProduct(product: Product): void {
    this.products.set(product.id, product);
    this.skuIndex.set(product.sku, product.id);
    this.slugIndex.set(product.slug, product.id);

    const categorySet = this.categoryIndex.get(product.category) || new Set();
    categorySet.add(product.id);
    this.categoryIndex.set(product.category, categorySet);

    const brandSet = this.brandIndex.get(product.brand) || new Set();
    brandSet.add(product.id);
    this.brandIndex.set(product.brand, brandSet);
  }

  private reindexProduct(product: Product): void {
    if (product.sku !== product.sku) {
      this.skuIndex.delete(product.sku);
      this.skuIndex.set(product.sku, product.id);
    }
    if (product.slug !== product.slug) {
      this.slugIndex.delete(product.slug);
      this.slugIndex.set(product.slug, product.id);
    }
  }

  private removeFromIndexes(product: Product): void {
    this.skuIndex.delete(product.sku);
    this.slugIndex.delete(product.slug);

    const categorySet = this.categoryIndex.get(product.category);
    if (categorySet) {
      categorySet.delete(product.id);
    }

    const brandSet = this.brandIndex.get(product.brand);
    if (brandSet) {
      brandSet.delete(product.id);
    }
  }

  private async setCache(id: string, product: Product): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.setEx(`product:${id}`, 3600, JSON.stringify(product));
    } catch (error) {
      logger.error(`Cache write error: ${error}`);
    }
  }

  private async getFromCache(id: string): Promise<Product | null> {
    if (!this.redisClient) return null;
    try {
      const cached = await this.redisClient.get(`product:${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error(`Cache read error: ${error}`);
      return null;
    }
  }

  private async invalidateCache(id: string): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.del(`product:${id}`);
    } catch (error) {
      logger.error(`Cache invalidation error: ${error}`);
    }
  }

  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}
