/**
 * STAYBOT - Negotiation Engine Integration
 * Handles agent-to-agent negotiations via HOJAI Negotiation Engine (Port 4191)
 * Part of the RTNM Economic Network
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

const NEGOTIATION_ENGINE_URL = process.env.NEGOTIATION_ENGINE_URL || 'http://localhost:4191';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';

export interface NegotiationOffer {
  offerId: string;
  type: 'price' | 'service' | 'contract' | 'partnership';
  fromAgent: string;
  toAgent: string;
  terms: {
    price?: number;
    quantity?: number;
    delivery?: string;
    paymentTerms?: string;
    quality?: string;
    duration?: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
  counterOffer?: NegotiationOffer;
  history: NegotiationOffer[];
}

export interface NegotiationContext {
  hotelId: string;
  agentId: string;
  agentType: string;
  negotiationType: 'supplier' | 'partner' | 'guest' | 'internal';
  maxRounds: number;
  timeout: number; // seconds
}

export class NegotiationEngine {
  private activeNegotiations: Map<string, NegotiationOffer> = new Map();
  private httpClient: axios.AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      baseURL: NEGOTIATION_ENGINE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
    });
  }

  /**
   * Initiate a negotiation
   */
  async initiateNegotiation(
    context: NegotiationContext,
    terms: NegotiationOffer['terms'],
    counterparty: string
  ): Promise<{ success: boolean; offer?: NegotiationOffer; error?: string }> {
    try {
      const offer: NegotiationOffer = {
        offerId: `NEG-${Date.now().toString(36).toUpperCase()}`,
        type: 'price', // Default
        fromAgent: context.agentId,
        toAgent: counterparty,
        terms,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + context.timeout * 1000),
        history: [],
      };

      // Try to use external negotiation engine
      try {
        const response = await this.httpClient.post('/api/negotiations/create', {
          negotiationId: offer.offerId,
          fromAgent: context.agentId,
          toAgent: counterparty,
          terms,
          context: {
            hotelId: context.hotelId,
            negotiationType: context.negotiationType,
          },
        });

        if (response.data?.negotiationId) {
          offer.offerId = response.data.negotiationId;
        }
      } catch (externalError: any) {
        logger.warn(`External negotiation engine unavailable: ${externalError.message}`);
      }

      this.activeNegotiations.set(offer.offerId, offer);

      logger.info(`Negotiation initiated: ${offer.offerId}`, {
        offerId: offer.offerId,
        from: context.agentId,
        to: counterparty,
        terms,
      });

      return { success: true, offer };
    } catch (error: any) {
      logger.error(`Negotiation initiation failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Accept a negotiation offer
   */
  async acceptOffer(
    offerId: string,
    agentId: string
  ): Promise<{ success: boolean; offer?: NegotiationOffer; error?: string }> {
    const offer = this.activeNegotiations.get(offerId);
    if (!offer) {
      return { success: false, error: 'Negotiation not found' };
    }

    if (offer.toAgent !== agentId) {
      return { success: false, error: 'Not authorized to accept this offer' };
    }

    offer.status = 'accepted';
    this.activeNegotiations.set(offerId, offer);

    logger.info(`Negotiation accepted: ${offerId}`, {
      offerId,
      acceptedBy: agentId,
    });

    return { success: true, offer };
  }

  /**
   * Reject a negotiation offer
   */
  async rejectOffer(
    offerId: string,
    agentId: string,
    reason?: string
  ): Promise<{ success: boolean; offer?: NegotiationOffer; error?: string }> {
    const offer = this.activeNegotiations.get(offerId);
    if (!offer) {
      return { success: false, error: 'Negotiation not found' };
    }

    offer.status = 'rejected';
    this.activeNegotiations.set(offerId, offer);

    logger.info(`Negotiation rejected: ${offerId}`, {
      offerId,
      rejectedBy: agentId,
      reason,
    });

    return { success: true, offer };
  }

  /**
   * Counter an offer
   */
  async counterOffer(
    offerId: string,
    counterparty: string,
    newTerms: NegotiationOffer['terms']
  ): Promise<{ success: boolean; offer?: NegotiationOffer; error?: string }> {
    const originalOffer = this.activeNegotiations.get(offerId);
    if (!originalOffer) {
      return { success: false, error: 'Negotiation not found' };
    }

    // Create counter offer
    const counterOffer: NegotiationOffer = {
      offerId: `NEG-${Date.now().toString(36).toUpperCase()}`,
      type: originalOffer.type,
      fromAgent: originalOffer.toAgent,
      toAgent: originalOffer.fromAgent,
      terms: newTerms,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 300000), // 5 minutes
      history: [...originalOffer.history, originalOffer],
    };

    // Update original offer with counter reference
    originalOffer.status = 'countered';
    originalOffer.counterOffer = counterOffer;
    this.activeNegotiations.set(offerId, originalOffer);

    // Store counter offer
    this.activeNegotiations.set(counterOffer.offerId, counterOffer);

    logger.info(`Counter offer created: ${counterOffer.offerId}`, {
      originalOfferId: offerId,
      counterOfferId: counterOffer.offerId,
      newTerms,
    });

    return { success: true, offer: counterOffer };
  }

  /**
   * Get negotiation by ID
   */
  getNegotiation(offerId: string): NegotiationOffer | null {
    return this.activeNegotiations.get(offerId) || null;
  }

  /**
   * Get active negotiations for agent
   */
  getActiveNegotiations(agentId: string): NegotiationOffer[] {
    return Array.from(this.activeNegotiations.values()).filter(
      (offer) =>
        (offer.fromAgent === agentId || offer.toAgent === agentId) &&
        offer.status === 'pending'
    );
  }

  /**
   * Expire old negotiations
   */
  expireOldNegotiations(): number {
    const now = Date.now();
    let expiredCount = 0;

    for (const [id, offer] of this.activeNegotiations.entries()) {
      if (
        offer.status === 'pending' &&
        offer.expiresAt &&
        new Date(offer.expiresAt).getTime() < now
      ) {
        offer.status = 'expired';
        this.activeNegotiations.set(id, offer);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.info(`Expired ${expiredCount} negotiations`);
    }

    return expiredCount;
  }

  /**
   * Calculate optimal price based on demand and competition
   */
  async calculateOptimalPrice(
    context: NegotiationContext,
    basePrice: number,
    demandFactor: number, // 0.5 to 1.5
    competitionFactor: number // 0.8 to 1.2
  ): Promise<number> {
    // Try to use external engine for complex calculations
    try {
      const response = await this.httpClient.post('/api/negotiations/calculate', {
        basePrice,
        demandFactor,
        competitionFactor,
        context: {
          hotelId: context.hotelId,
          agentType: context.agentType,
        },
      });

      if (response.data?.optimalPrice) {
        return response.data.optimalPrice;
      }
    } catch (externalError: any) {
      logger.warn(`Price calculation using local logic: ${externalError.message}`);
    }

    // Local calculation
    const adjustedPrice = basePrice * demandFactor * competitionFactor;
    const minPrice = basePrice * 0.7; // Don't go below 70% of base
    const maxPrice = basePrice * 1.5; // Don't go above 150% of base

    return Math.round(Math.max(minPrice, Math.min(maxPrice, adjustedPrice)));
  }

  /**
   * Evaluate offer fairness
   */
  evaluateOfferFairness(
    offer: NegotiationOffer,
    marketPrice: number,
    agentType: string
  ): { fair: boolean; score: number; analysis: string } {
    const offerPrice = offer.terms.price || 0;
    const deviation = Math.abs(offerPrice - marketPrice) / marketPrice;

    let score = 100;
    let analysis = '';

    // Check price deviation
    if (deviation > 0.3) {
      score -= 30;
      analysis += 'Significant price deviation from market. ';
    } else if (deviation > 0.15) {
      score -= 15;
      analysis += 'Moderate price deviation from market. ';
    } else {
      analysis += 'Price within acceptable range. ';
    }

    // Check terms completeness
    const hasRequiredTerms =
      offer.terms.price !== undefined &&
      offer.terms.quantity !== undefined;

    if (!hasRequiredTerms) {
      score -= 20;
      analysis += 'Incomplete terms. ';
    } else {
      analysis += 'All required terms present. ';
    }

    // Check delivery terms
    if (offer.terms.delivery) {
      score += 5;
      analysis += 'Delivery terms specified. ';
    }

    // Check payment terms
    if (offer.terms.paymentTerms) {
      score += 5;
      analysis += 'Payment terms specified. ';
    }

    const fair = score >= 70;

    return { fair, score: Math.max(0, score), analysis };
  }
}

export const negotiationEngine = new NegotiationEngine();
export default NegotiationEngine;