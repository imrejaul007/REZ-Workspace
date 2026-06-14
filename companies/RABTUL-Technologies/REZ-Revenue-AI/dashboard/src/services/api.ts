/**
 * REZ Revenue AI - API Service
 * Connects dashboard to REZ Revenue AI Platform
 * @module services/api
 * @author RTNM Digital
 * @version 1.0.0
 *
 * Environment Variables (prefix with VITE_ for Vite):
 * - VITE_API_BASE_1: Pricing Engine (default: 4301)
 * - VITE_API_BASE_2: Demand Forecast (default: 4302)
 * - VITE_API_BASE_4: Revenue Copilot (default: 4307)
 * - VITE_API_BASE_5: Simulation (default: 4308)
 * - VITE_API_BASE_6: Benchmark (default: 4309)
 * - VITE_API_BASE_7: Segment Brain (default: 4310)
 * - VITE_API_BASE_8: Campaign (default: 4311)
 * - VITE_API_BASE_9: MerchantGPT (default: 4312)
 */

const API_BASE = import.meta.env.VITE_API_BASE_1 || 'http://localhost:4301'; // Pricing Engine
const API_BASE_2 = import.meta.env.VITE_API_BASE_2 || 'http://localhost:4302'; // Demand Forecast
const API_BASE_4 = import.meta.env.VITE_API_BASE_4 || 'http://localhost:4307'; // Revenue Copilot
const API_BASE_5 = import.meta.env.VITE_API_BASE_5 || 'http://localhost:4308'; // Simulation
const API_BASE_6 = import.meta.env.VITE_API_BASE_6 || 'http://localhost:4309'; // Benchmark
const API_BASE_7 = import.meta.env.VITE_API_BASE_7 || 'http://localhost:4310'; // Segment Brain
const API_BASE_8 = import.meta.env.VITE_API_BASE_8 || 'http://localhost:4311'; // Campaign
const API_BASE_9 = import.meta.env.VITE_API_BASE_9 || 'http://localhost:4312'; // MerchantGPT

/**
 * @typedef {Object} PricingResult
 * @property {number} finalPrice - Final calculated price
 * @property {number} originalPrice - Original base price
 * @property {number} adjustment - Price adjustment amount
 * @property {string} adjustmentType - Type of adjustment applied
 * @property {Array<{name: string, reason: string, contribution: number}>} factors - Pricing factors
 */

/**
 * @typedef {Object} BenchmarkResult
 * @property {number} overallScore - Overall benchmark score
 * @property {string} percentile - Performance percentile
 * @property {string} letterGrade - Letter grade (A-F)
 * @property {Array<{metric: string, score: number, categoryRank: string}>} breakdown - Score breakdown
 */

/**
 * @typedef {Object} SegmentResult
 * @property {Array<{name: string, count: number, percentage: number}>} segments - Customer segments
 */

/**
 * @typedef {Object} ChatResult
 * @property {string} response - Agent response text
 * @property {string} intent - Detected user intent
 * @property {Array<{title: string, id: string}>} [actions] - Suggested actions
 */

/**
 * Calculate dynamic price for a product/item
 * @param {Object} params - Pricing parameters
 * @param {string} params.itemId - Unique item identifier
 * @param {number} params.basePrice - Base price of the item
 * @param {number} params.cost - Cost of the item
 * @param {string} params.category - Item category
 * @param {Date} params.time - Time for contextual pricing
 * @param {number} [params.tablesRemaining] - Available tables (for restaurants)
 * @param {number} [params.totalTables] - Total tables (for restaurants)
 * @param {string} [params.customerSegment] - Customer segment for personalization
 * @returns {Promise<PricingResult | null>} Pricing result or null on error
 * @throws {Error} When API call fails
 *
 * @example
 * const result = await calculatePrice({
 *   itemId: 'pizza_001',
 *   basePrice: 299,
 *   cost: 120,
 *   category: 'pizza',
 *   time: new Date()
 * });
 */
export async function calculatePrice(params: {
  itemId: string;
  basePrice: number;
  cost: number;
  category: string;
  time: Date;
  tablesRemaining?: number;
  totalTables?: number;
  customerSegment?: string;
}): Promise<PricingResult | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/pricing/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          entity: {
            id: params.itemId,
            type: 'product',
            category: params.category,
            vertical: 'restaurant',
            name: params.itemId,
            basePrice: params.basePrice,
            cost: params.cost,
          },
          time: {
            dayOfWeek: params.time.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            hourOfDay: params.time.getHours(),
            isWeekend: params.time.getDay() === 0 || params.time.getDay() === 6,
          },
          inventory: params.tablesRemaining !== undefined ? {
            slotsRemaining: params.tablesRemaining,
            totalSlots: params.totalTables,
          } : undefined,
        },
      }),
    });

    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Pricing API error:', error);
    return null;
  }
}

