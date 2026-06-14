import { IndustryConfig, IIndustryConfig } from '../models/Industry.js';
import { Module, IModule } from '../models/Module.js';
import { IndustryType, ModuleType, INDUSTRY_MODULES, INDUSTRY_INFO, MODULE_INFO, ApiResponse } from '../types/index.js';
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

export interface IndustryWithModules {
  type: IndustryType;
  name: string;
  description: string;
  icon: string;
  color: string;
  modules: {
    id: ModuleType;
    name: string;
    description: string;
    icon: string;
    category: 'core' | 'operations' | 'customer' | 'management';
  }[];
  features: IIndustryConfig['features'];
}

export interface ModuleWithIndustries {
  id: ModuleType;
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'operations' | 'customer' | 'management';
  industries: IndustryType[];
}

export class IndustryService {
  /**
   * Initialize industry configurations
   */
  async initializeIndustries(): Promise<void> {
    try {
      await IndustryConfig.initializeFromConfig();
      logger.info('Industry configurations initialized');
    } catch (error) {
      logger.error('Failed to initialize industries', { error });
      throw error;
    }
  }

  /**
   * Initialize modules
   */
  async initializeModules(): Promise<void> {
    try {
      await Module.initializeFromConfig();
      logger.info('Module configurations initialized');
    } catch (error) {
      logger.error('Failed to initialize modules', { error });
      throw error;
    }
  }

  /**
   * Get all industries with their modules
   */
  async getAllIndustries(): Promise<ApiResponse<IndustryWithModules[]>> {
    try {
      const industries: IndustryWithModules[] = [];

      for (const industryType of Object.values(IndustryType)) {
        const info = INDUSTRY_INFO[industryType];
        const modules = INDUSTRY_MODULES[industryType] || [];

        const moduleInfos = modules.map((moduleType) => {
          const moduleInfo = MODULE_INFO[moduleType];
          return {
            id: moduleType,
            name: moduleInfo.name,
            description: moduleInfo.description,
            icon: moduleInfo.icon,
            category: moduleInfo.category
          };
        });

        // Get features from database or use defaults
        const dbConfig = await IndustryConfig.findOne({ industry: industryType });
        const features = dbConfig?.features || this.getDefaultFeatures(industryType);

        industries.push({
          type: industryType,
          name: info.name,
          description: info.description,
          icon: info.icon,
          color: info.color,
          modules: moduleInfos,
          features
        });
      }

      return {
        success: true,
        data: industries
      };
    } catch (error) {
      logger.error('Failed to get all industries', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get industries'
      };
    }
  }

