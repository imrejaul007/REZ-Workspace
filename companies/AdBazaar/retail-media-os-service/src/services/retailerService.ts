import { Retailer, IRetailer } from '../models';
import { logger } from '../utils/logger';
import { retailersTotal } from '../utils/metrics';
import { v4 as uuidv4 } from 'uuid';

export interface CreateRetailerInput {
  name: string;
  slug?: string;
  logo?: string;
  website?: string;
  categories: string[];
  settings?: Partial<IRetailer['settings']>;
  integration?: Partial<IRetailer['integration']>;
}

export interface UpdateRetailerInput {
  name?: string;
  logo?: string;
  website?: string;
  categories?: string[];
  settings?: Partial<IRetailer['settings']>;
  integration?: Partial<IRetailer['integration']>;
  status?: 'active' | 'inactive' | 'suspended';
}

class RetailerService {
  async create(input: CreateRetailerInput): Promise<IRetailer> {
    try {
      const slug = input.slug || this.generateSlug(input.name);

      const retailer = new Retailer({
        name: input.name,
        slug,
        logo: input.logo,
        website: input.website,
        categories: input.categories,
        settings: input.settings,
        integration: input.integration,
        status: 'active'
      });

      await retailer.save();
      logger.info(`Retailer created: ${retailer._id} - ${retailer.name}`);

      // Update metrics
      retailersTotal.inc();

      return retailer;
    } catch (error) {
      logger.error('Error creating retailer:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<IRetailer | null> {
    try {
      const retailer = await Retailer.findById(id);
      return retailer;
    } catch (error) {
      logger.error(`Error fetching retailer ${id}:`, error);
      throw error;
    }
  }

  async getBySlug(slug: string): Promise<IRetailer | null> {
    try {
      const retailer = await Retailer.findOne({ slug });
      return retailer;
    } catch (error) {
      logger.error(`Error fetching retailer by slug ${slug}:`, error);
      throw error;
    }
  }

  async list(filters?: {
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ retailers: IRetailer[]; total: number }> {
    try {
      const query: Record<string, unknown> = {};

      if (filters?.status) {
        query.status = filters.status;
      }
      if (filters?.category) {
        query.categories = filters.category;
      }

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      const [retailers, total] = await Promise.all([
        Retailer.find(query).skip(offset).limit(limit).sort({ createdAt: -1 }),
        Retailer.countDocuments(query)
      ]);

      return { retailers, total };
    } catch (error) {
      logger.error('Error listing retailers:', error);
      throw error;
    }
  }

  async update(id: string, input: UpdateRetailerInput): Promise<IRetailer | null> {
    try {
      const retailer = await Retailer.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true, runValidators: true }
      );

      if (retailer) {
        logger.info(`Retailer updated: ${id}`);
      }

      return retailer;
    } catch (error) {
      logger.error(`Error updating retailer ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await Retailer.findByIdAndDelete(id);

      if (result) {
        logger.info(`Retailer deleted: ${id}`);
        retailersTotal.dec();
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error deleting retailer ${id}:`, error);
      throw error;
    }
  }

  async updateStoreCount(id: string, change: number): Promise<void> {
    try {
      await Retailer.findByIdAndUpdate(id, {
        $inc: { storeCount: change }
      });
    } catch (error) {
      logger.error(`Error updating store count for retailer ${id}:`, error);
      throw error;
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const categories = await Retailer.distinct('categories');
      return categories;
    } catch (error) {
      logger.error('Error fetching categories:', error);
      throw error;
    }
  }

  private generateSlug(name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return `${slug}-${uuidv4().slice(0, 8)}`;
  }
}

export const retailerService = new RetailerService();
export default retailerService;