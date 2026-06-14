import { Product, IProduct } from '../models';
import { instagramApiService } from './instagramApiService';
import logger from '../utils/logger';
import { config } from '../config';

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  currency?: string;
  images: string[];
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  category: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  images?: string[];
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  category?: string;
}

class ProductService {
  /**
   * Create a new product and optionally sync to Instagram
   */
  async createProduct(
    input: CreateProductInput,
    syncToInstagram: boolean = false
  ): Promise<IProduct> {
    try {
      const product = new Product({
        catalogId: config.instagram.catalogId,
        ...input,
        currency: input.currency || 'INR',
        availability: input.availability || 'in_stock',
        syncStatus: syncToInstagram ? 'pending' : 'pending',
      });

      await product.save();

      if (syncToInstagram) {
        await this.syncToInstagram(product._id.toString());
      }

      logger.info('Product created', { productId: product.id });
      return product;
    } catch (error) {
      logger.error('Failed to create product', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(productId: string): Promise<IProduct | null> {
    return Product.findById(productId).exec();
  }

  /**
   * Get product by Instagram product ID
   */
  async getProductByInstagramId(
    instagramProductId: string
  ): Promise<IProduct | null> {
    return Product.findOne({ instagramProductId }).exec();
  }

  /**
   * Update product
   */
  async updateProduct(
    productId: string,
    updates: UpdateProductInput
  ): Promise<IProduct | null> {
    try {
      const product = await Product.findByIdAndUpdate(
        productId,
        {
          ...updates,
          syncStatus: 'pending',
        },
        { new: true }
      ).exec();

      if (product && product.instagramProductId) {
        // Sync updates to Instagram
        await instagramApiService.updateCatalogProduct(
          product.instagramProductId,
          {
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            currency: product.currency,
            image_url: product.images[0] || '',
            availability: product.availability === 'in_stock' ? 'in stock' : 'out of stock',
          }
        );
        product.syncStatus = 'synced';
        product.syncedAt = new Date();
        await product.save();
      }

      return product;
    } catch (error) {
      logger.error('Failed to update product', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId,
      });
      throw error;
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const product = await Product.findById(productId).exec();
      if (!product) {
        return false;
      }

      // Remove from Instagram if synced
      if (product.instagramProductId) {
        try {
          await instagramApiService.deleteCatalogProduct(product.instagramProductId);
        } catch (error) {
          logger.warn('Failed to delete from Instagram, continuing with local delete', {
            error: error instanceof Error ? error.message : 'Unknown error',
            instagramProductId: product.instagramProductId,
          });
        }
      }

      await Product.findByIdAndDelete(productId).exec();
      logger.info('Product deleted', { productId });
      return true;
    } catch (error) {
      logger.error('Failed to delete product', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId,
      });
      throw error;
    }
  }

  /**
   * Sync product to Instagram catalog
   */
  async syncToInstagram(productId: string): Promise<IProduct | null> {
    try {
      const product = await Product.findById(productId).exec();
      if (!product) {
        throw new Error('Product not found');
      }

      const instagramProductId = await instagramApiService.createCatalogProduct({
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        image_url: product.images[0] || '',
        availability:
          product.availability === 'in_stock'
            ? 'in stock'
            : product.availability === 'out_of_stock'
            ? 'out of stock'
            : 'preorder',
      });

      product.instagramProductId = instagramProductId ?? undefined;
      product.syncStatus = 'synced';
      product.syncedAt = new Date();
      product.syncError = undefined;
      await product.save();

      logger.info('Product synced to Instagram', { productId, instagramProductId });
      return product;
    } catch (error) {
      logger.error('Failed to sync product to Instagram', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId,
      });

      const product = await Product.findById(productId).exec();
      if (product) {
        product.syncStatus = 'failed';
        product.syncError = error instanceof Error ? error.message : 'Unknown error';
        await product.save();
      }

      throw error;
    }
  }

  /**
   * Get tagging suggestions for a product image
   */
  async getTaggingSuggestions(productId: string): Promise<string[]> {
    try {
      const product = await Product.findById(productId).exec();
      if (!product || !product.images.length) {
        return [];
      }

      return instagramApiService.getProductTaggingSuggestions(product.images[0]);
    } catch (error) {
      logger.error('Failed to get tagging suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId,
      });
      return [];
    }
  }

  /**
   * List products with filtering and pagination
   */
  async listProducts(options: {
    category?: string;
    availability?: string;
    syncStatus?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ products: IProduct[]; total: number; page: number; totalPages: number }> {
    const {
      category,
      availability,
      syncStatus,
      page = 1,
      limit = 20,
      search,
    } = options;

    const query: Record<string, unknown> = {};

    if (category) query.category = category;
    if (availability) query.availability = availability;
    if (syncStatus) query.syncStatus = syncStatus;

    if (search) {
      query.$text = { $search: search };
    }

    const total = await Product.countDocuments(query).exec();
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Batch sync products to Instagram
   */
  async batchSyncToInstagram(productIds: string[]): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ id: string; error: string }>,
    };

    for (const productId of productIds) {
      try {
        await this.syncToInstagram(productId);
        results.successful.push(productId);
      } catch (error) {
        results.failed.push({
          id: productId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Batch sync completed', {
      successful: results.successful.length,
      failed: results.failed.length,
    });

    return results;
  }

  /**
   * Update product availability based on stock
   */
  async updateAvailability(
    productId: string,
    availability: 'in_stock' | 'out_of_stock' | 'preorder'
  ): Promise<IProduct | null> {
    return this.updateProduct(productId, { availability });
  }
}

export const productService = new ProductService();
export default productService;