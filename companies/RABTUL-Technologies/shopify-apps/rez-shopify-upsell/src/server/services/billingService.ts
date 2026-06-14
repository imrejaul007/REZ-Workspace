/**
 * ReZ Upsell - Billing Service
 *
 * Shopify subscription billing integration.
 * Allows merchants to subscribe to paid plans.
 */

import { Request, Response } from 'express';
import axios from 'axios';

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET } = process.env;

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'every_30_days' | 'annual';
  trialDays: number;
  features: string[];
  limits: {
    maxOrders: number;
    maxProducts: number;
    maxCustomers: number;
  };
}

export const PLANS: Record<string, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 999,
    currency: 'INR',
    interval: 'every_30_days',
    trialDays: 14,
    features: [
      'checkout_upsells',
      'basic_analytics',
      'email_support',
      '1_store',
    ],
    limits: {
      maxOrders: 1000,
      maxProducts: 100,
      maxCustomers: 5000,
    },
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 1999,
    currency: 'INR',
    interval: 'every_30_days',
    trialDays: 14,
    features: [
      'checkout_upsells',
      'cart_upsells',
      'ai_recommendations',
      'advanced_analytics',
      'ab_testing',
      'custom_branding',
      'priority_support',
      '3_stores',
    ],
    limits: {
      maxOrders: 10000,
      maxProducts: 500,
      maxCustomers: 50000,
    },
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    price: 4999,
    currency: 'INR',
    interval: 'every_30_days',
    trialDays: 14,
    features: [
      'all_features',
      'unlimited_stores',
      'custom_integrations',
      'dedicated_support',
      'white_label',
      'api_access',
    ],
    limits: {
      maxOrders: 100000,
      maxProducts: -1, // unlimited
      maxCustomers: -1, // unlimited
    },
  },
};

export interface Subscription {
  id: string;
  shop: string;
  planId: string;
  status: 'active' | 'trialing' | 'cancelled' | 'expired';
  trialEnd?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
}

