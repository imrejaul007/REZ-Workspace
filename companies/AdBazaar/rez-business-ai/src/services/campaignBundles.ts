/**
 * REZ Business AI - One-Click Campaign Bundles
 *
 * Pre-built campaign bundles for instant execution
 */

import { AIAction, BusinessIntelligence } from '../types';

export interface CampaignBundle {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'growth' | 'retention' | 'promotion' | 'seasonal' | 'emergency';
  businessTypes: string[];
  actions: BundleAction[];
  estimatedImpact: {
    revenue: number;
    customers: number;
    roi: number;
    time: string;
  };
  risk: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
}

export interface BundleAction {
  type: string;
  params: Record<string, unknown>;
  delay: number; // minutes
}

export interface BundleExecution {
  bundleId: string;
  actions: AIAction[];
  startedAt: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  results: BundleResult[];
}

export interface BundleResult {
  actionType: string;
  status: 'success' | 'failed' | 'pending';
  result?;
  error?: string;
}

export class CampaignBundles {
  private bundles: Map<string, CampaignBundle> = new Map();

  constructor() {
    this.initializeBundles();
  }

  /**
   * Initialize all campaign bundles
   */
  private initializeBundles() {
    // Growth Bundles
    this.register({
      id: 'weekend-rush',
      name: 'Weekend Rush',
      icon: '🚀',
      description: 'Boost weekend traffic with special offers',
      category: 'growth',
      businessTypes: ['restaurant', 'salon', 'retail'],
      actions: [
        { type: 'pricing_adjustment', params: { discount: 15, category: 'weekend-special' }, delay: 0 },
        { type: 'offer_launch', params: { type: 'combo', discount: 20 }, delay: 5 },
        { type: 'whatsapp_campaign', params: { segment: 'all', message: 'Weekend Special! 20% off on combos' }, delay: 10 },
        { type: 'push_notification', params: { title: 'Weekend Deal!', message: 'Visit us this weekend for exclusive offers' }, delay: 15 },
      ],
      estimatedImpact: { revenue: 8000, customers: 40, roi: 2.5, time: '3 days' },
      risk: 'low',
      requiresApproval: false,
    });

    this.register({
      id: 'happy-hour',
      name: 'Happy Hour',
      icon: '🍺',
      description: 'Drive evening footfall with happy hour deals',
      category: 'growth',
      businessTypes: ['restaurant', 'bar'],
      actions: [
        { type: 'pricing_adjustment', params: { discount: 25, time: '17:00-19:00' }, delay: 0 },
        { type: 'offer_launch', params: { type: 'happy_hour', freebies: ['starter'] }, delay: 5 },
        { type: 'whatsapp_campaign', params: { segment: 'evening_regulars', message: 'Happy Hour starts at 5! Join us for drinks & deals' }, delay: 10 },
        { type: 'qr_reward', params: { type: 'checkin', reward: 'free_drink' }, delay: 15 },
      ],
      estimatedImpact: { revenue: 5000, customers: 30, roi: 3.0, time: '2 hours daily' },
      risk: 'low',
      requiresApproval: false,
    });

    this.register({
      id: 'new-customer-acquisition',
      name: 'New Customer Rush',
      icon: '👋',
      description: 'Attract new customers with intro offers',
      category: 'growth',
      businessTypes: ['restaurant', 'salon', 'gym', 'retail'],
      actions: [
        { type: 'offer_launch', params: { type: 'first_order', discount: 30, maxDiscount: 200 }, delay: 0 },
        { type: 'ad_create', params: { objective: 'reach', target: 'new_audience', budget: 2000 }, delay: 5 },
        { type: 'referral_campaign', params: { reward: '₹100 off' }, delay: 10 },
      ],
      estimatedImpact: { revenue: 15000, customers: 100, roi: 2.0, time: '7 days' },
      risk: 'medium',
      requiresApproval: true,
    });

    // Retention Bundles
    this.register({
      id: 'win-back-customers',
      name: 'We Miss You!',
      icon: '😢',
      description: 'Win back inactive customers',
      category: 'retention',
      businessTypes: ['restaurant', 'salon', 'gym', 'retail'],
      actions: [
        { type: 'offer_launch', params: { type: 'winback', discount: 25, validHours: 48 }, delay: 0 },
        { type: 'whatsapp_campaign', params: { segment: 'inactive_14_days', message: 'We miss you! Here\'s 25% off your next order' }, delay: 5 },
        { type: 'loyalty_boost', params: { bonusPoints: 200, reason: 'We miss you' }, delay: 10 },
        { type: 'personal_offer', params: { type: 'vip', discount: 30 }, delay: 15 },
      ],
      estimatedImpact: { revenue: 5000, customers: 25, roi: 4.0, time: '48 hours' },
      risk: 'low',
      requiresApproval: false,
    });

    this.register({
      id: 'vip-treatment',
      name: 'VIP Treatment',
      icon: '👑',
      description: 'Reward your best customers',
      category: 'retention',
      businessTypes: ['restaurant', 'salon', 'retail'],
      actions: [
        { type: 'offer_launch', params: { type: 'vip', discount: 20, minOrder: 500 }, delay: 0 },
        { type: 'whatsapp_campaign', params: { segment: 'high_value', message: 'Exclusive offer just for you, VIP!' }, delay: 5 },
        { type: 'loyalty_points', params: { multiplier: 3, duration: '24 hours' }, delay: 10 },
        { type: 'early_access', params: { products: ['new_items'] }, delay: 15 },
      ],
      estimatedImpact: { revenue: 12000, customers: 20, roi: 5.0, time: '1 day' },
      risk: 'low',
      requiresApproval: false,
    });

    this.register({
      id: 'loyalty-reward',
      name: 'Loyalty Rewards',
      icon: '🎁',
      description: 'Double points for loyal customers',
      category: 'retention',
      businessTypes: ['restaurant', 'salon', 'gym', 'retail'],
      actions: [
        { type: 'loyalty_points', params: { multiplier: 2, duration: '7 days' }, delay: 0 },
        { type: 'whatsapp_campaign', params: { segment: 'regulars', message: 'Earn double points this week! Shop now.' }, delay: 5 },
        { type: 'tier_upgrade', params: { bonusPoints: 500 }, delay: 10 },
      ],
      estimatedImpact: { revenue: 6000, customers: 50, roi: 3.5, time: '7 days' },
      risk: 'low',
      requiresApproval: false,
    });

    // Seasonal Bundles
    this.register({
      id: 'festival-boost',
      name: 'Festival Special',
      icon: '🎉',
      description: 'Celebrate festivals with special offers',
      category: 'seasonal',
      businessTypes: ['restaurant', 'salon', 'retail'],
      actions: [
        { type: 'campaign_create', params: { type: 'festival', theme: 'celebration' }, delay: 0 },
        { type: 'pricing_adjustment', params: { discount: 20, festive: true }, delay: 5 },
        { type: 'offer_launch', params: { type: 'festival_combo', discount: 25 }, delay: 10 },
        { type: 'whatsapp_campaign', params: { segment: 'all', message: 'Happy Festival! 🎉 Enjoy special offers' }, delay: 15 },
        { type: 'gift_offer', params: { type: 'freebie', minOrder: 500 }, delay: 20 },
      ],
      estimatedImpact: { revenue: 25000, customers: 150, roi: 3.0, time: 'Festival period' },
      risk: 'medium',
      requiresApproval: true,
    });

    this.register({
      id: 'rainy-day-recovery',
      name: 'Rainy Day Special',
      icon: '🌧️',
      description: 'Boost delivery orders on rainy days',
      category: 'emergency',
      businessTypes: ['restaurant'],
      actions: [
        { type: 'offer_launch', params: { type: 'free_delivery', minOrder: 200 }, delay: 0 },
        { type: 'pricing_adjustment', params: { discount: 15, delivery_only: true }, delay: 5 },
        { type: 'whatsapp_campaign', params: { segment: 'delivery_customers', message: 'Rainy day? We\'ve got you covered with FREE delivery!' }, delay: 10 },
        { type: 'push_notification', params: { title: '🌧️ Rain = Free Delivery!', message: 'Stay dry, order in!' }, delay: 15 },
      ],
      estimatedImpact: { revenue: 10000, customers: 60, roi: 4.0, time: 'Until rain stops' },
      risk: 'low',
      requiresApproval: false,
    });

    this.register({
      id: 'slow-day-boost',
      name: 'Slow Day Rescue',
      icon: '⚡',
      description: 'Fix slow days with targeted offers',
      category: 'emergency',
      businessTypes: ['restaurant', 'salon', 'retail'],
      actions: [
        { type: 'offer_launch', params: { type: 'flash_sale', discount: 30, duration: 4 }, delay: 0 },
        { type: 'whatsapp_campaign', params: { segment: 'nearby_users', message: 'Flash sale! 30% off, limited time only!' }, delay: 5 },
        { type: 'push_notification', params: { title: '⚡ Flash Sale!', message: '30% off for next 4 hours only' }, delay: 10 },
      ],
      estimatedImpact: { revenue: 4000, customers: 30, roi: 3.5, time: '4 hours' },
      risk: 'medium',
      requiresApproval: false,
    });

    // Promotion Bundles
    this.register({
      id: 'combo-meal',
      name: 'Combo Deal',
      icon: '🍔',
      description: 'Increase order value with combo offers',
      category: 'promotion',
      businessTypes: ['restaurant'],
      actions: [
        { type: 'offer_launch', params: { type: 'combo', discount: 20, minItems: 2 }, delay: 0 },
        { type: 'pricing_adjustment', params: { combo: true, savings: 50 }, delay: 5 },
        { type: 'whatsapp_campaign', params: { segment: 'all', message: 'New Combo Deals! Save up to ₹50' }, delay: 10 },
      ],
      estimatedImpact: { revenue: 8000, customers: 50, avgOrder: 20, roi: 2.8, time: '7 days' },
      risk: 'low',
      requiresApproval: false,
    });

    this.register({
      id: 'referral-program',
      name: 'Refer & Earn',
      icon: '🎯',
      description: 'Grow through word-of-mouth',
      category: 'promotion',
      businessTypes: ['restaurant', 'salon', 'gym', 'retail'],
      actions: [
        { type: 'referral_campaign', params: { reward: '₹200', refereeReward: '₹100' } },
        delay: 0,
        { type: 'ad_create', params: { objective: 'referrals', budget: 3000 }, delay: 5 },
        { type: 'whatsapp_campaign', params: { segment: 'loyal_customers', message: 'Refer a friend, both get rewards! 🎁' }, delay: 10 },
      ],
      estimatedImpact: { revenue: 20000, customers: 100, roi: 4.5, time: '14 days' },
      risk: 'low',
      requiresApproval: true,
    });

    this.register({
      id: 'first-order-boost',
      name: 'First Order Frenzy',
      icon: '🛒',
      description: 'Convert browsing to buying',
      category: 'promotion',
      businessTypes: ['restaurant', 'retail'],
      actions: [
        { type: 'offer_launch', params: { type: 'first_order', discount: 20 }, delay: 0 },
        { type: 'abandoned_cart', params: { reminder: '24h', discount: 10 }, delay: 5 },
        { type: 'push_notification', params: { title: 'Complete your order!', message: 'Use code FIRST20 for 20% off' }, delay: 10 },
      ],
      estimatedImpact: { revenue: 5000, customers: 40, roi: 2.5, time: '7 days' },
      risk: 'low',
      requiresApproval: false,
    });
  }

