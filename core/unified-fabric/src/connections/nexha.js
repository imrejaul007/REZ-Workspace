/**
 * Nexha Commerce Network Connection Module
 * Connects Nexha services to RTMN Core Platform
 */

// Use built-in fetch (Node 18+) via globalThis so tests that swap
// `globalThis.fetch` are picked up. Falls back to dynamic import of
// node-fetch if running on an older Node where globalThis.fetch is
// not available (rare in practice).
if (!globalThis.fetch) {
  globalThis.fetch = (await import('node-fetch')).default;
}
const fetch = (...args) => globalThis.fetch(...args);

const NEXHA_GATEWAY_URL = process.env.NEXHA_GATEWAY_URL || 'http://localhost:5002';
const NEXHA_DISTRIBUTION_URL = process.env.NEXHA_DISTRIBUTION_URL || 'http://localhost:4300';
const NEXHA_FRANCHISE_URL = process.env.NEXHA_FRANCHISE_URL || 'http://localhost:4310';
const NEXHA_PROCUREMENT_URL = process.env.NEXHA_PROCUREMENT_URL || 'http://localhost:4320';
const NEXHA_TRADE_FINANCE_URL = process.env.NEXHA_TRADE_FINANCE_URL || 'http://localhost:4340';
const NEXHA_INTELLIGENCE_URL = process.env.NEXHA_INTELLIGENCE_URL || 'http://localhost:4350';
const NEXHA_CONNECTOR_URL = process.env.NEXHA_CONNECTOR_URL || 'http://localhost:4399';
// ADR-0009 Phase 3 (2026-06-22) — business directory reached via the Hub.
const NEXHA_BUSINESS_DIRECTORY_URL = process.env.NEXHA_BUSINESS_DIRECTORY_URL || 'http://localhost:4360';
const RTMN_HUB_URL = process.env.RTMN_HUB_URL || NEXHA_CONNECTOR_URL;

/**
 * Nexha Connection Interface
 */
export class NexhaConnection {
  constructor(config = {}) {
    this.logger = config.logger;
    this.token = config.token;
  }

