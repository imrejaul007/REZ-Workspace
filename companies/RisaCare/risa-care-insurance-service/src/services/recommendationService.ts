import { v4 as uuidv4 } from 'uuid';
import {
  CoverageRecommendation,
  RecommendationScore,
  RecommendationRequest,
  InsurancePlan,
  PlanType,
  ApiResponse,
} from '../models/insurance';
import { planService } from './planService';
import { policyService } from './policyService';

// In-memory cache for recommendations
const recommendations: Map<string, CoverageRecommendation> = new Map();

export class RecommendationService {
  /**
   * Calculate premium estimate based on user profile
   */
  async calculatePremium(params: {
    age: number;
    sumInsured: number;
    familySize: number;
    healthConditions?: string[];
    tenure?: number;
  }): Promise<ApiResponse<{ basePremium: number; finalPremium: number; breakdown: Record<string, number> }>> {
    const { age, sumInsured, familySize, healthConditions = [], tenure = 1 } = params;

    // Base premium calculation (simplified formula)
    // In reality, insurers use complex actuarial models
    let basePremium = (sumInsured / 100000) * 1500; // ₹1500 per 1 lakh coverage

    const breakdown: Record<string, number> = {
      basePremium: Math.round(basePremium),
      ageLoading: 0,
      familyLoading: 0,
      healthLoading: 0,
      tenureDiscount: 0,
      finalPremium: Math.round(basePremium),
    };

    // Age loading (premium increases with age)
    if (age > 45) {
      const ageLoading = Math.round(basePremium * 0.15);
      breakdown.ageLoading = ageLoading;
      basePremium += ageLoading;
    } else if (age > 35) {
      const ageLoading = Math.round(basePremium * 0.08);
      breakdown.ageLoading = ageLoading;
      basePremium += ageLoading;
    }

    // Family loading
    if (familySize > 2) {
      const familyLoading = Math.round(basePremium * 0.1 * (familySize - 2));
      breakdown.familyLoading = familyLoading;
      basePremium += familyLoading;
    }

    // Health conditions loading
    const criticalConditions = ['diabetes', 'hypertension', 'heart disease', 'cancer', 'kidney disease'];
    const hasCriticalCondition = healthConditions.some((c) =>
      criticalConditions.includes(c.toLowerCase())
    );

    if (hasCriticalCondition) {
      const healthLoading = Math.round(basePremium * 0.25);
      breakdown.healthLoading = healthLoading;
      basePremium += healthLoading;
    }

    // Multi-year tenure discount
    if (tenure > 1) {
      const tenureDiscount = Math.round(basePremium * 0.1 * (tenure - 1));
      breakdown.tenureDiscount = -tenureDiscount;
      basePremium -= tenureDiscount;
    }

    breakdown.finalPremium = Math.round(basePremium);

    return {
      success: true,
      data: breakdown,
    };
  }

  /**
   * Assess eligibility for a plan
   */
  async assessEligibility(params: {
    age: number;
    healthConditions?: string[];
    planId: string;
  }): Promise<ApiResponse<{
    eligible: boolean;
    reasons: string[];
    warnings: string[];
    loadingFactors: number[];
  }>> {
    const planResult = await planService.getPlanDetails(params.planId);
    if (!planResult.success || !planResult.data) {
      return {
        success: false,
        error: 'Plan not found',
      };
    }

    const plan = planResult.data;
    const reasons: string[] = [];
    const warnings: string[] = [];
    const loadingFactors: number[] = [];

    // Check age eligibility
    if (params.age < plan.minAge) {
      return {
        success: true,
        data: {
          eligible: false,
          reasons: [`Minimum age requirement is ${plan.minAge} years`],
          warnings: [],
          loadingFactors: [],
        },
      };
    }

    if (params.age > plan.maxAge) {
      return {
        success: true,
        data: {
          eligible: false,
          reasons: [`Maximum age limit is ${plan.maxAge} years`],
          warnings: [],
          loadingFactors: [],
        },
      };
    }

    // Add age eligibility message
    reasons.push(`Age ${params.age} is within eligibility (${plan.minAge}-${plan.maxAge})`);

    // Check health conditions
    const preExistingDiseases = ['diabetes', 'hypertension', 'heart disease', 'asthma', 'thyroid'];
    const hasPreExisting = params.healthConditions?.some((c) =>
      preExistingDiseases.includes(c.toLowerCase())
    );

    if (hasPreExisting && plan.preExistingDiseaseCover) {
      warnings.push('Pre-existing diseases are covered after waiting period');
      loadingFactors.push(10);
    }

    if (hasPreExisting && !plan.preExistingDiseaseCover) {
      warnings.push('Pre-existing diseases are NOT covered under this plan');
    }

    return {
      success: true,
      data: {
        eligible: true,
        reasons,
        warnings,
        loadingFactors,
      },
    };
  }

