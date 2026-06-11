/**
 * PROPFLOW - Real Estate AI Operating System
 * AI Employee: Deal Closer Agent (NEW - LLM-Powered)
 * Handles deal analysis, negotiation strategy, and deal closure
 */

import { Deal, Lead, Property, SiteVisit } from '../models';
import { logger } from '../config/logger';
import { IDeal } from '../models';
import { AgentRuntime } from '@hojai/agent-runtime';

// ============================================
// Types
// ============================================

interface DealAnalysis {
  deal: IDeal;
  probability: number;
  risks: string[];
  opportunities: string[];
  nextSteps: string[];
  talkingPoints: string[];
  priceAnalysis: {
    offerPrice: number;
    askingPrice: number;
    gap: number;
    gapPercent: number;
    assessment: string;
  };
  timeline: {
    expectedCloseDate: Date;
    daysRemaining: number;
    criticalMilestones: Array<{ milestone: string; dueDate: Date }>;
  };
  recommendations: string[];
}

interface OfferStrategy {
  type: 'aggressive' | 'balanced' | 'conservative';
  initialOffer: number;
  targetPrice: number;
  walkawayPrice: number;
  negotiationSteps: Array<{
    action: string;
    price: number;
    justification: string;
  }>;
}

interface ObjectionResponse {
  objection: string;
  response: string;
  talkingPoints: string[];
  fallback: string;
}

interface DealMetrics {
  totalDeals: number;
  activeDeals: number;
  closedWon: number;
  closedLost: number;
  totalValue: number;
  avgDealSize: number;
  avgCycleTime: number;
  winRate: number;
}

interface ComparableDeal {
  propertyId: string;
  propertyTitle: string;
  finalPrice: number;
  daysOnMarket: number;
  buyerMotivation: string;
}

// ============================================
// Deal Closer Agent (LLM-Powered)
// ============================================

export class DealCloserAgent {
  private runtime: AgentRuntime;

  constructor() {
    this.runtime = new AgentRuntime();
    logger.info('Deal Closer Agent initialized');
  }

  /**
   * Analyze a deal with LLM-powered insights
   */
  async analyzeDeal(dealId: string): Promise<DealAnalysis> {
    try {
      const deal = await Deal.findById(dealId);
      if (!deal) {
        throw new Error('Deal not found');
      }

      const [property, lead, siteVisits, comparableDeals] = await Promise.all([
        Property.findById(deal.propertyId),
        Lead.findById(deal.leadId),
        SiteVisit.find({ leadId: deal.leadId, status: 'completed' }),
        this.getComparableDeals(deal.propertyId)
      ]);

      if (!property || !lead) {
        throw new Error('Property or Lead not found');
      }

      logger.info('Deal Closer Agent: Analyzing deal', { dealId });

      try {
        // Use LLM for comprehensive deal analysis
        return await this.analyzeWithLLM(deal, property, lead, siteVisits, comparableDeals);
      } catch (error) {
        logger.warn('Deal Closer Agent: LLM analysis failed, using fallback', { error });
        return this.analyzeFallback(deal, property, lead);
      }

    } catch (error) {
      logger.error('Deal Closer Agent: Deal analysis failed', { error, dealId });
      throw error;
    }
  }

  /**
   * LLM-powered deal analysis
   */
  private async analyzeWithLLM(
    deal: any,
    property: any,
    lead: any,
    siteVisits: any[],
    comparableDeals: ComparableDeal[]
  ): Promise<DealAnalysis> {
    const prompt = this.buildAnalysisPrompt(deal, property, lead, siteVisits, comparableDeals);

    const response = await this.runtime.runAgent('Deal Closer', prompt, {
      deals: [deal],
      custom: {
        marketData: await this.getMarketData(property.location?.locality),
        comparableDeals
      }
    });

    return this.parseAnalysisResponse(response.content, deal, property, lead);
  }

