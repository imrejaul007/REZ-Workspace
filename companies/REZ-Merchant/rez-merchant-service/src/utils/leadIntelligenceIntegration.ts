/**
 * LEAD INTELLIGENCE INTEGRATION
 * Connects Merchant Service to Lead Intelligence Service
 */

import axios from 'axios';
import { logger } from '../config/logger';

const LEAD_INTELLIGENCE_URL = process.env.LEAD_INTELLIGENCE_URL || 'http://localhost:4106';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

// Fail-closed: prevent calls if token is not configured
if (!INTERNAL_TOKEN) {
  throw new Error('INTERNAL_SERVICE_TOKEN environment variable is required for internal service authentication');
}

// Circuit Breaker Configuration
interface CircuitBreaker {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuits: Record<string, CircuitBreaker> = {};
const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT = 60000;

// Personalized offer structure
interface PersonalizedOffer {
  offerId: string;
  title: string;
  description: string;
  discount: number;
  expiresAt: string;
}

/**
 * Call downstream service with circuit breaker protection
 */
async function callWithCircuitBreaker<T>(
  service: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  const circuit = circuits[service] || { failures: 0, lastFailure: 0, state: 'closed' };

  if (circuit.state === 'open') {
    if (Date.now() - circuit.lastFailure > RESET_TIMEOUT) {
      circuit.state = 'half-open';
      logger.info(`[CircuitBreaker] ${service} transitioning to half-open`);
    } else {
      logger.warn(`[CircuitBreaker] ${service} circuit is open, returning fallback`);
      return fallback;
    }
  }

  try {
    const result = await fn();
    if (circuit.state === 'half-open') {
      circuit.state = 'closed';
      circuit.failures = 0;
      logger.info(`[CircuitBreaker] ${service} circuit closed, service recovered`);
    }
    circuits[service] = circuit;
    return result;
  } catch (error: unknown) {
    circuit.failures++;
    circuit.lastFailure = Date.now();
    if (circuit.failures >= FAILURE_THRESHOLD) {
      circuit.state = 'open';
      logger.error(`[CircuitBreaker] ${service} circuit opened after ${circuit.failures} failures`);
    }
    circuits[service] = circuit;
    return fallback;
  }
}

interface LeadScore {
  userId: string;
  temperature: 'hot' | 'warm' | 'cold';
  score: number;
  signals: {
    recentSearches: number;
    abandonedCarts: number;
    viewedProducts: number;
    lastActiveHours: number;
    intentStrength: number;
  };
  recommendedChannel: string;
}

/**
 * Get lead score for a user
 */
export async function getLeadScore(userId: string): Promise<LeadScore | null> {
  return callWithCircuitBreaker(
    'lead-intelligence',
    async () => {
      const response = await axios.get(`${LEAD_INTELLIGENCE_URL}/api/leads/${userId}/score`, {
        headers: {
          'x-internal-token': INTERNAL_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
      return response.data;
    },
    null
  );
}

/**
 * Get all hot leads for a merchant
 */
export async function getHotLeads(merchantId: string): Promise<LeadScore[]> {
  return callWithCircuitBreaker(
    'lead-intelligence',
    async () => {
      const response = await axios.get(`${LEAD_INTELLIGENCE_URL}/api/leads/hot`, {
        params: { merchantId },
        headers: {
          'x-internal-token': INTERNAL_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return response.data.leads || [];
    },
    []
  );
}

/**
 * Get all warm leads for a merchant
 */
export async function getWarmLeads(merchantId: string): Promise<LeadScore[]> {
  return callWithCircuitBreaker(
    'lead-intelligence',
    async () => {
      const response = await axios.get(`${LEAD_INTELLIGENCE_URL}/api/leads/warm`, {
        params: { merchantId },
        headers: {
          'x-internal-token': INTERNAL_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return response.data.leads || [];
    },
    []
  );
}

/**
 * Get all cold leads for a merchant
 */
export async function getColdLeads(merchantId: string): Promise<LeadScore[]> {
  return callWithCircuitBreaker(
    'lead-intelligence',
    async () => {
      const response = await axios.get(`${LEAD_INTELLIGENCE_URL}/api/leads/cold`, {
        params: { merchantId },
        headers: {
          'x-internal-token': INTERNAL_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return response.data.leads || [];
    },
    []
  );
}

/**
 * Track abandoned cart for a user
 */
export async function trackAbandonedCart(
  userId: string,
  merchantId: string,
  cartItems: { productId: string; price: number }[],
  totalValue: number
): Promise<void> {
  return callWithCircuitBreaker(
    'lead-intelligence',
    async () => {
      await axios.post(`${LEAD_INTELLIGENCE_URL}/api/abandonment/cart`, {
        userId,
        merchantId,
        cartItems,
        totalValue,
      }, {
        headers: {
          'x-internal-token': INTERNAL_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
    },
    undefined
  );
}

/**
 * Track abandoned search for a user
 */
export async function trackAbandonedSearch(
  userId: string,
  merchantId: string,
  query: string,
  intentDetected: string
): Promise<void> {
  return callWithCircuitBreaker(
    'lead-intelligence',
    async () => {
      await axios.post(`${LEAD_INTELLIGENCE_URL}/api/abandonment/search`, {
        userId,
        merchantId,
        query,
        intentDetected,
      }, {
        headers: {
          'x-internal-token': INTERNAL_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
    },
    undefined
  );
}

/**
 * Get personalized offers for a user
 */
export async function getPersonalizedOffers(
  userId: string,
  merchantId: string,
  limit: number = 5
): Promise<PersonalizedOffer[]> {
  return callWithCircuitBreaker(
    'lead-intelligence',
    async () => {
      const response = await axios.get(`${LEAD_INTELLIGENCE_URL}/api/offers/personalized`, {
        params: { userId, merchantId, limit },
        headers: {
          'x-internal-token': INTERNAL_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return (response.data.offers || []) as PersonalizedOffer[];
    },
    []
  );
}

/**
 * Trigger re-engagement for a user
 */
export async function triggerReEngagement(
  userId: string,
  reason: 'abandoned_cart' | 'abandoned_search' | 'inactive' | 'price_drop'
): Promise<void> {
  return callWithCircuitBreaker(
    'lead-intelligence',
    async () => {
      await axios.post(`${LEAD_INTELLIGENCE_URL}/api/reengagement/trigger`, {
        userId,
        reason,
      }, {
        headers: {
          'x-internal-token': INTERNAL_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
    },
    undefined
  );
}

/**
 * Get merchant's customer intelligence summary
 */
export async function getCustomerIntelligenceSummary(
  merchantId: string
): Promise<{
  totalCustomers: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
  avgLeadScore: number;
}> {
  return callWithCircuitBreaker(
    'lead-intelligence',
    async () => {
      const [hot, warm, cold] = await Promise.all([
        getHotLeads(merchantId),
        getWarmLeads(merchantId),
        getColdLeads(merchantId),
      ]);

      const allLeads = [...hot, ...warm, ...cold];
      const avgScore = allLeads.length > 0
        ? allLeads.reduce((sum, l) => sum + l.score, 0) / allLeads.length
        : 0;

      return {
        totalCustomers: allLeads.length,
        hotCount: hot.length,
        warmCount: warm.length,
        coldCount: cold.length,
        avgLeadScore: Math.round(avgScore),
      };
    },
    {
      totalCustomers: 0,
      hotCount: 0,
      warmCount: 0,
      coldCount: 0,
      avgLeadScore: 0,
    }
  );
}
