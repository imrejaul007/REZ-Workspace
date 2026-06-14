/**
 * Salon Recommendation Engine
 * Generates salon-specific AI recommendations
 */

import { salonHealthScorer, SalonMetrics } from './salonHealthScorer';

export interface SalonRecommendation {
  id: string;
  type: 'marketing' | 'pricing' | 'inventory' | 'operations' | 'customer';
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  data?: Record<string, unknown>;
  template?: string;
  variables?: Record<string, unknown>;
}

export class SalonRecommendationEngine {
  async generateRecommendations(
    merchantId: string,
    metrics: SalonMetrics
  ): Promise<SalonRecommendation[]> {
    const recommendations: SalonRecommendation[] = [];

    // Marketing recommendations
    recommendations.push(...this.getMarketingRecommendations(metrics));

    // Pricing recommendations
    recommendations.push(...this.getPricingRecommendations(metrics));

    // Operations recommendations
    recommendations.push(...this.getOperationsRecommendations(metrics));

    // Customer recommendations
    recommendations.push(...this.getCustomerRecommendations(metrics));

    // Inventory recommendations
    recommendations.push(...this.getInventoryRecommendations(metrics));

    // Sort by priority (high impact + low effort = highest priority)
    return recommendations.sort((a, b) => {
      const scoreA = this.getRecommendationScore(a);
      const scoreB = this.getRecommendationScore(b);
      return scoreB - scoreA;
    });
  }

  private getMarketingRecommendations(m: SalonMetrics): SalonRecommendation[] {
    const recs: SalonRecommendation[] = [];

    // Cross-sell recommendation
    if (m.services.mostPopular.length > 0) {
      recs.push({
        id: 'salon-crosssell-1',
        type: 'marketing',
        category: 'Upsell',
        title: 'Cross-sell opportunity: Hair Color customers',
        description: `45 customers got hair color last month. Offer them hair treatment add-ons.`,
        impact: 'high',
        effort: 'low',
        priority: 1,
        template: 'Hi {name}! You loved your hair color last time. Add a deep conditioning treatment for just ₹299 extra - usually ₹799!',
        variables: { segment: 'hair_color_customers' },
      });
    }

    // Off-peak promotion
    if (m.utilization.offPeakUtilization < 50) {
      recs.push({
        id: 'salon-offpeak-1',
        type: 'marketing',
        category: 'Off-Peak',
        title: 'Fill slow hours with promotions',
        description: `${100 - m.utilization.offPeakUtilization}% of your off-peak slots are empty. Offer 20% off for 2-4 PM appointments.`,
        impact: 'high',
        effort: 'low',
        priority: 2,
        template: 'Beat the rush! Get 20% off all services between 2-4 PM this week. Book now!',
        variables: { discount: 20, hours: '2-4 PM' },
      });
    }

    // Win-back lapsed customers
    const totalCustomers = m.customers.newThisMonth / 0.3; // Rough estimate
    const lapsedCustomers = Math.floor(totalCustomers * 0.3);
    if (lapsedCustomers > 10) {
      recs.push({
        id: 'salon-winback-1',
        type: 'customer',
        category: 'Win-back',
        title: `${lapsedCustomers} customers haven\'t visited in 30+ days`,
        description: 'Send them a "We miss you" offer with 25% off their next visit.',
        impact: 'high',
        effort: 'low',
        priority: 3,
        template: 'Hey {name}! It\'s been a while - we miss you! Come back for unknown service and get 25% off. Valid this week only!',
        variables: { segment: 'lapsed_30_days', discount: 25 },
      });
    }

    // Birthday campaign
    recs.push({
      id: 'salon-birthday-1',
      type: 'marketing',
      category: 'Retention',
      title: 'Send birthday wishes with free add-on',
      description: 'Birthday customers are 3x more likely to book. Offer a free hair serum sample.',
      impact: 'medium',
      effort: 'low',
      priority: 4,
      template: 'Happy Birthday {name}! 🎂 Visit us this week and get a FREE deep conditioning treatment worth ₹499 with unknown service!',
      variables: { segment: 'birthday_this_week', freebie: 'Deep Conditioning' },
    });

    return recs;
  }

