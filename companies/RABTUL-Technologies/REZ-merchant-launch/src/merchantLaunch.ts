/**
 * REZ Merchant Launch Wizard
 *
 * Simple onboarding that hides intelligence complexity
 *
 * The merchant experience should feel like:
 * > "turn on growth mode"
 *
 * NOT:
 * > "configure intelligence graph"
 */

import { randomUUID } from 'crypto';
import { bootstrapIntelligence } from '../../../REZ-Intelligence/REZ-bootstrap-intelligence/src/bootstrapIntelligence';

// ============================================================================
// Types
// ============================================================================

export type BusinessType =
  | 'restaurant'
  | 'cafe'
  | 'grocery'
  | 'pharmacy'
  | 'salon'
  | 'fitness'
  | 'retail'
  | 'hotel'
  | 'other';

export type MerchantTier = 'starter' | 'growth' | 'pro' | 'enterprise';

export interface MerchantProfile {
  basicInfo: {
    businessName: string;
    ownerName: string;
    phone: string;
    email: string;
    city: string;
    address: string;
  };
  businessType: BusinessType;
  category: string;
  tier: MerchantTier;
}

export interface LaunchConfig {
  merchantId: string;
  profile: MerchantProfile;

  // Simplified toggles
  features: {
    qrCodes: boolean;
    loyalty: boolean;
    cashback: boolean;
    notifications: boolean;
    analytics: boolean;
    recommendations: boolean;
  };

  // One-click growth modes
  growthMode: 'basic' | 'growth' | 'full';

  // Budget settings
  budget: {
    monthlyAdSpend: number;
    cashbackPercent: number;
    maxCashbackPerOrder: number;
  };
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  fields: OnboardingField[];
  autoComplete?: boolean;
}

export interface OnboardingField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'toggle' | 'upload';
  required: boolean;
  value?;
  options?: { label: string; value: unknown }[];
  placeholder?: string;
  helpText?: string;
}

// ============================================================================
// Onboarding Wizard
// ============================================================================

class MerchantOnboardingWizard {
  private steps: OnboardingStep[] = [];

  constructor() {
    this.initializeSteps();
  }

  private initializeSteps(): void {
    // Step 1: Basic Info
    this.steps.push({
      id: 'basic-info',
      title: 'Tell us about your business',
      description: 'This helps us set up your account',
      status: 'pending',
      fields: [
        {
          id: 'businessName',
          label: 'Business Name',
          type: 'text',
          required: true,
          placeholder: 'e.g., Pizza Palace'
        },
        {
          id: 'ownerName',
          label: 'Your Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your full name'
        },
        {
          id: 'phone',
          label: 'Phone Number',
          type: 'text',
          required: true,
          placeholder: 'Enter 10-digit mobile number'
        },
        {
          id: 'city',
          label: 'City',
          type: 'select',
          required: true,
          options: [
            { label: 'Mumbai', value: 'mumbai' },
            { label: 'Delhi', value: 'delhi' },
            { label: 'Bangalore', value: 'bangalore' },
            { label: 'Hyderabad', value: 'hyderabad' },
            { label: 'Pune', value: 'pune' },
            { label: 'Chennai', value: 'chennai' },
            { label: 'Other', value: 'other' }
          ]
        }
      ]
    });

    // Step 2: Business Type
    this.steps.push({
      id: 'business-type',
      title: 'What type of business?',
      description: 'We\'ll customize features for your industry',
      status: 'pending',
      fields: [
        {
          id: 'businessType',
          label: 'Business Type',
          type: 'select',
          required: true,
          options: [
            { label: 'Restaurant / Food', value: 'restaurant' },
            { label: 'Cafe / Coffee Shop', value: 'cafe' },
            { label: 'Grocery / Supermarket', value: 'grocery' },
            { label: 'Pharmacy', value: 'pharmacy' },
            { label: 'Salon / Beauty', value: 'salon' },
            { label: 'Fitness / Gym', value: 'fitness' },
            { label: 'Retail Store', value: 'retail' },
            { label: 'Hotel / Hospitality', value: 'hotel' },
            { label: 'Other', value: 'other' }
          ]
        }
      ]
    });

    // Step 3: Growth Mode (Simplified)
    this.steps.push({
      id: 'growth-mode',
      title: 'Choose your growth mode',
      description: 'Pick how fast you want to grow',
      status: 'pending',
      fields: [
        {
          id: 'growthMode',
          label: 'Growth Mode',
          type: 'select',
          required: true,
          options: [
            { label: 'Basic - Start Simple', value: 'basic' },
            { label: 'Growth - More Customers', value: 'growth' },
            { label: 'Full Power - All Features', value: 'full' }
          ],
          helpText: 'You can change this anytime'
        }
      ]
    });

    // Step 4: Budget (Simple)
    this.steps.push({
      id: 'budget',
      title: 'Set your monthly budget',
      description: 'How much do you want to spend on growth?',
      status: 'pending',
      fields: [
        {
          id: 'monthlyBudget',
          label: 'Monthly Budget',
          type: 'select',
          required: false,
          options: [
            { label: '₹0 - Start Free', value: 0 },
            { label: '₹999 - Basic Growth', value: 999 },
            { label: '₹2,999 - Pro Growth', value: 2999 },
            { label: '₹7,999 - Full Power', value: 7999 }
          ],
          helpText: 'You\'ll get more customers automatically'
        }
      ]
    });

    // Step 5: Features (One-Click)
    this.steps.push({
      id: 'features',
      title: 'Turn on what you need',
      description: 'All features work automatically',
      status: 'pending',
      autoComplete: true,
      fields: [
        {
          id: 'qrCodes',
          label: 'QR Codes',
          type: 'toggle',
          required: false,
          helpText: 'Customers scan to order/pay'
        },
        {
          id: 'loyalty',
          label: 'Loyalty Program',
          type: 'toggle',
          required: false,
          helpText: 'Reward repeat customers'
        },
        {
          id: 'cashback',
          label: 'Cashback',
          type: 'toggle',
          required: false,
          helpText: 'Give customers REZ coins'
        },
        {
          id: 'notifications',
          label: 'Smart Notifications',
          type: 'toggle',
          required: false,
          helpText: 'Automated reminders'
        }
      ]
    });

    // Step 6: Ready (Auto-complete)
    this.steps.push({
      id: 'ready',
      title: 'You\'re all set!',
      description: 'Your store is being created',
      status: 'pending',
      autoComplete: true,
      fields: []
    });
  }

