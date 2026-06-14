import { v4 as uuidv4 } from 'uuid';
import {
  InsurancePlan,
  PlanType,
  PlanSearchParams,
  ApiResponse,
  PaginatedResponse,
} from '../models/insurance';

// In-memory data store
const plans: Map<string, InsurancePlan> = new Map();

// Seed data for demonstration
const seedPlans: InsurancePlan[] = [
  {
    planId: 'PLAN001',
    providerId: 'PROV001',
    providerName: 'Star Health',
    planName: 'Star Comprehensive Insurance',
    type: PlanType.FAMILY,
    coverageAmount: 1000000,
    premium: 15000,
    tenure: 1,
    exclusions: [
      'Pre-existing diseases (first 4 years)',
      'Cosmetic treatments',
      'Self-inflicted injuries',
      'Adventure sports injuries',
      'Dental treatment (unless due to accident)',
      'War and nuclear risks',
    ],
    inclusions: [
      'In-patient hospitalization',
      'Day care procedures',
      'Pre and post hospitalization',
      'Domiciliary hospitalization',
      'Organ donor expenses',
      'Air ambulance cover',
      'Modern treatments (Robotic surgery)',
    ],
    subLimits: {
      roomRent: 5000,
      icuCharges: 10000,
      ambulanceCharges: 2000,
      dayCareProcedures: 100000,
      preHospitalization: 30000,
      postHospitalization: 45000,
    },
    waitingPeriod: 30,
    copay: 10,
    noClaimBonus: 10,
    restorationBenefit: true,
    maternityCover: true,
    mentalHealthCover: true,
    preExistingDiseaseCover: true,
    minAge: 18,
    maxAge: 75,
    networkHospitals: 14000,
    claimSettlementRatio: 98.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    planId: 'PLAN002',
    providerId: 'PROV002',
    providerName: 'HDFC Ergo',
    planName: 'HDFC Ergo Health Suraksha',
    type: PlanType.INDIVIDUAL,
    coverageAmount: 500000,
    premium: 8500,
    tenure: 1,
    exclusions: [
      'Pre-existing diseases (first 3 years)',
      'Cosmetic surgery',
      'HIV/AIDS',
      'Self-harm attempts',
      'Drug or alcohol abuse',
    ],
    inclusions: [
      'In-patient care',
      'Day care treatments',
      'AYUSH treatment',
      'Recovery and rehabilitation',
      'Emergency ambulance',
    ],
    subLimits: {
      roomRent: 3000,
      icuCharges: 5000,
      ambulanceCharges: 1500,
      dayCareProcedures: 50000,
      preHospitalization: 15000,
      postHospitalization: 30000,
    },
    waitingPeriod: 30,
    copay: 15,
    noClaimBonus: 5,
    restorationBenefit: false,
    maternityCover: false,
    mentalHealthCover: true,
    preExistingDiseaseCover: true,
    minAge: 18,
    maxAge: 65,
    networkHospitals: 12000,
    claimSettlementRatio: 97.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    planId: 'PLAN003',
    providerId: 'PROV003',
    providerName: 'ICICI Lombard',
    planName: 'ICICI Lombard Complete Health',
    type: PlanType.FAMILY,
    coverageAmount: 2000000,
    premium: 22000,
    tenure: 1,
    exclusions: [
      'Pre-existing conditions (first 4 years)',
      'Weight management treatments',
      'Sleep disorders',
      'Fertility treatments',
      'Experimental treatments',
    ],
    inclusions: [
      'Multi-year coverage',
      'Automatic restoration',
      'International second opinion',
      'Travel insurance included',
      'Wellness benefits',
      'Health check-up allowance',
    ],
    subLimits: {
      roomRent: 7500,
      icuCharges: 15000,
      ambulanceCharges: 3000,
      dayCareProcedures: 200000,
      preHospitalization: 50000,
      postHospitalization: 60000,
    },
    waitingPeriod: 30,
    copay: 10,
    noClaimBonus: 20,
    restorationBenefit: true,
    maternityCover: true,
    mentalHealthCover: true,
    preExistingDiseaseCover: true,
    minAge: 18,
    maxAge: 80,
    networkHospitals: 16500,
    claimSettlementRatio: 98.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    planId: 'PLAN004',
    providerId: 'PROV004',
    providerName: 'Care Health',
    planName: 'Care Freedom Plan',
    type: PlanType.SENIOR,
    coverageAmount: 300000,
    premium: 12000,
    tenure: 1,
    exclusions: [
      'Pre-existing diseases (first 2 years)',
      'Non-allopathic treatments',
      'Hearing aids and spectacles',
      'Dental implants',
    ],
    inclusions: [
      'Senior citizen specific coverage',
      'No medical check-up up to 70 years',
      'Lifetime renewability',
      'Tax benefit under 80D',
      'Assisted phone for claims',
    ],
    subLimits: {
      roomRent: 2000,
      icuCharges: 4000,
      ambulanceCharges: 1000,
      dayCareProcedures: 30000,
      preHospitalization: 10000,
      postHospitalization: 15000,
    },
    waitingPeriod: 60,
    copay: 20,
    noClaimBonus: 5,
    restorationBenefit: false,
    maternityCover: false,
    mentalHealthCover: false,
    preExistingDiseaseCover: true,
    minAge: 60,
    maxAge: 90,
    networkHospitals: 8500,
    claimSettlementRatio: 96.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    planId: 'PLAN005',
    providerId: 'PROV005',
    providerName: 'Max Bupa',
    planName: 'Max Bupa Heartbeat Family',
    type: PlanType.CRITICAL_ILLNESS,
    coverageAmount: 5000000,
    premium: 35000,
    tenure: 1,
    exclusions: [
      'Pre-existing critical illness',
      'Self-diagnosis',
      'Unproven treatments',
      'Congenital diseases',
    ],
    inclusions: [
      'Critical illness cover (37 diseases)',
      'Lump sum payment on diagnosis',
      'Income protection rider available',
      'Second opinion service',
      'Recovery grant',
    ],
    subLimits: {},
    waitingPeriod: 90,
    copay: 0,
    noClaimBonus: 0,
    restorationBenefit: false,
    maternityCover: false,
    mentalHealthCover: false,
    preExistingDiseaseCover: false,
    minAge: 18,
    maxAge: 65,
    networkHospitals: 10000,
    claimSettlementRatio: 99.1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    planId: 'PLAN006',
    providerId: 'PROV001',
    providerName: 'Star Health',
    planName: 'Star Family Health Optima',
    type: PlanType.FAMILY,
    coverageAmount: 750000,
    premium: 12000,
    tenure: 1,
    exclusions: [
      'Pre-existing diseases (first 3 years)',
      'Cosmetic procedures',
      'Intentional self-harm',
    ],
    inclusions: [
      '1 Year auto restoration',
      'Vaccination cover',
      'Elderly parent coverage',
      'Domestic road ambulance',
    ],
    subLimits: {
      roomRent: 4000,
      icuCharges: 8000,
      ambulanceCharges: 2000,
      dayCareProcedures: 75000,
      preHospitalization: 25000,
      postHospitalization: 35000,
    },
    waitingPeriod: 30,
    copay: 10,
    noClaimBonus: 10,
    restorationBenefit: true,
    maternityCover: false,
    mentalHealthCover: true,
    preExistingDiseaseCover: true,
    minAge: 18,
    maxAge: 75,
    networkHospitals: 14000,
    claimSettlementRatio: 98.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    planId: 'PLAN007',
    providerId: 'PROV002',
    providerName: 'HDFC Ergo',
    planName: 'HDFC Ergo my:health Suraksha',
    type: PlanType.INDIVIDUAL,
    coverageAmount: 1000000,
    premium: 12000,
    tenure: 1,
    exclusions: [
      'Pre-existing diseases (first 3 years)',
      'STI/HIV',
      'Substance abuse',
      'Self-inflicted injuries',
    ],
    inclusions: [
      'Global emergency care',
      'Mental wellness cover',
      'Modern treatment cover',
      'Smart phone protection',
      'Daily hospital cash',
    ],
    subLimits: {
      roomRent: 4000,
      icuCharges: 8000,
      ambulanceCharges: 2000,
      dayCareProcedures: 100000,
      preHospitalization: 25000,
      postHospitalization: 35000,
    },
    waitingPeriod: 30,
    copay: 10,
    noClaimBonus: 10,
    restorationBenefit: true,
    maternityCover: false,
    mentalHealthCover: true,
    preExistingDiseaseCover: true,
    minAge: 18,
    maxAge: 70,
    networkHospitals: 12000,
    claimSettlementRatio: 97.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    planId: 'PLAN008',
    providerId: 'PROV006',
    providerName: 'Bajaj Allianz',
    planName: 'Bajaj Allianz Health Guard',
    type: PlanType.FAMILY,
    coverageAmount: 1500000,
    premium: 14000,
    tenure: 1,
    exclusions: [
      'Pre-existing diseases (first 4 years)',
      'Weight loss treatments',
      'Fertility treatment',
      'Genetic disorders',
    ],
    inclusions: [
      'Annual health check-up',
      'Vaccination cover',
      'Loyalty bonus',
      'NCB protection',
      'Alternative treatment (AYUSH)',
    ],
    subLimits: {
      roomRent: 5000,
      icuCharges: 10000,
      ambulanceCharges: 2500,
      dayCareProcedures: 150000,
      preHospitalization: 30000,
      postHospitalization: 45000,
    },
    waitingPeriod: 30,
    copay: 10,
    noClaimBonus: 10,
    restorationBenefit: true,
    maternityCover: true,
    mentalHealthCover: true,
    preExistingDiseaseCover: true,
    minAge: 18,
    maxAge: 75,
    networkHospitals: 6500,
    claimSettlementRatio: 98.2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initialize seed data
seedPlans.forEach((plan) => {
  plans.set(plan.planId, plan);
});

export class PlanService {
  /**
   * Search and filter insurance plans
   */
  async searchPlans(params: PlanSearchParams): Promise<PaginatedResponse<InsurancePlan>> {
    let filteredPlans = Array.from(plans.values());

    // Apply filters
    if (params.query) {
      const query = params.query.toLowerCase();
      filteredPlans = filteredPlans.filter(
        (p) =>
          p.planName.toLowerCase().includes(query) ||
          p.providerName.toLowerCase().includes(query) ||
          p.type.toLowerCase().includes(query)
      );
    }

    if (params.type) {
      filteredPlans = filteredPlans.filter((p) => p.type === params.type);
    }

    if (params.minCoverage !== undefined) {
      filteredPlans = filteredPlans.filter((p) => p.coverageAmount >= params.minCoverage!);
    }

    if (params.maxCoverage !== undefined) {
      filteredPlans = filteredPlans.filter((p) => p.coverageAmount <= params.maxCoverage!);
    }

    if (params.minPremium !== undefined) {
      filteredPlans = filteredPlans.filter((p) => p.premium >= params.minPremium!);
    }

    if (params.maxPremium !== undefined) {
      filteredPlans = filteredPlans.filter((p) => p.premium <= params.maxPremium!);
    }

    if (params.providerId) {
      filteredPlans = filteredPlans.filter((p) => p.providerId === params.providerId);
    }

    if (params.age !== undefined) {
      filteredPlans = filteredPlans.filter(
        (p) => p.minAge <= params.age! && p.maxAge >= params.age!
      );
    }

    // Apply sorting
    const sortBy = params.sortBy || 'premium';
    const sortOrder = params.sortOrder || 'asc';

    filteredPlans.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'premium':
          comparison = a.premium - b.premium;
          break;
        case 'coverage':
          comparison = a.coverageAmount - b.coverageAmount;
          break;
        case 'provider':
          comparison = a.providerName.localeCompare(b.providerName);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedPlans = filteredPlans.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginatedPlans,
      pagination: {
        page,
        limit,
        total: filteredPlans.length,
        totalPages: Math.ceil(filteredPlans.length / limit),
      },
    };
  }

  /**
   * Get detailed information about a specific plan
   */
  async getPlanDetails(planId: string): Promise<ApiResponse<InsurancePlan>> {
    const plan = plans.get(planId);
    if (!plan) {
      return {
        success: false,
        error: 'Plan not found',
      };
    }
    return {
      success: true,
      data: plan,
    };
  }

  /**
   * Compare multiple plans side by side
   */
  async comparePlans(planIds: string[]): Promise<ApiResponse<InsurancePlan[]>> {
    const foundPlans: InsurancePlan[] = [];
    const notFound: string[] = [];

    for (const id of planIds) {
      const plan = plans.get(id);
      if (plan) {
        foundPlans.push(plan);
      } else {
        notFound.push(id);
      }
    }

    if (foundPlans.length === 0) {
      return {
        success: false,
        error: 'No plans found for the given IDs',
      };
    }

    return {
      success: true,
      data: foundPlans,
      message: notFound.length > 0 ? `Plans not found: ${notFound.join(', ')}` : undefined,
    };
  }

  /**
   * Get recommended plans based on criteria
   */
  async getRecommendedPlans(params: {
    age: number;
    familySize: number;
    budget?: number;
    healthConditions?: string[];
    existingCoverage?: number;
  }): Promise<ApiResponse<InsurancePlan[]>> {
    let recommendedPlans = Array.from(plans.values());

    // Filter by age eligibility
    recommendedPlans = recommendedPlans.filter(
      (p) => p.minAge <= params.age && p.maxAge >= params.age
    );

    // Filter by budget
    if (params.budget) {
      recommendedPlans = recommendedPlans.filter((p) => p.premium <= params.budget!);
    }

    // Prioritize family plans for families
    if (params.familySize > 1) {
      recommendedPlans.sort((a, b) => {
        if (a.type === PlanType.FAMILY && b.type !== PlanType.FAMILY) return -1;
        if (a.type !== PlanType.FAMILY && b.type === PlanType.FAMILY) return 1;
        // Then by coverage amount
        return b.coverageAmount - a.coverageAmount;
      });
    } else {
      // Sort by coverage for individuals
      recommendedPlans.sort((a, b) => b.coverageAmount - a.coverageAmount);
    }

    // Calculate recommended coverage based on income rule (10x annual income for life cover, 50% for health)
    // For health insurance, recommend 1-2 years of income or minimum 5 lakhs
    const recommendedCoverage = Math.max(500000, params.familySize * 250000);

    return {
      success: true,
      data: recommendedPlans.slice(0, 5),
      message: `Recommended minimum coverage: ₹${(recommendedCoverage / 100000).toFixed(1)} lakhs`,
    };
  }

  /**
   * Get all plans (for admin purposes)
   */
  async getAllPlans(): Promise<InsurancePlan[]> {
    return Array.from(plans.values());
  }

  /**
   * Add a new plan (for admin purposes)
   */
  async addPlan(planData: Omit<InsurancePlan, 'planId'>): Promise<ApiResponse<InsurancePlan>> {
    const planId = `PLAN${uuidv4().slice(0, 6).toUpperCase()}`;
    const newPlan: InsurancePlan = {
      ...planData,
      planId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    plans.set(planId, newPlan);
    return {
      success: true,
      data: newPlan,
      message: 'Plan created successfully',
    };
  }

  /**
   * Update an existing plan
   */
  async updatePlan(
    planId: string,
    updates: Partial<InsurancePlan>
  ): Promise<ApiResponse<InsurancePlan>> {
    const plan = plans.get(planId);
    if (!plan) {
      return {
        success: false,
        error: 'Plan not found',
      };
    }
    const updatedPlan: InsurancePlan = {
      ...plan,
      ...updates,
      planId, // Ensure planId doesn't change
      updatedAt: new Date().toISOString(),
    };
    plans.set(planId, updatedPlan);
    return {
      success: true,
      data: updatedPlan,
      message: 'Plan updated successfully',
    };
  }
}

export const planService = new PlanService();
