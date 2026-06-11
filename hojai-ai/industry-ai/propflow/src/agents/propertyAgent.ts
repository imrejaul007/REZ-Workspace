/**
 * PROPFLOW - Real Estate AI Operating System
 * AI Employee: Property Agent (LLM-Powered)
 * Handles property matching, recommendations, and market analysis
 * Upgraded from rule-based to LLM-powered matching
 */

import { Property, Lead } from '../models';
import { logger } from '../config/logger';
import { IProperty } from '../models';
import { AgentRuntime } from '@hojai/agent-runtime';

// ============================================
// Types
// ============================================

interface PropertyMatchCriteria {
  budget: { min: number; max: number };
  requirements?: {
    type?: string;
    bedrooms?: number;
    bathrooms?: number;
    location?: string;
    amenities?: string[];
    minArea?: number;
    maxArea?: number;
  };
  propertyTypes?: string[];
  excludePropertyIds?: string[];
}

interface PropertyMatch {
  property: IProperty;
  score: number;
  matchFactors: string[];
  gaps: string[];
  recommendationReason: string;
  urgency: 'high' | 'medium' | 'low';
  investmentInsights?: string[];
}

interface MarketAnalysis {
  averagePrice: number;
  priceRange: { min: number; max: number };
  medianPrice: number;
  totalListings: number;
  availableListings: number;
  averagePricePerSqft: number;
  topLocalities: Array<{ locality: string; count: number; avgPrice: number }>;
  priceTrend: 'increasing' | 'stable' | 'decreasing';
  insights: string[];
  recommendations: string[];
}

interface PropertyComparison {
  properties: any[];
  analysis: {
    bestValue: string;
    bestAmenities: string;
    bestLocation: string;
    bestPricePerSqft: string;
    recommendation: string;
  };
  comparisonMatrix: any;
}

// ============================================
// Property Agent (LLM-Powered)
// ============================================

export class PropertyAgent {
  private runtime: AgentRuntime;
  private readonly BASE_SCORE = 40;
  private readonly MAX_SCORE = 100;

  constructor() {
    this.runtime = new AgentRuntime();
 logger.info('Property Agent (LLM) initialized');
  }

  /**
   * LLM-powered property matching
   * Replaces rule-based scoring with intelligent matching
   */
  async findMatchingProperties(criteria: PropertyMatchCriteria): Promise<PropertyMatch[]> {
    try {
      logger.info('Property Agent (LLM): Searching for matching properties', { criteria });

      // Build query for database
      const query: any = {
        status: 'available',
        isActive: true,
        price: { $gte: criteria.budget.min || 0, $lte: criteria.budget.max }
      };

      if (criteria.propertyTypes?.length) {
        query.type = { $in: criteria.propertyTypes };
      }

      if (criteria.excludePropertyIds?.length) {
        query._id = { $nin: criteria.excludePropertyIds };
      }

      const properties = await Property.find(query).lean();

      if (properties.length === 0) {
        logger.info('Property Agent (LLM): No properties found matching criteria');
        return [];
      }

      // Use LLM for intelligent matching
      const llmMatches = await this.matchWithLLM(criteria, properties);

      // Sort by score descending
      const ranked = llmMatches
        .filter(p => p.score >= this.getThreshold())
        .sort((a, b) => b.score - a.score);

      logger.info('Property Agent (LLM): Found matching properties', { count: ranked.length });
      return ranked;

    } catch (error) {
      logger.error('Property Agent (LLM): Matching failed', { error });
      // Fallback to rule-based matching
      return this.findMatchingPropertiesFallback(criteria);
    }
  }

  /**
   * LLM-powered matching engine
   */
  private async matchWithLLM(criteria: PropertyMatchCriteria, properties: any[]): Promise<PropertyMatch[]> {
    try {
      // Build prompt for LLM
      const prompt = this.buildMatchingPrompt(criteria, properties);

      // Run through agent runtime
      const response = await this.runtime.runAgent('Property Matcher', prompt, {
        properties,
        custom: { criteria }
      });

      // Parse LLM response
      return this.parseLLMResponse(response.content, properties);

    } catch (error) {
      logger.warn('Property Agent (LLM): LLM matching failed, using fallback', { error });
      throw error;
    }
  }

