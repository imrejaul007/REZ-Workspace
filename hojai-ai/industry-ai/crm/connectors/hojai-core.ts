/**
 * HOJAI Core Connector
 * Central connector for all Industry AI products
 */

export type IndustryType =
  | 'waitron'      // Restaurant POS & ordering
  | 'shopflow'     // Retail shopping
  | 'staybot'      // Hotel management
  | 'carecode'     // Healthcare scheduling
  | 'glamai'       // Salon & beauty
  | 'fitmind'      // Fitness & wellness
  | 'teammind'     // Team management
  | 'ledgerai'     // Accounting & invoicing
  | 'fleetiq'      // Fleet management
  | 'propflow'     // Property management
  | 'neighborai'   // Community management
  | 'learniq'      // Learning management
  | 'tripmind'     // Travel planning
  | 'franchiseiq'  // Franchise management
  | 'prodflow';    // Production/manufacturing

export interface IndustryProduct {
  id: string;
  name: string;
  industry: IndustryType;
  basePort: number;
  apiEndpoint: string;
  description: string;
}

export interface HOJAIConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

// Port mapping for all 15 Industry AI products
export const INDUSTRY_PRODUCTS: Record<IndustryType, IndustryProduct> = {
  waitron: {
    id: 'waitron',
    name: 'Waitron',
    industry: 'waitron',
    basePort: 4101,
    apiEndpoint: '/api/waitron',
    description: 'Restaurant POS & Intelligent Ordering System'
  },
  shopflow: {
    id: 'shopflow',
    name: 'ShopFlow',
    industry: 'shopflow',
    basePort: 4102,
    apiEndpoint: '/api/shopflow',
    description: 'Retail Shopping Experience Platform'
  },
  staybot: {
    id: 'staybot',
    name: 'StayBot',
    industry: 'staybot',
    basePort: 4103,
    apiEndpoint: '/api/staybot',
    description: 'Hotel Management & Guest Experience'
  },
  carecode: {
    id: 'carecode',
    name: 'CareCode',
    industry: 'carecode',
    basePort: 4104,
    apiEndpoint: '/api/carecode',
    description: 'Healthcare Scheduling & Patient Management'
  },
  glamai: {
    id: 'glamai',
    name: 'GlamAI',
    industry: 'glamai',
    basePort: 4105,
    apiEndpoint: '/api/glamai',
    description: 'Salon & Beauty Services Platform'
  },
  fitmind: {
    id: 'fitmind',
    name: 'FitMind',
    industry: 'fitmind',
    basePort: 4106,
    apiEndpoint: '/api/fitmind',
    description: 'Fitness & Wellness Management'
  },
  teammind: {
    id: 'teammind',
    name: 'TeamMind',
    industry: 'teammind',
    basePort: 4107,
    apiEndpoint: '/api/teammind',
    description: 'Team Collaboration & Management'
  },
  ledgerai: {
    id: 'ledgerai',
    name: 'LedgerAI',
    industry: 'ledgerai',
    basePort: 4108,
    apiEndpoint: '/api/ledgerai',
    description: 'Accounting & Invoicing Automation'
  },
  fleetiq: {
    id: 'fleetiq',
    name: 'FleetIQ',
    industry: 'fleetiq',
    basePort: 4109,
    apiEndpoint: '/api/fleetiq',
    description: 'Fleet Management & Tracking'
  },
  propflow: {
    id: 'propflow',
    name: 'PropFlow',
    industry: 'propflow',
    basePort: 4110,
    apiEndpoint: '/api/propflow',
    description: 'Property Management & Rentals'
  },
  neighborai: {
    id: 'neighborai',
    name: 'NeighborAI',
    industry: 'neighborai',
    basePort: 4111,
    apiEndpoint: '/api/neighborai',
    description: 'Community & Neighborhood Platform'
  },
  learniq: {
    id: 'learniq',
    name: 'LearnIQ',
    industry: 'learniq',
    basePort: 4112,
    apiEndpoint: '/api/learniq',
    description: 'Learning Management System'
  },
  tripmind: {
    id: 'tripmind',
    name: 'TripMind',
    industry: 'tripmind',
    basePort: 4113,
    apiEndpoint: '/api/tripmind',
    description: 'Travel Planning & Booking'
  },
  franchiseiq: {
    id: 'franchiseiq',
    name: 'FranchiseIQ',
    industry: 'franchiseiq',
    basePort: 4114,
    apiEndpoint: '/api/franchiseiq',
    description: 'Franchise Management System'
  },
  prodflow: {
    id: 'prodflow',
    name: 'ProdFlow',
    industry: 'prodflow',
    basePort: 4115,
    apiEndpoint: '/api/prodflow',
    description: 'Production & Manufacturing Management'
  }
};

