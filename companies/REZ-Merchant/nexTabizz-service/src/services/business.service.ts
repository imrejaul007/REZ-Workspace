import { v4 as uuidv4 } from 'uuid';
import { Business, IBusiness } from '../models/Business.js';
import {
  IndustryType,
  ModuleType,
  INDUSTRY_MODULES,
  INDUSTRY_INFO,
  CreateBusinessSchema,
  UpdateBusinessSchema,
  QueryBusinessSchema,
  PaginationInfo,
  PaginatedResponse,
  ApiResponse
} from '../types/index.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export class BusinessService {
  /**
   * Create a new business
   */
  async createBusiness(data: z.infer<typeof CreateBusinessSchema>): Promise<ApiResponse<IBusiness>> {
    try {
      const validationResult = CreateBusinessSchema.safeParse(data);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error.errors[0].message
        };
      }

      const validatedData = validationResult.data;

      // Generate unique business ID
      const businessId = `biz_${uuidv4().replace(/-/g, '').substring(0, 12)}`;

      // Get default modules for the industry
      const defaultModules = INDUSTRY_MODULES[validatedData.industry] || [];

      // Create business
      const business = new Business({
        businessId,
        name: validatedData.name,
        industry: validatedData.industry,
        ownerId: validatedData.ownerId,
        modules: defaultModules,
        location: {
          address: validatedData.address,
          city: validatedData.city,
          state: validatedData.state,
          country: validatedData.country,
          zipCode: validatedData.zipCode
        },
        contact: {
          phone: validatedData.phone,
          email: validatedData.email
        },
        timezone: validatedData.timezone || 'Asia/Kolkata',
        currency: validatedData.currency || 'INR',
        locale: validatedData.locale || 'en-IN',
        settings: validatedData.settings || {}
      });

      await business.save();

      logger.info(`Business created: ${businessId}`, {
        businessId,
        industry: validatedData.industry,
        ownerId: validatedData.ownerId
      });

      return {
        success: true,
        data: business,
        message: 'Business created successfully'
      };
    } catch (error) {
      logger.error('Failed to create business', { error, data });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create business'
      };
    }
  }

  /**
   * Get business by ID
   */
  async getBusinessById(businessId: string): Promise<ApiResponse<IBusiness>> {
    try {
      const business = await Business.findOne({ businessId });

      if (!business) {
        return {
          success: false,
          error: 'Business not found'
        };
      }

      return {
        success: true,
        data: business
      };
    } catch (error) {
      logger.error('Failed to get business', { error, businessId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get business'
      };
    }
  }

  /**
   * List businesses with pagination and filters
   */
  async listBusinesses(params: {
    page?: number;
    limit?: number;
    industry?: IndustryType;
    isActive?: boolean;
    search?: string;
    ownerId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<IBusiness>> {
    try {
      const query = QueryBusinessSchema.parse(params);
      const skip = (query.page - 1) * query.limit;

      const filter: Record<string, any> = {};

      if (query.industry) {
        filter.industry = query.industry;
      }

      if (query.isActive !== undefined) {
        filter.isActive = query.isActive;
      }

      if (query.search) {
        filter.$or = [
          { name: { $regex: query.search, $options: 'i' } },
          { 'location.city': { $regex: query.search, $options: 'i' } }
        ];
      }

      if (params.ownerId) {
        filter.ownerId = params.ownerId;
      }

      const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
      const sort: Record<string, 1 | -1> = {};
      sort[query.sortBy] = sortDirection;

      const [businesses, total] = await Promise.all([
        Business.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(query.limit)
          .lean(),
        Business.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / query.limit);

      const pagination: PaginationInfo = {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1
      };

      return {
        success: true,
        data: businesses as IBusiness[],
        pagination
      };
    } catch (error) {
      logger.error('Failed to list businesses', { error, params });
      return {
        success: false,
        data: [],
        pagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }
  }

  /**
   * Update business
   */
  async updateBusiness(
    businessId: string,
    data: z.infer<typeof UpdateBusinessSchema>
  ): Promise<ApiResponse<IBusiness>> {
    try {
      const validationResult = UpdateBusinessSchema.safeParse(data);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error.errors[0].message
        };
      }

      const validatedData = validationResult.data;
      const updateData: Record<string, any> = {};

      // Handle location updates
      if (validatedData.address || validatedData.city || validatedData.state || validatedData.country || validatedData.zipCode) {
        updateData['location.address'] = validatedData.address;
        updateData['location.city'] = validatedData.city;
        updateData['location.state'] = validatedData.state;
        updateData['location.country'] = validatedData.country;
        updateData['location.zipCode'] = validatedData.zipCode;
      }

      // Handle contact updates
      if (validatedData.phone || validatedData.email) {
        updateData['contact.phone'] = validatedData.phone;
        updateData['contact.email'] = validatedData.email;
      }

      // Handle other fields
      if (validatedData.name) updateData.name = validatedData.name;
      if (validatedData.timezone) updateData.timezone = validatedData.timezone;
      if (validatedData.currency) updateData.currency = validatedData.currency;
      if (validatedData.locale) updateData.locale = validatedData.locale;
      if (validatedData.settings) updateData.settings = validatedData.settings;
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

      const business = await Business.findOneAndUpdate(
        { businessId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!business) {
        return {
          success: false,
          error: 'Business not found'
        };
      }

      logger.info(`Business updated: ${businessId}`, { updateData });

      return {
        success: true,
        data: business,
        message: 'Business updated successfully'
      };
    } catch (error) {
      logger.error('Failed to update business', { error, businessId, data });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update business'
      };
    }
  }

  /**
   * Delete business (soft delete)
   */
  async deleteBusiness(businessId: string): Promise<ApiResponse<IBusiness>> {
    try {
      const business = await Business.findOneAndUpdate(
        { businessId },
        { $set: { isActive: false } },
        { new: true }
      );

      if (!business) {
        return {
          success: false,
          error: 'Business not found'
        };
      }

      logger.info(`Business deactivated: ${businessId}`);

      return {
        success: true,
        data: business,
        message: 'Business deleted successfully'
      };
    } catch (error) {
      logger.error('Failed to delete business', { error, businessId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete business'
      };
    }
  }

  /**
   * Get modules for a business
   */
  async getBusinessModules(businessId: string): Promise<ApiResponse<{ enabled: ModuleType[]; available: ModuleType[] }>> {
    try {
      const business = await Business.findOne({ businessId }).lean();

      if (!business) {
        return {
          success: false,
          error: 'Business not found'
        };
      }

      const availableModules = INDUSTRY_MODULES[business.industry as IndustryType] || [];
      const enabledModules = business.modules;

      return {
        success: true,
        data: {
          enabled: enabledModules,
          available: availableModules
        }
      };
    } catch (error) {
      logger.error('Failed to get business modules', { error, businessId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get modules'
      };
    }
  }

  /**
   * Enable a module for a business
   */
  async enableModule(businessId: string, moduleId: ModuleType): Promise<ApiResponse<IBusiness>> {
    try {
      const business = await Business.findOne({ businessId });

      if (!business) {
        return {
          success: false,
          error: 'Business not found'
        };
      }

      // Check if module is available for this industry
      const availableModules = INDUSTRY_MODULES[business.industry] || [];
      if (!availableModules.includes(moduleId)) {
        return {
          success: false,
          error: `Module ${moduleId} is not available for ${business.industry} industry`
        };
      }

      // Check if module is already enabled
      if (business.modules.includes(moduleId)) {
        return {
          success: false,
          error: 'Module is already enabled'
        };
      }

      business.modules.push(moduleId);
      await business.save();

      logger.info(`Module enabled: ${moduleId} for business: ${businessId}`);

      return {
        success: true,
        data: business,
        message: 'Module enabled successfully'
      };
    } catch (error) {
      logger.error('Failed to enable module', { error, businessId, moduleId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enable module'
      };
    }
  }

  /**
   * Disable a module for a business
   */
  async disableModule(businessId: string, moduleId: ModuleType): Promise<ApiResponse<IBusiness>> {
    try {
      const business = await Business.findOne({ businessId });

      if (!business) {
        return {
          success: false,
          error: 'Business not found'
        };
      }

      // Check if module is currently enabled
      if (!business.modules.includes(moduleId)) {
        return {
          success: false,
          error: 'Module is not enabled'
        };
      }

      // Remove module from enabled list
      business.modules = business.modules.filter((m) => m !== moduleId);
      await business.save();

      logger.info(`Module disabled: ${moduleId} for business: ${businessId}`);

      return {
        success: true,
        data: business,
        message: 'Module disabled successfully'
      };
    } catch (error) {
      logger.error('Failed to disable module', { error, businessId, moduleId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disable module'
      };
    }
  }

  /**
   * Get businesses by owner
   */
  async getBusinessesByOwner(ownerId: string): Promise<ApiResponse<IBusiness[]>> {
    try {
      const businesses = await Business.find({ ownerId, isActive: true })
        .sort({ createdAt: -1 })
        .lean();

      return {
        success: true,
        data: businesses as IBusiness[]
      };
    } catch (error) {
      logger.error('Failed to get businesses by owner', { error, ownerId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get businesses'
      };
    }
  }

  /**
   * Update business stats
   */
  async updateBusinessStats(
    businessId: string,
    stats: Partial<IBusiness['stats']>
  ): Promise<ApiResponse<IBusiness>> {
    try {
      const business = await Business.findOneAndUpdate(
        { businessId },
        { $inc: stats },
        { new: true }
      );

      if (!business) {
        return {
          success: false,
          error: 'Business not found'
        };
      }

      return {
        success: true,
        data: business
      };
    } catch (error) {
      logger.error('Failed to update business stats', { error, businessId, stats });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update stats'
      };
    }
  }
}

// Import zod for schema validation type
import { z } from 'zod';

export const businessService = new BusinessService();
export default businessService;
