/**
 * BuzzLocal → Karma Foundation Bridge
 *
 * Earn Karma Foundation points for BuzzLocal activities:
 * - Check-ins
 * - Asking questions
 * - Answering questions
 * - Reporting safety alerts
 * - Buying/selling locally
 *
 * Connects to: karma-foundation-service (Port 3009)
 */

import axios from 'axios';

const KARMA_SERVICE_URL = process.env.KARMA_FOUNDATION_URL || 'http://localhost:3009';
const BUZZLOCAL_OFFERS_URL = process.env.BUZZLOCAL_OFFERS_URL || 'http://localhost:4023';

interface KarmaEarnRequest {
  userId: string;
  buzzUserId: string;
  action: 'checkin' | 'ask_question' | 'answer_question' | 'safety_alert' | 'local_purchase' | 'local_sale' | 'community_contribution';
  points: number;
  metadata?: {
    area?: string;
    queryId?: string;
    alertId?: string;
    listingId?: string;
    amount?: number;
  };
}

interface KarmaRedeemRequest {
  userId: string;
  buzzUserId: string;
  offerId: string;
  points: number;
  merchantId: string;
}

interface OfferRedemption {
  offerId: string;
  merchantId: string;
  discount: string;
  pointsCost: number;
  expiresAt: Date;
}

export class BuzzLocalKarmaBridge {
  private karmaClient: axios.AxiosInstance;
  private offersClient: axios.AxiosInstance;

  constructor() {
    this.karmaClient = axios.create({
      baseURL: KARMA_SERVICE_URL,
      timeout: 5000,
      headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
    });

    this.offersClient = axios.create({
      baseURL: BUZZLOCAL_OFFERS_URL,
      timeout: 5000,
      headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
    });
  }

  // ===== KARMA EARNING =====

  /**
   * Earn Karma for BuzzLocal check-in
   */
  async earnForCheckin(userId: string, buzzUserId: string, area: string): Promise<{ success: boolean; karma: number }> {
    return this.earnKarma({
      userId,
      buzzUserId,
      action: 'checkin',
      points: 5,
      metadata: { area }
    });
  }

  /**
   * Earn Karma for asking a question
   */
  async earnForQuestion(userId: string, buzzUserId: string, queryId: string): Promise<{ success: boolean; karma: number }> {
    return this.earnKarma({
      userId,
      buzzUserId,
      action: 'ask_question',
      points: 2,
      metadata: { queryId }
    });
  }

  /**
   * Earn Karma for answering a question
   */
  async earnForAnswer(userId: string, buzzUserId: string, queryId: string): Promise<{ success: boolean; karma: number }> {
    return this.earnKarma({
      userId,
      buzzUserId,
      action: 'answer_question',
      points: 10,
      metadata: { queryId }
    });
  }

  /**
   * Earn Karma for helpful answer
   */
  async earnForHelpfulAnswer(userId: string, buzzUserId: string, queryId: string): Promise<{ success: boolean; karma: number }> {
    return this.earnKarma({
      userId,
      buzzUserId,
      action: 'answer_question',
      points: 25,
      metadata: { queryId }
    });
  }

  /**
   * Earn Karma for safety alert
   */
  async earnForSafetyAlert(userId: string, buzzUserId: string, alertId: string): Promise<{ success: boolean; karma: number }> {
    return this.earnKarma({
      userId,
      buzzUserId,
      action: 'safety_alert',
      points: 30,
      metadata: { alertId }
    });
  }

  /**
   * Earn Karma for verified safety alert
   */
  async earnForVerifiedAlert(userId: string, buzzUserId: string, alertId: string): Promise<{ success: boolean; karma: number }> {
    return this.earnKarma({
      userId,
      buzzUserId,
      action: 'safety_alert',
      points: 50,
      metadata: { alertId }
    });
  }

  /**
   * Earn Karma for local purchase
   */
  async earnForLocalPurchase(userId: string, buzzUserId: string, listingId: string, amount: number): Promise<{ success: boolean; karma: number }> {
    // 1 karma per ₹100 spent
    const points = Math.floor(amount / 100);
    return this.earnKarma({
      userId,
      buzzUserId,
      action: 'local_purchase',
      points,
      metadata: { listingId, amount }
    });
  }