export class HOJAIConnector {
  private config: HOJAIConfig;
  private baseUrl: string;

  constructor(config?: Partial<HOJAIConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || process.env.HOJAI_CORE_URL || 'http://localhost:4100',
      apiKey: config?.apiKey || process.env.HOJAI_API_KEY || '',
      timeout: config?.timeout || 30000
    };
    this.baseUrl = this.config.baseUrl;
  }

  /**
   * Get all registered Industry AI products
   */
  getAllProducts(): IndustryProduct[] {
    return Object.values(INDUSTRY_PRODUCTS);
  }

  /**
   * Get product by industry type
   */
  getProduct(industry: IndustryType): IndustryProduct | undefined {
    return INDUSTRY_PRODUCTS[industry];
  }

  /**
   * Fetch leads from a specific industry
   */
  async getLeadsFromIndustry(industry: IndustryType): Promise<any[]> {
    const product = INDUSTRY_PRODUCTS[industry];
    if (!product) return [];

    try {
      // Simulated - would call actual industry API
      console.log(`Fetching leads from ${product.name} at ${this.baseUrl}:${product.basePort}`);
      return [];
    } catch (error) {
      console.error(`HOJAI: Failed to fetch leads from ${industry}`, error);
      return [];
    }
  }

  /**
   * Fetch customers from a specific industry
   */
  async getCustomersFromIndustry(industry: IndustryType): Promise<any[]> {
    const product = INDUSTRY_PRODUCTS[industry];
    if (!product) return [];

    try {
      console.log(`Fetching customers from ${product.name}`);
      return [];
    } catch (error) {
      console.error(`HOJAI: Failed to fetch customers from ${industry}`, error);
      return [];
    }
  }

  /**
   * Fetch revenue data from a specific industry
   */
  async getRevenueFromIndustry(industry: IndustryType, startDate?: Date, endDate?: Date): Promise<any> {
    const product = INDUSTRY_PRODUCTS[industry];
    if (!product) return { total: 0, transactions: [] };

    try {
      console.log(`Fetching revenue from ${product.name}`);
      return {
        industry,
        productName: product.name,
        total: 0,
        transactions: [],
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      };
    } catch (error) {
      console.error(`HOJAI: Failed to fetch revenue from ${industry}`, error);
      return { total: 0, transactions: [] };
    }
  }

  /**
   * Fetch aggregated metrics from all industries
   */
  async getCrossIndustryMetrics(): Promise<{
    totalLeads: number;
    totalCustomers: number;
    totalRevenue: number;
    industryBreakdown: Record<IndustryType, { leads: number; customers: number; revenue: number }>;
  }> {
    const breakdown: Record<IndustryType, { leads: number; customers: number; revenue: number }> = {} as any;

    for (const industry of Object.keys(INDUSTRY_PRODUCTS) as IndustryType[]) {
      breakdown[industry] = { leads: 0, customers: 0, revenue: 0 };
    }

    return {
      totalLeads: 0,
      totalCustomers: 0,
      totalRevenue: 0,
      industryBreakdown: breakdown
    };
  }

  /**
   * Register a new customer across all industries
   */
  async registerCustomerCrossIndustry(customer: {
    name: string;
    email: string;
    phone: string;
    industries: IndustryType[];
  }): Promise<{ success: boolean; customerId: string; registrations: Record<string, string> }> {
    const customerId = `cross_${Date.now()}`;
    const registrations: Record<string, string> = {};

    for (const industry of customer.industries) {
      registrations[industry] = `${industry}_${customerId}`;
    }

    return {
      success: true,
      customerId,
      registrations
    };
  }

  /**
   * Push lead to specific industry
   */
  async pushLeadToIndustry(lead: any, industry: IndustryType): Promise<boolean> {
    const product = INDUSTRY_PRODUCTS[industry];
    if (!product) return false;

    try {
      console.log(`Pushing lead to ${product.name}`);
      return true;
    } catch (error) {
      console.error(`HOJAI: Failed to push lead to ${industry}`, error);
      return false;
    }
  }

  /**
   * Health check for HOJAI Core
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simulated health check
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check health of all connected products
   */
  async checkAllProductsHealth(): Promise<Record<IndustryType, boolean>> {
    const health: Record<IndustryType, boolean> = {} as any;

    for (const industry of Object.keys(INDUSTRY_PRODUCTS) as IndustryType[]) {
      health[industry] = true; // Simulated
    }

    return health;
  }
}

export const hojaiCore = new HOJAIConnector();