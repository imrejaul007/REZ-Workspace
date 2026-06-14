/**
 * Salon Health Scorer - Extended metrics for salon industry
 * Extends MerchantHealthScorer with salon-specific KPIs
 */

import axios from 'axios';

const SALON_SERVICE_URL = process.env.SALON_SERVICE_URL || 'http://localhost:4010';
const MERCHANT_SERVICE_URL = process.env.MERCHANT_SERVICE_URL || 'http://localhost:4003';

export interface SalonMetrics {
  // Appointment metrics
  appointments: {
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
    today: number;
    walkIns: number;
    booked: number;
  };

  // Utilization metrics
  utilization: {
    chairUtilizationRate: number;    // % of time chairs are occupied
    peakHourUtilization: number;     // % utilization during peak hours
    offPeakUtilization: number;      // % utilization during off-peak
    avgWaitTime: number;             // minutes
    avgServiceTime: number;          // minutes
  };

  // Service metrics
  services: {
    mostPopular: Array<{ name: string; count: number; revenue: number }>;
    revenueByCategory: Record<string, number>;
    avgServiceValue: number;
    upsellRate: number;              // % of appointments with add-ons
  };

  // Staff metrics
  staff: {
    activeStaff: number;
    avgBookingsPerStylist: number;
    topPerformer: { name: string; services: number; revenue: number } | null;
    commissionTotal: number;
  };

  // Customer metrics
  customers: {
    newThisMonth: number;
    returningRate: number;           // % of customers who return
    noShowRate: number;             // % of appointments missed
    avgVisitsPerCustomer: number;
    lifetimeValue: number;
  };

  // Salon-specific alerts
  alerts: Array<{
    type: 'warning' | 'critical' | 'info';
    category: 'staff' | 'customer' | 'inventory' | 'revenue' | 'utilization';
    message: string;
    recommendation?: string;
  }>;
}

export interface SalonHealthScore {
  overall: number;                  // 0-100
  breakdown: {
    appointmentHealth: number;       // Booking completion rate
    utilizationHealth: number;      // Chair/stylist utilization
    serviceHealth: number;           // Service mix & revenue
    staffHealth: number;            // Staff productivity
    customerHealth: number;         // Retention & satisfaction
  };
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  industryBenchmarks: {
    avgUtilizationRate: number;
    avgNoShowRate: number;
    avgReturningRate: number;
  };
}

// Salon-specific weights (differ from restaurant/retail)
const SALON_WEIGHTS = {
  appointmentHealth: 0.20,
  utilizationHealth: 0.25,
  serviceHealth: 0.20,
  staffHealth: 0.15,
  customerHealth: 0.20,
};

export class SalonHealthScorer {

  async getSalonMetrics(merchantId: string): Promise<SalonMetrics> {
    try {
      // Fetch from salon service
      const salonRes = await axios.get(`${SALON_SERVICE_URL}/api/salons/merchant/${merchantId}/metrics`, {
        timeout: 5000,
      }).catch(() => ({ data: this.getMockSalonMetrics() }));

      return salonRes.data;
    } catch (error) {
      console.error('[SalonHealthScorer] Failed to fetch metrics:', error);
      return this.getMockSalonMetrics();
    }
  }

  async calculateHealthScore(merchantId: string): Promise<SalonHealthScore> {
    const metrics = await this.getSalonMetrics(merchantId);

    // Calculate individual health scores
    const appointmentHealth = this.calculateAppointmentHealth(metrics);
    const utilizationHealth = this.calculateUtilizationHealth(metrics);
    const serviceHealth = this.calculateServiceHealth(metrics);
    const staffHealth = this.calculateStaffHealth(metrics);
    const customerHealth = this.calculateCustomerHealth(metrics);

    // Weighted overall score
    const overall = Math.round(
      appointmentHealth * SALON_WEIGHTS.appointmentHealth +
      utilizationHealth * SALON_WEIGHTS.utilizationHealth +
      serviceHealth * SALON_WEIGHTS.serviceHealth +
      staffHealth * SALON_WEIGHTS.staffHealth +
      customerHealth * SALON_WEIGHTS.customerHealth
    );

    // Determine trend
    const trend = this.calculateTrend(metrics);

    // Risk assessment
    const riskLevel = this.assessRisk(overall, metrics);

    // Generate alerts
    const alerts = this.generateAlerts(metrics, overall);

    return {
      overall,
      breakdown: {
        appointmentHealth: Math.round(appointmentHealth),
        utilizationHealth: Math.round(utilizationHealth),
        serviceHealth: Math.round(serviceHealth),
        staffHealth: Math.round(staffHealth),
        customerHealth: Math.round(customerHealth),
      },
      trend,
      riskLevel,
      industryBenchmarks: {
        avgUtilizationRate: 65,      // Industry avg: 65%
        avgNoShowRate: 12,          // Industry avg: 12%
        avgReturningRate: 45,       // Industry avg: 45%
      },
    };
  }

  private calculateAppointmentHealth(m: SalonMetrics): number {
    // Lower no-show = higher health
    const noShowPenalty = m.customers.noShowRate * 5;  // 10% no-show = 50 penalty
    const completionRate = (m.appointments.booked / Math.max(m.appointments.booked + m.appointments.walkIns, 1)) * 100;

    return Math.max(0, Math.min(100, 100 - noShowPenalty + (completionRate * 0.1)));
  }

