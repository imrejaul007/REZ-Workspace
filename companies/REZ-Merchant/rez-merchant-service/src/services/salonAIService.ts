/**
 * Salon AI Service
 *
 * Extends AI Service with salon-specific AI capabilities:
 * - Stylist matching based on customer preferences
 * - Service recommendations based on hair/skin profile
 * - Appointment slot optimization
 * - Service duration prediction
 * - Shares churn/LTV models from base AI service
 */

import axios from 'axios';
import { logger } from '../config/logger';
import { aiService } from './aiService';

// ── Salon-Specific Types ─────────────────────────────────────────────────────────

export interface StylistMatch {
  stylistId: string;
  stylistName: string;
  matchScore: number;
  specialties: string[];
  availability: 'high' | 'medium' | 'low';
  distance?: number;
  reasons: string[];
}

export interface ServiceRecommendation {
  serviceId: string;
  serviceName: string;
  category: string;
  confidence: number;
  reason: string;
  estimatedDuration: number;
  price: number;
  prerequisites?: string[];
}

export interface AppointmentSlot {
  startTime: Date;
  endTime: Date;
  stylistId?: string;
  available: boolean;
  serviceFit: number;
}

export interface ServiceDurationPrediction {
  serviceId: string;
  serviceName: string;
  baseDuration: number;
  adjustedDuration: number;
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
}

// ── Service Class ─────────────────────────────────────────────────────────────────

export class SalonAIService {
  private mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:4001';
  private baseService = aiService;

  /**
   * Get stylist matching for a customer
   */
  async matchStylist(
    customerId: string,
    options?: {
      serviceId?: string;
      preferredStylistIds?: string[];
      location?: { lat: number; lng: number };
    }
  ): Promise<StylistMatch[]> {
    try {
      const res = await axios.post(
        `${this.mlUrl}/api/salon/stylist-match`,
        { customerId, ...options },
        { timeout: 5000 }
      );
      return res.data.matches || [];
    } catch (error) {
      logger.error('[SalonAIService] matchStylist failed:', {
        customerId,
        error: error.message,
      });
      // Fallback to local matching
      return this.localStylistMatch(customerId, options);
    }
  }

  /**
   * Get service recommendations for a customer
   */
  async getServiceRecommendations(
    customerId: string,
    context?: {
      lastServices?: string[];
      budget?: { min: number; max: number };
      occasion?: string;
    }
  ): Promise<ServiceRecommendation[]> {
    try {
      const res = await axios.post(
        `${this.mlUrl}/api/salon/service-recommendations`,
        { customerId, context },
        { timeout: 5000 }
      );
      return res.data.recommendations || [];
    } catch (error) {
      logger.error('[SalonAIService] getServiceRecommendations failed:', {
        customerId,
        error: error.message,
      });
      // Fallback to rule-based recommendations
      return this.localServiceRecommendations(customerId, context);
    }
  }

  /**
   * Predict optimal appointment slots
   */
  async getOptimalSlots(
    merchantId: string,
    serviceIds: string[],
    date: Date,
    preferences?: {
      preferredTimeRange?: { start: string; end: string };
      preferredStylistIds?: string[];
    }
  ): Promise<AppointmentSlot[]> {
    try {
      const res = await axios.post(
        `${this.mlUrl}/api/salon/optimal-slots`,
        { merchantId, serviceIds, date, preferences },
        { timeout: 5000 }
      );
      return res.data.slots || [];
    } catch (error) {
      logger.error('[SalonAIService] getOptimalSlots failed:', {
        merchantId,
        error: error.message,
      });
      // Return default slots
      return this.generateDefaultSlots(date);
    }
  }

  /**
   * Predict service duration based on customer and service factors
   */
  async predictDuration(
    serviceId: string,
    customerId?: string,
    options?: {
      hairLength?: string;
      hairThickness?: string;
      previousServices?: string[];
    }
  ): Promise<ServiceDurationPrediction> {
    try {
      const res = await axios.post(
        `${this.mlUrl}/api/salon/duration-predict`,
        { serviceId, customerId, options },
        { timeout: 5000 }
      );
      return res.data;
    } catch (error) {
      logger.error('[SalonAIService] predictDuration failed:', {
        serviceId,
        error: error.message,
      });
      // Return default duration
      return this.estimateDefaultDuration(serviceId, options);
    }
  }

  // ── Shared Base AI Service Methods ──────────────────────────────────────────────

  /**
   * Get churn prediction (delegates to base AI service)
   */
  async getChurnRisk(customerId: string): Promise<unknown> {
    return this.baseService.getChurnRisk(customerId);
  }

  /**
   * Get customer lifetime value prediction (delegates to base AI service)
   */
  async getCustomerLTV(customerId: string): Promise<unknown> {
    return this.baseService.getCustomerLTV(customerId);
  }

  /**
   * Get personalized recommendations (delegates to base AI service)
   */
  async getRecommendations(customerId: string, context): Promise<unknown> {
    return this.baseService.getRecommendations(customerId, context);
  }

  /**
   * Get fraud risk (delegates to base AI service)
   */
  async getFraudRisk(orderId: string): Promise<unknown> {
    return this.baseService.getFraudRisk(orderId);
  }

  // ── Salon-Specific Analytics ───────────────────────────────────────────────────