  /**
   * Build analysis prompt for LLM
   */
  private buildAnalysisPrompt(
    deal: any,
    property: any,
    lead: any,
    siteVisits: any[],
    comparableDeals: ComparableDeal[]
  ): string {
    const visitSummary = siteVisits.map(v => ({
      date: v.date,
      feedback: v.feedback,
      rating: v.rating
    }));

    return `You are an expert real estate deal closer.

Analyze this deal and provide comprehensive insights:

DEAL:
${JSON.stringify({
  id: deal._id,
  offerPrice: deal.offerPrice,
  askingPrice: deal.askingPrice,
  status: deal.status,
  stage: deal.stage,
  probability: deal.probability,
  agentId: deal.agentId,
  expectedCloseDate: deal.expectedCloseDate,
  createdAt: deal.createdAt
}, null, 2)}

PROPERTY:
${JSON.stringify({
  title: property.title,
  price: property.price,
  location: property.location,
  specifications: property.specifications,
  amenities: property.amenities,
  daysOnMarket: Math.floor((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24))
}, null, 2)}

LEAD:
${JSON.stringify({
  name: lead.name,
  score: lead.score,
  tier: lead.scoreTier,
  budget: lead.budget,
  visitCount: lead.visitCount,
  status: lead.status,
  source: lead.source
}, null, 2)}

VISIT HISTORY:
${JSON.stringify(visitSummary, null, 2)}

COMPARABLE DEALS:
${JSON.stringify(comparableDeals, null, 2)}

Provide:
1. Deal probability (0-100%)
2. Key risks
3. Opportunities
4. Next steps
5. Talking points
6. Price analysis
7. Timeline assessment
8. Recommendations

Return as JSON:
{
  "probability": 75,
  "risks": ["Risk 1", "Risk 2"],
  "opportunities": ["Opportunity 1"],
  "nextSteps": ["Step 1", "Step 2"],
  "talkingPoints": ["Talking point 1"],
  "priceAnalysis": {
    "offerPrice": 5000000,
    "askingPrice": 5500000,
    "gap": 500000,
    "gapPercent": 9.1,
    "assessment": "Negotiable"
  },
  "timeline": {
    "expectedCloseDate": "2026-02-15",
    "daysRemaining": 45,
    "criticalMilestones": [...]
  },
  "recommendations": ["Recommendation 1"]
}`;
  }