  getSteps(): OnboardingStep[] {
    return this.steps;
  }

  getStep(stepId: string): OnboardingStep | undefined {
    return this.steps.find(s => s.id === stepId);
  }

  getCurrentStep(): OnboardingStep | undefined {
    return this.steps.find(s => s.status === 'pending');
  }

  async completeStep(stepId: string, fieldValues: Record<string, unknown>): Promise<OnboardingStep | null> {
    const step = this.steps.find(s => s.id === stepId);
    if (!step) return null;

    // Validate required fields
    for (const field of step.fields) {
      if (field.required && !fieldValues[field.id]) {
        throw new Error(`${field.label} is required`);
      }
    }

    // Update field values
    step.fields.forEach(field => {
      field.value = fieldValues[field.id];
    });

    // Mark as completed
    step.status = 'completed';

    // Move to next step
    const currentIndex = this.steps.indexOf(step);
    if (currentIndex < this.steps.length - 1) {
      this.steps[currentIndex + 1].status = 'pending';
    }

    return step;
  }
}

// ============================================================================
// Growth Mode Configuration
// ============================================================================

class GrowthModeConfig {
  static getConfig(mode: 'basic' | 'growth' | 'full'): LaunchConfig['features'] & LaunchConfig['budget'] {
    switch (mode) {
      case 'basic':
        return {
          qrCodes: true,
          loyalty: false,
          cashback: false,
          notifications: true,
          analytics: false,
          recommendations: false,
          monthlyAdSpend: 0,
          cashbackPercent: 0,
          maxCashbackPerOrder: 0
        };

      case 'growth':
        return {
          qrCodes: true,
          loyalty: true,
          cashback: true,
          notifications: true,
          analytics: true,
          recommendations: true,
          monthlyAdSpend: 2000,
          cashbackPercent: 5,
          maxCashbackPerOrder: 50
        };

      case 'full':
        return {
          qrCodes: true,
          loyalty: true,
          cashback: true,
          notifications: true,
          analytics: true,
          recommendations: true,
          monthlyAdSpend: 5000,
          cashbackPercent: 8,
          maxCashbackPerOrder: 100
        };
    }
  }
}

// ============================================================================
// Merchant Launch Service
// ============================================================================

class MerchantLaunchService {
  private onboardingWizard: MerchantOnboardingWizard;

  constructor() {
    this.onboardingWizard = new MerchantOnboardingWizard();
  }

  /**
   * Start onboarding
   */
  startOnboarding(): {
    merchantId: string;
    steps: OnboardingStep[];
    currentStep: OnboardingStep | null;
  } {
    const merchantId = `merchant_${randomUUID().slice(0, 8)}`;
    const steps = this.onboardingWizard.getSteps();
    const currentStep = this.onboardingWizard.getCurrentStep() || null;

    // Mark first step as active
    if (steps.length > 0) {
      steps[0].status = 'pending';
    }

    return { merchantId, steps, currentStep };
  }

  /**
   * Complete onboarding step
   */
  async completeOnboardingStep(
    merchantId: string,
    stepId: string,
    values: Record<string, unknown>
  ): Promise<{
    completedStep: OnboardingStep;
    nextStep: OnboardingStep | null;
    isComplete: boolean;
  }> {
    const completedStep = await this.onboardingWizard.completeStep(stepId, values);
    if (!completedStep) {
      throw new Error('Step not found');
    }

    const nextStep = this.onboardingWizard.getCurrentStep() || null;
    const isComplete = !nextStep;

    return { completedStep, nextStep, isComplete };
  }

