/**
 * PROPFLOW - Pricing Analysis Tool
 * Tool for analyzing pricing and generating offers
 */

import { BaseTool } from '@hojai/agent-runtime';
import { AgentContext, ToolResult } from '@hojai/agent-runtime';
import { Property, Deal } from '../../models';

export class PricingAnalysisTool extends BaseTool {
  name = 'pricingAnalysis';
  description = 'Analyze property pricing and generate offer recommendations';

  parameters = [
    {
      name: 'propertyId',
      type: 'string',
      description: 'Property ID to analyze',
      required: true
    },
    {
      name: 'offerPrice',
      type: 'number',
      description: 'Current offer price (if available)',
      required: false
    }
  ];

  async execute(params: Record<string, any>, context: AgentContext): Promise<ToolResult> {
    try {
      const { propertyId, offerPrice } = params;

      const property = await Property.findById(propertyId);
      if (!property) {
        return {
          result: null,
          error: 'Property not found'
        };
      }

      // Get comparable properties
      const comparableProperties = await Property.find({
        _id: { $ne: propertyId },
        'location.locality': property.location?.locality,
        status: 'available'
      })
 .sort({ price: 1 })
      .limit(10)
      .lean();

      // Get recent closed deals in the area
      const recentDeals = await Deal.find({
        propertyId: { $ne: propertyId },
        status: 'closed'
      })
      .populate('propertyId')
      .sort({ closedAt: -1 })
      .limit(10)
      .lean();

      const comparableDeals = recentDeals
        .filter(d => {
          const prop = d.propertyId as any;
          return prop?.location?.locality === property.location?.locality;
        })
        .map(d => ({
          propertyId: (d.propertyId as any)?._id,
          price: d.offerPrice,
          closedAt: d.closedAt
        }));

      // Calculate metrics
      const askingPrice = property.price;
      const pricePerSqft = askingPrice / (property.specifications?.area || 1);

      const comparablePrices = comparableProperties.map(p => p.price);
      const avgComparablePrice = comparablePrices.length > 0
        ? comparablePrices.reduce((a, b) => a + b, 0) / comparablePrices.length
        : askingPrice;

      const priceVsMarket = ((askingPrice - avgComparablePrice) / avgComparablePrice) * 100;

      // Days on market
      const daysOnMarket = Math.floor(
        (Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Offer analysis
      let offerAnalysis: any = null;
      if (offerPrice) {
        const gap = askingPrice - offerPrice;
        const gapPercent = (gap / askingPrice) * 100;

        offerAnalysis = {
          offerPrice,
          askingPrice,
          gap,
          gapPercent,
          assessment: this.assessOffer(gapPercent, daysOnMarket),
          negotiationRange: {
            minimum: Math.round(askingPrice * 0.95),
            target: Math.round(askingPrice * 0.98),
            maximum: Math.round(askingPrice * 1.02)
          }
        };
      }

      return {
        result: {
          property: {
            id: property._id,
            title: property.title,
            askingPrice,
            pricePerSqft: Math.round(pricePerSqft),
            area: property.specifications?.area,
            daysOnMarket
          },
          marketAnalysis: {
            avgComparablePrice: Math.round(avgComparablePrice),
            priceVsMarket: Math.round(priceVsMarket * 10) / 10,
            comparableCount: comparableProperties.length,
            comparableDealsCount: comparableDeals.length
          },
          offerAnalysis,
          recommendations: this.getRecommendations(priceVsMarket, daysOnMarket, comparableProperties.length)
        }
      };
    } catch (error) {
      return {
        result: null,
        error: `Pricing analysis failed: ${error}`
      };
    }
  }

  private assessOffer(gapPercent: number, daysOnMarket: number): string {
    if (gapPercent <= 0) {
      return 'At or above asking price - strong position';
    }

    if (gapPercent <= 5) {
      return 'Minor gap - likely negotiable';
    }

    if (gapPercent <= 10) {
      return 'Moderate gap - room for negotiation';
    }

    if (gapPercent <= 20) {
      return 'Large gap - may need multiple rounds';
    }

    return 'Very large gap - unlikely to succeed';
  }

  private getRecommendations(priceVsMarket: number, daysOnMarket: number, comparableCount: number): string[] {
    const recommendations: string[] = [];

    if (priceVsMarket > 10) {
      recommendations.push('Property priced above market - consider negotiation');
    } else if (priceVsMarket < -10) {
      recommendations.push('Property priced below market - may sell quickly');
    } else {
      recommendations.push('Property priced competitively');
    }

    if (daysOnMarket > 60) {
      recommendations.push('Long days on market - seller may be flexible');
    } else if (daysOnMarket < 14) {
      recommendations.push('New listing - limited negotiation room');
    }

    if (comparableCount < 3) {
      recommendations.push('Limited comparable data - verify pricing with market analysis');
    }

    return recommendations;
  }
}

export default new PricingAnalysisTool();