  /**
   * Build matching prompt for LLM
   */
  private buildMatchingPrompt(criteria: PropertyMatchCriteria, properties: any[]): string {
    const criteriaStr = JSON.stringify(criteria, null, 2);
    const propertiesStr = JSON.stringify(properties.map(p => ({
      id: p._id,
      title: p.title,
      type: p.type,
      price: p.price,
      location: p.location,
      specifications: p.specifications,
      amenities: p.amenities,
      description: p.description?.slice(0, 500)
    })), null, 2);

    return `You are an expert real estate property matcher.

Analyze the following lead criteria and available properties to find the best matches.

CRITERIA:
${criteriaStr}

AVAILABLE PROPERTIES:
${propertiesStr}

For each property, provide:
1. Match score (0-100)
2. Match factors (what aligns well with criteria)
3. Gaps (what doesn't match)
4. Recommendation reason
5. Urgency level (high/medium/low)
6. Investment insights

Return your analysis as a JSON array:
[
 {
    "propertyId": "...",
    "score": 85,
    "matchFactors": ["Within budget", "Good location"],
    "gaps": ["Slightly below required area"],
    "recommendationReason": "...",
    "urgency": "high",
    "investmentInsights": ["Good appreciation potential"]
  }
]

Only include properties with score >= 60. Sort by score descending.`;
  }

  /**
   * Parse LLM response into structured matches
   */
  private parseLLMResponse(content: string, properties: any[]): PropertyMatch[] {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        logger.warn('Property Agent (LLM): Could not parse JSON from response');
        return this.findMatchingPropertiesFallback(
          { budget: { min: 0, max: Infinity } }
        ).then(r => r.map(m => ({
          ...m,
          matchFactors: [],
          gaps: [],
          investmentInsights: []
        })));
      }

      const matches = JSON.parse(jsonMatch[0]);
      const propertyMap = new Map(properties.map(p => [p._id.toString(), p]));