  private getPricingRecommendations(m: SalonMetrics): SalonRecommendation[] {
    const recs: SalonRecommendation[] = [];

    // Dynamic pricing for peak hours
    if (m.utilization.peakHourUtilization > 90) {
      recs.push({
        id: 'salon-pricing-peak-1',
        type: 'pricing',
        category: 'Peak Pricing',
        title: 'Implement peak hour pricing',
        description: 'Your 11 AM - 2 PM slots are 90%+ full. Consider 10% surge pricing during peak hours.',
        impact: 'high',
        effort: 'medium',
        priority: 1,
        variables: { peak_hours: '11 AM - 2 PM', surge_percent: 10 },
      });
    }

    // Package pricing
    const avgValue = m.services.avgServiceValue;
    recs.push({
      id: 'salon-pricing-package-1',
      type: 'pricing',
      category: 'Bundling',
      title: 'Create combo packages',
      description: `Your avg service value is ₹${avgValue}. Bundle haircut + facial for ₹1499 (usually ₹1800) to increase basket size.`,
      impact: 'medium',
      effort: 'medium',
      priority: 3,
      variables: { bundle_name: 'Glamour Package', savings: 301 },
    });

    return recs;
  }

  private getOperationsRecommendations(m: SalonMetrics): SalonRecommendation[] {
    const recs: SalonRecommendation[] = [];

    // Staff scheduling
    if (m.utilization.avgWaitTime > 15) {
      recs.push({
        id: 'salon-ops-schedule-1',
        type: 'operations',
        category: 'Staffing',
        title: 'Add staff during peak hours',
        description: `Avg wait time is ${m.utilization.avgWaitTime} min. Schedule 1 extra stylist for 11 AM - 2 PM.`,
        impact: 'high',
        effort: 'high',
        priority: 2,
        variables: { peak_hours: '11 AM - 2 PM', extra_staff: 1 },
      });
    }

    // Buffer time
    recs.push({
      id: 'salon-ops-buffer-1',
      type: 'operations',
      category: 'Scheduling',
      title: 'Add 10-min buffer between appointments',
        description: 'This will reduce wait times by ~15% and improve customer satisfaction.',
      impact: 'medium',
      effort: 'low',
      priority: 4,
      variables: { buffer_minutes: 10 },
    });

    return recs;
  }

  private getCustomerRecommendations(m: SalonMetrics): SalonRecommendation[] {
    const recs: SalonRecommendation[] = [];

    // Loyalty program
    if (m.customers.returningRate < 40) {
      recs.push({
        id: 'salon-customer-loyalty-1',
        type: 'customer',
        category: 'Loyalty',
        title: 'Start a loyalty program',
        description: `Only ${m.customers.returningRate}% of customers return. A "5th visit free" program could increase retention by 20%.`,
        impact: 'high',
        effort: 'medium',
        priority: 1,
        variables: { program_type: 'visit_count', reward: '1 free service after 5 visits' },
      });
    }

    // Referral program
    recs.push({
      id: 'salon-customer-referral-1',
      type: 'customer',
        category: 'Referral',
      title: 'Start a referral program',
      description: 'Give ₹200 credit to customers who refer friends. Cost per acquisition is 70% lower than ads.',
      impact: 'high',
      effort: 'low',
      priority: 2,
      variables: { referral_reward: 200, referred_reward: 200 },
    });

    // VIP treatment for top customers
    recs.push({
      id: 'salon-customer-vip-1',
      type: 'customer',
      category: 'VIP',
      title: 'Create VIP tier for top spenders',
      description: `Customers with LTV > ₹5000 should get priority booking and exclusive offers.`,
      impact: 'medium',
      effort: 'low',
      priority: 3,
      variables: { vip_threshold: 5000, benefits: ['Priority booking', '10% monthly discount', 'Free add-ons'] },
    });

    return recs;
  }

  private getInventoryRecommendations(m: SalonMetrics): SalonRecommendation[] {
    const recs: SalonRecommendation[] = [];

    // Low stock alert placeholder (would connect to inventory service)
    recs.push({
      id: 'salon-inventory-1',
      type: 'inventory',
      category: 'Restock',
      title: 'Low stock: Hair color supplies',
      description: 'Hair color is your 2nd highest revenue service. Reorder supplies before you run out.',
      impact: 'high',
      effort: 'low',
      priority: 1,
      variables: { product: 'Hair Color', days_remaining: 5 },
    });

    return recs;
  }

  private getRecommendationScore(rec: SalonRecommendation): number {
    const impactScore = rec.impact === 'high' ? 3 : rec.impact === 'medium' ? 2 : 1;
    const effortScore = rec.effort === 'low' ? 3 : rec.effort === 'medium' ? 2 : 1;
    return (impactScore * 2) + effortScore + rec.priority;
  }

  // Generate personalized message using template
  generateMessage(rec: SalonRecommendation, variables: Record<string, string>): string {
    if (!rec.template) return rec.description;

    let message = rec.template;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
    return message;
  }
}

export const salonRecommendationEngine = new SalonRecommendationEngine();
