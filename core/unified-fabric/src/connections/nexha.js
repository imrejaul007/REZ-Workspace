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

  // ============================================
  // MARKETPLACE-LISTINGS (ADR-0010 Phase 5, 2026-06-22)
  // Reachable via the RTMN Hub at `/api/sutar/marketplace-listings/*`.
  // Real impl: companies/HOJAI-AI/blr-ai-marketplace/services/marketplace-listings/
  // Per-tenant Agent Marketplace storefront with reviews, directory linkage,
  // and visibility rules.
  // ============================================

  async createMarketplaceListing(input) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/marketplace-listings/api/listings`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(input),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Marketplace createListing failed:', error.message);
      return null;
    }
  }

  async searchMarketplaceListings(query = {}) {
    try {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
      }
      const path = `/api/sutar/marketplace-listings/api/listings${qs.toString() ? `?${qs.toString()}` : ''}`;
      const response = await fetch(`${RTMN_HUB_URL}${path}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Marketplace searchListings failed:', error.message);
      return null;
    }
  }

  async getMarketplaceListing(listingId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/marketplace-listings/api/listings/${encodeURIComponent(listingId)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Marketplace getListing failed:', error.message);
      return null;
    }
  }

  async updateMarketplaceListing(listingId, patch) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/marketplace-listings/api/listings/${encodeURIComponent(listingId)}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(patch),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Marketplace updateListing failed:', error.message);
      return null;
    }
  }

  async publishMarketplaceListing(listingId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/marketplace-listings/api/listings/${encodeURIComponent(listingId)}/publish`, {
        method: 'POST',
        headers: this.headers,
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Marketplace publishListing failed:', error.message);
      return null;
    }
  }

  async recordMarketplaceView(listingId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/marketplace-listings/api/listings/${encodeURIComponent(listingId)}/view`, {
        method: 'POST',
        headers: this.headers,
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Marketplace recordView failed:', error.message);
      return null;
    }
  }

  async recordMarketplaceInstall(listingId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/marketplace-listings/api/listings/${encodeURIComponent(listingId)}/install`, {
        method: 'POST',
        headers: this.headers,
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Marketplace recordInstall failed:', error.message);
      return null;
    }
  }

  async listMarketplaceReviews(listingId, query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.status) qs.set('status', query.status);
      if (query.limit) qs.set('limit', String(query.limit));
      if (query.offset) qs.set('offset', String(query.offset));
      const path = `/api/sutar/marketplace-listings/api/listings/${encodeURIComponent(listingId)}/reviews${qs.toString() ? `?${qs.toString()}` : ''}`;
      const response = await fetch(`${RTMN_HUB_URL}${path}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Marketplace listReviews failed:', error.message);
      return null;
    }
  }

  async upsertMarketplaceReview(listingId, review) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/marketplace-listings/api/listings/${encodeURIComponent(listingId)}/reviews`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(review),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Marketplace upsertReview failed:', error.message);
      return null;
    }
  }

  async getMyMarketplaceReview(listingId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/marketplace-listings/api/my-reviews?listingId=${encodeURIComponent(listingId)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Marketplace getMyReview failed:', error.message);
      return null;
    }
  }

  async getMarketplaceStats() {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/marketplace-listings/api/stats`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Marketplace stats failed:', error.message);
      return null;
    }
  }

  // ============================================
  // MISSION PLANNER (ADR-0010 Phase 6, 2026-06-22)
  // Reachable via the RTMN Hub at `/api/nexha/nexha-mission-planner/*`.
  // Real impl: companies/Nexha/services/nexha-mission-planner/
  // Cross-tenant mission composition: a tenant instantiates a template
  // (or supplies a custom DAG), the planner resolves each subtask to an
  // agent in nexha-business-directory, and subtasks progress through a
  // state machine. Mission lifecycle:
  //   DRAFT → PLANNED → EXECUTING → COMPLETED|FAILED|CANCELLED
  // Subtask lifecycle:
  //   PENDING → ASSIGNED → IN_PROGRESS → COMPLETED|FAILED|SKIPPED
  // ============================================

  async createMission(input) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-mission-planner/api/missions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(input),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Mission createMission failed:', error.message);
      return null;
    }
  }

  async listMissions(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.status) qs.set('status', query.status);
      if (query.templateId) qs.set('templateId', query.templateId);
      if (query.limit != null) qs.set('limit', String(query.limit));
      if (query.offset != null) qs.set('offset', String(query.offset));
      const suffix = qs.toString() ? `?${qs}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-mission-planner/api/missions${suffix}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Mission listMissions failed:', error.message);
      return null;
    }
  }

  async getMission(missionId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-mission-planner/api/missions/${encodeURIComponent(missionId)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Mission getMission failed:', error.message);
      return null;
    }
  }

  async updateMission(missionId, patch) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-mission-planner/api/missions/${encodeURIComponent(missionId)}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(patch),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Mission updateMission failed:', error.message);
      return null;
    }
  }

  async planMission(missionId, assignments = {}) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-mission-planner/api/missions/${encodeURIComponent(missionId)}/plan`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ assignments }),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Mission planMission failed:', error.message);
      return null;
    }
  }

  async startMission(missionId) {
    return this._missionAction(missionId, 'start');
  }

  async pauseMission(missionId) {
    return this._missionAction(missionId, 'pause');
  }

  async cancelMission(missionId) {
    return this._missionAction(missionId, 'cancel');
  }

  async retryMission(missionId) {
    return this._missionAction(missionId, 'retry');
  }

  async _missionAction(missionId, action) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-mission-planner/api/missions/${encodeURIComponent(missionId)}/${action}`, {
        method: 'POST',
        headers: this.headers,
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn(`Mission ${action} failed:`, error.message);
      return null;
    }
  }

  async startSubtask(missionId, subtaskId, body = {}) {
    return this._subtaskAction(missionId, subtaskId, 'start', body);
  }

  async completeSubtask(missionId, subtaskId, result, assignedTenant) {
    return this._subtaskAction(missionId, subtaskId, 'complete', { result, assignedTenant });
  }

  async failSubtask(missionId, subtaskId, error) {
    return this._subtaskAction(missionId, subtaskId, 'fail', { error });
  }

  async skipSubtask(missionId, subtaskId) {
    return this._subtaskAction(missionId, subtaskId, 'skip', {});
  }

  async _subtaskAction(missionId, subtaskId, action, body) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-mission-planner/api/missions/${encodeURIComponent(missionId)}/subtasks/${encodeURIComponent(subtaskId)}/${action}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn(`Mission subtask ${action} failed:`, error.message);
      return null;
    }
  }

  async listMissionTemplates(tenantId) {
    try {
      const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-mission-planner/api/templates${qs}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Mission listTemplates failed:', error.message);
      return null;
    }
  }

  async getMissionTemplate(templateId, tenantId) {
    try {
      const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-mission-planner/api/templates/${encodeURIComponent(templateId)}${qs}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Mission getTemplate failed:', error.message);
      return null;
    }
  }

  async createMissionTemplate(body) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-mission-planner/api/templates`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Mission createTemplate failed:', error.message);
      return null;
    }
  }

  async getMissionStats() {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-mission-planner/api/stats`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Mission stats failed:', error.message);
      return null;
    }
  }

  // ============================================
  // PARTNER GRAPH (ADR-0010 Phase 7, 2026-06-22)
  // Reachable via the RTMN Hub at `/api/nexha/nexha-partner-graph/*`.
  // Real impl: companies/Nexha/services/nexha-partner-graph/
  // Per-tenant partnership tracking + recommendation engine. Records
  // interactions (transactions, missions, reviews) which update a
  // computed "strength" score per partner (30% count + 30% GMV +
  // 20% rating + 20% recency). recommendPartners() surfaces the best
  // candidates given an optional capability context.
  // ============================================

  async recordInteraction(input) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-partner-graph/api/interactions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(input),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Partner recordInteraction failed:', error.message);
      return null;
    }
  }

  async listInteractions(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.partnerRef) qs.set('partnerRef', query.partnerRef);
      if (query.type) qs.set('type', query.type);
      if (query.limit != null) qs.set('limit', String(query.limit));
      if (query.offset != null) qs.set('offset', String(query.offset));
      const suffix = qs.toString() ? `?${qs}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-partner-graph/api/interactions${suffix}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Partner listInteractions failed:', error.message);
      return null;
    }
  }

  async listPartners(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.relationshipType) qs.set('relationshipType', query.relationshipType);
      if (query.limit != null) qs.set('limit', String(query.limit));
      if (query.offset != null) qs.set('offset', String(query.offset));
      const suffix = qs.toString() ? `?${qs}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-partner-graph/api/partners${suffix}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Partner listPartners failed:', error.message);
      return null;
    }
  }

  async getPartner(partnerRef) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-partner-graph/api/partners/${encodeURIComponent(partnerRef)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Partner getPartner failed:', error.message);
      return null;
    }
  }

  async listPartnersByType(relationshipType, query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.limit != null) qs.set('limit', String(query.limit));
      const suffix = qs.toString() ? `?${qs}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-partner-graph/api/partners/by-type/${encodeURIComponent(relationshipType)}${suffix}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Partner listPartnersByType failed:', error.message);
      return null;
    }
  }

  async recommendPartners(input = {}) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-partner-graph/api/recommend`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(input),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Partner recommendPartners failed:', error.message);
      return null;
    }
  }

  async getPartnerStats() {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-partner-graph/api/stats`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Partner stats failed:', error.message);
      return null;
    }
  }

  // ============================================
  // COMMERCE RUNTIME (ADR-0010 Phase 8, 2026-06-22)
  // Reachable via the RTMN Hub at `/api/nexha/nexha-commerce-runtime/*`.
  // Real impl: companies/Nexha/services/nexha-commerce-runtime/
  // The execution plane: orders + payments + returns. Each entity has
  // an explicit state machine. Order lifecycle:
  //   DRAFT → PLACED → PAID → FULFILLING → SHIPPED → DELIVERED → COMPLETED
  //                ↓         ↓            ↓
  //             CANCELLED  REFUNDED    RETURNED → COMPLETED|REFUNDED
  // Capturing a payment auto-promotes the order to PAID. Refunding a
  // return auto-refunds the linked payment and promotes the order to
  // RETURNED → COMPLETED|REFUNDED.
  // ============================================

  // ---- Orders ----

  async createOrder(input) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/orders`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(input),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Commerce createOrder failed:', error.message);
      return null;
    }
  }

  async listOrders(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.status) qs.set('status', query.status);
      if (query.buyerRef) qs.set('buyerRef', query.buyerRef);
      if (query.sellerRef) qs.set('sellerRef', query.sellerRef);
      if (query.paymentId) qs.set('paymentId', query.paymentId);
      if (query.limit != null) qs.set('limit', String(query.limit));
      if (query.offset != null) qs.set('offset', String(query.offset));
      const suffix = qs.toString() ? `?${qs}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/orders${suffix}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Commerce listOrders failed:', error.message);
      return null;
    }
  }

  async getOrder(orderId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/orders/${encodeURIComponent(orderId)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Commerce getOrder failed:', error.message);
      return null;
    }
  }

  async updateOrder(orderId, patch) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(patch),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Commerce updateOrder failed:', error.message);
      return null;
    }
  }

  async placeOrder(orderId, opts = {}) {
    return this._orderAction(orderId, 'place', opts);
  }

  async cancelOrder(orderId, reason) {
    return this._orderAction(orderId, 'cancel', { reason });
  }

  async startFulfillment(orderId, body) {
    return this._orderAction(orderId, 'fulfill', body || {});
  }

  async shipOrder(orderId, body) {
    return this._orderAction(orderId, 'ship', body);
  }

  async deliverOrder(orderId, body) {
    return this._orderAction(orderId, 'deliver', body || {});
  }

  async completeOrder(orderId) {
    return this._orderAction(orderId, 'complete', {});
  }

  async refundOrder(orderId, body) {
    return this._orderAction(orderId, 'refund', body || {});
  }

  async _orderAction(orderId, action, body) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/orders/${encodeURIComponent(orderId)}/${action}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn(`Commerce order ${action} failed:`, error.message);
      return null;
    }
  }

  // ---- Payments ----

  async createPayment(input) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/payments`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(input),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Commerce createPayment failed:', error.message);
      return null;
    }
  }

  async listPayments(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.orderId) qs.set('orderId', query.orderId);
      if (query.status) qs.set('status', query.status);
      if (query.method) qs.set('method', query.method);
      if (query.limit != null) qs.set('limit', String(query.limit));
      if (query.offset != null) qs.set('offset', String(query.offset));
      const suffix = qs.toString() ? `?${qs}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/payments${suffix}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Commerce listPayments failed:', error.message);
      return null;
    }
  }

  async getPayment(paymentId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/payments/${encodeURIComponent(paymentId)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Commerce getPayment failed:', error.message);
      return null;
    }
  }

  async _paymentAction(paymentId, action, body = {}) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/payments/${encodeURIComponent(paymentId)}/${action}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn(`Commerce payment ${action} failed:`, error.message);
      return null;
    }
  }

  async authorizePayment(paymentId, body) { return this._paymentAction(paymentId, 'authorize', body || {}); }
  async capturePayment(paymentId, body) { return this._paymentAction(paymentId, 'capture', body || {}); }
  async completePayment(paymentId) { return this._paymentAction(paymentId, 'complete', {}); }
  async failPayment(paymentId, reason) { return this._paymentAction(paymentId, 'fail', { reason }); }
  async cancelPayment(paymentId, reason) { return this._paymentAction(paymentId, 'cancel', { reason }); }
  async refundPayment(paymentId, body) { return this._paymentAction(paymentId, 'refund', body || {}); }

  // ---- Returns ----

  async createReturn(input) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/returns`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(input),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Commerce createReturn failed:', error.message);
      return null;
    }
  }

  async listReturns(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.orderId) qs.set('orderId', query.orderId);
      if (query.status) qs.set('status', query.status);
      if (query.limit != null) qs.set('limit', String(query.limit));
      if (query.offset != null) qs.set('offset', String(query.offset));
      const suffix = qs.toString() ? `?${qs}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/returns${suffix}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Commerce listReturns failed:', error.message);
      return null;
    }
  }

  async getReturn(returnId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/returns/${encodeURIComponent(returnId)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Commerce getReturn failed:', error.message);
      return null;
    }
  }

  async _returnAction(returnId, action, body = {}) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/returns/${encodeURIComponent(returnId)}/${action}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn(`Commerce return ${action} failed:`, error.message);
      return null;
    }
  }

  async approveReturn(returnId, body) { return this._returnAction(returnId, 'approve', body || {}); }
  async rejectReturn(returnId, reason) { return this._returnAction(returnId, 'reject', { reason }); }
  async markReturnInTransit(returnId, body) { return this._returnAction(returnId, 'in-transit', body || {}); }
  async markReturnReceived(returnId) { return this._returnAction(returnId, 'received', {}); }
  async completeReturn(returnId) { return this._returnAction(returnId, 'complete', {}); }
  async refundReturn(returnId, body) { return this._returnAction(returnId, 'refund', body || {}); }

  // ---- Stats ----

  async getCommerceStats() {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-commerce-runtime/api/stats`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Commerce stats failed:', error.message);
      return null;
    }
  }

  // ============================================
  // SUTAR TENANT INSTANCES (ADR-0010 Phase 9, 2026-06-22)
  // Reachable via the RTMN Hub at `/api/sutar/sutar-tenant-instances/*`.
  // Real impl: companies/HOJAI-AI/sutar-os/core/sutar-tenant-instances/
  // Lifecycle manager for per-tenant SUTAR shards. Provisions isolated
  // instances (SHARED/DEDICATED/ISOLATED) for large/regulated tenants,
  // tracks usage, enforces limits.
  // ============================================

  async provisionInstance(input) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/sutar-tenant-instances/api/instances`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(input),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('SUTAR provisionInstance failed:', error.message);
      return null;
    }
  }

  async listInstances(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.status) qs.set('status', query.status);
      if (query.tenantId) qs.set('tenantId', query.tenantId);
      if (query.isolationLevel) qs.set('isolationLevel', query.isolationLevel);
      if (query.region) qs.set('region', query.region);
      if (query.limit != null) qs.set('limit', String(query.limit));
      if (query.offset != null) qs.set('offset', String(query.offset));
      const suffix = qs.toString() ? `?${qs}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/sutar-tenant-instances/api/instances${suffix}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('SUTAR listInstances failed:', error.message);
      return null;
    }
  }

  async getInstance(instanceId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/sutar-tenant-instances/api/instances/${encodeURIComponent(instanceId)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('SUTAR getInstance failed:', error.message);
      return null;
    }
  }

  async getInstanceByTenant(tenantId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/sutar-tenant-instances/api/instances/by-tenant/${encodeURIComponent(tenantId)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('SUTAR getInstanceByTenant failed:', error.message);
      return null;
    }
  }

  async updateInstance(instanceId, patch) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/sutar-tenant-instances/api/instances/${encodeURIComponent(instanceId)}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(patch),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('SUTAR updateInstance failed:', error.message);
      return null;
    }
  }

  async _instanceAction(instanceId, action, body = {}) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/sutar-tenant-instances/api/instances/${encodeURIComponent(instanceId)}/${action}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn(`SUTAR ${action} failed:`, error.message);
      return null;
    }
  }

  async suspendInstance(instanceId, reason) { return this._instanceAction(instanceId, 'suspend', { reason }); }
  async resumeInstance(instanceId) { return this._instanceAction(instanceId, 'resume', {}); }
  async destroyInstance(instanceId, reason) { return this._instanceAction(instanceId, 'destroy', { reason }); }
  async failInstance(instanceId, reason) { return this._instanceAction(instanceId, 'fail', { reason }); }
  async rotateInstanceKey(instanceId) { return this._instanceAction(instanceId, 'rotate-key', {}); }

  async recordInstanceHealth(instanceId, status = 'healthy') {
    return this._instanceAction(instanceId, 'health', { status });
  }

  async recordInstanceUsage(instanceId, event) {
    return this._instanceAction(instanceId, 'usage', event);
  }

  async getInstanceUsage(instanceId, query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.date) qs.set('date', query.date);
      if (query.startDate) qs.set('startDate', query.startDate);
      const suffix = qs.toString() ? `?${qs}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/sutar-tenant-instances/api/instances/${encodeURIComponent(instanceId)}/usage${suffix}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('SUTAR getInstanceUsage failed:', error.message);
      return null;
    }
  }

  async checkInstanceLimits(instanceId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/sutar-tenant-instances/api/instances/${encodeURIComponent(instanceId)}/limits`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('SUTAR checkInstanceLimits failed:', error.message);
      return null;
    }
  }

  async getTenantInstanceStats() {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/sutar/sutar-tenant-instances/api/stats`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('SUTAR getTenantInstanceStats failed:', error.message);
      return null;
    }
  }

  // ============================================
  // INDUSTRY TENANT INSTANCES (ADR-0010 Phase 10, 2026-06-22)
  // Reachable via the RTMN Hub at `/api/nexha/industry-tenant-instances/*`.
  // Real impl: industry-os/services/industry-tenant-instances/
  // Lifecycle manager for per-tenant Industry OS shards (healthcare, finance,
  // hotel, etc.). One active instance per (tenantId, industry) pair, with
  // SHARED/DEDICATED/ISOLATED isolation, compliance metadata, per-instance
  // API keys, usage metrics, and limit enforcement.
  // ============================================

  async provisionIndustryInstance(input) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/industry-tenant-instances/api/instances`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(input),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('provisionIndustryInstance failed:', error.message);
      return null;
    }
  }

  async listIndustryInstances(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.status) qs.set('status', query.status);
      if (query.tenantId) qs.set('tenantId', query.tenantId);
      if (query.industry) qs.set('industry', query.industry);
      if (query.isolationLevel) qs.set('isolationLevel', query.isolationLevel);
      if (query.region) qs.set('region', query.region);
      if (query.complianceFramework) qs.set('complianceFramework', query.complianceFramework);
      if (query.limit != null) qs.set('limit', String(query.limit));
      if (query.offset != null) qs.set('offset', String(query.offset));
      const suffix = qs.toString() ? `?${qs}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/industry-tenant-instances/api/instances${suffix}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('listIndustryInstances failed:', error.message);
      return null;
    }
  }

  async getIndustryInstance(instanceId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/industry-tenant-instances/api/instances/${encodeURIComponent(instanceId)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('getIndustryInstance failed:', error.message);
      return null;
    }
  }

  async getIndustryInstanceByTenant(tenantId, industry) {
    try {
      const qs = industry ? `?industry=${encodeURIComponent(industry)}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/industry-tenant-instances/api/instances/by-tenant/${encodeURIComponent(tenantId)}${qs}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('getIndustryInstanceByTenant failed:', error.message);
      return null;
    }
  }

  async updateIndustryInstance(instanceId, patch) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/industry-tenant-instances/api/instances/${encodeURIComponent(instanceId)}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(patch),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('updateIndustryInstance failed:', error.message);
      return null;
    }
  }

  async _industryInstanceAction(instanceId, action, body = {}) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/industry-tenant-instances/api/instances/${encodeURIComponent(instanceId)}/${action}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn(`industryInstance ${action} failed:`, error.message);
      return null;
    }
  }

  async suspendIndustryInstance(instanceId, reason) {
    return this._industryInstanceAction(instanceId, 'suspend', { reason });
  }
  async resumeIndustryInstance(instanceId) {
    return this._industryInstanceAction(instanceId, 'resume', {});
  }
  async destroyIndustryInstance(instanceId, reason) {
    return this._industryInstanceAction(instanceId, 'destroy', { reason });
  }
  async failIndustryInstance(instanceId, reason) {
    return this._industryInstanceAction(instanceId, 'fail', { reason });
  }
  async rotateIndustryInstanceKey(instanceId) {
    return this._industryInstanceAction(instanceId, 'rotate-key', {});
  }

  async recordIndustryInstanceHealth(instanceId, status = 'healthy') {
    return this._industryInstanceAction(instanceId, 'health', { status });
  }

  async recordIndustryInstanceUsage(instanceId, event) {
    return this._industryInstanceAction(instanceId, 'usage', event);
  }

  async getIndustryInstanceUsage(instanceId, query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.date) qs.set('date', query.date);
      if (query.startDate) qs.set('startDate', query.startDate);
      const suffix = qs.toString() ? `?${qs}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/industry-tenant-instances/api/instances/${encodeURIComponent(instanceId)}/usage${suffix}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('getIndustryInstanceUsage failed:', error.message);
      return null;
    }
  }

  async checkIndustryInstanceLimits(instanceId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/industry-tenant-instances/api/instances/${encodeURIComponent(instanceId)}/limits`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('checkIndustryInstanceLimits failed:', error.message);
      return null;
    }
  }

  async getIndustryInstanceStats(industry) {
    try {
      const qs = industry ? `?industry=${encodeURIComponent(industry)}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/industry-tenant-instances/api/stats${qs}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('getIndustryInstanceStats failed:', error.message);
      return null;
    }
  }

  // ============================================
  // ADR-0011 Phase 12 (2026-06-23) — Provisioning Engine
  // ============================================
  // Declarative provisioning plans for per-tenant instances. Emits
  // YAML/JSON plans (NOT real K8s/AWS) consumed by external orchestrators.
  // State machine PENDING → APPLYING → READY → DESTROYING → DESTROYED.
  // ============================================

  async createProvisioningPlan(input) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-provisioning-engine/api/plans`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(input),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('createProvisioningPlan failed:', error.message);
      return null;
    }
  }

  async listProvisioningPlans(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.status) qs.set('status', query.status);
      if (query.tenantId) qs.set('tenantId', query.tenantId);
      if (query.targetInstanceKind) qs.set('targetInstanceKind', query.targetInstanceKind);
      if (query.targetInstanceId) qs.set('targetInstanceId', query.targetInstanceId);
      if (query.region) qs.set('region', query.region);
      if (query.limit != null) qs.set('limit', String(query.limit));
      if (query.offset != null) qs.set('offset', String(query.offset));
      if (query.skip != null) qs.set('skip', String(query.skip));
      const path = `/api/nexha/nexha-provisioning-engine/api/plans${qs.toString() ? `?${qs}` : ''}`;
      const response = await fetch(`${RTMN_HUB_URL}${path}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('listProvisioningPlans failed:', error.message);
      return null;
    }
  }

  async getProvisioningPlan(planId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-provisioning-engine/api/plans/${encodeURIComponent(planId)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('getProvisioningPlan failed:', error.message);
      return null;
    }
  }

  async getProvisioningPlanJson(planId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-provisioning-engine/api/plans/${encodeURIComponent(planId)}/plan.json`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('getProvisioningPlanJson failed:', error.message);
      return null;
    }
  }

  async _provisioningPlanAction(planId, action, body = {}) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-provisioning-engine/api/plans/${encodeURIComponent(planId)}/${action}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn(`_provisioningPlanAction(${action}) failed:`, error.message);
      return null;
    }
  }

  async transitionProvisioningPlan(planId, toStatus, opts = {}) {
    return this._provisioningPlanAction(planId, 'transition', { toStatus, ...opts });
  }

  async recordResourceApplied(planId, resourceName, outputs = {}) {
    return this._provisioningPlanAction(planId, 'apply', { resourceName, outputs });
  }

  async recordResourceFailed(planId, resourceName, reason) {
    return this._provisioningPlanAction(planId, 'fail-resource', { resourceName, reason });
  }

  async recordProvisioningOutputs(planId, outputs) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-provisioning-engine/api/plans/${encodeURIComponent(planId)}/outputs`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(outputs),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('recordProvisioningOutputs failed:', error.message);
      return null;
    }
  }

  async cancelProvisioningPlan(planId, reason) {
    return this._provisioningPlanAction(planId, 'cancel', { reason });
  }

  async destroyProvisioningPlan(planId, reason) {
    return this._provisioningPlanAction(planId, 'destroy', { reason });
  }

  async markProvisioningDestroyed(planId) {
    return this._provisioningPlanAction(planId, 'mark-destroyed', {});
  }

  async listProvisioningPlanEvents(planId, query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.limit != null) qs.set('limit', String(query.limit));
      if (query.kind) qs.set('kind', query.kind);
      if (query.offset != null) qs.set('offset', String(query.offset));
      if (query.skip != null) qs.set('skip', String(query.skip));
      const suffix = qs.toString() ? `?${qs}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-provisioning-engine/api/plans/${encodeURIComponent(planId)}/events${suffix}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('listProvisioningPlanEvents failed:', error.message);
      return null;
    }
  }

  async getProvisioningStats(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.tenantId) qs.set('tenantId', query.tenantId);
      const suffix = qs.toString() ? `?${qs}` : '';
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-provisioning-engine/api/stats${suffix}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('getProvisioningStats failed:', error.message);
      return null;
    }
  }

  // ============================================
  // ADR-0011 Phase 12 (2026-06-23) — Hooks SDK
  // ============================================
  // Webhook subscriptions with HMAC-SHA256 signing and exponential
  // retry. 28+ event types covering instance lifecycle, provisioning,
  // missions, commerce, partners.
  // ============================================

  async createHookSubscription(body) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-hooks-sdk/api/subscriptions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('createHookSubscription failed:', error.message);
      return null;
    }
  }

  async listHookSubscriptions(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.status) qs.set('status', query.status);
      if (query.tenantId) qs.set('tenantId', query.tenantId);
      if (query.eventType) qs.set('eventType', query.eventType);
      if (query.limit != null) qs.set('limit', String(query.limit));
      if (query.offset != null) qs.set('offset', String(query.offset));
      if (query.skip != null) qs.set('skip', String(query.skip));
      const path = `/api/nexha/nexha-hooks-sdk/api/subscriptions${qs.toString() ? `?${qs}` : ''}`;
      const response = await fetch(`${RTMN_HUB_URL}${path}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('listHookSubscriptions failed:', error.message);
      return null;
    }
  }

  async getHookSubscription(subscriptionId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-hooks-sdk/api/subscriptions/${encodeURIComponent(subscriptionId)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('getHookSubscription failed:', error.message);
      return null;
    }
  }

  async updateHookSubscription(subscriptionId, patch) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-hooks-sdk/api/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(patch),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('updateHookSubscription failed:', error.message);
      return null;
    }
  }

  async _hookSubAction(subscriptionId, action, method = 'POST', body = {}) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-hooks-sdk/api/subscriptions/${encodeURIComponent(subscriptionId)}/${action}`, {
        method,
        headers: this.headers,
        body: method === 'DELETE' || method === 'GET' ? undefined : JSON.stringify(body),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn(`_hookSubAction(${action}) failed:`, error.message);
      return null;
    }
  }

  async disableHookSubscription(subscriptionId) {
    return this._hookSubAction(subscriptionId, 'disable');
  }

  async enableHookSubscription(subscriptionId) {
    return this._hookSubAction(subscriptionId, 'enable');
  }

  async deleteHookSubscription(subscriptionId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-hooks-sdk/api/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        method: 'DELETE',
        headers: this.headers,
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('deleteHookSubscription failed:', error.message);
      return null;
    }
  }

  async rotateHookSecret(subscriptionId) {
    return this._hookSubAction(subscriptionId, 'rotate-secret');
  }

  async emitHookEvent(body) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-hooks-sdk/api/events`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('emitHookEvent failed:', error.message);
      return null;
    }
  }

  async processHookDeliveries(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.limit != null) qs.set('limit', String(query.limit));
      if (query.batchSize != null) qs.set('batchSize', String(query.batchSize));
      const suffix = qs.toString() ? `?${qs}` : '';
      const headers = { ...this.headers, 'x-internal-token': this.internalToken || '' };
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-hooks-sdk/api/deliveries/process${suffix}`, {
        method: 'POST',
        headers,
        body: '{}',
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('processHookDeliveries failed:', error.message);
      return null;
    }
  }

  async listHookDeliveries(query = {}) {
    try {
      const qs = new URLSearchParams();
      if (query.subscriptionId) qs.set('subscriptionId', query.subscriptionId);
      if (query.eventId) qs.set('eventId', query.eventId);
      if (query.eventType) qs.set('eventType', query.eventType);
      if (query.status) qs.set('status', query.status);
      if (query.limit != null) qs.set('limit', String(query.limit));
      if (query.skip != null) qs.set('skip', String(query.skip));
      const path = `/api/nexha/nexha-hooks-sdk/api/deliveries${qs.toString() ? `?${qs}` : ''}`;
      const response = await fetch(`${RTMN_HUB_URL}${path}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('listHookDeliveries failed:', error.message);
      return null;
    }
  }

  async getHookDelivery(deliveryId) {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-hooks-sdk/api/deliveries/${encodeURIComponent(deliveryId)}`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('getHookDelivery failed:', error.message);
      return null;
    }
  }

  async listHookEventTypes() {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-hooks-sdk/api/event-types`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('listHookEventTypes failed:', error.message);
      return null;
    }
  }

  async getHookStats() {
    try {
      const response = await fetch(`${RTMN_HUB_URL}/api/nexha/nexha-hooks-sdk/api/stats`, { headers: this.headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('getHookStats failed:', error.message);
      return null;
    }
  }

  // ============================================
  // ADR-0011 Phase 13 (2026-06-23) — Tenant Summary aggregator
  // ============================================
  // Read-only fan-out aggregator that returns a unified view of a tenant
  // across all 9 ADR-0010 services. No state of its own.
  // ============================================

  async buildTenantSummary(tenantId) {
    try {
      const response = await fetch(
        `${RTMN_HUB_URL}/api/nexha/nexha-tenant-summary/api/tenants/${encodeURIComponent(tenantId)}/summary`,
        { headers: this.headers }
      );
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('buildTenantSummary failed:', error.message);
      return null;
    }
  }

  async getTenantSummarySection(tenantId, section) {
    try {
      const response = await fetch(
        `${RTMN_HUB_URL}/api/nexha/nexha-tenant-summary/api/tenants/${encodeURIComponent(tenantId)}/summary/${encodeURIComponent(section)}`,
        { headers: this.headers }
      );
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('getTenantSummarySection failed:', error.message);
      return null;
    }
  }

  async listTenantSummarySources() {
    try {
      const response = await fetch(
        `${RTMN_HUB_URL}/api/nexha/nexha-tenant-summary/api/sources`,
        { headers: this.headers }
      );
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('listTenantSummarySources failed:', error.message);
      return null;
    }
  }

  async checkTenantSummaryUpstreams() {
    try {
      const response = await fetch(
        `${RTMN_HUB_URL}/api/nexha/nexha-tenant-summary/api/health/upstreams`,
        { headers: this.headers }
      );
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('checkTenantSummaryUpstreams failed:', error.message);
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
