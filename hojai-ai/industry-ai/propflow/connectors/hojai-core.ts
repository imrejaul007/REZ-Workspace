/**
 * HOJAI Core Connector
 * Connects PROPFLOW to HOJAI Core AI infrastructure
 * Real Estate AI Analysis and Recommendations
 */

export interface HOJAIConfig {
  baseUrl: string;
  apiKey: string;
}

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
}

export interface PropertyContext {
  customerId?: string;
  budget?: { min: number; max: number };
  preferredLocations?: string[];
  propertyType?: string;
  purpose?: 'buy' | 'rent' | 'invest';
}

export interface PropertyRecommendation {
  properties: Array<{
    id: string;
    name: string;
    price: number;
    matchScore: number;
    reasons: string[];
    highlights: string[];
  }>;
  analysis: string;
}

export interface PriceAnalysis {
  currentPrice: number;
  marketPrice: number;
  priceTrend: 'rising' | 'stable' | 'falling';
  pricePerSqFt: number;
  similarPropertiesAvg: number;
  investmentPotential: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface AreaAnalysis {
  areaName: string;
  avgPricePerSqFt: number;
  priceAppreciation: number;
  connectivityScore: number;
  infrastructureScore: number;
  livabilityScore: number;
  topFacilities: string[];
  growthPotential: 'low' | 'medium' | 'high';
}

export class HOJAIConnector {
  private config: HOJAIConfig;

  constructor(config: HOJAIConfig) {
    this.config = config;
  }

  /**
   * Analyze property intent from text
   */
  async analyzeIntent(
    text: string,
    context?: PropertyContext
  ): Promise<IntentResult> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/intent/analyze`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text, context })
        }
      );

      if (!response.ok) {
        return { intent: 'unknown', confidence: 0, entities: {} };
      }

      return await response.json();
    } catch {
      return { intent: 'unknown', confidence: 0, entities: {} };
    }
  }

  /**
   * Get personalized property recommendations
   */
  async getPropertyRecommendations(
    customerId: string,
    criteria?: {
      budget?: { min: number; max: number };
      locations?: string[];
      propertyType?: string;
      bedrooms?: number;
    }
  ): Promise<PropertyRecommendation | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/recommendations/properties/${customerId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(criteria)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Analyze property price
   */
  async analyzePropertyPrice(propertyId: string): Promise<PriceAnalysis | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/property/price-analysis/${propertyId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Get area analysis
   */
  async getAreaAnalysis(location: string): Promise<AreaAnalysis | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/property/area-analysis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ location })
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Generate property description
   */
  async generatePropertyDescription(
    property: {
      name: string;
      type: string;
      area: number;
      bedrooms?: number;
      bathrooms?: number;
      amenities?: string[];
      location: string;
    }
  ): Promise<string> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/narrative/property-description`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(property)
        }
      );

      if (!response.ok) {
        return `${property.name} - ${property.bedrooms || ''} BHK ${property.type} in ${property.location}`;
      }

      const data = await response.json();
      return data.description;
    } catch {
      return `${property.name} - ${property.bedrooms || ''} BHK ${property.type} in ${property.location}`;
    }
  }

  /**
   * Generate investment analysis
   */
  async getInvestmentAnalysis(
    propertyId: string,
    investmentType: 'rental' | 'resale' | 'flip'
  ): Promise<{
    expectedReturns: number;
    roiPercentage: number;
    breakEvenYears: number;
    risks: string[];
    recommendation: string;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/property/investment-analysis/${propertyId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ investmentType })
        }
      );

      if (!response.ok) {
        return {
          expectedReturns: 0,
          roiPercentage: 0,
          breakEvenYears: 0,
          risks: [],
          recommendation: ''
        };
      }

      return await response.json();
    } catch {
      return {
        expectedReturns: 0,
        roiPercentage: 0,
        breakEvenYears: 0,
        risks: [],
        recommendation: ''
      };
    }
  }

  /**
   * Get ROI comparison
   */
  async comparePropertyROI(propertyIds: string[]): Promise<{
    properties: Array<{
      id: string;
      name: string;
      roiScore: number;
      analysis: string;
    }>;
    recommendation: string;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/property/compare-roi`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ propertyIds })
        }
      );

      if (!response.ok) {
        return { properties: [], recommendation: '' };
      }

      return await response.json();
    } catch {
      return { properties: [], recommendation: '' };
    }
  }

  /**
   * Generate follow-up message
   */
  async generateFollowUpMessage(
    customerName: string,
    propertyName: string,
    context: 'interest' | 'visit-scheduled' | 'negotiation' | 'closing'
  ): Promise<string> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/narrative/property-followup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ customerName, propertyName, context })
        }
      );

      if (!response.ok) {
        return `Dear ${customerName}, regarding ${propertyName} - we would love to assist you.`;
      }

      const data = await response.json();
      return data.message;
    } catch {
      return `Dear ${customerName}, regarding ${propertyName} - we would love to assist you.`;
    }
  }

  /**
   * Get customer memory/preferences
   */
  async getMemory(
    customerId: string,
    key?: string
  ): Promise<{ key: string; value: unknown } | { key: string; value: unknown }[] | null> {
    try {
      const url = key
        ? `${this.config.baseUrl}/api/memory/${customerId}/${key}`
        : `${this.config.baseUrl}/api/memory/${customerId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Store customer memory/preferences
   */
  async setMemory(
    customerId: string,
    data: { key: string; value: unknown; ttl?: number }
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/memory/${customerId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get AI agent response
   */
  async getAgentResponse(
    agentId: string,
    message: string,
    context?: PropertyContext
  ): Promise<{ response: string; actions?: unknown[] } | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/agents/${agentId}/chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message, context })
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Check connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }
}

export default HOJAIConnector;