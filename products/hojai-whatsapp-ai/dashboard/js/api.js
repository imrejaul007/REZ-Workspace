/**
 * Hojai WhatsApp AI - API Client
 *
 * Frontend API integration for onboarding and dashboard
 */

const API_BASE = window.location.origin;

class HojaiAPI {
  constructor() {
    this.apiKey = localStorage.getItem('hojai_api_key') || '';
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('hojai_api_key', key);
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {})
    };
  }

  async request(method, endpoint, data = null) {
    const options = {
      method,
      headers: this.getHeaders()
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || 'Request failed');
    }

    return json;
  }

  // =============================================================================
  // ONBOARDING
  // =============================================================================

  async startOnboarding(email, phone) {
    return this.request('POST', '/onboarding/start', { email, phone });
  }

  async verifyEmail(sessionId, otp) {
    return this.request('POST', '/onboarding/verify-email', { sessionId, otp });
  }

  async resendOtp(sessionId) {
    return this.request('POST', '/onboarding/resend-otp', { sessionId });
  }

  async saveBusinessInfo(sessionId, businessName, businessType, city) {
    return this.request('POST', '/onboarding/business-info', {
      sessionId,
      businessName,
      businessType,
      city
    });
  }

  async connectWhatsApp(sessionId, whatsappNumber) {
    return this.request('POST', '/onboarding/whatsapp', {
      sessionId,
      whatsappNumber
    });
  }

  async addKnowledge(sessionId, items) {
    return this.request('POST', '/onboarding/knowledge', { sessionId, items });
  }

  async getTemplates(businessType) {
    return this.request('GET', `/onboarding/templates/${businessType}`);
  }

  async createSubscription(sessionId, plan = 'trial') {
    return this.request('POST', '/onboarding/subscription', { sessionId, plan });
  }

  async completeOnboarding(sessionId) {
    return this.request('POST', '/onboarding/complete', { sessionId });
  }

  async getOnboardingStatus(sessionId) {
    return this.request('GET', `/onboarding/status/${sessionId}`);
  }

  // =============================================================================
  // MERCHANT API (requires API key)
  // =============================================================================

  async getMerchant() {
    return this.request('GET', '/api/merchant');
  }

  async updateMerchant(updates) {
    return this.request('PATCH', '/api/merchant', updates);
  }

  async getStats() {
    return this.request('GET', '/api/stats');
  }

  // =============================================================================
  // KNOWLEDGE BASE
  // =============================================================================

  async getKnowledge() {
    return this.request('GET', '/api/knowledge');
  }

  async addKnowledge(item) {
    return this.request('POST', '/api/knowledge', item);
  }

  async updateKnowledge(id, updates) {
    return this.request('PATCH', `/api/knowledge/${id}`, updates);
  }

  async deleteKnowledge(id) {
    return this.request('DELETE', `/api/knowledge/${id}`);
  }

  async searchKnowledge(query) {
    return this.request('GET', `/api/knowledge/search?q=${encodeURIComponent(query)}`);
  }
}

// Global API instance
window.hojai = new HojaiAPI();
