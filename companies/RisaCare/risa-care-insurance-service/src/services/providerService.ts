import { v4 as uuidv4 } from 'uuid';
import {
  InsuranceProvider,
  ClaimsStats,
  ProviderClaimsStats,
  ApiResponse,
  PaginatedResponse,
} from '../models/insurance';
import { claimService } from './claimService';
import { policyService } from './policyService';

// In-memory data store
const providers: Map<string, InsuranceProvider> = new Map();

// Seed data for demonstration
const seedProviders: InsuranceProvider[] = [
  {
    providerId: 'PROV001',
    name: 'Star Health',
    logo: '/logos/star-health.png',
    website: 'https://www.starhealth.in',
    claimsSettledRate: 98.5,
    turnaroundTime: '7-10 days',
    tollFreeNumber: '1800-425-2255',
    email: 'support@starhealth.in',
    address: 'New No. 628, Lansdowne Road, Chennai - 600004',
    description: 'Star Health and Allied Insurance is India\'s first Standalone Health Insurance company. We offer comprehensive health insurance products with extensive network hospitals.',
    specialFeatures: [
      'Largest network of hospitals',
      '快24x7 Claim assistance',
      'Lifetime renewability',
      'International coverage options',
    ],
    networkHospitalCount: 14000,
    yearFounded: 2006,
    headquarters: 'Chennai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    providerId: 'PROV002',
    name: 'HDFC Ergo',
    logo: '/logos/hdfc-ergo.png',
    website: 'https://www.hdfcergo.com',
    claimsSettledRate: 97.8,
    turnaroundTime: '10-15 days',
    tollFreeNumber: '1800-2700-700',
    email: 'customer.service@hdfcergo.com',
    address: '6th Floor, Leela Business Park, Andheri Kurla Road, Mumbai - 400059',
    description: 'HDFC ERGO General Insurance offers a wide range of health insurance plans with innovative features like my:health app and digital claim processing.',
    specialFeatures: [
      'Digital-first claim processing',
      'Health app with wellness tracking',
      'Global emergency coverage',
      'Quick claim settlement',
    ],
    networkHospitalCount: 12000,
    yearFounded: 2002,
    headquarters: 'Mumbai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    providerId: 'PROV003',
    name: 'ICICI Lombard',
    logo: '/logos/icici-lombard.png',
    website: 'https://www.icicilombard.com',
    claimsSettledRate: 98.9,
    turnaroundTime: '5-7 days',
    tollFreeNumber: '1800-2666-556',
    email: 'customersupport@icicilombard.com',
    address: 'ICICI Lombard House, 414, Veer Savarkar Marg, Prabhadevi, Mumbai - 400025',
    description: 'ICICI Lombard is one of India\'s leading general insurance companies offering comprehensive health insurance with industry-leading claim settlement ratio.',
    specialFeatures: [
      'Industry-leading claim settlement',
      '快5-day claim settlement',
      '快Complete app-based management',
      '快Global second opinion',
    ],
    networkHospitalCount: 16500,
    yearFounded: 2001,
    headquarters: 'Mumbai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    providerId: 'PROV004',
    name: 'Care Health',
    logo: '/logos/care-health.png',
    website: 'https://www.carehealthinsurance.com',
    claimsSettledRate: 96.5,
    turnaroundTime: '10-12 days',
    tollFreeNumber: '1800-102-4488',
    email: 'cs@carehealthinsurance.com',
    address: 'Unit No. 604, 6th Floor, East Wing, Infinity Tower B, DLF Phase 2, Gurugram - 122002',
    description: 'Care Health Insurance (formerly Religare Health Insurance) specializes in comprehensive health insurance with unique plans for senior citizens.',
    specialFeatures: [
      'Special senior citizen plans',
      'No medical check-up options',
      '快Affordable premiums',
      '快Wide range of plans',
    ],
    networkHospitalCount: 8500,
    yearFounded: 2012,
    headquarters: 'Gurugram',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    providerId: 'PROV005',
    name: 'Max Bupa',
    logo: '/logos/max-bupa.png',
    website: 'https://www.maxbupa.com',
    claimsSettledRate: 99.1,
    turnaroundTime: '7-10 days',
    tollFreeNumber: '1860-500-6060',
    email: 'hello@maxbupa.com',
    address: 'Bupa India, 7th Floor, Tower A, Building No. 8, DLF Cyber City, Gurugram - 122002',
    description: 'Max Bupa Health Insurance offers premium health insurance with a focus on comprehensive coverage and superior customer experience.',
    specialFeatures: [
      'Highest claim settlement ratio',
      'Dedicated relationship manager',
      '快Preventive health check-ups',
      '快Health coach services',
    ],
    networkHospitalCount: 10000,
    yearFounded: 2010,
    headquarters: 'Gurugram',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    providerId: 'PROV006',
    name: 'Bajaj Allianz',
    logo: '/logos/bajaj-allianz.png',
    website: 'https://www.bajajallianz.com',
    claimsSettledRate: 98.2,
    turnaroundTime: '8-12 days',
    tollFreeNumber: '1800-209-5858',
    email: 'bagichealth@bajajallianz.co.in',
    address: 'Bajaj Allianz House, 6th Floor, Airport Road, Yerawada, Pune - 411006',
    description: 'Bajaj Allianz General Insurance offers feature-rich health insurance plans with good network coverage and competitive pricing.',
    specialFeatures: [
      '快Multi-year policy discounts',
      '快Annual health check-ups',
      '快Loyalty benefits',
      '快Alternative treatment coverage',
    ],
    networkHospitalCount: 6500,
    yearFounded: 2001,
    headquarters: 'Pune',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    providerId: 'PROV007',
    name: 'Aditya Birla Health',
    logo: '/logos/aditya-birla.png',
    website: 'https://www.adityabirlacapital.com/health-insurance',
    claimsSettledRate: 97.5,
    turnaroundTime: '10-14 days',
    tollFreeNumber: '1800-270-7000',
    email: 'healthinsurance@adityabirla.com',
    address: 'Aditya Birla Centre, 7th Floor, Worli, Mumbai - 400030',
    description: 'Aditya Birla Health Insurance offers unique health insurance plans with wellness benefits and reward programs.',
    specialFeatures: [
      'Health Rewards program',
      'Preventive health benefits',
      'Customizable plans',
      'Wellness partner network',
    ],
    networkHospitalCount: 7500,
    yearFounded: 2015,
    headquarters: 'Mumbai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    providerId: 'PROV008',
    name: 'Manipal Cigna',
    logo: '/logos/manipal-cigna.png',
    website: 'https://www.manipalcigna.com',
    claimsSettledRate: 97.2,
    turnaroundTime: '10-15 days',
    tollFreeNumber: '1800-102-1020',
    email: 'customercare@manipalcigna.com',
    address: 'Manipal Cigna Health Insurance, 7th Floor, Tower A, Building No. 9, DLF Cyber City, Gurugram',
    description: 'ManipalCigna offers comprehensive health insurance with a focus on preventive healthcare and wellness benefits.',
    specialFeatures: [
      'Manipal Hospital network access',
      'Preventive health check-ups',
      'Wellness rewards',
      'Telemedicine services',
    ],
    networkHospitalCount: 5500,
    yearFounded: 2016,
    headquarters: 'Gurugram',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initialize seed data
seedProviders.forEach((provider) => {
  providers.set(provider.providerId, provider);
});

export class ProviderService {
  /**
   * Get all insurance providers
   */
  async getProviders(params?: {
    sortBy?: 'name' | 'claimsRate' | 'turnaround';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<InsuranceProvider>> {
    let allProviders = Array.from(providers.values());

    // Apply sorting
    const sortBy = params?.sortBy || 'name';
    const sortOrder = params?.sortOrder || 'asc';

    allProviders.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'claimsRate':
          comparison = b.claimsSettledRate - a.claimsSettledRate;
          break;
        case 'turnaround':
          comparison = a.turnaroundTime.localeCompare(b.turnaroundTime);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedProviders = allProviders.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginatedProviders,
      pagination: {
        page,
        limit,
        total: allProviders.length,
        totalPages: Math.ceil(allProviders.length / limit),
      },
    };
  }

  /**
   * Get provider details by ID
   */
  async getProviderDetails(providerId: string): Promise<ApiResponse<InsuranceProvider>> {
    const provider = providers.get(providerId);
    if (!provider) {
      return {
        success: false,
        error: 'Provider not found',
      };
    }
    return {
      success: true,
      data: provider,
    };
  }

  /**
   * Get claims statistics for a provider
   */
  async getClaimsStats(providerId: string): Promise<ApiResponse<ProviderClaimsStats>> {
    const provider = providers.get(providerId);
    if (!provider) {
      return {
        success: false,
        error: 'Provider not found',
      };
    }

    // Get all policies and claims for this provider
    const allPolicies = await policyService.getAllPolicies();
    const providerPolicies = allPolicies.filter((p) => p.providerId === providerId);
    const allClaims = await claimService.getAllClaims();
    const providerClaimIds = new Set(
      providerPolicies.flatMap((p) => {
        return allClaims
          .filter((c) => c.policyId === p.policyId)
          .map((c) => c.claimId);
      })
    );
    const providerClaims = allClaims.filter((c) => providerClaimIds.has(c.claimId));

    // Calculate statistics
    const pendingClaims = providerClaims.filter(
      (c) =>
        c.status === 'initiated' ||
        c.status === 'documents_pending' ||
        c.status === 'under_review'
    ).length;

    const approvedClaims = providerClaims.filter((c) => c.status === 'approved').length;
    const rejectedClaims = providerClaims.filter((c) => c.status === 'rejected').length;
    const settledClaims = providerClaims.filter(
      (c) => c.status === 'settled' || c.status === 'disbursed'
    ).length;

    const claimsStats: ClaimsStats = {
      totalClaims: providerClaims.length,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      totalClaimAmount: providerClaims.reduce((sum, c) => sum + c.amount, 0),
      averageSettlementTime: provider.turnaroundTime,
      settlementRate: provider.claimsSettledRate,
    };

    const stats: ProviderClaimsStats = {
      providerId: provider.providerId,
      providerName: provider.name,
      totalPolicies: providerPolicies.length,
      claimsStats,
      averagePremium:
        providerPolicies.length > 0
          ? providerPolicies.reduce((sum, p) => sum + p.premiumPaid, 0) / providerPolicies.length
          : 0,
      averageCoverage:
        providerPolicies.length > 0
          ? providerPolicies.reduce((sum, p) => sum + p.sumInsured, 0) / providerPolicies.length
          : 0,
      customerRating: this.calculateRating(provider.claimsSettledRate),
    };

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Calculate customer rating based on claim settlement rate
   */
  private calculateRating(settlementRate: number): number {
    if (settlementRate >= 99) return 5;
    if (settlementRate >= 98) return 4.5;
    if (settlementRate >= 97) return 4;
    if (settlementRate >= 95) return 3.5;
    if (settlementRate >= 90) return 3;
    return 2.5;
  }

  /**
   * Compare multiple providers
   */
  async compareProviders(providerIds: string[]): Promise<ApiResponse<{
    providers: InsuranceProvider[];
    comparison: {
      highestSettlementRate: string;
      fastestTurnaround: string;
      largestNetwork: string;
      bestValue: string;
    };
  }>> {
    const foundProviders: InsuranceProvider[] = [];
    const notFound: string[] = [];

    for (const id of providerIds) {
      const provider = providers.get(id);
      if (provider) {
        foundProviders.push(provider);
      } else {
        notFound.push(id);
      }
    }

    if (foundProviders.length === 0) {
      return {
        success: false,
        error: 'No providers found for the given IDs',
      };
    }

    // Find best in each category
    const highestSettlementRate = foundProviders.reduce((best, p) =>
      p.claimsSettledRate > best.claimsSettledRate ? p : best
    );

    const turnaroundOrder = ['3-5 days', '5-7 days', '7-10 days', '10-12 days', '10-15 days', '15-20 days'];
    const fastestTurnaround = foundProviders.reduce((best, p) => {
      const bestIndex = turnaroundOrder.indexOf(best.turnaroundTime);
      const currentIndex = turnaroundOrder.indexOf(p.turnaroundTime);
      return currentIndex < bestIndex ? p : best;
    });

    const largestNetwork = foundProviders.reduce((best, p) =>
      (p.networkHospitalCount || 0) > (best.networkHospitalCount || 0) ? p : best
    );

    // Best value = good settlement rate + reasonable network + reasonable turnaround
    const bestValue = foundProviders.reduce((best, p) => {
      const bestScore = (best.claimsSettledRate * 0.5) + ((best.networkHospitalCount || 0) * 0.01);
      const currentScore = (p.claimsSettledRate * 0.5) + ((p.networkHospitalCount || 0) * 0.01);
      return currentScore > bestScore ? p : best;
    });

    return {
      success: true,
      data: {
        providers: foundProviders,
        comparison: {
          highestSettlementRate: `${highestSettlementRate.name} (${highestSettlementRate.claimsSettledRate}%)`,
          fastestTurnaround: `${fastestTurnaround.name} (${fastestTurnaround.turnaroundTime})`,
          largestNetwork: `${largestNetwork.name} (${largestNetwork.networkHospitalCount?.toLocaleString()} hospitals)`,
          bestValue: `${bestValue.name} (${bestValue.claimsSettledRate}% settlement, ${bestValue.networkHospitalCount?.toLocaleString()} hospitals)`,
        },
      },
      message: notFound.length > 0 ? `Providers not found: ${notFound.join(', ')}` : undefined,
    };
  }

  /**
   * Search providers by name
   */
  async searchProviders(query: string): Promise<ApiResponse<InsuranceProvider[]>> {
    const queryLower = query.toLowerCase();
    const matchingProviders = Array.from(providers.values()).filter(
      (p) =>
        p.name.toLowerCase().includes(queryLower) ||
        p.description?.toLowerCase().includes(queryLower)
    );

    return {
      success: true,
      data: matchingProviders,
    };
  }

  /**
   * Get top-rated providers
   */
  async getTopProviders(limit: number = 5): Promise<ApiResponse<InsuranceProvider[]>> {
    const sortedProviders = Array.from(providers.values())
      .sort((a, b) => b.claimsSettledRate - a.claimsSettledRate)
      .slice(0, limit);

    return {
      success: true,
      data: sortedProviders,
    };
  }

  /**
   * Add a new provider (admin)
   */
  async addProvider(
    providerData: Omit<InsuranceProvider, 'providerId'>
  ): Promise<ApiResponse<InsuranceProvider>> {
    const providerId = `PROV${uuidv4().slice(0, 6).toUpperCase()}`;
    const newProvider: InsuranceProvider = {
      ...providerData,
      providerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    providers.set(providerId, newProvider);
    return {
      success: true,
      data: newProvider,
      message: 'Provider added successfully',
    };
  }

  /**
   * Update provider details (admin)
   */
  async updateProvider(
    providerId: string,
    updates: Partial<InsuranceProvider>
  ): Promise<ApiResponse<InsuranceProvider>> {
    const provider = providers.get(providerId);
    if (!provider) {
      return {
        success: false,
        error: 'Provider not found',
      };
    }
    const updatedProvider: InsuranceProvider = {
      ...provider,
      ...updates,
      providerId,
      updatedAt: new Date().toISOString(),
    };
    providers.set(providerId, updatedProvider);
    return {
      success: true,
      data: updatedProvider,
      message: 'Provider updated successfully',
    };
  }

  /**
   * Get all providers (for admin purposes)
   */
  async getAllProviders(): Promise<InsuranceProvider[]> {
    return Array.from(providers.values());
  }
}

export const providerService = new ProviderService();
