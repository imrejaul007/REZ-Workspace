import axios from 'axios';

const MERCHANT_SERVICE_URL = process.env.MERCHANT_SERVICE_URL || 'http://localhost:4003';

export interface CompetitorAnalysis {
  competitors: Array<{
    id: string;
    name: string;
    rating: number;
    priceLevel: 'low' | 'medium' | 'high';
    distanceKm: number;
    similarity: number;
  }>;
  priceGap: number;
  ratingGap: number;
  marketShare: number;
  insights: Array<{
    type: string;
    message: string;
  }>;
}

export class CompetitorAnalyzer {
  async analyzeCompetitors(merchantId: string): Promise<CompetitorAnalysis> {
    try {
      // Get merchant location and category
      const merchantRes = await axios.get(`${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}`);
      const merchant = merchantRes.data;

      if (!merchant.location || !merchant.category) {
        return this.getDefaultAnalysis();
      }

      // Find competitors
      const competitorsRes = await axios.get(`${MERCHANT_SERVICE_URL}/api/merchants/nearby`, {
        params: {
          lat: merchant.location.coordinates[1],
          lng: merchant.location.coordinates[0],
          radiusKm: 5,
          category: merchant.category,
          limit: 5,
        },
      });

      const competitors = competitorsRes.data.merchants || [];

      // Calculate price gap
      const ourPrices = merchant.avgPrice || 0;
      const competitorPrices = competitors.map((c) => c.avgPrice || 0);
      const avgCompetitorPrice = competitorPrices.length > 0
        ? competitorPrices.reduce((a: number, b: number) => a + b, 0) / competitorPrices.length
        : ourPrices;

      const priceGap = ourPrices > 0 && avgCompetitorPrice > 0
        ? ((ourPrices - avgCompetitorPrice) / avgCompetitorPrice) * 100
        : 0;

      // Calculate rating gap
      const ourRating = merchant.rating || 0;
      const avgCompetitorRating = competitors.length > 0
        ? competitors.reduce((sum: number, c) => sum + (c.rating || 0), 0) / competitors.length
        : ourRating;

      const ratingGap = ourRating - avgCompetitorRating;

      // Calculate market share
      const ourOrders = merchant.totalOrders || 0;
      const totalOrders = competitors.reduce((sum: number, c) => sum + (c.totalOrders || 0), 0) + ourOrders;
      const marketShare = totalOrders > 0 ? (ourOrders / totalOrders) * 100 : 0;

      // Determine price level
      const getPriceLevel = (price: number, avg: number): 'low' | 'medium' | 'high' => {
        if (price < avg * 0.8) return 'low';
        if (price > avg * 1.2) return 'high';
        return 'medium';
      };

      // Generate insights
      const insights = [];

      if (priceGap > 15) {
        insights.push({
          type: 'pricing_warning',
          message: `You're priced ${Math.round(priceGap)}% higher than competitors. Consider adjusting prices or adding value.`,
        });
      } else if (priceGap < -15) {
        insights.push({
          type: 'pricing_opportunity',
          message: `You're priced ${Math.abs(Math.round(priceGap))}% lower than competitors. Consider gradual price increase.`,
        });
      }

      if (ratingGap > 0.5) {
        insights.push({
          type: 'competitive_advantage',
          message: `Your rating is ${ratingGap.toFixed(1)} points higher than average. Leverage this in marketing.`,
        });
      } else if (ratingGap < -0.5) {
        insights.push({
          type: 'improvement_needed',
          message: `Your rating is ${Math.abs(ratingGap).toFixed(1)} points lower than competitors. Focus on quality.`,
        });
      }

      return {
        competitors: competitors.map((c) => ({
          id: c._id,
          name: c.name,
          rating: c.rating || 0,
          priceLevel: getPriceLevel(c.avgPrice || 0, avgCompetitorPrice),
          distanceKm: c.distance || 0,
          similarity: c.similarity || 0.8,
        })),
        priceGap: Math.round(priceGap * 10) / 10,
        ratingGap: Math.round(ratingGap * 10) / 10,
        marketShare: Math.round(marketShare * 10) / 10,
        insights,
      };
    } catch (error) {
      console.error('Failed to analyze competitors', error);
      return this.getDefaultAnalysis();
    }
  }

  async getMarketTrends(merchantId: string): Promise<{
    demandIncrease: string[];
    demandDecrease: string[];
    peakHours: string[];
    popularItems: string[];
  }> {
    try {
      const response = await axios.get(`${MERCHANT_SERVICE_URL}/api/trends/local`, {
        params: { merchantId },
      });
      return response.data;
    } catch {
      return {
        demandIncrease: [],
        demandDecrease: [],
        peakHours: ['12:00-14:00', '18:00-21:00'],
        popularItems: [],
      };
    }
  }

  private getDefaultAnalysis(): CompetitorAnalysis {
    return {
      competitors: [],
      priceGap: 0,
      ratingGap: 0,
      marketShare: 0,
      insights: [
        {
          type: 'no_data',
          message: 'Insufficient competitor data available. Keep improving your service!',
        },
      ],
    };
  }
}

export const competitorAnalyzer = new CompetitorAnalyzer();
