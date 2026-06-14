/**
 * FeedService
 * Manages product feeds - creation, sync, retrieval
 */

import { v4 as uuidv4 } from 'uuid';
import { ProductFeedModel, IProductFeed } from '../models';
import type { Product, FeedSource, FeedUploadRequest, FeedStats } from '../types';
import logger from '../utils/logger';

export class FeedService {
  /**
   * Create a new product feed
   */
  async createFeed(data: FeedUploadRequest): Promise<IProductFeed> {
    const feedId = `feed-${uuidv4().slice(0, 12)}`;

    // Process products with timestamps
    const products: Product[] = data.products.map(p => ({
      ...p,
      lastUpdated: new Date(),
    }));

    // Calculate initial stats
    const stats: FeedStats = {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.availability !== 'out_of_stock').length,
      outOfStockProducts: products.filter(p => p.availability === 'out_of_stock').length,
      lastSynced: new Date(),
      syncErrors: 0,
    };

    const feed = new ProductFeedModel({
      feedId,
      merchantId: data.merchantId,
      name: data.name,
      source: data.source,
      sourceUrl: data.sourceUrl,
      products,
      syncConfig: data.syncConfig,
      stats,
      status: 'active',
    });

    await feed.save();
    logger.info('Feed created', { feedId, merchantId: data.merchantId, productCount: products.length });

    return feed;
  }

  /**
   * Update existing feed with new products
   */
  async updateFeed(feedId: string, products: Product[]): Promise<IProductFeed | null> {
    const feed = await ProductFeedModel.findOne({ feedId });
    if (!feed) {
      return null;
    }

    // Merge products (update existing, add new)
    const existingMap = new Map(feed.products.map(p => [p.productId, p]));

    for (const product of products) {
      existingMap.set(product.productId, {
        ...product,
        lastUpdated: new Date(),
      });
    }

    feed.products = Array.from(existingMap.values());
    feed.stats = {
      totalProducts: feed.products.length,
      activeProducts: feed.products.filter(p => p.availability !== 'out_of_stock').length,
      outOfStockProducts: feed.products.filter(p => p.availability === 'out_of_stock').length,
      lastSynced: new Date(),
      syncErrors: 0,
    };

    await feed.save();
    logger.info('Feed updated', { feedId, productCount: feed.products.length });

    return feed;
  }

  /**
   * Get feed by ID
   */
  async getFeed(feedId: string): Promise<IProductFeed | null> {
    return ProductFeedModel.findOne({ feedId });
  }

  /**
   * List feeds with pagination
   */
  async listFeeds(params: {
    merchantId?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ feeds: IProductFeed[]; total: number; page: number; limit: number; pages: number }> {
    const {
      merchantId,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const query: Record<string, unknown> = {};
    if (merchantId) query.merchantId = merchantId;
    if (status) query.status = status;

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [feeds, total] = await Promise.all([
      ProductFeedModel.find(query).sort(sort).skip(skip).limit(limit),
      ProductFeedModel.countDocuments(query),
    ]);

    return {
      feeds,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete a feed
   */
  async deleteFeed(feedId: string): Promise<boolean> {
    const result = await ProductFeedModel.deleteOne({ feedId });
    if (result.deletedCount > 0) {
      logger.info('Feed deleted', { feedId });
      return true;
    }
    return false;
  }

  /**
   * Get products from a feed with filtering
   */
  async getProducts(feedId: string, filters?: {
    categories?: string[];
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    brands?: string[];
    excludeProducts?: string[];
  }): Promise<Product[]> {
    const feed = await ProductFeedModel.findOne({ feedId });
    if (!feed) {
      return [];
    }

    let products = feed.products;

    if (filters) {
      if (filters.categories && filters.categories.length > 0) {
        products = products.filter(p => filters.categories!.includes(p.category));
      }

      if (filters.minPrice !== undefined) {
        products = products.filter(p => p.price >= filters.minPrice!);
      }

      if (filters.maxPrice !== undefined) {
        products = products.filter(p => p.price <= filters.maxPrice!);
      }

      if (filters.inStockOnly) {
        products = products.filter(p => p.availability !== 'out_of_stock');
      }

      if (filters.brands && filters.brands.length > 0) {
        products = products.filter(p => p.brand && filters.brands!.includes(p.brand));
      }

      if (filters.excludeProducts && filters.excludeProducts.length > 0) {
        products = products.filter(p => !filters.excludeProducts!.includes(p.productId));
      }
    }

    return products;
  }

  /**
   * Get a specific product from a feed
   */
  async getProduct(feedId: string, productId: string): Promise<Product | null> {
    const feed = await ProductFeedModel.findOne({ feedId });
    if (!feed) {
      return null;
    }

    return feed.products.find(p => p.productId === productId) || null;
  }

  /**
   * Sync feed from external source (Shopify, WooCommerce, etc.)
   */
  async syncFeed(feedId: string): Promise<{ success: boolean; productsUpdated: number; errors: string[] }> {
    const feed = await ProductFeedModel.findOne({ feedId });
    if (!feed) {
      return { success: false, productsUpdated: 0, errors: ['Feed not found'] };
    }

    try {
      feed.status = 'syncing';
      await feed.save();

      // For manual feeds, just update the lastSynced time
      // For external sources, you would fetch from the API here
      // This is a placeholder for actual sync logic

      feed.status = 'active';
      feed.stats.lastSynced = new Date();
      await feed.save();

      logger.info('Feed synced', { feedId, source: feed.source });

      return {
        success: true,
        productsUpdated: feed.products.length,
        errors: [],
      };
    } catch (error) {
      feed.status = 'error';
      await feed.save();

      const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
      logger.error('Feed sync failed', { feedId, error: errorMsg });

      return {
        success: false,
        productsUpdated: 0,
        errors: [errorMsg],
      };
    }
  }

  /**
   * Pause a feed
   */
  async pauseFeed(feedId: string): Promise<IProductFeed | null> {
    const feed = await ProductFeedModel.findOneAndUpdate(
      { feedId },
      { status: 'paused' },
      { new: true }
    );
    return feed;
  }

  /**
   * Activate a paused feed
   */
  async activateFeed(feedId: string): Promise<IProductFeed | null> {
    const feed = await ProductFeedModel.findOneAndUpdate(
      { feedId },
      { status: 'active' },
      { new: true }
    );
    return feed;
  }
}

export const feedService = new FeedService();

export default feedService;