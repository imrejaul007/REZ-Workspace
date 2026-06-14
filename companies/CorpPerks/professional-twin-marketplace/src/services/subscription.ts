/**
 * Subscription Service - RABTUL Integration
 *
 * Handles subscription billing for TwinOS:
 * - Individual plans (Basic/Pro/Premium)
 * - Enterprise plans (per employee)
 * - Freelancer bundles
 * - Usage-based billing
 */

import fetch from 'node-fetch';
import { ProfessionalTwin, AccessGrant } from '../index.js';

// =============================================================================
// CONFIG
// =============================================================================

const RABTUL_WALLET_URL = process.env.RABTUL_WALLET_URL || 'http://localhost:4004';
const RABTUL_PAYMENT_URL = process.env.RABTUL_PAYMENT_URL || 'http://localhost:4001';
const RABTUL_SUBSCRIPTION_URL = process.env.RABTUL_SUBSCRIPTION_URL || 'http://localhost:4022';
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || 'corpid-internal-token';

// =============================================================================
// SUBSCRIPTION PLANS
// =============================================================================

export const SUBSCRIPTION_PLANS = {
  // Individual Plans
  individual: {
    basic: {
      planId: 'twinos-basic',
      name: 'TwinOS Basic',
      price: 0,
      currency: 'INR',
      interval: 'monthly',
      features: [
        '1 Knowledge Twin',
        '1GB Memory',
        'Export capability',
        'Basic analytics'
      ],
      twinsLimit: 1,
      memoryLimit: 1024, // MB
      twinTypes: ['KNOWLEDGE']
    },
    pro: {
      planId: 'twinos-pro',
      name: 'TwinOS Pro',
      price: 499,
      currency: 'INR',
      interval: 'monthly',
      features: [
        '3 Twins (Knowledge, Skill, Career)',
        '10GB Memory',
        'API access',
        'Advanced analytics',
        'Priority support'
      ],
      twinsLimit: 3,
      memoryLimit: 10240,
      twinTypes: ['KNOWLEDGE', 'SKILL', 'CAREER']
    },
    premium: {
      planId: 'twinos-premium',
      name: 'TwinOS Premium',
      price: 999,
      currency: 'INR',
      interval: 'monthly',
      features: [
        'All 5 Twins',
        '100GB Memory',
        'Sutar execution',
        'Unlimited API',
        'Custom training',
        'Dedicated support'
      ],
      twinsLimit: 5,
      memoryLimit: 102400,
      twinTypes: ['KNOWLEDGE', 'SKILL', 'CAREER', 'PRODUCTIVITY', 'EXECUTION']
    }
  },

  // Freelancer Bundle
  freelancer: {
    bundle: {
      planId: 'twinos-freelancer',
      name: 'TwinOS + MyTalent Bundle',
      price: 799,
      currency: 'INR',
      interval: 'monthly',
      features: [
        'Full MyTalent profile',
        'All 5 Professional Twins',
        'Marketplace visibility',
        'Client hiring access',
        'Priority support'
      ],
      twinsLimit: 5,
      memoryLimit: 102400,
      twinTypes: ['KNOWLEDGE', 'SKILL', 'CAREER', 'PRODUCTIVITY', 'EXECUTION']
    }
  },

  // Enterprise Plans
  enterprise: {
    startup: {
      planId: 'twinos-enterprise-startup',
      name: 'TwinOS Enterprise - Startup',
      pricePerEmployee: 50,
      currency: 'INR',
      interval: 'monthly',
      minEmployees: 10,
      features: [
        'Workforce twins',
        'Basic analytics',
        'CorpPerks integration',
        'Email support'
      ],
      twinsLimit: 5,
      memoryLimit: 10240
    },
    business: {
      planId: 'twinos-enterprise-business',
      name: 'TwinOS Enterprise - Business',
      pricePerEmployee: 100,
      currency: 'INR',
      interval: 'monthly',
      minEmployees: 25,
      features: [
        'Workforce twins',
        'Advanced analytics',
        'Custom training',
        'API access',
        'Dedicated support'
      ],
      twinsLimit: 5,
      memoryLimit: 102400
    },
    enterprise: {
      planId: 'twinos-enterprise-enterprise',
      name: 'TwinOS Enterprise - Enterprise',
      pricePerEmployee: 200,
      currency: 'INR',
      interval: 'monthly',
      minEmployees: 100,
      features: [
        'All enterprise features',
        'White-label option',
        'Custom SLA',
        'Priority engineering',
        '24/7 support'
      ],
      twinsLimit: 5,
      memoryLimit: 1024000
    }
  }
};

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================

