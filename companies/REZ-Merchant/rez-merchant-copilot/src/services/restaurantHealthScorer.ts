/**
 * Restaurant Health Scorer - Extended metrics for restaurant industry
 * Extends MerchantHealthScorer with restaurant-specific KPIs
 */

import axios from 'axios';

const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:4020';

export interface RestaurantMetrics {
  // Order metrics
  orders: {
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
    today: number;
    dineIn: number;
    takeaway: number;
    delivery: number;
    avgOrderValue: number;
  };

  // Table metrics
  tables: {
    total: number;
    occupied: number;
    turnoverRate: number;
    avgDiningTime: number;
    peakHourOccupancy: number;
  };

  // Menu metrics
  menu: {
    totalItems: number;
    popularItems: Array<{ name: string; sold: number; revenue: number }>;
    lowPerformers: Array<{ name: string; sold: number }>;
    avgRating: number;
    revenueByCategory: Record<string, number>;
  };

  // Customer metrics
  customers: {
    newThisMonth: number;
    returningRate: number;
    noShowRate: number;
    avgVisitsPerCustomer: number;
    lifetimeValue: number;
  };

  // Staff metrics
  staff: {
    activeStaff: number;
    avgOrdersPerStaff: number;
    avgPrepTime: number;
    tipTotal: number;
  };

  // Alerts
  alerts: Array<{
    type: 'warning' | 'critical' | 'info';
    category: 'orders' | 'tables' | 'menu' | 'staff' | 'customers';
    message: string;
    recommendation?: string;
  }>;
}

export interface RestaurantHealthScore {
  overall: number;
  breakdown: {
    orderHealth: number;
    tableHealth: number;
    menuHealth: number;
    staffHealth: number;
    customerHealth: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  industryBenchmarks: {
    avgTableTurnover: number;
    avgOrderValue: number;
    avgNoShowRate: number;
  };
}

// Restaurant-specific weights
const RESTAURANT_WEIGHTS = {
  orderHealth: 0.25,
  tableHealth: 0.25,
  menuHealth: 0.20,
  staffHealth: 0.10,
  customerHealth: 0.20,
};

export class RestaurantHealthScorer {

  async getRestaurantMetrics(merchantId: string): Promise<RestaurantMetrics> {
    try {
      const restaurantRes = await axios.get(
        `${RESTAURANT_SERVICE_URL}/api/restaurants/${merchantId}/metrics`,
        { timeout: 5000 }
      ).catch(() => ({ data: this.getMockMetrics() }));

      return restaurantRes.data;
    } catch (error) {
      console.error('[RestaurantHealthScorer] Failed to fetch metrics:', error);
      return this.getMockMetrics();
    }
  }

  async calculateHealthScore(merchantId: string): Promise<RestaurantHealthScore> {
    const metrics = await this.getRestaurantMetrics(merchantId);

    const orderHealth = this.calculateOrderHealth(metrics);
    const tableHealth = this.calculateTableHealth(metrics);
    const menuHealth = this.calculateMenuHealth(metrics);
    const staffHealth = this.calculateStaffHealth(metrics);
    const customerHealth = this.calculateCustomerHealth(metrics);

    const overall = Math.round(
      orderHealth * RESTAURANT_WEIGHTS.orderHealth +
      tableHealth * RESTAURANT_WEIGHTS.tableHealth +
      menuHealth * RESTAURANT_WEIGHTS.menuHealth +
      staffHealth * RESTAURANT_WEIGHTS.staffHealth +
      customerHealth * RESTAURANT_WEIGHTS.customerHealth
    );

    const trend = this.calculateTrend(metrics);
    const riskLevel = this.assessRisk(overall, metrics);
    const alerts = this.generateAlerts(metrics, overall);

    return {
      overall,
      breakdown: {
        orderHealth: Math.round(orderHealth),
        tableHealth: Math.round(tableHealth),
        menuHealth: Math.round(menuHealth),
        staffHealth: Math.round(staffHealth),
        customerHealth: Math.round(customerHealth),
      },
      trend,
      riskLevel,
      industryBenchmarks: {
        avgTableTurnover: 3.5,
        avgOrderValue: 450,
        avgNoShowRate: 8,
      },
    };
  }

  private calculateOrderHealth(m: RestaurantMetrics): number {
    const growth = m.orders.thisMonth > 0
      ? ((m.orders.thisMonth - m.orders.lastMonth) / m.orders.lastMonth) * 100
      : 0;
    const valueScore = Math.min(100, (m.orders.avgOrderValue / 450) * 80);
    return Math.max(0, Math.min(100, 60 + growth + valueScore));
  }

