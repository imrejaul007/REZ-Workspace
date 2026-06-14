import { v4 as uuidv4 } from 'uuid';
import {
  UserPolicy,
  PolicyStatus,
  PlanType,
  CoverageSummary,
  AddPolicyRequest,
  ApiResponse,
  PaginatedResponse,
} from '../models/insurance';
import { planService } from './planService';

// In-memory data store
const policies: Map<string, UserPolicy> = new Map();

// Seed data for demonstration
const seedPolicies: UserPolicy[] = [
  {
    policyId: 'POL001',
    userId: 'USER001',
    planId: 'PLAN001',
    providerId: 'PROV001',
    providerName: 'Star Health',
    planName: 'Star Comprehensive Insurance',
    startDate: '2025-06-01',
    endDate: '2026-06-01',
    premiumPaid: 15000,
    sumInsured: 1000000,
    coveredMembers: [
      {
        name: 'Rajesh Kumar',
        relationship: 'self',
        dateOfBirth: '1985-03-15',
        gender: 'male',
        aadharNumber: 'XXXX-XXXX-1234',
      },
      {
        name: 'Priya Kumar',
        relationship: 'spouse',
        dateOfBirth: '1988-07-22',
        gender: 'female',
        aadharNumber: 'XXXX-XXXX-5678',
      },
    ],
    status: PolicyStatus.ACTIVE,
    renewalDate: '2026-05-01',
    claimCount: 0,
    policyNumber: 'STAR/2025/123456',
    agentName: 'Vikram Singh',
    agentContact: '+91-9876543210',
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
  },
  {
    policyId: 'POL002',
    userId: 'USER001',
    planId: 'PLAN004',
    providerId: 'PROV004',
    providerName: 'Care Health',
    planName: 'Care Freedom Plan',
    startDate: '2024-01-15',
    endDate: '2025-01-15',
    premiumPaid: 12000,
    sumInsured: 300000,
    coveredMembers: [
      {
        name: 'Shyam Kumar',
        relationship: 'father',
        dateOfBirth: '1958-11-30',
        gender: 'male',
        aadharNumber: 'XXXX-XXXX-9012',
      },
    ],
    status: PolicyStatus.EXPIRED,
    claimCount: 1,
    lastClaimAmount: 45000,
    policyNumber: 'CARE/2024/789012',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
  },
  {
    policyId: 'POL003',
    userId: 'USER002',
    planId: 'PLAN003',
    providerId: 'PROV003',
    providerName: 'ICICI Lombard',
    planName: 'ICICI Lombard Complete Health',
    startDate: '2025-03-01',
    endDate: '2026-03-01',
    premiumPaid: 22000,
    sumInsured: 2000000,
    coveredMembers: [
      {
        name: 'Amit Sharma',
        relationship: 'self',
        dateOfBirth: '1980-05-10',
        gender: 'male',
        aadharNumber: 'XXXX-XXXX-3456',
      },
      {
        name: 'Sunita Sharma',
        relationship: 'spouse',
        dateOfBirth: '1982-09-18',
        gender: 'female',
        aadharNumber: 'XXXX-XXXX-7890',
      },
      {
        name: 'Arjun Sharma',
        relationship: 'son',
        dateOfBirth: '2010-12-25',
        gender: 'male',
        aadharNumber: 'XXXX-XXXX-2345',
      },
    ],
    status: PolicyStatus.ACTIVE,
    renewalDate: '2026-02-01',
    claimCount: 0,
    policyNumber: 'ICICI/2025/345678',
    agentName: 'Neha Patel',
    agentContact: '+91-9123456789',
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2025-03-01T10:00:00Z',
  },
];

// Initialize seed data
seedPolicies.forEach((policy) => {
  policies.set(policy.policyId, policy);
});

export class PolicyService {
  /**
   * Add a new policy for a user
   */
  async addPolicy(request: AddPolicyRequest): Promise<ApiResponse<UserPolicy>> {
    // Validate plan exists
    const planResult = await planService.getPlanDetails(request.planId);
    if (!planResult.success || !planResult.data) {
      return {
        success: false,
        error: 'Plan not found',
      };
    }

    const plan = planResult.data;
    const policyId = `POL${uuidv4().slice(0, 6).toUpperCase()}`;
    const policyNumber = `${plan.providerName.split(' ')[0]}/${new Date().getFullYear()}/${uuidv4().slice(0, 6)}`;

    // Calculate policy end date based on tenure
    const startDate = new Date(request.startDate);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + plan.tenure);

    // Calculate renewal date (30 days before expiry)
    const renewalDate = new Date(endDate);
    renewalDate.setDate(renewalDate.getDate() - 30);

    const newPolicy: UserPolicy = {
      policyId,
      userId: request.userId,
      planId: plan.planId,
      providerId: plan.providerId,
      providerName: plan.providerName,
      planName: plan.planName,
      startDate: request.startDate,
      endDate: endDate.toISOString().split('T')[0],
      premiumPaid: request.premiumPaid,
      sumInsured: plan.coverageAmount,
      coveredMembers: request.coveredMembers,
      status: PolicyStatus.ACTIVE,
      renewalDate: renewalDate.toISOString().split('T')[0],
      claimCount: 0,
      policyNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    policies.set(policyId, newPolicy);

    return {
      success: true,
      data: newPolicy,
      message: 'Policy added successfully',
    };
  }

