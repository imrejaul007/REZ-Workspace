/**
 * Merchant Twin Service - Type Definitions
 */

export interface Location {
  city: string;
  state: string;
  country: string;
}

export interface BusinessProfile {
  name: string;
  category: string;
  subcategory: string;
  location: Location;
  size: 'small' | 'medium' | 'large';
  rating: number;
  yearsActive: number;
}

export interface AgeDistribution {
  range: string;
  percentage: number;
}

export interface Demographics {
  ageDistribution: AgeDistribution[];
  genderDistribution: Record<string, number>;
  incomeLevel: 'low' | 'medium' | 'high';
}

export interface Behavioral {
  avgVisitFrequency: number;
  avgOrderValue: number;
  peakHours: string[];
  popularDays: string[];
  repeatCustomerRate: number;
}

export interface CustomerProfile {
  demographics: Demographics;
  behavioral: Behavioral;
  size: number;
}

export interface AdSpendHistory {
  month: string;
  amount: number;
}

export interface Advertising {
  adSpendHistory: AdSpendHistory[];
  preferredChannels: string[];
  targetAudience: string[];
  competitorOverlap: number;
  adEffectiveness: number;
}

export interface Growth {
  monthlyGrowth: number;
  seasonalPatterns: string[];
  expansionPotential: number;
  investmentReadiness: 'low' | 'medium' | 'high';
}

export interface MerchantTwin {
  merchantId: string;
  twinId: string;
  business: BusinessProfile;
  customerProfile: CustomerProfile;
  advertising: Advertising;
  growth: Growth;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMerchantTwinInput {
  merchantId: string;
  business: BusinessProfile;
  customerProfile?: CustomerProfile;
  advertising?: Advertising;
  growth?: Growth;
}

export interface UpdateMerchantTwinInput {
  business?: Partial<BusinessProfile>;
  customerProfile?: Partial<CustomerProfile>;
  advertising?: Partial<Advertising>;
  growth?: Partial<Growth>;
}

export interface AudienceInsights {
  totalCustomers: number;
  demographicBreakdown: Demographics;
  behavioralInsights: Behavioral;
  growthPotential: number;
  targetSegments: string[];
}

export interface AdvertisingInsights {
  avgAdSpend: number;
  preferredChannels: string[];
  audienceOverlap: number;
  effectivenessScore: number;
  recommendations: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}