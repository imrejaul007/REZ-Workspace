/**
 * Nexha Commerce Network Connection Module
 * Connects Nexha services to RTMN Core Platform
 */

import fetch from 'node-fetch';

const NEXHA_GATEWAY_URL = process.env.NEXHA_GATEWAY_URL || 'http://localhost:5002';
const NEXHA_DISTRIBUTION_URL = process.env.NEXHA_DISTRIBUTION_URL || 'http://localhost:4300';
const NEXHA_FRANCHISE_URL = process.env.NEXHA_FRANCHISE_URL || 'http://localhost:4310';
const NEXHA_PROCUREMENT_URL = process.env.NEXHA_PROCUREMENT_URL || 'http://localhost:4320';
const NEXHA_TRADE_FINANCE_URL = process.env.NEXHA_TRADE_FINANCE_URL || 'http://localhost:4340';
const NEXHA_INTELLIGENCE_URL = process.env.NEXHA_INTELLIGENCE_URL || 'http://localhost:4350';
const NEXHA_CONNECTOR_URL = process.env.NEXHA_CONNECTOR_URL || 'http://localhost:4399';

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
      { name: 'Ecosystem Connector', url: NEXHA_CONNECTOR_URL }
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
