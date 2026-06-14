import { Product, IProduct, IProductDocument } from '../models/Product';
import { Inventory } from '../models/Inventory';
import { ProductInput, ProductFilter, ProductVariant } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';

export class ProductService {
  private readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Create a new product
   */
  async createProduct(input: ProductInput): Promise<IProduct> {
    try {
      // Generate SKU if not provided
      if (!input.sku) {
        input.sku = this.generateSKU(input.name);
      }

      const product = new Product({
        ...input,
        id: uuidv4(),
      });

      await product.save();

      // Create inventory record
      const inventory = new Inventory({
        id: uuidv4(),
        productId: product.id,
        sku: product.sku,
        quantity: input.inventory || 0,
        availableQuantity: input.inventory || 0,
        lowStockThreshold: input.lowStockThreshold || 10,
      });
      await inventory.save();

      // Invalidate cache
      await this.invalidateCache();

      logger.info(`Product created: ${product.id}`);
      return product.toJSON();
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<IProduct | null> {
    const cacheKey = `product:${id}`;

    try {
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const product = await Product.findOne({ id });
      if (!product) return null;

      const result = product.toJSON();

      // Cache the result
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Error fetching product:', error);
      return await Product.findOne({ id }).then(p => p?.toJSON() || null);
    }
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(sku: string): Promise<IProduct | null> {
    const cacheKey = `product:sku:${sku}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const product = await Product.findOne({ sku });
      if (!product) return null;

      const result = product.toJSON();
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Error fetching product by SKU:', error);
      return await Product.findOne({ sku }).then(p => p?.toJSON() || null);
    }
  }

  /**
   * Update product
   */
  async updateProduct(id: string, updates: Partial<ProductInput>): Promise<IProduct | null> {
    try {
      const product = await Product.findOne({ id });
      if (!product) return null;

      Object.assign(product, updates);
      await product.save();

      // Invalidate cache
      await this.invalidateCache(id);

      logger.info(`Product updated: ${id}`);
      return product.toJSON();
    } catch (error) {
      logger.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const result = await Product.updateOne({ id }, { isActive: false });
      await this.invalidateCache(id);
      logger.info(`Product deleted: ${id}`);
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * List products with filters and pagination
   */
  async listProducts(
    filter: ProductFilter = {},
    page = 1,
    limit = 20
  ): Promise<{ products: IProduct[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, unknown> = {};

    if (filter.search) {
      query.$text = { $search: filter.search };
    }
    if (filter.categoryId) {
      query.categoryId = filter.categoryId;
    }
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      query.price = {};
      if (filter.minPrice !== undefined) query.price.$gte = filter.minPrice;
      if (filter.maxPrice !== undefined) query.price.$lte = filter.maxPrice;
    }
    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $all: filter.tags };
    }
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }
    if (filter.isFeatured !== undefined) {
      query.isFeatured = filter.isFeatured;
    }
    if (filter.inStock !== undefined) {
      query.inventory = filter.inStock ? { $gt: 0 } : 0;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    return {
      products: products.map(p => p.toJSON()),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add variant to product
   */
  async addVariant(productId: string, variant: Omit<ProductVariant, 'id'>): Promise<IProduct | null> {
    try {
      const product = await Product.findOne({ id: productId });
      if (!product) return null;

      const newVariant = {
        ...variant,
        id: uuidv4(),
      };

      product.variants.push(newVariant);
      product.inventory += variant.inventory;
      await product.save();

      await this.invalidateCache(productId);
      logger.info(`Variant added to product ${productId}: ${newVariant.id}`);

      return product.toJSON();
    } catch (error) {
      logger.error('Error adding variant:', error);
      throw error;
    }
  }

  /**
   * Update variant
   */
  async updateVariant(
    productId: string,
    variantId: string,
    updates: Partial<ProductVariant>
  ): Promise<IProduct | null> {
    try {
      const product = await Product.findOne({ id: productId });
      if (!product) return null;

      const variantIndex = product.variants.findIndex(v => v.id === variantId);
      if (variantIndex === -1) return null;

      const oldInventory = product.variants[variantIndex].inventory;
      product.variants[variantIndex] = { ...product.variants[variantIndex], ...updates };
      const newInventory = product.variants[variantIndex].inventory;

      // Update total inventory
      product.inventory = product.inventory - oldInventory + newInventory;

      await product.save();
      await this.invalidateCache(productId);

      return product.toJSON();
    } catch (error) {
      logger.error('Error updating variant:', error);
      throw error;
    }
  }

  /**
   * Delete variant
   */
  async deleteVariant(productId: string, variantId: string): Promise<IProduct | null> {
    try {
      const product = await Product.findOne({ id: productId });
      if (!product) return null;

      const variantIndex = product.variants.findIndex(v => v.id === variantId);
      if (variantIndex === -1) return null;

      const variantInventory = product.variants[variantIndex].inventory;
      product.variants.splice(variantIndex, 1);
      product.inventory -= variantInventory;

      await product.save();
      await this.invalidateCache(productId);

      return product.toJSON();
    } catch (error) {
      logger.error('Error deleting variant:', error);
      throw error;
    }
  }

  /**
   * Update product inventory
   */
  async updateInventory(productId: string, quantity: number): Promise<IProduct | null> {
    try {
      const product = await Product.findOne({ id: productId });
      if (!product) return null;

      product.inventory = quantity;
      await product.save();

      // Update inventory record
      await Inventory.findOneAndUpdate(
        { productId },
        { quantity, availableQuantity: quantity }
      );

      await this.invalidateCache(productId);
      return product.toJSON();
    } catch (error) {
      logger.error('Error updating inventory:', error);
      throw error;
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 10): Promise<IProduct[]> {
    const cacheKey = 'products:featured';

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const products = await Product.find({ isFeatured: true, isActive: true, inventory: { $gt: 0 } })
        .sort({ createdAt: -1 })
        .limit(limit);

      const result = products.map(p => p.toJSON());
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Error fetching featured products:', error);
      return await Product.find({ isFeatured: true, isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .then(p => p.map(prod => prod.toJSON()));
    }
  }

  /**
   * Generate unique SKU
   */
  private generateSKU(name: string): string {
    const prefix = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 3);
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache(productId?: string): Promise<void> {
    try {
      const keys = await redisClient.keys('product:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      if (productId) {
        await redisClient.del(`product:${productId}`);
      }
    } catch (error) {
      logger.warn('Cache invalidation failed:', error);
    }
  }
}

export const productService = new ProductService();
export default productService;