  /**
   * Get industry by type
   */
  async getIndustryByType(type: IndustryType): Promise<ApiResponse<IndustryWithModules>> {
    try {
      const info = INDUSTRY_INFO[type];
      if (!info) {
        return {
          success: false,
          error: 'Industry not found'
        };
      }

      const modules = INDUSTRY_MODULES[type] || [];
      const moduleInfos = modules.map((moduleType) => {
        const moduleInfo = MODULE_INFO[moduleType];
        return {
          id: moduleType,
          name: moduleInfo.name,
          description: moduleInfo.description,
          icon: moduleInfo.icon,
          category: moduleInfo.category
        };
      });

      const dbConfig = await IndustryConfig.findOne({ industry: type });
      const features = dbConfig?.features || this.getDefaultFeatures(type);

      return {
        success: true,
        data: {
          type,
          name: info.name,
          description: info.description,
          icon: info.icon,
          color: info.color,
          modules: moduleInfos,
          features
        }
      };
    } catch (error) {
      logger.error('Failed to get industry by type', { error, type });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get industry'
      };
    }
  }

  /**
   * Get modules for an industry
   */
  async getModulesForIndustry(type: IndustryType): Promise<ApiResponse<ModuleWithIndustries[]>> {
    try {
      const modules = INDUSTRY_MODULES[type] || [];

      const moduleInfos: ModuleWithIndustries[] = modules.map((moduleType) => {
        const moduleInfo = MODULE_INFO[moduleType];
        return {
          id: moduleType,
          name: moduleInfo.name,
          description: moduleInfo.description,
          icon: moduleInfo.icon,
          category: moduleInfo.category,
          industries: [type]
        };
      });

      return {
        success: true,
        data: moduleInfos
      };
    } catch (error) {
      logger.error('Failed to get modules for industry', { error, type });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get modules'
      };
    }
  }

  /**
   * Get all modules
   */
  async getAllModules(): Promise<ApiResponse<ModuleWithIndustries[]>> {
    try {
      const moduleInfos: ModuleWithIndustries[] = [];

      for (const moduleType of Object.values(ModuleType)) {
        const moduleInfo = MODULE_INFO[moduleType];

        // Find which industries have this module
        const industries: IndustryType[] = [];
        for (const [industry, modules] of Object.entries(INDUSTRY_MODULES)) {
          if (modules.includes(moduleType)) {
            industries.push(industry as IndustryType);
          }
        }

        moduleInfos.push({
          id: moduleType,
          name: moduleInfo.name,
          description: moduleInfo.description,
          icon: moduleInfo.icon,
          category: moduleInfo.category,
          industries
        });
      }

      return {
        success: true,
        data: moduleInfos
      };
    } catch (error) {
      logger.error('Failed to get all modules', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get modules'
      };
    }
  }

  /**
   * Get module by type
   */
  async getModuleByType(type: ModuleType): Promise<ApiResponse<ModuleWithIndustries>> {
    try {
      const moduleInfo = MODULE_INFO[type];
      if (!moduleInfo) {
        return {
          success: false,
          error: 'Module not found'
        };
      }

      // Find which industries have this module
      const industries: IndustryType[] = [];
      for (const [industry, modules] of Object.entries(INDUSTRY_MODULES)) {
        if (modules.includes(type)) {
          industries.push(industry as IndustryType);
        }
      }

      return {
        success: true,
        data: {
          id: type,
          name: moduleInfo.name,
          description: moduleInfo.description,
          icon: moduleInfo.icon,
          category: moduleInfo.category,
          industries
        }
      };
    } catch (error) {
      logger.error('Failed to get module by type', { error, type });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get module'
      };
    }
  }

  /**
   * Get industries by category
   */
  async getIndustriesByModuleCategory(category: IModule['category']): Promise<ApiResponse<IndustryWithModules[]>> {
    try {
      const industries: IndustryWithModules[] = [];

      for (const industryType of Object.values(IndustryType)) {
        const info = INDUSTRY_INFO[industryType];
        const modules = INDUSTRY_MODULES[industryType] || [];

        // Filter modules by category
        const moduleInfos = modules
          .map((moduleType) => {
            const moduleInfo = MODULE_INFO[moduleType];
            if (moduleInfo.category === category) {
              return {
                id: moduleType,
                name: moduleInfo.name,
                description: moduleInfo.description,
                icon: moduleInfo.icon,
                category: moduleInfo.category
              };
            }
            return null;
          })
          .filter((m): m is NonNullable<typeof m> => m !== null);

        if (moduleInfos.length > 0) {
          const dbConfig = await IndustryConfig.findOne({ industry: industryType });
          const features = dbConfig?.features || this.getDefaultFeatures(industryType);

          industries.push({
            type: industryType,
            name: info.name,
            description: info.description,
            icon: info.icon,
            color: info.color,
            modules: moduleInfos,
            features
          });
        }
      }

      return {
        success: true,
        data: industries
      };
    } catch (error) {
      logger.error('Failed to get industries by module category', { error, category });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get industries'
      };
    }
  }

  /**
   * Get default features based on industry type
   */
  private getDefaultFeatures(industry: IndustryType): IIndustryConfig['features'] {
    const features: IIndustryConfig['features'] = {
      hasReservations: ['restaurant', 'hotel', 'salon', 'spa'].includes(industry),
      hasInventory: true,
      hasStaff: true,
      hasLoyalty: true,
      hasBookings: ['hotel', 'salon', 'spa'].includes(industry),
      hasMembership: ['gym', 'fitness'].includes(industry),
      hasDelivery: ['restaurant', 'grocery', 'retail'].includes(industry),
      hasTableManagement: industry === 'restaurant'
    };
    return features;
  }
}

export const industryService = new IndustryService();
export default industryService;
