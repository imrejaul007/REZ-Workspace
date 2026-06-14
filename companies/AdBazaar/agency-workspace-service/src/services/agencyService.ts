import { Agency, IAgency } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { agencyCreateSchema, agencyUpdateSchema, AgencyCreate, AgencyUpdate } from '../utils/helpers';

export class AgencyService {
  /**
   * Create a new agency
   */
  async createAgency(data: AgencyCreate): Promise<IAgency> {
    try {
      const validatedData = agencyCreateSchema.parse(data);

      // Generate API key
      const apiKey = uuidv4();

      const agency = new Agency({
        ...validatedData,
        apiKeys: [{
          key: apiKey,
          name: 'Primary API Key',
          permissions: ['full_access'],
          createdAt: new Date()
        }],
        stats: {
          totalClients: 0,
          activeClients: 0,
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalSpend: 0,
          totalRevenue: 0
        }
      });

      await agency.save();
      logger.info(`Agency created: ${agency._id}`, { agencyId: agency._id, name: agency.name });

      return agency;
    } catch (error) {
      logger.error('Failed to create agency', { error });
      throw error;
    }
  }

  /**
   * Get agency by ID
   */
  async getAgencyById(agencyId: string): Promise<IAgency | null> {
    try {
      const agency = await Agency.findById(agencyId);
      if (!agency) {
        logger.warn(`Agency not found: ${agencyId}`);
      }
      return agency;
    } catch (error) {
      logger.error('Failed to get agency', { agencyId, error });
      throw error;
    }
  }

  /**
   * List all agencies with pagination
   */
  async listAgencies(options: {
    page?: number;
    limit?: number;
    status?: string;
    tier?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ agencies: IAgency[]; total: number; page: number; limit: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        tier,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const query: any = {};
      if (status) query.status = status;
      if (tier) query.tier = tier;

      const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [agencies, total] = await Promise.all([
        Agency.find(query)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Agency.countDocuments(query)
      ]);

      return { agencies: agencies as IAgency[], total, page, limit };
    } catch (error) {
      logger.error('Failed to list agencies', { error });
      throw error;
    }
  }

  /**
   * Update agency
   */
  async updateAgency(agencyId: string, data: AgencyUpdate): Promise<IAgency | null> {
    try {
      const validatedData = agencyUpdateSchema.parse(data);

      const agency = await Agency.findByIdAndUpdate(
        agencyId,
        { $set: validatedData },
        { new: true, runValidators: true }
      );

      if (agency) {
        logger.info(`Agency updated: ${agencyId}`, { agencyId });
      }

      return agency;
    } catch (error) {
      logger.error('Failed to update agency', { agencyId, error });
      throw error;
    }
  }

  /**
   * Delete agency
   */
  async deleteAgency(agencyId: string): Promise<boolean> {
    try {
      const result = await Agency.findByIdAndDelete(agencyId);
      if (result) {
        logger.info(`Agency deleted: ${agencyId}`, { agencyId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete agency', { agencyId, error });
      throw error;
    }
  }

  /**
   * Generate new API key for agency
   */
  async generateApiKey(agencyId: string, name: string): Promise<string | null> {
    try {
      const apiKey = uuidv4();

      const agency = await Agency.findByIdAndUpdate(
        agencyId,
        {
          $push: {
            apiKeys: {
              key: apiKey,
              name,
              permissions: ['full_access'],
              createdAt: new Date()
            }
          }
        },
        { new: true }
      );

      if (agency) {
        logger.info(`API key generated for agency: ${agencyId}`);
        return apiKey;
      }
      return null;
    } catch (error) {
      logger.error('Failed to generate API key', { agencyId, error });
      throw error;
    }
  }

  /**
   * Update agency stats
   */
  async updateAgencyStats(agencyId: string, updates: Partial<IAgency['stats']>): Promise<void> {
    try {
      await Agency.findByIdAndUpdate(agencyId, {
        $inc: Object.fromEntries(
          Object.entries(updates).map(([key, value]) => [`stats.${key}`, value])
        )
      });
    } catch (error) {
      logger.error('Failed to update agency stats', { agencyId, error });
      throw error;
    }
  }

  /**
   * Get agency by email
   */
  async getAgencyByEmail(email: string): Promise<IAgency | null> {
    try {
      return await Agency.findOne({ email: email.toLowerCase() });
    } catch (error) {
      logger.error('Failed to get agency by email', { email, error });
      throw error;
    }
  }
}

export const agencyService = new AgencyService();