/**
 * Get benchmark score for a merchant
 * @param {string} merchantId - Unique merchant identifier
 * @returns {Promise<BenchmarkResult | null>} Benchmark result or null on error
 * @example
 * const benchmark = await getBenchmark('merchant_123');
 */
export async function getBenchmark(merchantId: string): Promise<BenchmarkResult | null> {
  try {
    const response = await fetch(`${API_BASE_6}/api/v1/benchmarks/${merchantId}`);
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Benchmark API error:', error);
    return null;
  }
}

/**
 * Get customer segments summary for a merchant
 * @param {string} merchantId - Unique merchant identifier
 * @returns {Promise<SegmentResult | null>} Segment result or null on error
 * @example
 * const segments = await getSegments('merchant_123');
 */
export async function getSegments(merchantId: string): Promise<SegmentResult | null> {
  try {
    const response = await fetch(`${API_BASE_7}/api/v1/segments/${merchantId}/summary`);
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Segments API error:', error);
    return null;
  }
}

/**
 * Chat with MerchantGPT AI agent
 * @param {string} question - User's question
 * @param {string} [merchantId='demo_merchant'] - Unique merchant identifier
 * @returns {Promise<ChatResult | null>} Chat result or null on error
 * @example
 * const chat = await chat('How can I increase sales?', 'merchant_123');
 */
export async function chat(question: string, merchantId: string = 'demo_merchant'): Promise<ChatResult | null> {
  try {
    const response = await fetch(`${API_BASE_9}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId,
        message: question,
      }),
    });

    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Chat API error:', error);
    return null;
  }
}

/**
 * Get AI-generated revenue plan
 * @param {string} merchantId - Unique merchant identifier
 * @param {Object} goal - Revenue goal parameters
 * @param {string} goal.type - Goal type (e.g., 'increase_revenue', 'reduce_costs')
 * @param {number} goal.target - Target value (e.g., 50000 for ₹50K)
 * @param {string} goal.timeframe - Timeframe (e.g., 'month', 'week')
 * @returns {Promise<any | null>} Revenue plan or null on error
 * @example
 * const plan = await getRevenuePlan('merchant_123', {
 *   type: 'increase_revenue',
 *   target: 50000,
 *   timeframe: 'month'
 * });
 */
export async function getRevenuePlan(
  merchantId: string,
  goal: { type: string; target: number; timeframe: string }
): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_4}/api/v1/copilot/revenue-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId,
        goal,
      }),
    });

    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Revenue plan API error:', error);
    return null;
  }
}

/**
 * Generate marketing campaign using AI
 * @param {Object} params - Campaign parameters
 * @param {string} params.merchantId - Unique merchant identifier
 * @param {string} params.objective - Campaign objective
 * @param {string} params.target - Target audience
 * @param {Object} params.offer - Offer details
 * @param {string} params.offer.type - Offer type (e.g., 'discount', 'cashback')
 * @param {number} params.offer.value - Offer value
 * @param {string[]} params.channels - Marketing channels
 * @returns {Promise<any | null>} Generated campaign or null on error
 * @example
 * const campaign = await generateCampaign({
 *   merchantId: 'merchant_123',
 *   objective: 'increase_footfall',
 *   target: 'regular_customers',
 *   offer: { type: 'cashback', value: 10 },
 *   channels: ['whatsapp', 'sms']
 * });
 */
export async function generateCampaign(params: {
  merchantId: string;
  objective: string;
  target: string;
  offer: { type: string; value: number };
  channels: string[];
}): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_8}/api/v1/campaigns/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Campaign API error:', error);
    return null;
  }
}

/**
 * Run revenue simulation scenario
 * @param {Object} params - Simulation parameters
 * @param {string} params.merchantId - Unique merchant identifier
 * @param {Object} params.scenario - Scenario to simulate
 * @param {string} params.scenario.type - Scenario type (e.g., 'price_change', 'promotion')
 * @param {Record<string, number>} params.scenario.changes - Variable changes
 * @returns {Promise<any | null>} Simulation result or null on error
 * @example
 * const result = await simulateScenario({
 *   merchantId: 'merchant_123',
 *   scenario: {
 *     type: 'price_change',
 *     changes: { discount: 15, expected_demand: 20 }
 *   }
 * });
 */
export async function simulateScenario(params: {
  merchantId: string;
  scenario: { type: string; changes: Record<string, number> };
}): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_5}/api/v1/simulation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Simulation API error:', error);
    return null;
  }
}