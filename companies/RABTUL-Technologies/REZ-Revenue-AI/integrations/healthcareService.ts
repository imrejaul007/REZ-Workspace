/**
 * REZ Revenue AI - Healthcare Integration
 *
 * Connects Healthcare services to REZ Revenue AI
 * Enables consultation fee optimization, diagnostic pricing
 */

import axios from 'axios';

const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';

export class HealthcareRevenueIntegration {
  /**
   * Calculate dynamic consultation fee
   */
  async calculateConsultationFee(params: {
    doctorId: string;
    doctorName: string;
    specialization: string;
    baseFee: number;
    cost: number;
    slot: Date;
    mode: 'in_clinic' | 'teleconsult' | 'home_visit';
    slotsRemaining?: number;
    totalSlots?: number;
    patientId?: string;
    patientSegment?: string;
  }): Promise<{
    originalFee: number;
    dynamicFee: number;
    adjustment: number;
    adjustmentType: string;
    factors: Array<{ name: string; reason: string; contribution: number }>;
  }> {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/pricing/calculate`, {
        context: {
          entity: {
            id: params.doctorId,
            type: 'appointment',
            category: params.specialization,
            vertical: 'clinic',
            name: params.doctorName,
            basePrice: params.baseFee,
            cost: params.cost,
          },
          time: {
            dayOfWeek: params.slot.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            hourOfDay: params.slot.getHours(),
            isPeakHour: this.isPeakHour(params.slot),
            isWeekend: params.slot.getDay() === 0,
          },
          inventory: params.slotsRemaining !== undefined ? {
            slotsRemaining: params.slotsRemaining,
            totalSlots: params.totalSlots,
          } : undefined,
          audience: params.patientId ? {
            userId: params.patientId,
            segment: params.patientSegment as any,
          } : undefined,
        },
      });

      if (response.data.success) {
        const data = response.data.data;
        let dynamicFee = data.finalPrice;

        // Mode adjustments
        if (params.mode === 'home_visit') {
          dynamicFee *= 1.5;
        } else if (params.mode === 'teleconsult') {
          dynamicFee *= 0.8;
        }

        return {
          originalFee: params.baseFee,
          dynamicFee: Math.round(dynamicFee),
          adjustment: data.adjustment,
          adjustmentType: data.adjustmentType,
          factors: data.factors || [],
        };
      }
    } catch (error) {
      console.warn('[RevenueAI] Healthcare pricing failed');
    }

    return this.localFallback(params);
  }

  /**
   * Calculate diagnostic test pricing
   */
  async calculateTestPrice(params: {
    testId: string;
    testName: string;
    category: string;
    basePrice: number;
    cost: number;
    isPackage: boolean;
    patientSegment?: string;
  }): Promise<{
    originalPrice: number;
    dynamicPrice: number;
    adjustment: number;
    factors: Array<{ name: string; reason: string; contribution: number }>;
  }> {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/pricing/calculate`, {
        context: {
          entity: {
            id: params.testId,
            type: 'service',
            category: params.category,
            vertical: 'clinic',
            name: params.testName,
            basePrice: params.basePrice,
            cost: params.cost,
          },
          time: {
            dayOfWeek: new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            hourOfDay: new Date().getHours(),
          },
        },
      });

      if (response.data.success) {
        const data = response.data.data;
        let dynamicPrice = data.finalPrice;

        // Package discount
        if (params.isPackage) {
          dynamicPrice *= 0.85; // 15% off for packages
        }

        return {
          originalPrice: params.basePrice,
          dynamicPrice: Math.round(dynamicPrice),
          adjustment: data.adjustment,
          factors: data.factors || [],
        };
      }
    } catch (error) {
      console.warn('[RevenueAI] Healthcare test pricing failed');
    }

    return {
      originalPrice: params.basePrice,
      dynamicPrice: params.isPackage ? Math.round(params.basePrice * 0.85) : params.basePrice,
      adjustment: params.isPackage ? -15 : 0,
      factors: [],
    };
  }

  /**
   * Get appointment demand forecast
   */
  async getAppointmentForecast(merchantId: string, horizon: 'day' | 'week' = 'week') {
    try {
      const response = await axios.post(`${REVENUE_AI_URL}/api/v1/forecast`, {
        merchantId,
        vertical: 'clinic',
        category: 'appointments',
        location: {},
        horizon,
      }, { timeout: 10000 });

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.warn('[RevenueAI] Healthcare forecast failed');
    }

    return {
      forecasts: [],
      summary: { avgDemand: 70, peakHour: 10 },
    };
  }

  /**
   * Get follow-up cashback
   */
  async getFollowUpCashback(orderValue: number, patientSegment: string) {
    const rates: Record<string, number> = {
      new: 0.10,
      regular: 0.05,
      chronic: 0.15, // Chronic patients - follow-up important
      vip: 0.03,
    };

    const rate = rates[patientSegment] || 0.05;

    return {
      cashbackAmount: Math.round(orderValue * rate),
      cashbackRate: rate,
      reason: patientSegment === 'chronic' ? 'Chronic care follow-up reward' : 'Standard follow-up cashback',
    };
  }

  private isPeakHour(slot: Date): boolean {
    const hour = slot.getHours();
    return [10, 11, 17, 18, 19].includes(hour);
  }

  private localFallback(params: any): any {
    const factors = [];
    let adjustment = 0;

    // Peak hours
    if (this.isPeakHour(params.slot)) {
      factors.push({ name: 'Peak Hours', reason: 'High demand consultation times', contribution: 20 });
      adjustment += 20;
    }

    // Weekend surcharge
    if (params.slot.getDay() === 0) {
      factors.push({ name: 'Sunday', reason: 'Weekend consultation', contribution: 25 });
      adjustment += 25;
    }

    // After hours
    const hour = params.slot.getHours();
    if (hour >= 20 || hour < 8) {
      factors.push({ name: 'After Hours', reason: 'Emergency consultation', contribution: 50 });
      adjustment += 50;
    }

    return {
      originalFee: params.baseFee,
      dynamicFee: Math.round(params.baseFee * (1 + adjustment / 100)),
      adjustment,
      adjustmentType: adjustment > 0 ? 'surge' : 'none',
      factors,
    };
  }
}

export const healthcareRevenue = new HealthcareRevenueIntegration();
export default HealthcareRevenueIntegration;