  /**
   * Get all policies for a user
   */
  async getPolicies(userId: string): Promise<PaginatedResponse<UserPolicy>> {
    const userPolicies = Array.from(policies.values()).filter(
      (p) => p.userId === userId
    );

    return {
      success: true,
      data: userPolicies,
      pagination: {
        page: 1,
        limit: userPolicies.length,
        total: userPolicies.length,
        totalPages: 1,
      },
    };
  }

  /**
   * Get detailed information about a specific policy
   */
  async getPolicyDetails(policyId: string): Promise<ApiResponse<UserPolicy>> {
    const policy = policies.get(policyId);
    if (!policy) {
      return {
        success: false,
        error: 'Policy not found',
      };
    }

    // Check if policy is expired
    const now = new Date();
    const endDate = new Date(policy.endDate);
    if (endDate < now && policy.status === PolicyStatus.ACTIVE) {
      policy.status = PolicyStatus.EXPIRED;
      policy.updatedAt = new Date().toISOString();
      policies.set(policyId, policy);
    }

    return {
      success: true,
      data: policy,
    };
  }

  /**
   * Get coverage summary for a user
   */
  async getCoverageSummary(userId: string): Promise<ApiResponse<CoverageSummary>> {
    const userPolicies = Array.from(policies.values()).filter(
      (p) => p.userId === userId
    );

    if (userPolicies.length === 0) {
      return {
        success: true,
        data: {
          totalPolicies: 0,
          activePolicies: 0,
          totalSumInsured: 0,
          totalPremiumPaid: 0,
          totalClaims: 0,
          settledClaims: 0,
          pendingClaims: 0,
          coverageByType: {
            [PlanType.INDIVIDUAL]: 0,
            [PlanType.FAMILY]: 0,
            [PlanType.SENIOR]: 0,
            [PlanType.CRITICAL_ILLNESS]: 0,
          },
        },
      };
    }

    const activePolicies = userPolicies.filter((p) => p.status === PolicyStatus.ACTIVE);
    const coverageByType: Record<PlanType, number> = {
      [PlanType.INDIVIDUAL]: 0,
      [PlanType.FAMILY]: 0,
      [PlanType.SENIOR]: 0,
      [PlanType.CRITICAL_ILLNESS]: 0,
    };

    // Calculate coverage by type
    for (const policy of activePolicies) {
      const plan = await planService.getPlanDetails(policy.planId);
      if (plan.success && plan.data) {
        coverageByType[plan.data.type] += policy.sumInsured;
      }
    }

    return {
      success: true,
      data: {
        totalPolicies: userPolicies.length,
        activePolicies: activePolicies.length,
        totalSumInsured: activePolicies.reduce((sum, p) => sum + p.sumInsured, 0),
        totalPremiumPaid: userPolicies.reduce((sum, p) => sum + p.premiumPaid, 0),
        totalClaims: userPolicies.reduce((sum, p) => sum + (p.claimCount || 0), 0),
        settledClaims: 0, // Would be calculated from claims data
        pendingClaims: 0, // Would be calculated from claims data
        coverageByType,
      },
    };
  }

  /**
   * Renew an existing policy
   */
  async renewPolicy(policyId: string): Promise<ApiResponse<UserPolicy>> {
    const policy = policies.get(policyId);
    if (!policy) {
      return {
        success: false,
        error: 'Policy not found',
      };
    }

    // Get plan details for renewal terms
    const planResult = await planService.getPlanDetails(policy.planId);
    if (!planResult.success || !planResult.data) {
      return {
        success: false,
        error: 'Plan details not found',
      };
    }

    const plan = planResult.data;

    // Calculate new dates
    const startDate = new Date(policy.endDate);
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + plan.tenure);
    const renewalDate = new Date(endDate);
    renewalDate.setDate(renewalDate.getDate() - 30);

    const renewedPolicy: UserPolicy = {
      ...policy,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      premiumPaid: plan.premium,
      status: PolicyStatus.ACTIVE,
      renewalDate: renewalDate.toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    policies.set(policyId, renewedPolicy);

    return {
      success: true,
      data: renewedPolicy,
      message: 'Policy renewed successfully',
    };
  }

  /**
   * Cancel a policy
   */
  async cancelPolicy(policyId: string): Promise<ApiResponse<UserPolicy>> {
    const policy = policies.get(policyId);
    if (!policy) {
      return {
        success: false,
        error: 'Policy not found',
      };
    }

    policy.status = PolicyStatus.CANCELLED;
    policy.updatedAt = new Date().toISOString();
    policies.set(policyId, policy);

    return {
      success: true,
      data: policy,
      message: 'Policy cancelled successfully',
    };
  }

  /**
   * Update policy claim information
   */
  async updateClaimInfo(
    policyId: string,
    claimAmount: number
  ): Promise<ApiResponse<UserPolicy>> {
    const policy = policies.get(policyId);
    if (!policy) {
      return {
        success: false,
        error: 'Policy not found',
      };
    }

    policy.claimCount = (policy.claimCount || 0) + 1;
    policy.lastClaimAmount = claimAmount;
    policy.updatedAt = new Date().toISOString();
    policies.set(policyId, policy);

    return {
      success: true,
      data: policy,
      message: 'Claim information updated',
    };
  }

  /**
   * Get all policies (for admin purposes)
   */
  async getAllPolicies(): Promise<UserPolicy[]> {
    return Array.from(policies.values());
  }
}

export const policyService = new PolicyService();