  /**
   * Predict no-show probability for appointment
   */
  async predictNoShowRisk(
    customerId: string,
    appointmentTime: Date
  ): Promise<{ risk: 'low' | 'medium' | 'high'; score: number; factors: string[] }> {
    try {
      const res = await axios.post(
        `${this.mlUrl}/api/salon/noshow-predict`,
        { customerId, appointmentTime },
        { timeout: 5000 }
      );
      return res.data;
    } catch (error) {
      logger.warn('[SalonAIService] predictNoShowRisk ML call failed, using default');
      return { risk: 'low', score: 0.2, factors: ['No ML model available'] };
    }
  }

  /**
   * Recommend pricing for new service
   */
  async suggestServicePricing(
    merchantId: string,
    serviceDetails: {
      name: string;
      category: string;
      duration: number;
      cost: number;
      competitorPrices?: number[];
    }
  ): Promise<{ suggestedPrice: number; confidence: number; strategy: string }> {
    try {
      const res = await axios.post(
        `${this.mlUrl}/api/salon/pricing-suggest`,
        { merchantId, serviceDetails },
        { timeout: 5000 }
      );
      return res.data;
    } catch (error) {
      logger.warn('[SalonAIService] suggestServicePricing ML call failed, using cost-plus');
      const markup = 2.5;
      return {
        suggestedPrice: Math.round(serviceDetails.cost * markup),
        confidence: 0.5,
        strategy: 'cost-plus',
      };
    }
  }

  /**
   * Analyze service combination popularity
   */
  async analyzeServiceCombinations(
    merchantId: string,
    topN: number = 10
  ): Promise<Array<{ services: string[]; frequency: number; avgTicket: number }>> {
    try {
      const res = await axios.get(
        `${this.mlUrl}/api/salon/service-combinations`,
        { params: { merchantId, topN }, timeout: 5000 }
      );
      return res.data.combinations || [];
    } catch (error) {
      logger.warn('[SalonAIService] analyzeServiceCombinations ML call failed');
      return [];
    }
  }

  /**
   * Predict busy periods for staffing optimization
   */
  async predictBusyPeriods(
    merchantId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<Array<{ date: string; hour: number; predictedDemand: number; confidence: number }>> {
    try {
      const res = await axios.post(
        `${this.mlUrl}/api/salon/busy-periods`,
        { merchantId, dateRange },
        { timeout: 5000 }
      );
      return res.data.periods || [];
    } catch (error) {
      logger.warn('[SalonAIService] predictBusyPeriods ML call failed');
      return [];
    }
  }

  // ── Local Fallback Methods ──────────────────────────────────────────────────────

  /**
   * Local stylist matching (fallback when ML service unavailable)
   */
  private localStylistMatch(
    customerId: string,
    options?: {
      serviceId?: string;
      preferredStylistIds?: string[];
      location?: { lat: number; lng: number };
    }
  ): StylistMatch[] {
    // Return empty matches - actual implementation would query stylist data
    logger.info('[SalonAIService] Using local stylist match fallback');
    return [];
  }

  /**
   * Local service recommendations (fallback)
   */
  private localServiceRecommendations(
    customerId: string,
    context?: {
      lastServices?: string[];
      budget?: { min: number; max: number };
      occasion?: string;
    }
  ): ServiceRecommendation[] {
    // Return popular services as fallback
    return [
      {
        serviceId: 'haircut',
        serviceName: 'Haircut & Styling',
        category: 'hair',
        confidence: 0.7,
        reason: 'Popular service',
        estimatedDuration: 45,
        price: 500,
      },
      {
        serviceId: 'color',
        serviceName: 'Hair Coloring',
        category: 'color',
        confidence: 0.6,
        reason: 'Frequently booked',
        estimatedDuration: 120,
        price: 2000,
      },
    ];
  }

  /**
   * Generate default appointment slots
   */
  private generateDefaultSlots(date: Date): AppointmentSlot[] {
    const slots: AppointmentSlot[] = [];
    const startHour = 9;
    const endHour = 20;

    for (let hour = startHour; hour < endHour; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + 30);

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available: Math.random() > 0.3, // Simulated availability
        serviceFit: 0.8,
      });
    }

    return slots;
  }

  /**
   * Estimate default duration
   */
  private estimateDefaultDuration(
    serviceId: string,
    options?: {
      hairLength?: string;
      hairThickness?: string;
      previousServices?: string[];
    }
  ): ServiceDurationPrediction {
    const baseDurations: Record<string, number> = {
      haircut: 30,
      color: 90,
      highlights: 120,
      perm: 150,
      treatment: 45,
      manicure: 30,
      pedicure: 45,
      facial: 60,
    };

    const baseDuration = baseDurations[serviceId] || 30;
    let adjustedDuration = baseDuration;
    const factors: ServiceDurationPrediction['factors'] = [];

    if (options?.hairLength === 'long') {
      adjustedDuration += 15;
      factors.push({ name: 'hair_length', impact: 15, description: 'Long hair adds time' });
    }
    if (options?.hairThickness === 'thick') {
      adjustedDuration += 20;
      factors.push({ name: 'hair_thickness', impact: 20, description: 'Thick hair requires more processing' });
    }

    return {
      serviceId,
      serviceName: 'Service',
      baseDuration,
      adjustedDuration,
      factors,
    };
  }
}

// ── Singleton Export ─────────────────────────────────────────────────────────────

export const salonAIService = new SalonAIService();
export default salonAIService;