  get headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  // ============================================
  // DISTRIBUTION
  // ============================================
  async getDistributors(params = {}) {
    try {
      const response = await fetch(`${NEXHA_DISTRIBUTION_URL}/api/distributors`, {
        headers: this.headers
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Distributors unavailable:', error.message);
      return null;
    }
  }

  async createVanSale(saleData) {
    try {
      const response = await fetch(`${NEXHA_DISTRIBUTION_URL}/api/van-sales`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(saleData)
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Van sale creation unavailable:', error.message);
      return null;
    }
  }

  async getCollections(params = {}) {
    try {
      const response = await fetch(`${NEXHA_DISTRIBUTION_URL}/api/collections`, {
        headers: this.headers
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Collections unavailable:', error.message);
      return null;
    }
  }

  // ============================================
  // FRANCHISE
  // ============================================
  async getFranchises(params = {}) {
    try {
      const response = await fetch(`${NEXHA_FRANCHISE_URL}/api/franchises`, {
        headers: this.headers
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Franchises unavailable:', error.message);
      return null;
    }
  }

  async calculateRoyalty(franchiseId, period) {
    try {
      const response = await fetch(`${NEXHA_FRANCHISE_URL}/api/franchises/${franchiseId}/royalty/calculate`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ period })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Royalty calculation unavailable:', error.message);
      return null;
    }
  }

  // ============================================
  // PROCUREMENT
  // ============================================
  async getSuppliers(params = {}) {
    try {
      const response = await fetch(`${NEXHA_PROCUREMENT_URL}/api/suppliers`, {
        headers: this.headers
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Suppliers unavailable:', error.message);
      return null;
    }
  }

  async createRFQ(rfqData) {
    try {
      const response = await fetch(`${NEXHA_PROCUREMENT_URL}/api/rfqs`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(rfqData)
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('RFQ creation unavailable:', error.message);
      return null;
    }
  }

  async submitQuote(rfqId, quoteData) {
    try {
      const response = await fetch(`${NEXHA_PROCUREMENT_URL}/api/rfqs/${rfqId}/quotes`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(quoteData)
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Quote submission unavailable:', error.message);
      return null;
    }
  }

  // ============================================
  // TRADE FINANCE
  // ============================================
  async applyForCredit(applicationData) {
    try {
      const response = await fetch(`${NEXHA_TRADE_FINANCE_URL}/api/credits/apply`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(applicationData)
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Credit application unavailable:', error.message);
      return null;
    }
  }

  async createBNPL(bnplData) {
    try {
      const response = await fetch(`${NEXHA_TRADE_FINANCE_URL}/api/bnpl/create`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(bnplData)
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('BNPL creation unavailable:', error.message);
      return null;
    }
  }

  async getRiskAssessment(merchantId) {
    try {
      const response = await fetch(`${NEXHA_TRADE_FINANCE_URL}/api/risk/${merchantId}`, {
        headers: this.headers
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Risk assessment unavailable:', error.message);
      return null;
    }
  }

  // ============================================
  // INTELLIGENCE
  // ============================================
  async predictDemand(params) {
    try {
      const response = await fetch(`${NEXHA_INTELLIGENCE_URL}/api/predict/demand`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(params)
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Demand prediction unavailable:', error.message);
      return null;
    }
  }

  async getReorderRecommendation(productId) {
    try {
      const response = await fetch(`${NEXHA_INTELLIGENCE_URL}/api/predict/reorder`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ productId })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Reorder recommendation unavailable:', error.message);
      return null;
    }
  }

  async scoreSupplier(supplierId) {
    try {
      const response = await fetch(`${NEXHA_INTELLIGENCE_URL}/api/score/supplier`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ supplierId })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Supplier scoring unavailable:', error.message);
      return null;
    }
  }

  async getAnalytics(query) {
    try {
      const response = await fetch(`${NEXHA_INTELLIGENCE_URL}/api/analytics/overview`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Analytics unavailable:', error.message);
      return null;
    }
  }

  // ============================================
  // EVENT BUS (Ecosystem Connector)
  // ============================================
  async publishEvent(eventData) {
    try {
      const response = await fetch(`${NEXHA_CONNECTOR_URL}/api/events`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(eventData)
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Event publish unavailable:', error.message);
      return null;
    }
  }

  async getEventHistory(params = {}) {
    try {
      const response = await fetch(`${NEXHA_CONNECTOR_URL}/api/events/history`, {
        headers: this.headers
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Event history unavailable:', error.message);
      return null;
    }
  }

  // ============================================
  // BUSINESS DIRECTORY (ADR-0009 Phase 3, 2026-06-22)
  // Reachable via the RTMN Hub (recommended) OR the upstream service.
  // Real impl: companies/Nexha/services/nexha-business-directory/
  // ============================================

  /**
   * Search the registered business directory.
   * Goes through the Hub at `/api/nexha/nexha-business-directory/companies`.
   */
  async searchCompanies(query = {}) {
    const qs = new URLSearchParams();
    if (query.q) qs.set('q', query.q);
    if (query.industry) qs.set('industry', query.industry);
    if (query.capability) qs.set('capability', query.capability);
    if (query.minTrust !== undefined && query.minTrust !== null) qs.set('minTrust', String(query.minTrust));
    if (query.limit) qs.set('limit', String(query.limit));
    const path = `/api/nexha/nexha-business-directory/companies${qs.toString() ? `?${qs.toString()}` : ''}`;
    try {
      const response = await fetch(`${RTMN_HUB_URL}${path}`, {
        headers: this.headers,
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Directory search unavailable:', error.message);
      return null;
    }
  }

  /**
   * Fetch one company from the directory, enriched with public trust.
   */
  async getCompany(id) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-business-directory/companies/${encodeURIComponent(id)}`, {
        headers: this.headers,
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Directory getCompany unavailable:', error.message);
      return null;
    }
  }

  /**
   * Search AI agents linked to companies in the directory.
   */
  async searchAgents(query = {}) {
    const qs = new URLSearchParams();
    if (query.q) qs.set('q', query.q);
    if (query.category) qs.set('category', query.category);
    if (query.companyId) qs.set('companyId', query.companyId);
    if (query.limit) qs.set('limit', String(query.limit));
    const path = `/api/nexha/nexha-business-directory/agents${qs.toString() ? `?${qs.toString()}` : ''}`;
    try {
      const response = await fetch(`${RTMN_HUB_URL}${path}`, {
        headers: this.headers,
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Directory searchAgents unavailable:', error.message);
      return null;
    }
  }

  /**
   * Fetch the capability co-occurrence graph (useful for "find partners
   * like X").
   */
  async getCapabilityGraph() {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-business-directory/capabilities/graph`, {
        headers: this.headers,
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Capability graph unavailable:', error.message);
      return null;
    }
  }

  /**
   * Fetch the sanitized public trust score for one entity from SADA,
   * via the directory (never directly to SADA).
   */
  async getEntityTrust(entityId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-business-directory/trust/${encodeURIComponent(entityId)}`, {
        headers: this.headers,
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Entity trust unavailable:', error.message);
      return null;
    }
  }

  // ============================================
  // ACP-MESSAGING (ADR-0010 Phase 4, 2026-06-22)
  // Reachable via the RTMN Hub at `/api/nexha/nexha-acp-messaging/*`.
  // Real impl: companies/Nexha/services/nexha-acp-messaging/
  // Implements 8 ACP message types (QUERY, QUOTE, COUNTER, ACCEPT, REJECT,
  // ORDER, TRACK, DISPUTE) with per-tenant state-machine validation.
  // ============================================

  /**
   * Send an ACP message — either start a new negotiation (omit negotiationId)
   * or append to an existing one. The server validates the state transition
   * and returns 422 ACP_INVALID_TRANSITION on illegal moves.
   */
  async sendAcpMessage(msg) {
    try {
      const path = msg.negotiationId
        ? `/api/nexha/nexha-acp-messaging/api/negotiations/${encodeURIComponent(msg.negotiationId)}/messages`
        : '/api/nexha/nexha-acp-messaging/api/negotiations';
      const response = await fetch(`${RTMN_HUB_URL}${path}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(msg),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('ACP message send failed:', error.message);
      return null;
    }
  }

  /** Validate a message body without persisting (returns 400 on bad input). */
  async validateAcpMessage(msg) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-acp-messaging/api/validate`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(msg),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('ACP validate failed:', error.message);
      return null;
    }
  }

  /** List the tenant's negotiations (filters: status, agent, limit). */
  async listAcpNegotiations(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.status) qs.set('status', query.status);
      if (query.agent) qs.set('agent', query.agent);
      if (query.limit) qs.set('limit', String(query.limit));
      const path = `/api/nexha/nexha-acp-messaging/api/negotiations${qs.toString() ? `?${qs.toString()}` : ''}`;
      const response = await fetch(`${RTMN_HUB_URL}${path}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('ACP list negotiations failed:', error.message);
      return null;
    }
  }

  /** Get one negotiation by id. */
  async getAcpNegotiation(id) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-acp-messaging/api/negotiations/${encodeURIComponent(id)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('ACP get negotiation failed:', error.message);
      return null;
    }
  }

  /** List messages in a negotiation, in conversation order. */
  async listAcpMessages(negotiationId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-acp-messaging/api/negotiations/${encodeURIComponent(negotiationId)}/messages`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('ACP list messages failed:', error.message);
      return null;
    }
  }

  /** Per-tenant ACP stats. */
  async getAcpStats() {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-acp-messaging/api/stats`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('ACP stats failed:', error.message);
      return null;
    }
  }
}

/**
 * Nexha Integration Points
 */
export const NEXHA_INTEGRATION_POINTS = {
  // TwinOS Hub integration
  twinos: {
    service: 'nexha-intelligence',
    port: 4350,
    purpose: 'Business analytics and demand prediction for twins',
    endpoints: [
      '/api/predict/demand',
      '/api/analytics/overview',
      '/api/insights'
    ]
  },

  // AgentOS Hub integration
  agentos: {
    service: 'nexha-procurement',
    port: 4320,
    purpose: 'Procurement agents for supplier matching',
    endpoints: [
      '/api/suppliers',
      '/api/rfqs',
      '/api/quotes'
    ]
  },

  // SUTAR OS integration
  sutar: {
    service: 'nexha-trade-finance',
    port: 4340,
    purpose: 'BNPL and credit for SUTAR marketplace',
    endpoints: [
      '/api/credits/apply',
      '/api/bnpl/create',
      '/api/risk/:merchantId'
    ]
  },

  // Business Copilot integration
  copilot: {
    service: 'nexha-intelligence',
    port: 4350,
    purpose: 'Real-time analytics for copilot insights',
    endpoints: [
      '/api/analytics/overview',
      '/api/trends/:category',
      '/api/anomaly/detect'
    ]
  },

  // RABTUL integration
  rabtul: {
    service: 'nexha-trade-finance',
    port: 4340,
    purpose: 'Payment processing for orders',
    endpoints: [
      '/api/payments/initiate',
      '/api/emi/calculate'
    ]
  },

  // AdBazaar integration
  adbazaar: {
    service: 'nexha-distribution',
    port: 4300,
    purpose: 'Retail media network for commerce',
    endpoints: [
      '/api/distributors',
      '/api/inventory'
    ]
  }
};

/**
 * Nexha → Economic Network OS Mapping
 */
export const ECONOMIC_NETWORK_OS_MAP = {
  // Commerce Layer (from Nexha)
  commerce: {
    distribution: { port: 4300, service: 'nexha-distribution' },
    franchise: { port: 4310, service: 'nexha-franchise' },
    procurement: { port: 4320, service: 'nexha-procurement' },
    manufacturing: { port: 4330, service: 'nexha-manufacturing' },
    tradeFinance: { port: 4340, service: 'nexha-trade-finance' },
    intelligence: { port: 4350, service: 'nexha-intelligence' }
  },

  // Trust & Growth Layer (from REE)
  trust: {
    trustPlatform: { port: 3001, service: 'ree-trust-platform' },
    rtoFraud: { port: 3010, service: 'ree-rto-fraud' },
    growthEngine: { port: 3002, service: 'ree-growth-engine' }
  },

  // Integration via SUTAR
  sutar: {
    trustEngine: { port: 4180, service: 'sutar-trust-engine' },
    negotiation: { port: 4191, service: 'sutar-negotiation-engine' },
    roiCalculator: { port: 4259, service: 'sutar-roi-calculator' }
  }
};

/**
 * Connection module for Nexha Commerce
 */
export const NexhaConnectionModule = {
  name: 'Nexha Commerce → Core Platform',
  version: '1.0.0',

  /**
   * Initialize Nexha connections
   */
  async initialize(config = {}) {
    const { logger, token } = config;

    const connection = new NexhaConnection({ logger, token });

    // Test all Nexha services
    const services = [
      { name: 'Nexha Gateway', url: NEXHA_GATEWAY_URL },
      { name: 'DistributionOS', url: NEXHA_DISTRIBUTION_URL },
      { name: 'FranchiseOS', url: NEXHA_FRANCHISE_URL },
      { name: 'ProcurementOS', url: NEXHA_PROCUREMENT_URL },
      { name: 'TradeFinance', url: NEXHA_TRADE_FINANCE_URL },
      { name: 'Intelligence', url: NEXHA_INTELLIGENCE_URL },
      { name: 'Ecosystem Connector', url: NEXHA_CONNECTOR_URL },
      // ADR-0009 Phase 3 (2026-06-22)
      { name: 'Business Directory', url: NEXHA_BUSINESS_DIRECTORY_URL },
    ];

    const results = {};
    for (const service of services) {
      try {
        const response = await fetch(`${service.url}/health`);
        results[service.name] = response.ok;
      } catch {
        results[service.name] = false;
      }
    }

    logger?.info('Nexha connections:', results);

    return { connection, results };
  },

  /**
   * Get Nexha connection instance
   */
  getConnection(config) {
    return new NexhaConnection(config);
  },

  /**
   * Get integration points
   */
  getIntegrationPoints() {
    return NEXHA_INTEGRATION_POINTS;
  },

  /**
   * Get Economic Network OS map
   */
  getEconomicNetworkOSMap() {
    return ECONOMIC_NETWORK_OS_MAP;
  }
};

export default NexhaConnectionModule;
