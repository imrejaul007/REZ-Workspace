import { Types } from 'mongoose';
import Decimal from 'decimal.js';
import { Product, Creator } from '../models';
import { cacheService } from './cache.service';
import { logger } from './logger.service';
import config from '../config';
import {
  IProduct,
  IProductDocument,
  CreateProductDTO,
  UpdateProductDTO,
  PaginatedResponse,
  ProductStatus,
} from '../types';

class ProductService {
  /**
   * Create a new product
   */
  async create(data: CreateProductDTO): Promise<IProductDocument> {
    const creator = await Creator.findById(data.creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    // Validate commission
    if (data.commission > config.business.maxCommission) {
      throw new Error(`Commission cannot exceed ${config.business.maxCommission}%`);
    }

    // Calculate commission amount
    const commissionAmount = new Decimal(data.price)
      .times(data.commission)
      .dividedBy(100)
      .toNumber();

    const product = new Product({
      creatorId: data.creatorId,
      name: data.name,
      description: data.description || '',
      price: data.price,
      commission: data.commission,
      commissionAmount,
      inventory: data.inventory,
      soldCount: 0,
      category: data.category || 'general',
      tags: data.tags || [],
      images: data.images || [],
      status: ProductStatus.ACTIVE,
    });

    await product.save();

    // Increment creator product count
    await Creator.findByIdAndUpdate(data.creatorId, {
      $inc: { totalProducts: 1 },
    });

    await cacheService.invalidateCreatorCache(data.creatorId);
    logger.info(`Product created: ${product._id} for creator: ${data.creatorId}`);

    return product;
  }

  /**
   * Get product by ID
   */
  async getById(id: string): Promise<IProductDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    // Try cache first
    const cached = await cacheService.get<IProductDocument>(cacheService.keys.product(id));
    if (cached) {
      return cached;
    }

    const product = await Product.findById(id);
    if (product) {
      await cacheService.set(cacheService.keys.product(id), product, config.cache.ttl);
    }

    return product;
  }

  /**
   * Get products by creator
   */
  async getByCreator(
    creatorId: string,
    params: {
      page?: number;
      limit?: number;
      status?: ProductStatus;
      category?: string;
    } = {}
  ): Promise<PaginatedResponse<IProductDocument>> {
    const { page = 1, limit = config.pagination.defaultLimit, status, category } = params;

    const query: Record<string, unknown> = { creatorId };

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category.toLowerCase();
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(limit, config.pagination.maxLimit)),
      Product.countDocuments(query),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Update product
   */
  async update(id: string, data: UpdateProductDTO): Promise<IProductDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const product = await Product.findById(id);
    if (!product) {
      return null;
    }

    // Validate commission if being updated
    if (data.commission !== undefined && data.commission > config.business.maxCommission) {
      throw new Error(`Commission cannot exceed ${config.business.maxCommission}%`);
    }

    const updateData: Record<string, unknown> = { ...data };

    // Recalculate commission if price or commission changes
    if (data.price !== undefined || data.commission !== undefined) {
      const newPrice = data.price ?? product.price;
      const newCommission = data.commission ?? product.commission;
      updateData.commissionAmount = new Decimal(newPrice)
        .times(newCommission)
        .dividedBy(100)
        .toNumber();
    }

    const updated = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (updated) {
      await cacheService.invalidateProductCache(id);
      logger.info(`Product updated: ${id}`);
    }

    return updated;
  }

  /**
   * Delete product
   */
  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }

    const product = await Product.findById(id);
    if (!product) {
      return false;
    }

    await Product.findByIdAndDelete(id);

    // Decrement creator product count
    await Creator.findByIdAndUpdate(product.creatorId, {
      $inc: { totalProducts: -1 },
    });

    await cacheService.invalidateProductCache(id);
    await cacheService.invalidateCreatorCache(product.creatorId.toString());
    logger.info(`Product deleted: ${id}`);

    return true;
  }

  /**
   * Update inventory
   */
  async updateInventory(id: string, quantity: number): Promise<IProductDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const product = await Product.findById(id);
    if (!product) {
      return null;
    }

    product.inventory = Math.max(0, product.inventory + quantity);

    // Auto-update status
    if (product.inventory === 0) {
      product.status = ProductStatus.SOLD_OUT;
    } else if (product.status === ProductStatus.SOLD_OUT) {
      product.status = ProductStatus.ACTIVE;
    }

    await product.save();
    await cacheService.invalidateProductCache(id);

    return product;
  }

  /**
   * Decrement inventory (after order)
   */
  async decrementInventory(id: string, quantity: number = 1): Promise<IProductDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const product = await Product.findById(id);
    if (!product) {
      return null;
    }

    if (product.inventory < quantity) {
      throw new Error('Insufficient inventory');
    }

    product.inventory -= quantity;
    product.soldCount += quantity;

    // Auto-update status
    if (product.inventory === 0) {
      product.status = ProductStatus.SOLD_OUT;
    }

    await product.save();
    await cacheService.invalidateProductCache(id);

    return product;
  }

  /**
   * Increment inventory
   */
  async incrementInventory(id: string, quantity: number = 1): Promise<IProductDocument | null> {
    const product = await this.updateInventory(id, quantity);
    return product;
  }

  /**
   * Calculate net earnings for an order
   */
  calculateNetEarnings(product: IProductDocument, quantity: number = 1): {
    grossEarnings: number;
    commissionAmount: number;
    netEarnings: number;
  } {
    const grossEarnings = new Decimal(product.price).times(quantity).toNumber();
    const commissionAmount = new Decimal(grossEarnings)
      .times(product.commission)
      .dividedBy(100)
      .toNumber();
    const netEarnings = grossEarnings - commissionAmount;

    return {
      grossEarnings,
      commissionAmount,
      netEarnings,
    };
  }

  /**
   * Get featured products
   */
  async getFeatured(limit: number = 20): Promise<IProductDocument[]> {
    return Product.find({ status: ProductStatus.ACTIVE })
      .sort({ soldCount: -1, createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get products by category
   */
  async getByCategory(category: string, limit: number = 20): Promise<IProductDocument[]> {
    return Product.find({
      category: category.toLowerCase(),
      status: ProductStatus.ACTIVE,
    })
      .sort({ soldCount: -1 })
      .limit(limit);
  }

  /**
   * Search products
   */
  async search(
    query: string,
    params: {
      page?: number;
      limit?: number;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
    } = {}
  ): Promise<PaginatedResponse<IProductDocument>> {
    const { page = 1, limit = config.pagination.defaultLimit, category, minPrice, maxPrice } = params;

    const searchQuery: Record<string, unknown> = {
      status: ProductStatus.ACTIVE,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ],
    };

    if (category) {
      searchQuery.category = category.toLowerCase();
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      searchQuery.price = {};
      if (minPrice !== undefined) {
        (searchQuery.price as Record<string, number>).$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        (searchQuery.price as Record<string, number>).$lte = maxPrice;
      }
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(searchQuery)
        .sort({ soldCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(Math.min(limit, config.pagination.maxLimit)),
      Product.countDocuments(searchQuery),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Update product status
   */
  async updateStatus(id: string, status: ProductStatus): Promise<IProductDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (product) {
      await cacheService.invalidateProductCache(id);
    }

    return product;
  }
}

export const productService = new ProductService();
export default productService;