/**
 * Create individual subscription
 */
export async function createIndividualSubscription(
  ownerCorpId: string,
  planType: 'basic' | 'pro' | 'premium'
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  const plan = SUBSCRIPTION_PLANS.individual[planType];

  if (!plan) {
    return { success: false, error: 'Invalid plan' };
  }

  if (plan.price === 0) {
    // Free tier - just create subscription record
    const subscription = await createSubscriptionRecord({
      ownerCorpId,
      planId: plan.planId,
      planType: 'individual',
      status: 'active',
      price: 0,
      twinsLimit: plan.twinsLimit,
      memoryLimit: plan.memoryLimit,
      twinTypes: plan.twinTypes
    });

    return { success: true, subscriptionId: subscription.subscriptionId };
  }

  // Create RABTUL subscription
  try {
    const response = await fetch(`${RABTUL_SUBSCRIPTION_URL}/api/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_TOKEN
      },
      body: JSON.stringify({
        customerId: ownerCorpId,
        planId: plan.planId,
        items: [{
          planId: plan.planId,
          name: plan.name,
          quantity: 1,
          unitPrice: plan.price
        }],
        autoRenew: true,
        paymentMethod: 'wallet' // Use RABTUL wallet
      })
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to create subscription' };
    }

    const data = await response.json();

    // Create local subscription record
    const subscription = await createSubscriptionRecord({
      ownerCorpId,
      planId: plan.planId,
      planType: 'individual',
      externalSubscriptionId: data.subscriptionId,
      status: 'active',
      price: plan.price,
      twinsLimit: plan.twinsLimit,
      memoryLimit: plan.memoryLimit,
      twinTypes: plan.twinTypes
    });

    return { success: true, subscriptionId: subscription.subscriptionId };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create enterprise subscription
 */
export async function createEnterpriseSubscription(
  companyCorpId: string,
  planType: 'startup' | 'business' | 'enterprise',
  employeeCount: number
): Promise<{ success: boolean; subscriptionId?: string; error?: string; price?: number }> {
  const plan = SUBSCRIPTION_PLANS.enterprise[planType];

  if (!plan) {
    return { success: false, error: 'Invalid plan' };
  }

  if (employeeCount < plan.minEmployees) {
    return {
      success: false,
      error: `Minimum ${plan.minEmployees} employees required for ${planType} plan`
    };
  }

  const totalPrice = plan.pricePerEmployee * employeeCount;

  try {
    const response = await fetch(`${RABTUL_SUBSCRIPTION_URL}/api/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_TOKEN
      },
      body: JSON.stringify({
        customerId: companyCorpId,
        planId: plan.planId,
        items: [{
          planId: plan.planId,
          name: `${plan.name} - ${employeeCount} employees`,
          quantity: employeeCount,
          unitPrice: plan.pricePerEmployee
        }],
        autoRenew: true,
        paymentMethod: 'invoice'
      })
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to create enterprise subscription' };
    }

    const data = await response.json();

    const subscription = await createSubscriptionRecord({
      ownerCorpId: companyCorpId,
      planId: plan.planId,
      planType: 'enterprise',
      externalSubscriptionId: data.subscriptionId,
      status: 'active',
      price: totalPrice,
      twinsLimit: plan.twinsLimit,
      memoryLimit: plan.memoryLimit,
      employeeCount,
      maxEmployees: employeeCount
    });

    return { success: true, subscriptionId: subscription.subscriptionId, price: totalPrice };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Add employee to enterprise subscription
 */
export async function addEmployeeToSubscription(
  subscriptionId: string,
  employeeCorpId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await SubscriptionModel.findOne({ subscriptionId });
    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    if (subscription.planType !== 'enterprise') {
      return { success: false, error: 'Not an enterprise subscription' };
    }

    if (subscription.employees.length >= (subscription as any).maxEmployees) {
      return { success: false, error: 'Employee limit reached' };
    }

    // Add employee to subscription
    subscription.employees.push(employeeCorpId);
    await subscription.save();

    // Create twins for employee if not exists
    await createDefaultTwinsForEmployee(employeeCorpId);

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Check subscription limits
 */
export async function checkSubscriptionLimits(
  ownerCorpId: string
): Promise<{
  canCreateTwin: boolean;
  currentTwins: number;
  twinsLimit: number;
  memoryUsed: number;
  memoryLimit: number;
  allowedTypes: string[];
}> {
  const twins = await ProfessionalTwin.find({
    ownerCorpId,
    status: { $ne: 'ARCHIVED' }
  });

  const subscription = await SubscriptionModel.findOne({
    ownerCorpId,
    status: 'active'
  });

  if (!subscription) {
    // Default to basic/free tier
    return {
      canCreateTwin: twins.length < 1,
      currentTwins: twins.length,
      twinsLimit: 1,
      memoryUsed: 0,
      memoryLimit: 1024,
      allowedTypes: ['KNOWLEDGE']
    };
  }

  return {
    canCreateTwin: twins.length < subscription.twinsLimit,
    currentTwins: twins.length,
    twinsLimit: subscription.twinsLimit,
    memoryUsed: await calculateMemoryUsage(ownerCorpId),
    memoryLimit: subscription.memoryLimit,
    allowedTypes: subscription.twinTypes || ['KNOWLEDGE']
  };
}

/**
 * Get subscription for owner
 */
export async function getSubscription(ownerCorpId: string): Promise<any> {
  const subscription = await SubscriptionModel.findOne({
    ownerCorpId,
    status: { $ne: 'cancelled' }
  });

  if (!subscription) {
    return null;
  }

  // Get plan details
  let planDetails: any = null;
  if (subscription.planType === 'individual') {
    const planKey = Object.keys(SUBSCRIPTION_PLANS.individual).find(
      key => SUBSCRIPTION_PLANS.individual[key as keyof typeof SUBSCRIPTION_PLANS.individual].planId === subscription.planId
    );
    if (planKey) {
      planDetails = SUBSCRIPTION_PLANS.individual[planKey as keyof typeof SUBSCRIPTION_PLANS.individual];
    }
  } else if (subscription.planType === 'enterprise') {
    const planKey = Object.keys(SUBSCRIPTION_PLANS.enterprise).find(
      key => SUBSCRIPTION_PLANS.enterprise[key as keyof typeof SUBSCRIPTION_PLANS.enterprise].planId === subscription.planId
    );
    if (planKey) {
      planDetails = SUBSCRIPTION_PLANS.enterprise[planKey as keyof typeof SUBSCRIPTION_PLANS.enterprise];
    }
  }

  return {
    subscriptionId: subscription.subscriptionId,
    planId: subscription.planId,
    planType: subscription.planType,
    planName: planDetails?.name,
    status: subscription.status,
    price: subscription.price,
    limits: {
      twins: subscription.twinsLimit,
      memory: subscription.memoryLimit,
      twinTypes: subscription.twinTypes
    },
    usage: {
      twins: await ProfessionalTwin.countDocuments({ ownerCorpId, status: { $ne: 'ARCHIVED' } }),
      memory: await calculateMemoryUsage(ownerCorpId)
    },
    features: planDetails?.features || [],
    createdAt: subscription.createdAt,
    currentPeriodEnd: subscription.currentPeriodEnd
  };
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  ownerCorpId: string,
  immediate: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await SubscriptionModel.findOne({
      subscriptionId,
      ownerCorpId
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    // Cancel external subscription
    if (subscription.externalSubscriptionId) {
      await fetch(`${RABTUL_SUBSCRIPTION_URL}/api/v1/subscriptions/${subscription.externalSubscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'x-internal-token': INTERNAL_TOKEN
        },
        body: JSON.stringify({ immediate })
      });
    }

    // Update local record
    subscription.status = immediate ? 'cancelled' : 'cancelling';
    subscription.cancelledAt = new Date();
    await subscription.save();

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

async function createSubscriptionRecord(data: {
  ownerCorpId: string;
  planId: string;
  planType: 'individual' | 'enterprise';
  externalSubscriptionId?: string;
  status: string;
  price: number;
  twinsLimit: number;
  memoryLimit: number;
  twinTypes?: string[];
  employeeCount?: number;
  maxEmployees?: number;
}): Promise<any> {
  const subscription = new SubscriptionModel({
    subscriptionId: `SUB-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ...data,
    employees: [],
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    createdAt: new Date()
  });

  await subscription.save();
  return subscription;
}

async function createDefaultTwinsForEmployee(corpId: string): Promise<void> {
  const twinTypes = ['KNOWLEDGE', 'SKILL', 'CAREER', 'PRODUCTIVITY', 'EXECUTION'];

  for (const twinType of twinTypes) {
    const twinId = `TWIN-${corpId}-${twinType}`;

    const exists = await ProfessionalTwin.findOne({ twinId });
    if (!exists) {
      const twin = new ProfessionalTwin({
        twinId,
        ownerCorpId: corpId,
        ownerName: 'Employee',
        twinType,
        ownership: {
          ownedBy: 'EMPLOYEE',
          transferRights: true,
          portability: true
        },
        learning: {
          sources: [],
          totalTrainingHours: 0,
          lastActiveAt: new Date()
        },
        knowledge: {
          domains: [],
          expertise: [],
          methodologies: [],
          tools: [],
          languages: ['English']
        },
        behavior: {
          workStyle: 'adaptive',
          communicationStyle: 'professional',
          decisionPattern: 'balanced',
          learningStyle: 'continuous',
          strengths: [],
          growthAreas: []
        },
        metrics: {
          productivityMultiplier: twinType === 'EXECUTION' ? 2.0 : 1.0,
          knowledgeScore: 0,
          executionScore: 0,
          reliabilityScore: 85,
          combinedScore: 50
        },
        privacy: {
          shareWithCurrentEmployer: true,
          shareWithFutureEmployer: true,
          showInResume: twinType !== 'PRODUCTIVITY',
          verifiedClaims: []
        },
        status: 'TRAINING'
      });

      await twin.save();
    }
  }
}

async function calculateMemoryUsage(corpId: string): Promise<number> {
  // Simplified calculation - in production, track actual memory usage
  const twins = await ProfessionalTwin.find({ ownerCorpId: corpId });
  return twins.reduce((sum, twin) => {
    return sum + twin.learning.totalTrainingHours * 0.1; // ~100MB per 1000 hours
  }, 0);
}

// =============================================================================
// SUBSCRIPTION MODEL (simplified)
// =============================================================================

import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  subscriptionId: { type: String, required: true, unique: true },
  ownerCorpId: { type: String, required: true, index: true },
  planId: String,
  planType: { type: String, enum: ['individual', 'enterprise'] },
  externalSubscriptionId: String,
  status: { type: String, enum: ['active', 'cancelling', 'cancelled', 'past_due'] },
  price: Number,
  twinsLimit: Number,
  memoryLimit: Number,
  twinTypes: [String],
  employeeCount: Number,
  maxEmployees: Number,
  employees: [String],
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelledAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const SubscriptionModel = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);

export { SubscriptionModel };
