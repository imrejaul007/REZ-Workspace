import axios from 'axios';

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:4002';
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4006';
const WAREHOUSE_SERVICE_URL = process.env.WAREHOUSE_SERVICE_URL || 'http://localhost:4007';

export interface Decision {
  decisionId: string;
  itemId: string;
  itemName: string;
  suggestion: string;
  actionLevel: 'SAFE' | 'SEMI_SAFE' | 'WARNING' | 'DANGER';
  confidence: number;
  reasoning: string;
  timestamp: Date;
}

export class DecisionEngine {
  async generateDecisions(merchantId: string): Promise<Decision[]> {
    const decisions: Decision[] = [];

    try {
      // Get inventory levels and sales velocity
      const inventoryData = await this.getInventoryData(merchantId);
      const salesData = await this.getSalesVelocity(merchantId);
      const demandForecast = await this.getDemandForecast(merchantId);

      // Generate reorder decisions
      for (const item of inventoryData.lowStockItems) {
        const salesVelocity = salesData[item.id] || { weekly: 0, trend: 'stable' };
        const forecast = demandForecast[item.id] || { nextWeek: 0, confidence: 0 };

        const actionLevel = this.calculateActionLevel(
          item.currentStock,
          item.reorderPoint,
          salesVelocity.weekly,
          forecast.nextWeek
        );

        decisions.push({
          decisionId: `dec_${item.id}_${Date.now()}`,
          itemId: item.id,
          itemName: item.name,
          suggestion: this.generateReorderSuggestion(item, salesVelocity, forecast),
          actionLevel,
          confidence: forecast.confidence,
          reasoning: this.generateReorderReasoning(item, salesVelocity, forecast),
          timestamp: new Date(),
        });
      }

      // Generate pricing decisions
      const pricingDecisions = await this.generatePricingDecisions(merchantId);
      decisions.push(...pricingDecisions);

      // Generate staffing recommendations
      const staffingDecisions = await this.generateStaffingDecisions(merchantId);
      decisions.push(...staffingDecisions);

    } catch (error) {
      console.error('Failed to generate decisions', error);
    }

    return decisions.sort((a, b) => {
      const levelOrder = { DANGER: 0, WARNING: 1, SEMI_SAFE: 2, SAFE: 3 };
      return levelOrder[a.actionLevel] - levelOrder[b.actionLevel];
    });
  }

  private async getInventoryData(merchantId: string): Promise<{
    lowStockItems: Array<{
      id: string;
      name: string;
      currentStock: number;
      reorderPoint: number;
      maxStock: number;
      leadTime: number;
    }>;
  }> {
    try {
      const response = await axios.get(`${CATALOG_SERVICE_URL}/api/inventory/low-stock`, {
        params: { merchantId },
      });
      return response.data;
    } catch {
      return { lowStockItems: [] };
    }
  }

  private async getSalesVelocity(merchantId: string): Promise<Record<string, {
    weekly: number;
    monthly: number;
    trend: 'up' | 'stable' | 'down';
    peakHours: string[];
  }>> {
    try {
      const response = await axios.get(`${ORDER_SERVICE_URL}/api/analytics/sales-velocity`, {
        params: { merchantId, period: '30d' },
      });
      return response.data.velocity || {};
    } catch {
      return {};
    }
  }

  private async getDemandForecast(merchantId: string): Promise<Record<string, {
    nextWeek: number;
    confidence: number;
    trend: 'up' | 'stable' | 'down';
  }>> {
    try {
      const response = await axios.get(`${ORDER_SERVICE_URL}/api/analytics/forecast`, {
        params: { merchantId, horizon: '7d' },
      });
      return response.data.forecasts || {};
    } catch {
      return {};
    }
  }

  private calculateActionLevel(
    currentStock: number,
    reorderPoint: number,
    weeklyVelocity: number,
    forecastNextWeek: number
  ): 'SAFE' | 'SEMI_SAFE' | 'WARNING' | 'DANGER' {
    // Days of stock remaining
    const daysOfStock = weeklyVelocity > 0
      ? currentStock / (weeklyVelocity / 7)
      : 999;

    // Recommended stock (7 days + buffer)
    const recommendedStock = forecastNextWeek * 1.2;

    if (currentStock <= reorderPoint * 0.5 || daysOfStock < 1) {
      return 'DANGER';
    }
    if (currentStock <= reorderPoint || daysOfStock < 3) {
      return 'WARNING';
    }
    if (currentStock < recommendedStock || daysOfStock < 5) {
      return 'SEMI_SAFE';
    }
    return 'SAFE';
  }

  private generateReorderSuggestion(
    item,
    velocity,
    forecast: unknown
  ): string {
    const suggestedQty = Math.ceil(forecast.nextWeek * 1.3); // 30% buffer
    return `Order ${suggestedQty} units (${velocity.trend} demand)`;
  }

  private generateReorderReasoning(
    item,
    velocity,
    forecast: unknown
  ): string {
    let reasoning = '';

    if (velocity.trend === 'up') {
      reasoning += 'Demand is increasing. ';
    } else if (velocity.trend === 'down') {
      reasoning += 'Demand is decreasing. ';
    }

    reasoning += `Current stock: ${item.currentStock} units. `;
    reasoning += `Weekly velocity: ${velocity.weekly} units. `;
    reasoning += `Forecast next week: ${forecast.nextWeek} units.`;

    return reasoning;
  }

  private async generatePricingDecisions(merchantId: string): Promise<Decision[]> {
    const decisions: Decision[] = [];

    try {
      const response = await axios.get(`${CATALOG_SERVICE_URL}/api/products/pricing-opportunities`, {
        params: { merchantId },
      });

      const opportunities = response.data.opportunities || [];

      for (const opp of opportunities.slice(0, 3)) {
        decisions.push({
          decisionId: `dec_pricing_${opp.itemId}_${Date.now()}`,
          itemId: opp.itemId,
          itemName: opp.itemName,
          suggestion: opp.suggestion,
          actionLevel: 'SEMI_SAFE',
          confidence: opp.confidence || 0.7,
          reasoning: opp.reasoning,
          timestamp: new Date(),
        });
      }
    } catch {
      // Ignore pricing errors
    }

    return decisions;
  }

  private async generateStaffingDecisions(merchantId: string): Promise<Decision[]> {
    const decisions: Decision[] = [];

    try {
      const response = await axios.get(`${ORDER_SERVICE_URL}/api/analytics/staffing-insights`, {
        params: { merchantId },
      });

      const insights = response.data.insights || [];

      for (const insight of insights) {
        decisions.push({
          decisionId: `dec_staffing_${Date.now()}`,
          itemId: 'staffing',
          itemName: 'Staffing Recommendation',
          suggestion: insight.suggestion,
          actionLevel: insight.priority === 'high' ? 'WARNING' : 'SEMI_SAFE',
          confidence: insight.confidence || 0.6,
          reasoning: insight.reasoning,
          timestamp: new Date(),
        });
      }
    } catch {
      // Ignore staffing errors
    }

    return decisions;
  }

  async recordFeedback(
    decisionId: string,
    feedback: {
      outcome: 'accepted' | 'rejected' | 'modified';
      actualValue?: number;
      reason?: string;
    }
  ): Promise<void> {
    try {
      await axios.post(`${ORDER_SERVICE_URL}/api/decisions/feedback`, {
        decisionId,
        ...feedback,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to record decision feedback', error);
    }
  }
}

export const decisionEngine = new DecisionEngine();
