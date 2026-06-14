/**
 * Restaurant Service
 *
 * Business logic for restaurant profile management
 */

import { Restaurant, IRestaurant, IAddress, IOperatingHours, IBranch } from '../models/Restaurant';
import { logger } from '../config/logger';
import axios from 'axios';

const log = (msg: string, meta?) => logger.info(`[restaurant] ${msg}`, meta);

const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4005';

export interface CreateRestaurantInput {
  name: string;
  description?: string;
  cuisineTypes: string[];
  priceRange: 1 | 2 | 3 | 4;
  address: IAddress;
  phone: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  operatingHours: IOperatingHours[];
  amenities?: string[];
  images?: string[];
  ownerId: string;
}

export interface UpdateRestaurantInput {
  name?: string;
  description?: string;
  cuisineTypes?: string[];
  priceRange?: 1 | 2 | 3 | 4;
  address?: IAddress;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  operatingHours?: IOperatingHours[];
  amenities?: string[];
  images?: string[];
  isActive?: boolean;
}

export interface BranchInput {
  name: string;
  address: IAddress;
  phone: string;
  email?: string;
  operatingHours: IOperatingHours[];
}

export interface SearchFilters {
  city?: string;
  cuisineTypes?: string[];
  priceRange?: number[];
  amenities?: string[];
  minRating?: number;
  isActive?: boolean;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36);
}

/**
 * FIX (security): Generate secure ID using crypto
 */
function generateRestaurantId(): string {
  try {
    const { randomUUID } = require('crypto');
    const uuid = randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
    return `RS${Date.now().toString(36)}${uuid}`;
  } catch {
    return 'RS' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
}

class RestaurantService {
  /**
   * Create a new restaurant
   */
  async createRestaurant(input: CreateRestaurantInput): Promise<IRestaurant> {
    const restaurantId = generateRestaurantId();
    const slug = generateSlug(input.name);

    const restaurant = new Restaurant({
      restaurantId,
      slug,
      ...input,
      branches: [],
      isActive: true,
      isVerified: false,
    });

    await restaurant.save();
    log('Restaurant created', { restaurantId, name: input.name });

    return restaurant;
  }

  /**
   * Get restaurant by ID
   */
  async getRestaurant(restaurantId: string): Promise<IRestaurant | null> {
    return Restaurant.findOne({ restaurantId, isActive: true });
  }

  /**
   * Get restaurant by slug
   */
  async getRestaurantBySlug(slug: string): Promise<IRestaurant | null> {
    return Restaurant.findOne({ slug, isActive: true });
  }

  /**
   * Get restaurants by owner
   */
  async getRestaurantsByOwner(ownerId: string): Promise<IRestaurant[]> {
    return Restaurant.find({ ownerId }).sort({ createdAt: -1 });
  }

  /**
   * Update restaurant
   */
  async updateRestaurant(restaurantId: string, input: UpdateRestaurantInput): Promise<IRestaurant | null> {
    const restaurant = await Restaurant.findOneAndUpdate(
      { restaurantId },
      { $set: input },
      { new: true }
    );

    if (restaurant) {
      log('Restaurant updated', { restaurantId });
    }

    return restaurant;
  }

  /**
   * Delete restaurant (soft delete)
   */
  async deleteRestaurant(restaurantId: string): Promise<boolean> {
    const result = await Restaurant.findOneAndUpdate(
      { restaurantId },
      { $set: { isActive: false } }
    );

    if (result) {
      log('Restaurant deleted', { restaurantId });
      return true;
    }

    return false;
  }

  /**
   * Add a branch to restaurant
   */
  async addBranch(restaurantId: string, branch: BranchInput): Promise<IRestaurant | null> {
    const restaurant = await Restaurant.findOne({ restaurantId });
    if (!restaurant) return null;

    const branchId = 'BR' + Date.now().toString(36);
    const newBranch: IBranch = {
      branchId,
      ...branch,
      isActive: true,
    };

    restaurant.branches.push(newBranch);
    await restaurant.save();

    log('Branch added', { restaurantId, branchId });
    return restaurant;
  }

  /**
   * Update branch
   */
  async updateBranch(
    restaurantId: string,
    branchId: string,
    updates: Partial<BranchInput>
  ): Promise<IRestaurant | null> {
    const restaurant = await Restaurant.findOne({ restaurantId });
    if (!restaurant) return null;

    const branchIndex = restaurant.branches.findIndex((b: IBranch) => b.branchId === branchId);
    if (branchIndex === -1) return null;

    restaurant.branches[branchIndex] = {
      ...restaurant.branches[branchIndex],
      ...updates,
    };

    await restaurant.save();
    log('Branch updated', { restaurantId, branchId });

    return restaurant;
  }

  /**
   * Remove branch
   */
  async removeBranch(restaurantId: string, branchId: string): Promise<IRestaurant | null> {
    const restaurant = await Restaurant.findOneAndUpdate(
      { restaurantId },
      { $pull: { branches: { branchId } } },
      { new: true }
    );

    if (restaurant) {
      log('Branch removed', { restaurantId, branchId });
    }

    return restaurant;
  }

  /**
   * Search restaurants with filters
   */
  async searchRestaurants(filters: SearchFilters): Promise<IRestaurant[]> {
    const query: unknown = { isActive: filters.isActive !== false };

    if (filters.city) {
      query['address.city'] = { $regex: filters.city, $options: 'i' };
    }

    if (filters.cuisineTypes && filters.cuisineTypes.length > 0) {
      query.cuisineTypes = { $in: filters.cuisineTypes };
    }

    if (filters.priceRange && filters.priceRange.length > 0) {
      query.priceRange = { $in: filters.priceRange };
    }

    if (filters.amenities && filters.amenities.length > 0) {
      query.amenities = { $all: filters.amenities };
    }

    if (filters.minRating) {
      query['rating.average'] = { $gte: filters.minRating };
    }

    return Restaurant.find(query).sort({ 'rating.average': -1, name: 1 });
  }

  /**
   * Get personalized recommendations from REZ Mind
   */
  async getRecommendations(
    userId: string,
    filters?: SearchFilters
  ): Promise<{ restaurantId: string; score: number }[]> {
    try {
      const response = await axios.post(
        `${REZ_MIND_URL}/v1/recommendations/restaurants`,
        { userId, filters },
        { timeout: 5000 }
      );

      return response.data.recommendations || [];
    } catch (error) {
      log('Failed to get recommendations from REZ Mind', { error });
      return [];
    }
  }

  /**
   * Update restaurant rating
   */
  async updateRating(
    restaurantId: string,
    newRating: number
  ): Promise<void> {
    const restaurant = await Restaurant.findOne({ restaurantId });
    if (!restaurant) return;

    const currentCount = restaurant.rating?.count || 0;
    const currentAverage = restaurant.rating?.average || 0;

    const newCount = currentCount + 1;
    const updatedAverage = ((currentAverage * currentCount) + newRating) / newCount;

    await Restaurant.findOneAndUpdate(
      { restaurantId },
      {
        $set: {
          'rating.average': Math.round(updatedAverage * 10) / 10,
          'rating.count': newCount,
        },
      }
    );
  }
}

export const restaurantService = new RestaurantService();