export class BillingService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = SHOPIFY_API_KEY || '';
    this.apiSecret = SHOPIFY_API_SECRET || '';
    this.baseUrl = 'https://partners.shopify.com';
  }

  /**
   * Create a recurring charge for the merchant's plan
   */
  async createCharge(
    shop: string,
    accessToken: string,
    planId: string
  ): Promise<{ chargeId: string; confirmationUrl: string }> {
    const plan = PLANS[planId];
    if (!plan) {
      throw new Error(`Unknown plan: ${planId}`);
    }

    // In production, use Shopify's RecurringApplicationCharge API
    // For now, we'll simulate the flow

    const charge = {
      name: `ReZ Upsell - ${plan.name}`,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval === 'every_30_days' ? 'every_30_days' : 'annual',
      trial_days: plan.trialDays,
      return_url: `${process.env.APP_URL}/billing/callback`,
      test: process.env.NODE_ENV !== 'production',
    };

    // Create charge via Shopify API
    const response = await axios.post(
      `https://${shop}/admin/api/2024-01/recurring_application_charges.json`,
      { recurring_application_charge: charge },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    const chargeData = response.data.recurring_application_charge;

    return {
      chargeId: chargeData.id.toString(),
      confirmationUrl: chargeData.confirmation_url,
    };
  }

  /**
   * Get active subscription for a shop
   */
  async getSubscription(
    shop: string,
    accessToken: string
  ): Promise<Subscription | null> {
    try {
      const response = await axios.get(
        `https://${shop}/admin/api/2024-01/recurring_application_charges.json?status=active`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
        }
      );

      const charges = response.data.recurring_application_charges;
      if (charges.length === 0) {
        return null;
      }

      const charge = charges[0];
      return {
        id: charge.id.toString(),
        shop,
        planId: this.getPlanIdFromName(charge.name),
        status: charge.status === 'active' ? 'active' : 'trialing',
        trialEnd: charge.trial_ends_on ? new Date(charge.trial_ends_on) : undefined,
        currentPeriodEnd: new Date(charge.billing_on || charge.created_at),
        cancelAtPeriodEnd: charge.cancelled_at !== null,
      };
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    shop: string,
    accessToken: string,
    subscriptionId: string
  ): Promise<boolean> {
    try {
      await axios.delete(
        `https://${shop}/admin/api/2024-01/recurring_application_charges/${subscriptionId}.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
        }
      );
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  /**
   * Update subscription plan
   */
  async updatePlan(
    shop: string,
    accessToken: string,
    newPlanId: string
  ): Promise<{ chargeId: string; confirmationUrl: string }> {
    // Cancel existing and create new
    const existing = await this.getSubscription(shop, accessToken);
    if (existing) {
      await this.cancelSubscription(shop, accessToken, existing.id);
    }

    return this.createCharge(shop, accessToken, newPlanId);
  }

  /**
   * Check if merchant has paid plan
   */
  async hasPaidPlan(shop: string, accessToken: string): Promise<boolean> {
    const subscription = await this.getSubscription(shop, accessToken);
    return subscription !== null && subscription.status === 'active';
  }

  /**
   * Get plan limits for current plan
   */
  async getPlanLimits(shop: string, accessToken: string): Promise<Plan['limits'] | null> {
    const subscription = await this.getSubscription(shop, accessToken);
    if (!subscription) {
      return PLANS.starter.limits; // Free tier limits
    }
    return PLANS[subscription.planId]?.limits || PLANS.starter.limits;
  }

  /**
   * Check if merchant has exceeded limits
   */
  async checkLimits(
    shop: string,
    accessToken: string,
    usage: { orders: number; products: number; customers: number }
  ): Promise<{ exceeded: boolean; type?: 'orders' | 'products' | 'customers'; upgrade?: string }> {
    const limits = await this.getPlanLimits(shop, accessToken);

    if (limits.maxOrders > 0 && usage.orders > limits.maxOrders) {
      return { exceeded: true, type: 'orders', upgrade: 'growth' };
    }

    if (limits.maxProducts > 0 && usage.products > limits.maxProducts) {
      return { exceeded: true, type: 'products', upgrade: 'growth' };
    }

    if (limits.maxCustomers > 0 && usage.customers > limits.maxCustomers) {
      return { exceeded: true, type: 'customers', upgrade: 'growth' };
    }

    return { exceeded: false };
  }

  /**
   * Extract plan ID from charge name
   */
  private getPlanIdFromName(name: string): string {
    if (name.toLowerCase().includes('starter')) return 'starter';
    if (name.toLowerCase().includes('growth')) return 'growth';
    if (name.toLowerCase().includes('scale')) return 'scale';
    return 'starter';
  }
}

// Billing API routes
export async function billingRoutes(app: any) {
  const billing = new BillingService();

  // Get available plans
  app.get('/api/billing/plans', async (req: Request, res: Response) => {
    res.json({
      success: true,
      plans: Object.values(PLANS).map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        trialDays: plan.trialDays,
        features: plan.features,
      })),
    });
  });

  // Get current subscription
  app.get('/api/billing/subscription', async (req: Request, res: Response) => {
    const { shop } = req.query as { shop?: string };
    if (!shop) {
      res.status(400).json({ error: 'Shop required' });
      return;
    }

    const subscription = await billing.getSubscription(shop, '');
    res.json({ success: true, subscription });
  });

  // Create subscription
  app.post('/api/billing/subscribe', async (req: Request, res: Response) => {
    const { shop, accessToken, planId } = req.body;

    if (!shop || !accessToken || !planId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    try {
      const result = await billing.createCharge(shop, accessToken, planId);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Create charge error:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  });

  // Cancel subscription
  app.post('/api/billing/cancel', async (req: Request, res: Response) => {
    const { shop, accessToken, subscriptionId } = req.body;

    try {
      const success = await billing.cancelSubscription(shop, accessToken, subscriptionId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });
}