  /**
   * Earn Karma for local sale
   */
  async earnForLocalSale(userId: string, buzzUserId: string, listingId: string, amount: number): Promise<{ success: boolean; karma: number }> {
    // 2 karma per ₹100 earned
    const points = Math.floor(amount / 50);
    return this.earnKarma({
      userId,
      buzzUserId,
      action: 'local_sale',
      points,
      metadata: { listingId, amount }
    });
  }

  /**
   * Earn Karma for community contribution
   */
  async earnForContribution(userId: string, buzzUserId: string): Promise<{ success: boolean; karma: number }> {
    return this.earnKarma({
      userId,
      buzzUserId,
      action: 'community_contribution',
      points: 15,
      metadata: {}
    });
  }

  private async earnKarma(request: KarmaEarnRequest): Promise<{ success: boolean; karma: number }> {
    try {
      const response = await this.karmaClient.post('/api/karma/earn', {
        userId: request.buzzUserId, // Use BuzzLocal user ID
        points: request.points,
        reason: `buzzlocal_${request.action}`,
        source: 'buzzlocal',
        metadata: request.metadata
      });

      return { success: true, karma: response.data.karma || request.points };
    } catch (error) {
      logger.error('Karma earn failed:', error.message);
      return { success: false, karma: 0 };
    }
  }

  // ===== KARMA REDEMPTION =====

  /**
   * Get available offers for karma redemption
   */
  async getAvailableOffers(userId: string): Promise<OfferRedemption[]> {
    try {
      const response = await this.offersClient.get('/api/offers/nearby', {
        params: { userId }
      });

      return response.data.offers.map((offer) => ({
        offerId: offer._id,
        merchantId: offer.merchantId,
        discount: `${offer.discount}% off`,
        pointsCost: Math.floor(offer.discount * 10), // 1 point per 1% discount
        expiresAt: new Date(offer.validUntil)
      }));
    } catch (error) {
      logger.error('Get offers failed:', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  /**
   * Redeem karma for an offer
   */
  async redeemForOffer(request: KarmaRedeemRequest): Promise<{
    success: boolean;
    redemptionCode?: string;
    discount?: string;
    error?: string;
  }> {
    try {
      // First check karma balance
      const balanceResponse = await this.karmaClient.get(`/api/karma/balance/${request.buzzUserId}`);
      const balance = balanceResponse.data.balance;

      if (balance < request.points) {
        return { success: false, error: 'Insufficient karma points' };
      }

      // Redeem karma
      await this.karmaClient.post('/api/karma/redeem', {
        userId: request.buzzUserId,
        points: request.points,
        reason: 'buzzlocal_offer_redemption',
        metadata: { offerId: request.offerId, merchantId: request.merchantId }
      });

      // Get offer details for redemption code
      const offerResponse = await this.offersClient.get(`/api/offers/${request.offerId}`);
      const offer = offerResponse.data.offer;

      return {
        success: true,
        redemptionCode: `BL-${offer._id.toString().slice(-6).toUpperCase()}`,
        discount: `${offer.discount}% off at ${offer.merchantName}`
      };
    } catch (error) {
      logger.error('Redemption failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ===== BALANCE & HISTORY =====

  /**
   * Get karma balance
   */
  async getBalance(userId: string): Promise<{ balance: number; tier: string }> {
    try {
      const response = await this.karmaClient.get(`/api/karma/balance/${userId}`);
      return response.data;
    } catch (error) {
      return { balance: 0, tier: 'bronze' };
    }
  }

  /**
   * Get karma transaction history
   */
  async getHistory(userId: string, limit = 20): Promise<unknown[]> {
    try {
      const response = await this.karmaClient.get(`/api/karma/history/${userId}`, {
        params: { limit }
      });
      return response.data.transactions || [];
    } catch (error) {
      return [];
    }
  }
}

// Singleton instance
export const buzzLocalKarmaBridge = new BuzzLocalKarmaBridge();


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-buzzlocal-karma-bridge',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
