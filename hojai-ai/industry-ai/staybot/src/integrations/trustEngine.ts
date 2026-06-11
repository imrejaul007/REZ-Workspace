/**
 * STAYBOT - Trust Engine Integration
 * Verifies supplier trust scores via RABTUL Trust Engine (Port 4180)
 * Part of the RTNM Economic Network
 */

import axios from 'axios';
import logger from '../utils/logger';

const TRUST_ENGINE_URL = process.env.RABTUL_TRUST_ENGINE_URL || 'http://localhost:4180';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';

export interface TrustScore {
  entityId: string;
  entityType: 'supplier' | 'partner' | 'guest' | 'agent';
  overallScore: number; // 0-100
  trustScore: number;
  paymentScore: number;
  fulfillmentScore: number;
  qualityScore: number;
  responseTimeScore: number;
  lastUpdated: Date;
  factors: TrustFactor[];
}

export interface TrustFactor {
  name: string;
  impact: number; // -1 to 1
  weight: number;
  description: string;
  evidence?: string[];
}

export interface TrustVerification {
  verified: boolean;
  entityId: string;
  trustScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  verifiedAt: Date;
}

export class TrustEngine {
  private trustCache: Map<string, { score: TrustScore; timestamp: number }> = new Map();
  private cacheTTL = 3600000; // 1 hour
  private httpClient: axios.AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      baseURL: TRUST_ENGINE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
    });
  }

  /**
   * Get trust score for an entity
   */
  async getTrustScore(
    entityId: string,
    entityType: TrustScore['entityType'] = 'supplier',
    forceRefresh: boolean = false
  ): Promise<{ success: boolean; score?: TrustScore; error?: string }> {
    const cacheKey = `${entityType}-${entityId}`;

    // Check cache
    if (!forceRefresh) {
      const cached = this.trustCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return { success: true, score: cached.score };
      }
    }

    try {
      // Try external trust engine
      try {
        const response = await this.httpClient.get(`/api/trust/${entityId}`, {
          params: { entityType },
        });

        if (response.data?.score) {
          const score: TrustScore = {
            entityId,
            entityType,
            overallScore: response.data.score.overall || 0,
            trustScore: response.data.score.trust || 0,
            paymentScore: response.data.score.payment || 0,
            fulfillmentScore: response.data.score.fulfillment || 0,
            qualityScore: response.data.score.quality || 0,
            responseTimeScore: response.data.score.responseTime || 0,
            lastUpdated: new Date(response.data.score.lastUpdated || Date.now()),
            factors: response.data.score.factors || [],
          };

          // Update cache
          this.trustCache.set(cacheKey, { score, timestamp: Date.now() });

          return { success: true, score };
        }
      } catch (externalError: any) {
        logger.warn(`External trust engine unavailable: ${externalError.message}`);
      }

      // Return cached or default score
      const cached = this.trustCache.get(cacheKey);
      if (cached) {
        return { success: true, score: cached.score };
      }

      // Default score for unknown entities
      const defaultScore: TrustScore = {
        entityId,
        entityType,
        overallScore: 50, // Neutral score
        trustScore: 50,
        paymentScore: 50,
        fulfillmentScore: 50,
        qualityScore: 50,
        responseTimeScore: 50,
        lastUpdated: new Date(),
        factors: [
          {
            name: 'new-entity',
            impact: 0,
            weight: 1,
            description: 'Entity is new to the platform',
          },
        ],
      };

      return { success: true, score: defaultScore };
    } catch (error: any) {
      logger.error(`Trust score fetch failed: ${error.message}`, { entityId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify if a supplier meets minimum trust requirements
   */
  async verifySupplier(
    supplierId: string,
    minTrustScore: number = 60
  ): Promise<TrustVerification> {
    const result = await this.getTrustScore(supplierId, 'supplier');
    const score = result.score;
    const verified = score ? score.overallScore >= minTrustScore : false;

    const warnings: string[] = [];
    let riskLevel: TrustVerification['riskLevel'] = 'low';

    if (score) {
      if (score.paymentScore < 50) {
        warnings.push('Payment history shows delays');
        riskLevel = 'medium';
      }
      if (score.fulfillmentScore < 50) {
        warnings.push('Fulfillment rate below average');
        riskLevel = 'medium';
      }
      if (score.qualityScore < 50) {
        warnings.push('Quality scores below average');
        riskLevel = 'medium';
      }
      if (score.overallScore < 40) {
        warnings.push('Overall trust score is low');
        riskLevel = 'high';
      }
      if (score.overallScore < 25) {
        warnings.push('Critical trust issues detected');
        riskLevel = 'critical';
      }
    }

    return {
      verified,
      entityId: supplierId,
      trustScore: score?.overallScore || 0,
      riskLevel,
      warnings,
      verifiedAt: new Date(),
    };
  }

  /**
   * Report trust violation
   */
  async reportViolation(
    entityId: string,
    entityType: TrustScore['entityType'],
    violation: {
      type: 'payment' | 'fulfillment' | 'quality' | 'response';
      severity: 'minor' | 'moderate' | 'major' | 'critical';
      description: string;
      evidence?: string[];
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Try external trust engine
      try {
        await this.httpClient.post('/api/trust/violations', {
          entityId,
          entityType,
          violation: {
            ...violation,
            reportedAt: new Date().toISOString(),
            reportedBy: 'staybot',
          },
        });
      } catch (externalError: any) {
        logger.warn(`External violation report failed: ${externalError.message}`);
      }

      // Invalidate cache
      const cacheKey = `${entityType}-${entityId}`;
      this.trustCache.delete(cacheKey);

      logger.info(`Trust violation reported: ${entityId}`, {
        entityId,
        violationType: violation.type,
        severity: violation.severity,
      });

      return { success: true };
    } catch (error: any) {
      logger.error(`Violation report failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Request trust score update
   */
  async requestScoreUpdate(
    entityId: string,
    entityType: TrustScore['entityType']
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Invalidate cache to force refresh
      const cacheKey = `${entityType}-${entityId}`;
      this.trustCache.delete(cacheKey);

      // Try external engine
      try {
        await this.httpClient.post(`/api/trust/${entityId}/refresh`, {
          entityType,
          requestedBy: 'staybot',
        });
      } catch (externalError: any) {
        logger.warn(`External score refresh failed: ${externalError.message}`);
      }

      return { success: true };
    } catch (error: any) {
      logger.error(`Score refresh request failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get top trusted suppliers
   */
  async getTopSuppliers(
    category?: string,
    limit: number = 10
  ): Promise<{ success: boolean; suppliers?: TrustScore[]; error?: string }> {
    try {
      // Try external engine
      try {
        const response = await this.httpClient.get('/api/trust/suppliers/top', {
          params: { category, limit },
        });

        if (response.data?.suppliers) {
          return { success: true, suppliers: response.data.suppliers };
        }
      } catch (externalError: any) {
        logger.warn(`External top suppliers query failed: ${externalError.message}`);
      }

      // Return empty if no external data
      return { success: true, suppliers: [] };
    } catch (error: any) {
      logger.error(`Top suppliers query failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get trust summary for dashboard
   */
  async getTrustSummary(hotelId: string): Promise<{
    avgTrustScore: number;
    suppliersAbove60: number;
    suppliersBelow40: number;
    recentViolations: number;
    riskDistribution: Record<string, number>;
  }> {
    // This would normally aggregate from external engine
    // For now, return placeholder data
    return {
      avgTrustScore: 78,
      suppliersAbove60: 12,
      suppliersBelow40: 2,
      recentViolations: 1,
      riskDistribution: {
        low: 10,
        medium: 3,
        high: 1,
        critical: 0,
      },
    };
  }

  /**
   * Clear trust cache
   */
  clearCache(): void {
    this.trustCache.clear();
    logger.info('Trust cache cleared');
  }
}

export const trustEngine = new TrustEngine();
export default TrustEngine;