/**
 * Brand Service - Business logic for brand operations
 */

import { v4 as uuidv4 } from 'uuid';
import { Brand, IBrand } from '../models';
import logger from 'utils/logger.js';

export interface CreateBrandInput {
  name: string;
  industry: string;
  website?: string;
  logo?: string;
  description?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
  tier?: 'basic' | 'silver' | 'gold' | 'platinum';
  userId: string;
}

export interface UpdateBrandInput {
  name?: string;
  industry?: string;
  website?: string;
  logo?: string;
  description?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
  tier?: 'basic' | 'silver' | 'gold' | 'platinum';
}

export class BrandService {
  /**
   * Create a new brand
   */
  async createBrand(input: CreateBrandInput): Promise<IBrand> {
    const brandId = `brand-${uuidv4().slice(0, 8)}`;

    const brand = new Brand({
      brandId,
      ...input,
      registeredAt: new Date()
    });

    await brand.save();
    logger.info(`Brand created: ${brandId}`, { name: input.name, userId: input.userId });

    return brand;
  }

  /**
   * Get brand by ID
   */
  async getBrandById(brandId: string): Promise<IBrand | null> {
    return Brand.findOne({ brandId });
  }

  /**
   * Get brand by user ID
   */
  async getBrandByUserId(userId: string): Promise<IBrand | null> {
    return Brand.findOne({ userId });
  }

  /**
   * Update brand
   */
  async updateBrand(brandId: string, input: UpdateBrandInput): Promise<IBrand | null> {
    const brand = await Brand.findOneAndUpdate(
      { brandId },
      { $set: input },
      { new: true }
    );

    if (brand) {
      logger.info(`Brand updated: ${brandId}`, input);
    }

    return brand;
  }

  /**
   * Verify brand
   */
  async verifyBrand(brandId: string): Promise<IBrand | null> {
    const brand = await Brand.findOneAndUpdate(
      { brandId },
      { $set: { verified: true, verifiedAt: new Date() } },
      { new: true }
    );

    if (brand) {
      logger.info(`Brand verified: ${brandId}`);
    }

    return brand;
  }

  /**
   * List brands with pagination
   */
  async listBrands(options: {
    page?: number;
    limit?: number;
    industry?: string;
    tier?: string;
    verified?: boolean;
  }): Promise<{ brands: IBrand[]; total: number; page: number; limit: number; pages: number }> {
    const { page = 1, limit = 20, industry, tier, verified } = options;
    const query: Record<string, any> = {};

    if (industry) query.industry = industry;
    if (tier) query.tier = tier;
    if (verified !== undefined) query.verified = verified;

    const skip = (page - 1) * limit;

    const [brands, total] = await Promise.all([
      Brand.find(query).sort({ registeredAt: -1 }).skip(skip).limit(limit),
      Brand.countDocuments(query)
    ]);

    return {
      brands,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Increment brand campaign stats
   */
  async incrementCampaignStats(brandId: string, budget: number = 0): Promise<void> {
    await Brand.findOneAndUpdate(
      { brandId },
      {
        $inc: {
          totalCampaigns: 1,
          totalBudget: budget
        }
      }
    );
  }

  /**
   * Delete brand
   */
  async deleteBrand(brandId: string): Promise<boolean> {
    const result = await Brand.deleteOne({ brandId });
    if (result.deletedCount > 0) {
      logger.info(`Brand deleted: ${brandId}`);
      return true;
    }
    return false;
  }
}

export const brandService = new BrandService();