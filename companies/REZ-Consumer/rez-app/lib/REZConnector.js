/**
 * REZ Integration Connector for rez-app-consumer
 * Drop this file into: lib/REZConnector.js
 */

const axios = require('axios');

class REZConsumerConnector {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.REZ_API_URL || 'http://localhost:4091',
      apiKey: config.apiKey || process.env.REZ_API_KEY,
      debug: config.debug || false
    };
    this.userId = null;
    this.sessionId = null;
  }

  log(...args) {
    if (this.config.debug) console.log('[REZ-Consumer]', ...args);
  }

  async init(user) {
    this.userId = user.id;
    this.sessionId = `consumer_${Date.now()}`;
    try {
      await this.resolveIdentity({
        phone: user.phone,
        email: user.email,
        sourceApp: 'consumer',
        sourceUserId: user.id
      });
    } catch (err) {
      this.log('Identity resolution failed:', err.message);
    }
  }

  async resolveIdentity(identifiers) {
    try {
      const response = await axios.post(`${this.config.baseUrl}/resolve`, identifiers, {
        headers: { 'X-REZ-API-Key': this.config.apiKey },
        timeout: 5000
      });
      this.userId = response.data.unifiedId;
      return response.data;
    } catch (err) {
      return null;
    }
  }

  // Track QR scan
  async trackQrScan(qr) {
    return this.track('qr_scan', {
      merchantId: qr.merchantId,
      source: qr.source || 'direct'
    });
  }

  // Track page view
  async trackPageView(page) {
    return this.track('page_view', {
      page: page.path,
      category: page.category,
      merchantId: page.merchantId
    });
  }

  // Track search
  async trackSearch(search) {
    return this.track('search', {
      query: search.query,
      results: search.resultCount,
      clicked: search.clickedItem
    });
  }

  // Track order
  async trackOrderCompleted(order) {
    return this.track('order_completed', {
      orderId: order.id,
      merchantId: order.merchantId,
      items: order.items,
      amount: order.total,
      paymentMethod: order.paymentMethod
    });
  }

  // Track payment
  async trackPayment(payment) {
    return this.track('payment_completed', {
      orderId: payment.orderId,
      amount: payment.amount,
      method: payment.method
    });
  }

  // Track profile update
  async trackProfileUpdate(profile) {
    return this.track('profile_update', {
      fields: Object.keys(profile)
    });
  }

  // Get recommendations
  async getRecommendations(options = {}) {
    if (!this.userId) return [];
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/api/recommendations/${this.userId}`,
        {
          params: {
            types: options.types || 'reorder,cross_sell,personalized',
            limit: options.limit || 10,
            context: 'consumer'
          },
          headers: { 'X-REZ-API-Key': this.config.apiKey },
          timeout: 5000
        }
      );
      return response.data.recommendations || [];
    } catch (err) {
      this.log('Recommendations failed:', err.message);
      return [];
    }
  }

  // Get reorder suggestions
  async getReorders(options = {}) {
    return this.getRecommendations({ ...options, types: 'reorder' });
  }

  // Track conversion
  async trackConversion(nudgeId, orderId, amount) {
    if (!nudgeId) return;
    try {
      await axios.post(`${this.config.baseUrl}/api/feedback/conversion`, {
        nudgeId,
        userId: this.userId,
        appId: 'consumer',
        converted: true,
        orderId,
        amount
      }, {
        headers: { 'X-REZ-API-Key': this.config.apiKey },
        timeout: 5000
      });
    } catch (err) {
      this.log('Conversion tracking failed:', err.message);
    }
  }

  async track(eventType, properties) {
    try {
      await axios.post(`${this.config.baseUrl}/api/events/track`, {
        eventType,
        userId: this.userId,
        sessionId: this.sessionId,
        appId: 'consumer',
        properties,
        timestamp: new Date().toISOString()
      }, {
        headers: { 'X-REZ-API-Key': this.config.apiKey },
        timeout: 5000
      });
      this.log(`Tracked: ${eventType}`);
    } catch (err) {
      this.log(`Track failed: ${eventType}`, err.message);
    }
  }
}

function rezMiddleware(req, res, next) {
  req.rez = new REZConsumerConnector();
  if (req.user) req.rez.init(req.user).catch(() => {});
  next();
}

module.exports = { REZConsumerConnector, rezMiddleware };
