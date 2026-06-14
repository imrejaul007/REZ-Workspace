/**
 * Restaurant Recommendation Engine
 * Generates restaurant-specific AI recommendations
 */

import { RestaurantMetrics } from './restaurantHealthScorer';

export interface RestaurantRecommendation {
  id: string;
  type: 'marketing' | 'pricing' | 'operations' | 'menu' | 'customer';
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  template?: string;
  variables?: Record<string, unknown>;
  recommendations?: string[];
}

export class RestaurantRecommendationEngine {
  async generateRecommendations(
    merchantId: string,
    metrics: RestaurantMetrics
  ): Promise<RestaurantRecommendation[]> {
    const recommendations: RestaurantRecommendation[] = [];

    // Menu recommendations
    recommendations.push(...this.getMenuRecommendations(metrics));

    // Table recommendations
    recommendations.push(...this.getTableRecommendations(metrics));

    // Customer recommendations
    recommendations.push(...this.getCustomerRecommendations(metrics));

    // Marketing recommendations
    recommendations.push(...this.getMarketingRecommendations(metrics));

    // Operations recommendations
    recommendations.push(...this.getOperationsRecommendations(metrics));

    return recommendations.sort((a, b) => {
      const scoreA = this.getScore(a);
      const scoreB = this.getScore(b);
      return scoreB - scoreA;
    });
  }

  private getMenuRecommendations(m: RestaurantMetrics): RestaurantRecommendation[] {
    const recs: RestaurantRecommendation[] = [];

    // Remove low performers
    if (m.menu.lowPerformers.length > 0) {
      recs.push({
        id: 'rest-menu-low-1',
        type: 'menu',
        category: 'Optimization',
        title: `${m.menu.lowPerformers.length} menu items underperforming`,
        description: `Consider removing or promoting: ${m.menu.lowPerformers.map(i => i.name).join(', ')}`,
        impact: 'high',
        effort: 'low',
        priority: 1,
      });
    }

    // Highlight popular items
    if (m.menu.popularItems.length > 0) {
      recs.push({
        id: 'rest-menu-pop-1',
        type: 'menu',
        category: 'Bundling',
        title: `Bundle ${m.menu.popularItems[0].name} with sides`,
        description: 'Your #1 dish. Increase basket size by pairing with beverages or desserts.',
        impact: 'medium',
        effort: 'low',
        priority: 2,
        template: 'Add a drink + dessert combo with {item} and save 15%!',
        variables: { item: m.menu.popularItems[0].name },
      });
    }

    return recs;
  }

  private getTableRecommendations(m: RestaurantMetrics): RestaurantRecommendation[] {
    const recs: RestaurantRecommendation[] = [];

    // Improve turnover
    if (m.tables.turnoverRate < 3) {
      recs.push({
        id: 'rest-table-1',
        type: 'operations',
        category: 'Turnover',
        title: 'Boost table turnover',
        description: `Current turnover: ${m.tables.turnoverRate}x. Industry avg: 3.5x`,
        impact: 'high',
        effort: 'medium',
        priority: 1,
        recommendations: [
          'Offer express lunch menu for quicker service',
          'Pre-bill during dessert to speed up payment',
          'Train staff for faster table clearing',
        ],
      });
    }

    // Peak hour optimization
    if (m.tables.peakHourOccupancy > 90) {
      recs.push({
        id: 'rest-table-2',
        type: 'pricing',
        category: 'Surge',
        title: 'Implement peak pricing',
        description: `${m.tables.peakHourOccupancy}% full during peak hours. Consider 10% surcharge.`,
        impact: 'high',
        effort: 'low',
        priority: 2,
      });
    }

    return recs;
  }

  private getCustomerRecommendations(m: RestaurantMetrics): RestaurantRecommendation[] {
    const recs: RestaurantRecommendation[] = [];

    // No-show prevention
    if (m.customers.noShowRate > 5) {
      recs.push({
        id: 'rest-customer-1',
        type: 'customer',
        category: 'No-Show',
        title: `Reduce no-show rate (currently ${m.customers.noShowRate}%)`,
        description: 'No-shows cost revenue and table time.',
        impact: 'high',
        effort: 'medium',
        priority: 1,
        template: 'Reminder: Your table at {restaurant} is reserved for {time}. Reply YES to confirm or R to reschedule.',
      });
    }

    // Win-back lapsed customers
    recs.push({
      id: 'rest-customer-2',
      type: 'marketing',
      category: 'Win-Back',
      title: 'Re-engage lapsed customers',
      description: 'Customers who haven\'t visited in 30+ days.',
      impact: 'high',
      effort: 'low',
      priority: 2,
      template: 'Hey {name}! It\'s been a while. Here\'s 20% off your next visit - valid this week only!',
    });

    // Birthday campaign
    recs.push({
      id: 'rest-customer-3',
      type: 'marketing',
      category: 'Retention',
      title: 'Birthday specials',
      description: 'Free dessert or drink on birthday.',
      impact: 'medium',
      effort: 'low',
      priority: 3,
      template: 'Happy Birthday! 🎂 Enjoy a FREE dessert at {restaurant} this week. Just show us this message!',
    });

    return recs;
  }

  private getMarketingRecommendations(m: RestaurantMetrics): RestaurantRecommendation[] {
    const recs: RestaurantRecommendation[] = [];

    // Off-peak promotion
    if (m.tables.turnoverRate < 3) {
      recs.push({
        id: 'rest-market-1',
        type: 'marketing',
        category: 'Off-Peak',
        title: 'Fill slow hours',
        description: '2-4 PM typically has empty tables. Offer 25% off.',
        impact: 'high',
        effort: 'low',
        priority: 1,
        template: 'Afternoon special! 25% off all mains from 2-4 PM. Perfect for a relaxed lunch!',
      });
    }

    // Happy hour
    recs.push({
      id: 'rest-market-2',
      type: 'marketing',
      category: 'Happy Hour',
      title: 'Start happy hour',
      description: 'Drinks 50% off from 5-7 PM increases footfall.',
      impact: 'medium',
      effort: 'low',
      priority: 3,
    });

    return recs;
  }

  private getOperationsRecommendations(m: RestaurantMetrics): RestaurantRecommendation[] {
    const recs: RestaurantRecommendation[] = [];

    // Staffing
    if (m.staff.avgPrepTime > 20) {
      recs.push({
        id: 'rest-ops-1',
        type: 'operations',
        category: 'Kitchen',
        title: `Reduce prep time (currently ${m.staff.avgPrepTime} min)`,
        description: 'Longer prep = longer wait = lower satisfaction.',
        impact: 'medium',
        effort: 'medium',
        priority: 2,
        recommendations: [
          'Pre-prep ingredients during slow periods',
          'Invest in better equipment',
          'Cross-train kitchen staff',
        ],
      });
    }

    return recs;
  }

  private getScore(rec: RestaurantRecommendation): number {
    const impactScore = rec.impact === 'high' ? 3 : rec.impact === 'medium' ? 2 : 1;
    const effortScore = rec.effort === 'low' ? 3 : rec.effort === 'medium' ? 2 : 1;
    return (impactScore * 2) + effortScore + (5 - rec.priority);
  }
}

export const restaurantRecommendationEngine = new RestaurantRecommendationEngine();