      return matches.map((match: any) => {
        const property = propertyMap.get(match.propertyId);
        if (!property) return null;

        return {
          property: property as unknown as IProperty,
          score: match.score,
          matchFactors: match.matchFactors || [],
          gaps: match.gaps || [],
          recommendationReason: match.recommendationReason || '',
          urgency: match.urgency || 'medium',
          investmentInsights: match.investmentInsights || []
        };
      }).filter(Boolean);

    } catch (error) {
      logger.error('Property Agent (LLM): Failed to parse response', { error });
      return [];
    }
  }

  /**
   * Fallback rule-based matching
   */
  private async findMatchingPropertiesFallback(criteria: PropertyMatchCriteria): Promise<PropertyMatch[]> {
    const query: any = {
      status: 'available',
      isActive: true,
      price: { $gte: criteria.budget.min || 0, $lte: criteria.budget.max }
    };

    if (criteria.propertyTypes?.length) {
      query.type = { $in: criteria.propertyTypes };
    }

    if (criteria.excludePropertyIds?.length) {
      query._id = { $nin: criteria.excludePropertyIds };
    }

    const properties = await Property.find(query).lean();

    return properties.map(property => {
      const { score, matchFactors } = this.calculateMatchScore(property, criteria);
      return {
        property: property as unknown as IProperty,
        score,
        matchFactors,
        gaps: this.identifyGaps(property, criteria),
        recommendationReason: this.generateRecommendationReason(property, score, criteria),
        urgency: this.determineUrgency(property, score),
        investmentInsights: this.generateInvestmentInsights(property)
      };
    }).filter(p => p.score >= this.getThreshold())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate match score (fallback)
   */
  private calculateMatchScore(property: any, criteria: PropertyMatchCriteria): { score: number; matchFactors: string[] } {
    let score = this.BASE_SCORE;
    const matchFactors: string[] = [];

    // Budget match
    const priceMatch = this.evaluateBudgetMatch(property.price, criteria.budget);
    score += priceMatch.score;
    matchFactors.push(...priceMatch.factors);

    // Property type match
    if (criteria.requirements?.type && property.type === criteria.requirements.type) {
      score += 15;
      matchFactors.push(`${this.capitalize(property.type)} property matches requirement`);
    }

    // Bedroom match
    if (criteria.requirements?.bedrooms && property.specifications?.bedrooms === criteria.requirements.bedrooms) {
      score += 12;
      matchFactors.push(`${property.specifications.bedrooms}BHK matches requirement`);
    } else if (criteria.requirements?.bedrooms && property.specifications?.bedrooms === criteria.requirements.bedrooms + 1) {
      score += 5;
      matchFactors.push(`${property.specifications.bedrooms}BHK is close to requirement`);
    }

    // Location match
    if (criteria.requirements?.location) {
      const locMatch = this.evaluateLocationMatch(property, criteria.requirements.location);
      score += locMatch.score;
      matchFactors.push(...locMatch.factors);
    }

    // Area match
    if (criteria.requirements?.minArea || criteria.requirements?.maxArea) {
      const areaMatch = this.evaluateAreaMatch(property.specifications?.area, criteria.requirements);
      score += areaMatch.score;
      matchFactors.push(...areaMatch.factors);
    }

    // Amenities match
    if (criteria.requirements?.amenities?.length && property.amenities?.length) {
      const amenitiesMatch = this.evaluateAmenitiesMatch(property.amenities, criteria.requirements.amenities);
      score += amenitiesMatch.score;
      matchFactors.push(...amenitiesMatch.factors);
    }

    return {
      score: Math.min(score, this.MAX_SCORE),
      matchFactors
    };
  }

  /**
   * Identify gaps in property match
   */
  private identifyGaps(property: any, criteria: PropertyMatchCriteria): string[] {
    const gaps: string[] = [];

    if (criteria.requirements?.type && property.type !== criteria.requirements.type) {
      gaps.push(`Property type is ${property.type}, not ${criteria.requirements.type}`);
    }

    if (criteria.requirements?.bedrooms && property.specifications?.bedrooms < criteria.requirements.bedrooms) {
      gaps.push(`Only ${property.specifications?.bedrooms}BHK, needs ${criteria.requirements.bedrooms}BHK`);
    }

    if (criteria.requirements?.location && !property.location?.locality?.toLowerCase().includes(criteria.requirements.location.toLowerCase())) {
      gaps.push(`Not in preferred location: ${criteria.requirements.location}`);
    }

    if (property.price > criteria.budget.max) {
      gaps.push(`Price exceeds budget by INR ${(property.price - criteria.budget.max).toLocaleString()}`);
    }

    return gaps;
  }

  /**
   * Generate investment insights
   */
  private generateInvestmentInsights(property: any): string[] {
    const insights: string[] = [];

    // Price per sqft analysis
    const pricePerSqft = property.price / (property.specifications?.area || 1);
    if (pricePerSqft < 5000) {
      insights.push('Below average price per sqft - potential value buy');
    } else if (pricePerSqft > 15000) {
      insights.push('Premium pricing - likely in prime location');
    }

    // Amenity value
    if (property.amenities?.length > 10) {
      insights.push('Extensive amenities add to living quality');
    }

    // New vs resale
    const daysSinceCreation = (Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 30) {
      insights.push('New listing - may have negotiation room');
    }

    return insights;
  }

  /**
   * Evaluate budget match
   */
  private evaluateBudgetMatch(price: number, budget: { min: number; max: number }): { score: number; factors: string[] } {
    const score: number[] = [];
    const factors: string[] = [];

    if (price <= budget.max && price >= budget.min) {
      score.push(20);
      factors.push('Within budget range');
      if (price <= budget.max * 0.9) {
        score.push(10);
        factors.push('Below upper budget limit - good deal');
      }
    } else if (price < budget.min) {
      score.push(5);
      factors.push('Below minimum budget - may indicate quality issues');
    } else if (price > budget.max) {
      const overByPercent = ((price - budget.max) / budget.max) * 100;
      if (overByPercent <= 10) {
        score.push(8);
        factors.push('Slightly above budget - negotiable');
      } else if (overByPercent <= 20) {
        score.push(3);
        factors.push('Above budget but may have unique features');
      }
    }

    return { score: score.reduce((a, b) => a + b, 0), factors };
  }

  /**
   * Evaluate location match
   */
  private evaluateLocationMatch(property: any, location: string): { score: number; factors: string[] } {
    const score: number[] = [];
    const factors: string[] = [];
    const locationLower = location.toLowerCase();

    if (property.location?.locality?.toLowerCase().includes(locationLower)) {
      score.push(15);
      factors.push(`Located in ${property.location.locality} - matches preferred area`);
    } else if (property.location?.city?.toLowerCase().includes(locationLower)) {
      score.push(8);
      factors.push(`In ${property.location.city} - same city as preference`);
    }

    return { score: score.reduce((a, b) => a + b, 0), factors };
  }

  /**
   * Evaluate area match
   */
  private evaluateAreaMatch(area: number, requirements: any): { score: number; factors: string[] } {
    const score: number[] = [];
    const factors: string[] = [];

    if (requirements.minArea && area >= requirements.minArea) {
      score.push(8);
      factors.push(`Area ${area} sqft meets minimum requirement`);
    }
    if (requirements.maxArea && area <= requirements.maxArea) {
      score.push(5);
    }

    return { score: score.reduce((a, b) => a + b, 0), factors };
  }

  /**
   * Evaluate amenities match
   */
  private evaluateAmenitiesMatch(propertyAmenities: string[], requiredAmenities: string[]): { score: number; factors: string[] } {
    const matching = requiredAmenities.filter(req =>
      propertyAmenities.some(pa => pa.toLowerCase().includes(req.toLowerCase()))
    );

    const matchPercent = (matching.length / requiredAmenities.length) * 100;
    const score = Math.min(10, Math.round(matchPercent / 10));
    const factors = matching.map(a => `Has ${a}`);

    return { score, factors };
  }

  /**
   * Get minimum threshold
   */
  private getThreshold(): number {
    return parseInt(process.env.AI_PROPERTY_MATCH_THRESHOLD || '60', 10);
  }

  /**
   * Generate recommendation reason
   */
  private generateRecommendationReason(property: any, score: number, criteria: PropertyMatchCriteria): string {
    if (score >= 90) {
      return `Excellent match! This ${property.specifications?.bedrooms || ''}BHK ${property.type} in ${property.location?.locality} perfectly matches your requirements within budget.`;
    } else if (score >= 80) {
      return `Great match with high compatibility. Property in ${property.location?.locality} offers good value for your investment.`;
    } else if (score >= 70) {
      return `Solid option that meets most of your criteria. Consider scheduling a visit to evaluate firsthand.`;
    } else {
      return `Decent option worth exploring. Contact the agent for more details about this property.`;
    }
  }

  /**
   * Determine urgency
   */
  private determineUrgency(property: any, score: number): 'high' | 'medium' | 'low' {
    if (score >= 85) {
      const daysSinceCreation = (Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation <= 7) return 'high';
      if (daysSinceCreation <= 30) return 'medium';
      return 'low';
    }
    return 'low';
  }

  /**
   * Compare multiple properties (LLM-enhanced)
   */
  async compareProperties(propertyIds: string[]): Promise<PropertyComparison> {
    const properties = await Property.find({ _id: { $in: propertyIds } }).lean();

    const withMetrics = properties.map(p => ({
      ...p,
      pricePerSqft: Math.round(p.price / (p.specifications?.area || 1)),
      valueScore: this.calculateValueScore(p),
      amenityScore: p.amenities?.length || 0,
      locationScore: p.location?.locality ? 1 : 0
    }));

    // Use LLM for comparison analysis
    let llmAnalysis = '';
    try {
      const response = await this.runtime.runAgent('Property Analyzer', `
        Compare these properties and provide insights:

        PROPERTIES:
        ${JSON.stringify(withMetrics.map(p => ({
          id: p._id,
          title: p.title,
          price: p.price,
          area: p.specifications?.area,
          pricePerSqft: p.pricePerSqft,
          bedrooms: p.specifications?.bedrooms,
          amenities: p.amenities?.length,
          locality: p.location?.locality
        })), null, 2)}

        Provide:
1. Best value property (price + quality)
        2. Best amenities
        3. Best location
        4. Best price per sqft
        5. Overall recommendation

        Return as JSON:
        {
          "bestValue": "propertyId",
          "bestAmenities": "propertyId",
          "bestLocation": "propertyId",
          "bestPricePerSqft": "propertyId",
          "recommendation": "Overall recommendation text"
        }
      `);

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        llmAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn('Property Agent: LLM comparison failed, using fallback', { error });
    }

    return {
      properties: withMetrics,
      analysis: {
        bestValue: llmAnalysis.bestValue || withMetrics.sort((a, b) => b.valueScore - a.valueScore)[0]?._id?.toString() || '',
        bestAmenities: llmAnalysis.bestAmenities || withMetrics.sort((a, b) => b.amenityScore - a.amenityScore)[0]?._id?.toString() || '',
        bestLocation: llmAnalysis.bestLocation || withMetrics.sort((a, b) => b.locationScore - a.locationScore)[0]?._id?.toString() || '',
        bestPricePerSqft: llmAnalysis.bestPricePerSqft || withMetrics.sort((a, b) => a.pricePerSqft - b.pricePerSqft)[0]?._id?.toString() || '',
        recommendation: llmAnalysis.recommendation || 'Compare all factors to make your decision.'
      },
      comparisonMatrix: {
        headers: ['Property', 'Price', 'Area', 'Price/Sqft', 'Bedrooms', 'Amenities'],
        rows: withMetrics.map(p => [p.title, p.price, p.specifications?.area, p.pricePerSqft, p.specifications?.bedrooms, p.amenities?.length])
      }
    };
  }

  /**
   * Calculate value score
   */
  private calculateValueScore(property: any): number {
    const avgPricePerSqft = property.price / (property.specifications?.area || 1);
    const amenityWeight = (property.amenities?.length || 0) * 2;
    const locationWeight = property.location?.locality ? 5 : 0;
    return 100 - avgPricePerSqft + amenityWeight + locationWeight;
  }

  /**
   * Get market analysis (LLM-enhanced)
   */
  async getMarketAnalysis(location?: string, propertyType?: string): Promise<MarketAnalysis> {
    const matchQuery: any = { status: 'available', isActive: true };
    if (location) matchQuery['location.locality'] = { $regex: location, $options: 'i' };
    if (propertyType) matchQuery.type = propertyType;

    const properties = await Property.find(matchQuery).lean();

    const prices = properties.map(p => p.price);
    const pricesSorted = [...prices].sort((a, b) => a - b);
    const median = pricesSorted.length % 2 === 0
      ? (pricesSorted[pricesSorted.length / 2 - 1] + pricesSorted[pricesSorted.length / 2]) / 2
      : pricesSorted[Math.floor(pricesSorted.length / 2)];

    // Top localities
    const localityMap = new Map<string, { count: number; totalPrice: number }>();
    properties.forEach(p => {
      const locality = p.location?.locality || 'Unknown';
      const existing = localityMap.get(locality) || { count: 0, totalPrice: 0 };
      existing.count++;
      existing.totalPrice += p.price;
      localityMap.set(locality, existing);
    });

    const topLocalities = Array.from(localityMap.entries())
      .map(([locality, data]) => ({
        locality,
        count: data.count,
        avgPrice: Math.round(data.totalPrice / data.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get LLM insights
    let insights: string[] = [];
    let recommendations: string[] = [];

    try {
      const response = await this.runtime.runAgent('Market Analyst', `
        Analyze this market data and provide insights:

        MARKET DATA:
        ${JSON.stringify({
          location,
          propertyType,
          totalListings: properties.length,
          averagePrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
          medianPrice: Math.round(median),
          priceRange: { min: pricesSorted[0] || 0, max: pricesSorted[pricesSorted.length - 1] || 0 },
          topLocalities
        }, null, 2)}

        Provide:
        1. Key insights (3-5 bullet points)
        2. Recommendations for buyers/sellers

        Return as JSON:
        {
          "insights": ["insight1", "insight2"],
          "recommendations": ["rec1", "rec2"]
        }
      `);

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        insights = parsed.insights || [];
        recommendations = parsed.recommendations || [];
      }
    } catch (error) {
      logger.warn('Property Agent: LLM market analysis failed', { error });
      insights = ['Market data analysis completed'];
      recommendations = ['Contact agent for personalized recommendations'];
    }

    return {
      averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / (prices.length || 1)),
      priceRange: { min: pricesSorted[0] || 0, max: pricesSorted[pricesSorted.length - 1] || 0 },
      medianPrice: Math.round(median),
      totalListings: properties.length,
      availableListings: properties.filter(p => p.status === 'available').length,
      averagePricePerSqft: Math.round((prices.reduce((a, b) => a + b, 0) / (properties.reduce((acc, p) => acc + (p.specifications?.area || 1), 0) || 1))),
      topLocalities,
      priceTrend: 'stable',
      insights,
      recommendations
    };
  }

  /**
   * Get personalized recommendations for a lead
   */
  async getRecommendationsForLead(leadId: string): Promise<PropertyMatch[]> {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    return this.findMatchingProperties({
      budget: lead.budget,
      requirements: lead.requirements
    });
  }

  /**
   * Get similar properties
   */
  async getSimilarProperties(propertyId: string, limit: number = 5): Promise<PropertyMatch[]> {
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    return this.findMatchingProperties({
      budget: { min: property.price * 0.8, max: property.price * 1.2 },
      requirements: {
        type: property.type,
        bedrooms: property.specifications?.bedrooms
      }
    });
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export default new PropertyAgent();