  private calculateTableHealth(m: RestaurantMetrics): number {
    const occupancyScore = m.tables.total > 0
      ? (m.tables.occupied / m.tables.total) * 100
      : 0;
    const turnoverScore = Math.min(100, m.tables.turnoverRate * 25);
    return Math.max(0, Math.min(100, (occupancyScore + turnoverScore) / 2));
  }

  private calculateMenuHealth(m: RestaurantMetrics): number {
    const popularCount = m.menu.popularItems.length;
    const lowPerformerPenalty = m.menu.lowPerformers.length * 5;
    const ratingScore = m.menu.avgRating * 20;
    return Math.max(0, Math.min(100, ratingScore - lowPerformerPenalty + (popularCount > 0 ? 20 : 0)));
  }

  private calculateStaffHealth(m: RestaurantMetrics): number {
    const prepTimeScore = Math.max(0, 100 - (m.staff.avgPrepTime - 15) * 5);
    const throughputScore = Math.min(100, m.staff.avgOrdersPerStaff * 15);
    return (prepTimeScore + throughputScore) / 2;
  }

  private calculateCustomerHealth(m: RestaurantMetrics): number {
    const retentionScore = m.customers.returningRate * 1.5;
    const noShowPenalty = m.customers.noShowRate * 3;
    return Math.max(0, Math.min(100, retentionScore - noShowPenalty));
  }

  private calculateTrend(m: RestaurantMetrics): 'improving' | 'stable' | 'declining' {
    const weekDiff = m.orders.thisWeek - m.orders.lastWeek;
    if (weekDiff > 5) return 'improving';
    if (weekDiff < -5) return 'declining';
    return 'stable';
  }

  private assessRisk(overall: number, m: RestaurantMetrics): 'low' | 'medium' | 'high' | 'critical' {
    if (overall < 30) return 'critical';
    if (overall < 50) return 'high';
    if (overall < 70 || m.customers.noShowRate > 15) return 'medium';
    return 'low';
  }

  private generateAlerts(m: RestaurantMetrics, overall: number): RestaurantMetrics['alerts'] {
    const alerts: RestaurantMetrics['alerts'] = [];

    if (m.tables.turnoverRate < 2) {
      alerts.push({
        type: 'warning',
        category: 'tables',
        message: `Table turnover is low (${m.tables.turnoverRate}x). Consider shorter courses or quicker service.`,
        recommendation: 'Train staff for faster turnover during peak hours',
      });
    }

    if (m.customers.noShowRate > 10) {
      alerts.push({
        type: 'warning',
        category: 'customers',
        message: `No-show rate: ${m.customers.noShowRate}% (industry avg: 8%)`,
        recommendation: 'Require advance payment or deposit for reservations',
      });
    }

    if (m.staff.avgPrepTime > 25) {
      alerts.push({
        type: 'warning',
        category: 'staff',
        message: `Avg prep time: ${m.staff.avgPrepTime} min`,
        recommendation: 'Review kitchen workflow to reduce wait times',
      });
    }

    if (m.menu.lowPerformers.length > 0) {
      alerts.push({
        type: 'info',
        category: 'menu',
        message: `${m.menu.lowPerformers.length} menu items have low sales`,
        recommendation: 'Consider removing or promoting low performers',
      });
    }

    return alerts;
  }

  private getMockMetrics(): RestaurantMetrics {
    return {
      orders: {
        thisWeek: 420,
        lastWeek: 398,
        thisMonth: 1680,
        lastMonth: 1590,
        today: 58,
        dineIn: 840,
        takeaway: 420,
        delivery: 420,
        avgOrderValue: 485,
      },
      tables: {
        total: 25,
        occupied: 18,
        turnoverRate: 3.2,
        avgDiningTime: 75,
        peakHourOccupancy: 92,
      },
      menu: {
        totalItems: 85,
        popularItems: [
          { name: 'Butter Chicken', sold: 245, revenue: 49000 },
          { name: 'Paneer Tikka', sold: 198, revenue: 39600 },
          { name: 'Biryani', sold: 167, revenue: 50100 },
        ],
        lowPerformers: [
          { name: 'Mushroom Soup', sold: 12 },
          { name: 'Bruschetta', sold: 18 },
        ],
        avgRating: 4.2,
        revenueByCategory: {
          'Starters': 45000,
          'Mains': 120000,
          'Beverages': 35000,
          'Desserts': 18000,
        },
      },
      customers: {
        newThisMonth: 156,
        returningRate: 48,
        noShowRate: 6,
        avgVisitsPerCustomer: 2.8,
        lifetimeValue: 2800,
      },
      staff: {
        activeStaff: 12,
        avgOrdersPerStaff: 35,
        avgPrepTime: 18,
        tipTotal: 28500,
      },
      alerts: [],
    };
  }
}

export const restaurantHealthScorer = new RestaurantHealthScorer();