  private calculateUtilizationHealth(m: SalonMetrics): number {
    const utilizationScore = m.utilization.chairUtilizationRate;
    const waitPenalty = Math.max(0, (m.utilization.avgWaitTime - 15) * 2);  // >15min wait = penalty

    return Math.max(0, Math.min(100, utilizationScore - waitPenalty));
  }

  private calculateServiceHealth(m: SalonMetrics): number {
    const revenueGrowth = m.appointments.thisMonth > 0
      ? ((m.appointments.thisMonth - m.appointments.lastMonth) / m.appointments.lastMonth) * 100
      : 0;

    const upsellBonus = m.services.upsellRate * 2;  // Bonus for upsells

    return Math.max(0, Math.min(100, 70 + revenueGrowth + upsellBonus));
  }

  private calculateStaffHealth(m: SalonMetrics): number {
    if (m.staff.activeStaff === 0) return 0;

    const avgBookings = m.staff.avgBookingsPerStylist;
    const utilizationScore = Math.min(100, (avgBookings / 6) * 100);  // 6/day = optimal

    return utilizationScore;
  }

  private calculateCustomerHealth(m: SalonMetrics): number {
    const retentionScore = m.customers.returningRate * 1.5;  // Weight retention
    const noShowPenalty = m.customers.noShowRate * 3;

    return Math.max(0, Math.min(100, retentionScore - noShowPenalty));
  }

  private calculateTrend(m: SalonMetrics): 'improving' | 'stable' | 'declining' {
    const weekDiff = m.appointments.thisWeek - m.appointments.lastWeek;
    const monthDiff = m.appointments.thisMonth - m.appointments.lastMonth;

    if (weekDiff > 2 || monthDiff > 10) return 'improving';
    if (weekDiff < -2 || monthDiff < -10) return 'declining';
    return 'stable';
  }

  private assessRisk(overall: number, m: SalonMetrics): 'low' | 'medium' | 'high' | 'critical' {
    if (overall < 30) return 'critical';
    if (overall < 50) return 'high';
    if (overall < 70 || m.customers.noShowRate > 20) return 'medium';
    return 'low';
  }

  private generateAlerts(m: SalonMetrics, overall: number): SalonMetrics['alerts'] {
    const alerts: SalonMetrics['alerts'] = [];

    // High no-show rate
    if (m.customers.noShowRate > 15) {
      alerts.push({
        type: 'warning',
        category: 'customer',
        message: `No-show rate is ${m.customers.noShowRate}% (industry avg: 12%)`,
        recommendation: 'Send WhatsApp reminders 2 hours before appointment',
      });
    }

    // Low utilization
    if (m.utilization.chairUtilizationRate < 50) {
      alerts.push({
        type: 'warning',
        category: 'utilization',
        message: `Chair utilization at ${m.utilization.chairUtilizationRate}%`,
        recommendation: 'Offer 15% off during off-peak hours (2-4 PM)',
      });
    }

    // Long wait times
    if (m.utilization.avgWaitTime > 20) {
      alerts.push({
        type: 'critical',
        category: 'customer',
        message: `Average wait time: ${m.utilization.avgWaitTime} minutes`,
        recommendation: 'Consider adding buffer time or more staff during peak hours',
      });
    }

    // Low returning rate
    if (m.customers.returningRate < 30) {
      alerts.push({
        type: 'warning',
        category: 'customer',
        message: `Only ${m.customers.returningRate}% of customers return`,
        recommendation: 'Start a loyalty program to increase retention',
      });
    }

    // Top performer alert
    if (m.staff.topPerformer) {
      alerts.push({
        type: 'info',
        category: 'staff',
        message: `${m.staff.topPerformer.name} is your top performer this week`,
      });
    }

    return alerts;
  }

  // Mock data for development
  private getMockSalonMetrics(): SalonMetrics {
    return {
      appointments: {
        thisWeek: 142,
        lastWeek: 138,
        thisMonth: 485,
        lastMonth: 462,
        today: 18,
        walkIns: 42,
        booked: 100,
      },
      utilization: {
        chairUtilizationRate: 72,
        peakHourUtilization: 85,
        offPeakUtilization: 45,
        avgWaitTime: 12,
        avgServiceTime: 45,
      },
      services: {
        mostPopular: [
          { name: 'Haircut & Blow Dry', count: 156, revenue: 78000 },
          { name: 'Hair Coloring', count: 45, revenue: 112500 },
          { name: 'Keratin Treatment', count: 28, revenue: 98000 },
        ],
        revenueByCategory: {
          'Hair': 180000,
          'Nails': 45000,
          'Facial': 62000,
          'Spa': 35000,
        },
        avgServiceValue: 850,
        upsellRate: 35,
      },
      staff: {
        activeStaff: 5,
        avgBookingsPerStylist: 5.2,
        topPerformer: { name: 'Priya', services: 32, revenue: 28000 },
        commissionTotal: 85000,
      },
      customers: {
        newThisMonth: 42,
        returningRate: 52,
        noShowRate: 8,
        avgVisitsPerCustomer: 3.2,
        lifetimeValue: 4200,
      },
      alerts: [],
    };
  }
}

export const salonHealthScorer = new SalonHealthScorer();
