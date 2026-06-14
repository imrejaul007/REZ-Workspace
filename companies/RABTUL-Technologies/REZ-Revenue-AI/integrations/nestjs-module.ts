/**
 * REZ Revenue AI - NestJS Module for Restaurant Hub
 *
 * This module can be imported into Restaurant Hub to enable dynamic pricing.
 *
 * Usage in Restaurant Hub:
 *
 * import { RevenueAIModule } from '@rez/revenue-ai-nestjs';
 *
 * @Module({
 *   imports: [RevenueAIModule],
 * })
 * export class AppModule {}
 */

import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

// Configuration
const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';
const REVENUE_AGENT_URL = process.env.REVENUE_AGENT_URL || 'http://localhost:4330';

// Providers
export const REVENUE_AI_PROVIDER = 'REVENUE_AI_SERVICE';
export const REVENUE_AGENT_PROVIDER = 'REVENUE_AGENT_SERVICE';

@Global()
@Module({
  imports: [
    HttpModule.register({
      baseURL: REVENUE_AI_URL,
      timeout: 10000,
    }),
  ],
  providers: [
    {
      provide: REVENUE_AI_PROVIDER,
      useFactory: () => ({
        baseUrl: REVENUE_AI_URL,
      }),
    },
    {
      provide: REVENUE_AGENT_PROVIDER,
      useFactory: () => ({
        baseUrl: REVENUE_AGENT_URL,
      }),
    },
  ],
  exports: [REVENUE_AI_PROVIDER, REVENUE_AGENT_PROVIDER, HttpModule],
})
export class RevenueAIModule {}

// ============================================================
// Revenue AI Service - Inject into your services
// ============================================================

/**
 * Example usage in OrderService:
 *
 * import { Inject } from '@nestjs/common';
 * import { REVENUE_AI_PROVIDER } from '@rez/revenue-ai-nestjs';
 *
 * @Injectable()
 * export class OrderService {
 *   constructor(
 *     @Inject(REVENUE_AI_PROVIDER) private revenueAI: any,
 *   ) {}
 *
 *   async calculateItemPrice(item: MenuItem, context: PricingContext) {
 *     return this.revenueAI.calculatePrice(item, context);
 *   }
 * }
 */

// ============================================================
// TypeScript Interfaces
// ============================================================

export interface PricingContext {
  time: Date;
  tablesRemaining?: number;
  totalTables?: number;
  customerId?: string;
  customerSegment?: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
  city?: string;
  tier?: 1 | 2 | 3;
}

export interface DynamicPrice {
  originalPrice: number;
  dynamicPrice: number;
  adjustment: number;
  adjustmentType: 'surge' | 'discount' | 'loyalty' | 'bundle' | 'time_based' | 'none';
  factors: Array<{
    name: string;
    reason: string;
    contribution: number;
  }>;
  alternatives?: Array<{
    label: string;
    price: number;
  }>;
}

export interface DemandForecast {
  peakHour: number;
  avgDailyDemand: number;
  peakDay: string;
  staffingRecommendation: {
    morning: number;
    evening: number;
  };
}

export interface CashbackResult {
  cashbackAmount: number;
  cashbackRate: number;
  reason: string;
}

export interface BenchmarkScore {
  overallScore: number;
  percentile: string;
  letterGrade: string;
  breakdown: Array<{
    metric: string;
    score: number;
    categoryRank: string;
  }>;
}

// ============================================================
// NestJS Service Template
// ============================================================

/**
 * Copy this into your Restaurant Hub service:
 */

export const REVENUE_AI_SERVICE_TEMPLATE = `
import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class RevenueAIService {
  private readonly baseUrl = process.env.REVENUE_AI_URL || 'http://localhost:4301';

  constructor(private readonly http: HttpService) {}

  /**
   * Calculate dynamic price for menu item
   */
  async calculatePrice(params: {
    entityId: string;
    entityName: string;
    category: string;
    basePrice: number;
    cost: number;
    time: Date;
    tablesRemaining?: number;
    totalTables?: number;
    customerSegment?: string;
  }): Promise<DynamicPrice> {
    try {
      const response = await firstValueFrom(
        this.http.post(\`\${this.baseUrl}/api/v1/pricing/calculate\`, {
          context: {
            entity: {
              id: params.entityId,
              type: 'product',
              category: params.category,
              vertical: 'restaurant',
              name: params.entityName,
              basePrice: params.basePrice,
              cost: params.cost,
            },
            time: {
              dayOfWeek: params.time.getDay(),
              hourOfDay: params.time.getHours(),
              isPeakHour: this.isPeakHour(params.time),
              isWeekend: params.time.getDay() === 0 || params.time.getDay() === 6,
            },
            inventory: params.tablesRemaining !== undefined ? {
              slotsRemaining: params.tablesRemaining,
              totalSlots: params.totalTables,
            } : undefined,
            audience: params.customerSegment ? {
              segment: params.customerSegment,
            } : undefined,
          },
        }).pipe(map(res => res.data))
      );

      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.warn('[RevenueAI] Pricing failed, using fallback');
    }

    return this.localFallback(params);
  }

  /**
   * Get demand forecast
   */
  async getForecast(merchantId: string): Promise<DemandForecast> {
    try {
      const response = await firstValueFrom(
        this.http.post(\`\${this.baseUrl}/api/v1/forecast\`, {
          merchantId,
          vertical: 'restaurant',
          category: 'general',
          location: {},
          horizon: 'week',
        }).pipe(map(res => res.data))
      );

      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.warn('[RevenueAI] Forecast failed');
    }

    return {
      peakHour: 19,
      avgDailyDemand: 60,
      peakDay: 'Saturday',
      staffingRecommendation: { morning: 4, evening: 7 },
    };
  }

  /**
   * Get optimal cashback
   */
  async getCashback(params: {
    merchantId: string;
    customerId: string;
    orderValue: number;
    segment: string;
  }): Promise<CashbackResult> {
    const rates: Record<string, number> = {
      new: 0.15,
      regular: 0.05,
      vip: 0.03,
      at_risk: 0.15,
      dormant: 0.10,
    };

    const rate = rates[params.segment] || 0.05;

    return {
      cashbackAmount: Math.round(params.orderValue * rate),
      cashbackRate: rate,
      reason: 'Standard rate',
    };
  }

  /**
   * Chat with Revenue Agent
   */
  async chat(merchantId: string, message: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.post('http://localhost:4330/api/v1/agent/chat', {
          merchantId,
          message,
        }).pipe(map(res => res.data))
      );

      if (response.success) {
        return response.data.response;
      }
    } catch (error) {
      console.error('[RevenueAI] Chat failed');
    }

    return 'Sorry, I had trouble processing that.';
  }

  private isPeakHour(time: Date): boolean {
    const hour = time.getHours();
    return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
  }

  private localFallback(params: any): DynamicPrice {
    const factors = [];
    let adjustment = 0;

    if (this.isPeakHour(params.time)) {
      factors.push({ name: 'Peak Hour', reason: 'Dinner rush', contribution: 15 });
      adjustment += 15;
    }

    if (params.time.getDay() === 5 || params.time.getDay() === 6) {
      factors.push({ name: 'Weekend', reason: 'Weekend pricing', contribution: 10 });
      adjustment += 10;
    }

    return {
      originalPrice: params.basePrice,
      dynamicPrice: Math.round(params.basePrice * (1 + adjustment / 100)),
      adjustment,
      adjustmentType: adjustment > 0 ? 'surge' : 'none',
      factors,
    };
  }
}
`;