  /**
   * Generate launch configuration
   */
  async generateLaunchConfig(merchantId: string, answers: Record<string, unknown>): Promise<LaunchConfig> {
    const { city, businessType, growthMode } = answers;

    // Get bootstrap intelligence
    const bootstrap = bootstrapIntelligence.getMerchantBootstrap(
      merchantId,
      businessType,
      city
    );

    // Get growth mode config
    const features = GrowthModeConfig.getConfig(growthMode);

    // Build profile
    const profile: MerchantProfile = {
      basicInfo: {
        businessName: answers.businessName,
        ownerName: answers.ownerName,
        phone: answers.phone,
        email: answers.email || '',
        city: answers.city,
        address: answers.address || ''
      },
      businessType: answers.businessType,
      category: businessType,
      tier: this.determineTier(answers.monthlyBudget || 0)
    };

    return {
      merchantId,
      profile,
      features: {
        qrCodes: features.qrCodes,
        loyalty: features.loyalty,
        cashback: features.cashback,
        notifications: features.notifications,
        analytics: features.analytics,
        recommendations: features.recommendations
      },
      growthMode,
      budget: {
        monthlyAdSpend: features.monthlyAdSpend,
        cashbackPercent: features.cashbackPercent,
        maxCashbackPerOrder: features.maxCashbackPerOrder
      }
    };
  }

  /**
   * Get recommended setup for merchant
   */
  async getRecommendedSetup(merchantId: string, city: string, category: string): Promise<{
    recommendedCashback: number;
    recommendedOffers: { type: string; value: number; duration: number }[];
    expectedOrders: number;
    peakHours: number[];
    insights: string[];
  }> {
    const bootstrap = bootstrapIntelligence.getMerchantBootstrap(merchantId, category, city);

    return {
      recommendedCashback: bootstrap.startingCashback,
      recommendedOffers: bootstrap.launchOffers.map(o => ({
        type: o.type,
        value: o.value,
        duration: o.duration
      })),
      expectedOrders: bootstrap.expectedOrderVolume,
      peakHours: bootstrap.peakHours,
      insights: [
        `Your category has ${bootstrap.categoryInsights.avgRating}★ average rating`,
        `Most customers spend ₹${bootstrap.recommendedPricing.optimal} in your category`,
        `Peak hours: ${bootstrap.peakHours.join(', ')}`
      ]
    };
  }

  /**
   * Get quick start checklist
   */
  getQuickStartChecklist(): { task: string; action: string; estimatedTime: string }[] {
    return [
      { task: 'Add your first product', action: 'Add items to your menu', estimatedTime: '5 min' },
      { task: 'Create QR code', action: 'Generate table/store QR', estimatedTime: '2 min' },
      { task: 'Set up cashback', action: 'Choose cashback percentage', estimatedTime: '1 min' },
      { task: 'Add payment method', action: 'Connect bank account', estimatedTime: '3 min' },
      { task: 'Test your store', action: 'Place a test order', estimatedTime: '2 min' }
    ];
  }

  /**
   * Get dashboard summary for new merchant
   */
  getNewMerchantDashboard(): {
    sections: { title: string; cards: { title: string; value: string | number; trend?: string }[] }[];
    actions: { title: string; description: string; button: string }[];
  } {
    return {
      sections: [
        {
          title: 'Today',
          cards: [
            { title: 'Orders', value: 0 },
            { title: 'Revenue', value: '₹0' },
            { title: 'New Customers', value: 0 }
          ]
        },
        {
          title: 'This Week',
          cards: [
            { title: 'Total Orders', value: 0 },
            { title: 'Total Revenue', value: '₹0' },
            { title: 'Returning Customers', value: '0%' }
          ]
        },
        {
          title: 'Growth',
          cards: [
            { title: 'QR Scans', value: 0 },
            { title: 'Cashback Given', value: '₹0' },
            { title: 'Repeat Rate', value: '0%' }
          ]
        }
      ],
      actions: [
        {
          title: 'Your QR Code is Ready',
          description: 'Share it with customers to start accepting orders',
          button: 'Download QR'
        },
        {
          title: 'Add Your Menu',
          description: 'Add items so customers can order',
          button: 'Add Products'
        },
        {
          title: 'Set Up Cashback',
          description: 'Reward customers with REZ coins',
          button: 'Configure Cashback'
        }
      ]
    };
  }

  private determineTier(budget: number): MerchantTier {
    if (budget >= 7999) return 'pro';
    if (budget >= 2999) return 'growth';
    return 'starter';
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const merchantLaunch = new MerchantLaunchService();
export default merchantLaunch;