  /**
   * Get personalized plan recommendations
   */
  async getRecommendations(request: RecommendationRequest): Promise<ApiResponse<CoverageRecommendation>> {
    const { userId, age, income, familySize, healthConditions = [], budget, existingCoverage = 0 } = request;

    // Calculate recommended coverage
    let recommendedCoverage: number;

    if (income) {
      // Rule of thumb: Health coverage = 50% of annual income or minimum ₹5 lakhs
      recommendedCoverage = Math.max(500000, Math.floor(income * 0.5));
    } else {
      // Based on family size
      recommendedCoverage = Math.max(500000, familySize * 250000);
    }

    // Adjust for existing coverage
    const additionalCoverageNeeded = Math.max(0, recommendedCoverage - existingCoverage);

    // Get all eligible plans
    const allPlans = await planService.getAllPlans();
    const eligiblePlans = allPlans.filter(
      (p) => p.minAge <= age && p.maxAge >= age
    );

    // Filter by budget if provided
    const withinBudgetPlans = budget
      ? eligiblePlans.filter((p) => p.premium <= budget)
      : eligiblePlans;

    // Score and rank plans
    const scoredPlans: RecommendationScore[] = withinBudgetPlans.map((plan) => {
      const score = this.calculatePlanScore(plan, {
        age,
        familySize,
        healthConditions,
        recommendedCoverage,
        income,
      });

      const { pros, cons, matchFactors } = this.generatePlanInsights(
        plan,
        age,
        familySize,
        healthConditions,
        recommendedCoverage
      );

      return {
        planId: plan.planId,
        providerId: plan.providerId,
        providerName: plan.providerName,
        planName: plan.planName,
        type: plan.type,
        coverageAmount: plan.coverageAmount,
        premium: plan.premium,
        score,
        matchFactors,
        pros,
        cons,
        reason: this.generateRecommendationReason(plan, score, familySize, age),
      };
    });

    // Sort by score descending
    scoredPlans.sort((a, b) => b.score - a.score);

    const recommendation: CoverageRecommendation = {
      recommendationId: `REC${uuidv4().slice(0, 8).toUpperCase()}`,
      userId,
      age,
      income,
      familySize,
      healthConditions,
      budget,
      recommendedCoverage: additionalCoverageNeeded > 0 ? additionalCoverageNeeded : recommendedCoverage,
      recommendations: scoredPlans.slice(0, 5),
      generatedAt: new Date().toISOString(),
    };

    // Cache recommendation
    recommendations.set(recommendation.recommendationId, recommendation);

    return {
      success: true,
      data: recommendation,
    };
  }

  /**
   * Calculate plan score based on user requirements
   */
  private calculatePlanScore(
    plan: InsurancePlan,
    params: {
      age: number;
      familySize: number;
      healthConditions: string[];
      recommendedCoverage: number;
      income?: number;
    }
  ): number {
    let score = 50; // Base score

    // Coverage adequacy (40% weight)
    const coverageRatio = plan.coverageAmount / params.recommendedCoverage;
    if (coverageRatio >= 1) {
      score += 40;
    } else if (coverageRatio >= 0.75) {
      score += 30;
    } else if (coverageRatio >= 0.5) {
      score += 20;
    } else {
      score += 10;
    }

    // Value for money (20% weight)
    const valueRatio = plan.coverageAmount / plan.premium;
    if (valueRatio >= 80) {
      score += 20;
    } else if (valueRatio >= 60) {
      score += 15;
    } else if (valueRatio >= 40) {
      score += 10;
    } else {
      score += 5;
    }

    // Family plan preference (15% weight)
    if (params.familySize > 1 && plan.type === PlanType.FAMILY) {
      score += 15;
    } else if (params.familySize === 1 && plan.type === PlanType.INDIVIDUAL) {
      score += 15;
    }

    // Provider reliability (10% weight)
    if (plan.claimSettlementRatio) {
      if (plan.claimSettlementRatio >= 98) {
        score += 10;
      } else if (plan.claimSettlementRatio >= 95) {
        score += 7;
      } else if (plan.claimSettlementRatio >= 90) {
        score += 5;
      }
    }

    // Low copay preference (10% weight)
    if (plan.copay <= 10) {
      score += 10;
    } else if (plan.copay <= 20) {
      score += 7;
    } else if (plan.copay <= 30) {
      score += 5;
    }

    // Senior citizen preference (5% weight)
    if (params.age >= 60 && plan.type === PlanType.SENIOR) {
      score += 5;
    }

    // Cap score at 100
    return Math.min(100, Math.round(score));
  }