  /**
   * Parse LLM analysis response
   */
  private parseAnalysisResponse(
    content: string,
    deal: any,
    property: any,
    lead: any
  ): DealAnalysis {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from LLM response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        deal,
        probability: parsed.probability || 50,
        risks: parsed.risks || [],
        opportunities: parsed.opportunities || [],
        nextSteps: parsed.nextSteps || [],
        talkingPoints: parsed.talkingPoints || [],
        priceAnalysis: {
          offerPrice: deal.offerPrice,
          askingPrice: deal.askingPrice || property.price,
          gap: (deal.askingPrice || property.price) - deal.offerPrice,
          gapPercent: (((deal.askingPrice || property.price) - deal.offerPrice) / (deal.askingPrice || property.price)) * 100,
          assessment: parsed.priceAnalysis?.assessment || 'Assessment pending'
        },
        timeline: {
          expectedCloseDate: parsed.timeline?.expectedCloseDate || deal.expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          daysRemaining: parsed.timeline?.daysRemaining || 30,
          criticalMilestones: parsed.timeline?.criticalMilestones || []
        },
        recommendations: parsed.recommendations || []
      };

    } catch (error) {
      logger.error('Deal Closer Agent: Failed to parse analysis response', { error });
      return this.analyzeFallback(deal, property, lead);
    }
  }

  /**
   * Fallback deal analysis
   */
  private analyzeFallback(deal: any, property: any, lead: any): DealAnalysis {
    const askingPrice = deal.askingPrice || property.price;
    const gap = askingPrice - deal.offerPrice;
    const gapPercent = (gap / askingPrice) * 100;

    // Calculate probability based on deal stage and gap
    let probability = deal.probability || 50;

    // Adjust for stage
    const stageAdjustment: Record<string, number> = {
      'negotiating': 0,
      'accepted': 20,
      'documents': 30,
      'registered': 50,
      'closed': 100
    };
    probability += stageAdjustment[deal.stage] || 0;

    // Adjust for gap
    if (gapPercent <= 5) probability += 15;
    else if (gapPercent <= 10) probability += 10;
    else if (gapPercent <= 20) probability += 5;
    else probability -= 10;

    // Adjust for lead quality
    if (lead.scoreTier === 'hot') probability += 10;
    else if (lead.scoreTier === 'warm') probability += 5;
    else probability -= 5;

    probability = Math.min(100, Math.max(0, probability));

    return {
      deal,
      probability,
      risks: [
        gapPercent > 15 ? 'Large price gap may require multiple negotiations' : 'Price gap is manageable',
        lead.scoreTier === 'cold' ? 'Lead engagement needs improvement' : 'Lead engagement is good',
        deal.stage === 'negotiating' ? 'Deal is in early stage' : 'Deal is progressing well'
      ],
      opportunities: [
        'Schedule follow-up visit to reinforce interest',
        'Prepare counter-offer strategy',
        'Gather comparable sale data for negotiation'
      ],
      nextSteps: this.getNextSteps(deal.stage),
      talkingPoints: [
        'Property has strong appreciation potential',
        'Similar properties in area sold quickly',
        'Seller is motivated to close'
      ],
      priceAnalysis: {
        offerPrice: deal.offerPrice,
        askingPrice,
        gap,
        gapPercent,
        assessment: gapPercent <= 5 ? 'Excellent offer' : gapPercent <= 10 ? 'Good offer' : gapPercent <= 20 ? 'Negotiable' : 'Needs discussion'
      },
      timeline: {
        expectedCloseDate: deal.expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        daysRemaining: 30,
        criticalMilestones: [
          { milestone: 'Acceptance', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
          { milestone: 'Document Review', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
          { milestone: 'Registration', dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) },
          { milestone: 'Possession', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        ]
      },
      recommendations: [
        'Schedule a call to discuss next steps',
        'Prepare documentation checklist',
        'Arrange site visit to finalize decisions'
      ]
    };
  }

  /**
   * Get next steps based on deal stage
   */
  private getNextSteps(stage: string): string[] {
    const steps: Record<string, string[]> = {
      'negotiating': [
        'Present counter-offer to seller',
        'Schedule follow-up with buyer',
        'Prepare comparable data for negotiation',
        'Get feedback on offer'
      ],
      'accepted': [
        'Prepare sale agreement',
        'Collect token amount',
        'Schedule document preparation',
        'Inform all parties of acceptance'
      ],
      'documents': [
        'Complete legal documentation',
        'Arrange home inspection',
        'Submit to registry',
        'Coordinate with lawyer'
      ],
      'registered': [
        'Arrange balance payment',
        'Schedule possession',
        'Complete handover formalities',
        'Hand over keys'
      ],
      'closed': [
        'Send thank you note',
        'Request referral',
        'Add to long-term relationship'
      ]
    };

    return steps[stage] || steps['negotiating'];
  }

  /**
   * Generate offer strategy with LLM
   */
  async generateOfferStrategy(dealId: string, strategyType: 'aggressive' | 'balanced' | 'conservative' = 'balanced'): Promise<OfferStrategy> {
    try {
      const deal = await Deal.findById(dealId);
      if (!deal) {
        throw new Error('Deal not found');
      }

      const property = await Property.findById(deal.propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      const marketData = await this.getMarketData(property.location?.locality);
      const comparableDeals = await this.getComparableDeals(deal.propertyId);

      logger.info('Deal Closer Agent: Generating offer strategy', { dealId, strategyType });

      const response = await this.runtime.runAgent('Deal Closer', `
        Generate an offer strategy for this deal:

        DEAL:
        ${JSON.stringify({
          offerPrice: deal.offerPrice,
          askingPrice: deal.askingPrice || property.price,
          currentStage: deal.stage
        })}

        PROPERTY:
        ${JSON.stringify({
          price: property.price,
          location: property.location,
          daysOnMarket: Math.floor((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        })}

        MARKET DATA:
        ${JSON.stringify(marketData)}

        STRATEGY TYPE: ${strategyType}

        Generate:
        1. Initial offer (first counter)
        2. Target price (where you want to land)
        3. Walkaway price (maximum you will go)
        4. Negotiation steps with justifications

        Return as JSON:
        {
          "type": "${strategyType}",
          "initialOffer": 4800000,
          "targetPrice": 5200000,
          "walkawayPrice": 5500000,
          "negotiationSteps": [
            { "action": "...", "price": 4800000, "justification": "..." }
          ]
        }
      `, { deals: [deal], custom: { marketData, comparableDeals } });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback
      return this.generateFallbackStrategy(deal, property, strategyType);

    } catch (error) {
      logger.error('Deal Closer Agent: Strategy generation failed', { error });
      throw error;
    }
  }

  /**
   * Fallback offer strategy
   */
  private generateFallbackStrategy(deal: any, property: any, type: string): OfferStrategy {
    const askingPrice = deal.askingPrice || property.price;
    const basePrice = deal.offerPrice;

    let initialOffer: number;
    let targetPrice: number;
    let walkawayPrice: number;

    if (type === 'aggressive') {
      initialOffer = basePrice * 0.9;
      targetPrice = basePrice * 1.0;
      walkawayPrice = basePrice * 1.05;
    } else if (type === 'conservative') {
      initialOffer = basePrice * 0.95;
      targetPrice = basePrice * 1.02;
      walkawayPrice = basePrice * 1.1;
    } else {
      initialOffer = basePrice * 0.92;
      targetPrice = basePrice * 1.0;
      walkawayPrice = basePrice * 1.08;
    }

    return {
      type,
      initialOffer: Math.round(initialOffer),
      targetPrice: Math.round(targetPrice),
      walkawayPrice: Math.round(walkawayPrice),
      negotiationSteps: [
        {
          action: 'Present initial offer with conditions',
          price: Math.round(initialOffer),
          justification: 'Below asking price to leave room for negotiation'
        },
        {
          action: 'Counter-offer if rejected',
          price: Math.round((initialOffer + targetPrice) / 2),
          justification: 'Meet halfway approach'
        },
        {
          action: 'Final offer at target',
          price: Math.round(targetPrice),
          justification: 'Fair market value with minor adjustment'
        }
      ]
    };
  }

  /**
   * Handle buyer objection with LLM
   */
  async handleObjection(dealId: string, objection: string): Promise<ObjectionResponse> {
    try {
      const deal = await Deal.findById(dealId);
      if (!deal) {
        throw new Error('Deal not found');
      }

      const property = await Property.findById(deal.propertyId);
      const lead = await Lead.findById(deal.leadId);

      logger.info('Deal Closer Agent: Handling objection', { dealId, objection });

      const response = await this.runtime.runAgent('Deal Closer', `
        Handle this buyer objection professionally:

        OBJECTION: "${objection}"

        DEAL INFO:
        ${JSON.stringify({
          offerPrice: deal.offerPrice,
          askingPrice: deal.askingPrice || property?.price,
          stage: deal.stage
        })}

        PROPERTY: ${property?.title || 'N/A'}
        BUYER: ${lead?.name || 'N/A'}

        Provide:
        1. Acknowledgment of the objection
        2. Response/rebuttal
        3. Key talking points
        4. Fallback if objection persists

        Return as JSON:
        {
          "response": "Full response text...",
          "talkingPoints": ["Point 1", "Point 2"],
          "fallback": "If still not convinced..."
        }
      `);

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          objection,
          response: parsed.response || 'Thank you for your concern. Let me address that...',
          talkingPoints: parsed.talkingPoints || [],
          fallback: parsed.fallback || 'Let me arrange a call with our senior advisor.'
        };
      }

      // Fallback responses
      return this.getFallbackResponse(objection);

    } catch (error) {
      logger.error('Deal Closer Agent: Objection handling failed', { error });
      return this.getFallbackResponse(objection);
    }
  }

  /**
   * Get fallback objection responses
   */
  private getFallbackResponse(objection: string): ObjectionResponse {
    const objectionLower = objection.toLowerCase();

    if (objectionLower.includes('price') || objectionLower.includes('expensive') || objectionLower.includes('cost')) {
      return {
        objection,
        response: 'I understand price is a key factor. Let me share that this property has seen consistent appreciation, and the current price reflects recent market developments. We can explore flexible payment options as well.',
        talkingPoints: [
          'Price includes all amenities and recent upgrades',
          'Flexible payment plans available',
          'Similar properties in the area are priced higher',
          'Investment potential justifies the price'
        ],
        fallback: 'Would you like me to arrange a meeting with the developer to discuss pricing options?'
      };
    }

    if (objectionLower.includes('think') || objectionLower.includes('consider')) {
      return {
        objection,
        response: 'Of course, this is a significant decision and I encourage you to take your time. However, I should mention that there is another interested party. Would it help if I arranged another visit or provided more information?',
        talkingPoints: [
          'Property is in high demand',
          'Another visit might help with decision',
          'Timeline is flexible',
          'We can pause and resume discussions anytime'
        ],
        fallback: 'When would be a good time to follow up with you?'
      };
    }

    if (objectionLower.includes('location') || objectionLower.includes('area')) {
      return {
        objection,
        response: 'I understand your concern about the location. Let me share that the area has seen significant infrastructure development, and there are excellent connectivity options. Would you like a tour of the neighborhood?',
        talkingPoints: [
          'Metro connectivity coming soon',
          'Schools and hospitals nearby',
          'Shopping centers within reach',
          'Upcoming infrastructure projects'
        ],
        fallback: 'Shall I send you a detailed locality report?'
      };
    }

    // Default response
    return {
      objection,
      response: 'Thank you for sharing your thoughts. Your concerns are valid, and I want to make sure we address them properly. Let me gather more information and get back to you with a solution.',
      talkingPoints: [
        'I understand your perspective',
        'Let me address this concern',
        'Your satisfaction is our priority'
      ],
      fallback: 'Would you prefer to speak with our senior consultant?'
    };
  }

  /**
   * Get market data for location
   */
  private async getMarketData(locality?: string): Promise<any> {
    if (!locality) return null;

    const properties = await Property.find({
      'location.locality': { $regex: locality, $options: 'i' },
      status: 'available'
    }).lean();

    if (properties.length === 0) return null;

    const prices = properties.map(p => p.price);
    return {
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      listingCount: properties.length,
      avgDaysOnMarket: 30 // Simplified
    };
  }

  /**
   * Get comparable deals
   */
  private async getComparableDeals(excludePropertyId: string): Promise<ComparableDeal[]> {
    const closedDeals = await Deal.find({
      status: 'closed',
      propertyId: { $ne: excludePropertyId }
    })
    .populate('propertyId')
    .sort({ closedAt: -1 })
    .limit(10)
    .lean();

    return closedDeals.map(deal => {
      const property = deal.propertyId as any;
      return {
        propertyId: property?._id?.toString() || '',
        propertyTitle: property?.title || 'Unknown',
        finalPrice: deal.offerPrice,
        daysOnMarket: property ? Math.floor((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 30,
        buyerMotivation: 'Standard'
      };
    });
  }

  /**
   * Get deal metrics
   */
  async getDealMetrics(agentId?: string, startDate?: Date, endDate?: Date): Promise<DealMetrics> {
    const query: any = {};
    if (agentId) query.agentId = agentId;
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const deals = await Deal.find(query).populate('propertyId');
    const closedWon = deals.filter(d => d.status === 'closed' && d.stage === 'closed');
    const closedLost = deals.filter(d => d.status === 'closed' && d.stage !== 'closed');

    const totalValue = closedWon.reduce((sum, d) => {
      const property = d.propertyId as any;
      return sum + (property?.price || d.offerPrice);
    }, 0);

    const avgCycleTime = closedWon.length > 0
      ? closedWon.reduce((sum, d) => {
          const days = (new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / closedWon.length
      : 0;

    return {
      totalDeals: deals.length,
      activeDeals: deals.filter(d => d.status !== 'closed').length,
      closedWon: closedWon.length,
      closedLost: closedLost.length,
      totalValue,
      avgDealSize: closedWon.length > 0 ? totalValue / closedWon.length : 0,
      avgCycleTime: Math.round(avgCycleTime),
      winRate: deals.length > 0 ? (closedWon.length / (closedWon.length + closedLost.length)) * 100 : 0
    };
  }

  /**
   * Generate deal summary report
   */
  async generateReport(agentId?: string): Promise<string> {
    try {
      const metrics = await this.getDealMetrics(agentId);
      const deals = await Deal.find({ agentId, status: { $ne: 'closed' } })
        .populate('propertyId leadId')
        .sort({ updatedAt: -1 })
        .limit(20);

      const response = await this.runtime.runAgent('Deal Closer', `
        Generate a deal summary report:

        METRICS:
        ${JSON.stringify(metrics, null, 2)}

        ACTIVE DEALS:
        ${JSON.stringify(deals.map(d => ({
          id: d._id,
          property: (d.propertyId as any)?.title,
          lead: (d.leadId as any)?.name,
          stage: d.stage,
          probability: d.probability,
          value: d.offerPrice
        })), null, 2)}

        Generate a concise executive summary.

        Return as JSON:
        {
          "summary": "Executive summary text...",
          "keyPoints": ["Point 1", "Point 2"],
          "recommendations": ["Rec 1", "Rec 2"]
        }
      `);

      return response.content;

    } catch (error) {
      logger.error('Deal Closer Agent: Report generation failed', { error });
      return 'Unable to generate report. Please try again later.';
    }
  }

  /**
   * Predict deal outcome
   */
  async predictOutcome(dealId: string): Promise<{ prediction: 'close-won' | 'close-lost' | 'pending'; confidence: number }> {
    const deal = await Deal.findById(dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    const analysis = await this.analyzeDeal(dealId);

    let prediction: 'close-won' | 'close-lost' | 'pending' = 'pending';
    let confidence = analysis.probability;

    if (confidence >= 80) {
      prediction = 'close-won';
    } else if (confidence <= 20) {
      prediction = 'close-lost';
    }

    return { prediction, confidence };
  }

  /**
   * Get deals requiring attention
   */
  async getDealsRequiringAttention(agentId?: string): Promise<any[]> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const query: any = {
      status: { $ne: 'closed' }
    };
    if (agentId) query.agentId = agentId;

    const deals = await Deal.find(query).populate('propertyId leadId');

    return deals.filter(deal => {
      // High priority: expected close date approaching
      if (deal.expectedCloseDate && new Date(deal.expectedCloseDate) <= thirtyDaysFromNow) {
        return true;
      }

      // High priority: low probability but active
      if (deal.probability < 30 && deal.stage !== 'negotiating') {
        return true;
      }

      // Medium priority: stuck in same stage for long
      const stageStuckDays = (now.getTime() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (stageStuckDays > 14 && deal.stage !== 'closed') {
        return true;
      }

      return false;
    });
  }
}

export default new DealCloserAgent();