  /**
   * Register a bundle
   */
  private register(bundle: CampaignBundle) {
    this.bundles.set(bundle.id, bundle);
  }

  /**
   * Get all bundles
   */
  getAllBundles(): CampaignBundle[] {
    return Array.from(this.bundles.values());
  }

  /**
   * Get bundles by business type
   */
  getBundlesForBusiness(businessType: string): CampaignBundle[] {
    return this.getAllBundles().filter(b =>
      b.businessTypes.includes(businessType) || b.businessTypes.includes('all')
    );
  }

  /**
   * Get bundles by category
   */
  getBundlesByCategory(category: CampaignBundle['category']): CampaignBundle[] {
    return this.getAllBundles().filter(b => b.category === category);
  }

  /**
   * Get bundle by ID
   */
  getBundle(id: string): CampaignBundle | undefined {
    return this.bundles.get(id);
  }

  /**
   * Get recommended bundles based on context
   */
  getRecommendedBundles(
    businessType: string,
    intelligence: BusinessIntelligence
  ): CampaignBundle[] {
    let bundles = this.getBundlesForBusiness(businessType);
    const recommendations: CampaignBundle[] = [];

    // Check weather
    if (intelligence.weatherImpact?.condition === 'rainy') {
      const rainy = bundles.find(b => b.id === 'rainy-day-recovery');
      if (rainy) recommendations.push(rainy);
    }

    // Check for slow demand
    const lowDemand = intelligence.demandSignals.find(s => s.type === 'demand_drop');
    if (lowDemand) {
      const slowDay = bundles.find(b => b.id === 'slow-day-boost');
      if (slowDay) recommendations.push(slowDay);
    }

    // Check for upcoming events
    const hasEvent = intelligence.eventImpact.length > 0;
    if (hasEvent) {
      const festival = bundles.find(b => b.id === 'festival-boost');
      if (festival) recommendations.push(festival);
    }

    // Check day of week
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;
    if (isWeekend) {
      const weekend = bundles.find(b => b.id === 'weekend-rush');
      if (weekend) recommendations.push(weekend);
    }

    // Check time of day
    const hour = new Date().getHours();
    const isEvening = hour >= 17 && hour <= 19;
    if (isEvening) {
      const happyHour = bundles.find(b => b.id === 'happy-hour');
      if (happyHour) recommendations.push(happyHour);
    }

    // Add general recommendations to fill up to 5
    const general = bundles.filter(b =>
      !recommendations.includes(b) && b.risk !== 'high'
    );
    recommendations.push(...general.slice(0, 5 - recommendations.length));

    return recommendations;
  }

  /**
   * Execute a bundle
   */
  executeBundle(bundleId: string, merchantId: string): BundleExecution {
    const bundle = this.bundles.get(bundleId);
    if (!bundle) {
      throw new Error(`Bundle ${bundleId} not found`);
    }

    const execution: BundleExecution = {
      bundleId,
      actions: [],
      startedAt: new Date(),
      status: 'pending',
      results: [],
    };

    // Create actions for each bundle action
    for (const action of bundle.actions) {
      const aiAction: AIAction = {
        id: `bundle-${bundleId}-${action.type}-${Date.now()}`,
        type: action.type as unknown,
        priority: bundle.risk === 'high' ? 'high' : 'medium',
        status: 'pending',
        agent: 'bundle-executor',
        merchantId,
        data: action.params,
        confidence: 0.9,
        reasoning: `Executing ${bundle.name}: ${action.type}`,
        estimatedImpact: bundle.estimatedImpact,
        requiresApproval: bundle.requiresApproval,
        createdAt: new Date(),
      };
      execution.actions.push(aiAction);
    }

    return execution;
  }
}

export const campaignBundles = new CampaignBundles();