  /**
   * Generate pros and cons for a plan
   */
  private generatePlanInsights(
    plan: InsurancePlan,
    age: number,
    familySize: number,
    healthConditions: string[],
    recommendedCoverage: number
  ): { pros: string[]; cons: string[]; matchFactors: string[] } {
    const pros: string[] = [];
    const cons: string[] = [];
    const matchFactors: string[] = [];

    // Coverage adequacy
    if (plan.coverageAmount >= recommendedCoverage) {
      pros.push(`Adequate coverage of ₹${(plan.coverageAmount / 100000).toFixed(0)} lakhs`);
      matchFactors.push('Coverage meets recommended amount');
    } else {
      cons.push(`Coverage below recommended ₹${(recommendedCoverage / 100000).toFixed(0)} lakhs`);
    }

    // Family plans
    if (plan.type === PlanType.FAMILY && familySize > 1) {
      pros.push(`Family floater covers ${familySize} members`);
      matchFactors.push('Family coverage');
    }

    // Maternity
    if (plan.maternityCover) {
      pros.push('Maternity coverage included');
    }

    // Mental health
    if (plan.mentalHealthCover) {
      pros.push('Mental health treatment covered');
    }

    // Copay
    if (plan.copay === 0) {
      pros.push('No copay required');
    } else if (plan.copay <= 15) {
      pros.push(`Low copay of ${plan.copay}%`);
    } else {
      cons.push(`${plan.copay}% copay required`);
    }

    // Waiting period
    if (plan.waitingPeriod <= 30) {
      pros.push('Short initial waiting period');
    } else {
      cons.push(`${plan.waitingPeriod} days initial waiting period`);
    }

    // No claim bonus
    if (plan.noClaimBonus && plan.noClaimBonus > 0) {
      pros.push(`${plan.noClaimBonus}% no-claim bonus`);
    }

    // Restoration benefit
    if (plan.restorationBenefit) {
      pros.push('Automatic restoration of sum insured');
    }

    // Network hospitals
    if (plan.networkHospitals && plan.networkHospitals > 5000) {
      pros.push(`${plan.networkHospitals.toLocaleString()} network hospitals`);
      matchFactors.push('Wide hospital network');
    }

    // Claim settlement
    if (plan.claimSettlementRatio && plan.claimSettlementRatio >= 98) {
      pros.push(`${plan.claimSettlementRatio}% claim settlement ratio`);
      matchFactors.push('High claim settlement rate');
    }

    // Senior citizen specific
    if (plan.type === PlanType.SENIOR && age >= 60) {
      pros.push('Designed for senior citizens');
      matchFactors.push('Senior citizen friendly');
    }

    // Pre-existing disease coverage
    if (plan.preExistingDiseaseCover) {
      pros.push('Covers pre-existing diseases');
    } else if (healthConditions.length > 0) {
      cons.push('Does not cover pre-existing diseases');
    }

    // Premium value
    const valueRatio = plan.coverageAmount / plan.premium;
    if (valueRatio > 70) {
      pros.push('Excellent value for money');
    }

    return { pros, cons, matchFactors };
  }

  /**
   * Generate recommendation reason text
   */
  private generateRecommendationReason(
    plan: InsurancePlan,
    score: number,
    familySize: number,
    age: number
  ): string {
    if (score >= 85) {
      return 'Excellent match for your requirements. This plan offers comprehensive coverage at a competitive price.';
    } else if (score >= 70) {
      if (familySize > 1 && plan.type === PlanType.FAMILY) {
        return 'Strong family coverage option with good value for your family size.';
      }
      return 'Good overall value with reliable coverage and provider.';
    } else if (score >= 55) {
      return 'Acceptable option. Consider comparing with higher-scored plans for better coverage.';
    } else {
      return 'Basic option. Review coverage limits and exclusions before purchasing.';
    }
  }

  /**
   * Get saved recommendation by ID
   */
  async getRecommendationById(recommendationId: string): Promise<ApiResponse<CoverageRecommendation>> {
    const recommendation = recommendations.get(recommendationId);
    if (!recommendation) {
      return {
        success: false,
        error: 'Recommendation not found',
      };
    }
    return {
      success: true,
      data: recommendation,
    };
  }

  /**
   * Get quick recommendations without caching
   */
  async getQuickRecommendations(params: {
    age: number;
    familySize: number;
    top?: number;
  }): Promise<ApiResponse<InsurancePlan[]>> {
    const { age, familySize, top = 3 } = params;

    const allPlans = await planService.getAllPlans();
    const eligiblePlans = allPlans.filter(
      (p) => p.minAge <= age && p.maxAge >= age
    );

    // Quick score
    const scoredPlans = eligiblePlans
      .map((plan) => ({
        plan,
        score:
          (plan.coverageAmount / 100000) * 0.4 +
          (100 - plan.copay) * 0.3 +
          (plan.claimSettlementRatio || 90) * 0.2 +
          (plan.type === (familySize > 1 ? PlanType.FAMILY : PlanType.INDIVIDUAL) ? 20 : 0),
      }))
      .sort((a, b) => b.score - a.score);

    return {
      success: true,
      data: scoredPlans.slice(0, top).map((s) => s.plan),
    };
  }
}

export const recommendationService = new RecommendationService();
