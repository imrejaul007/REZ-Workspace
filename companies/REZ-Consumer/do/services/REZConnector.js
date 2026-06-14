/**
 * REZ Integration Connector for do-app
 * Drop this file into: services/REZConnector.js
 */

const axios = require('axios');

class REZDoAppConnector {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.REZ_API_URL || 'http://localhost:4091',
      apiKey: config.apiKey || process.env.REZ_API_KEY,
      debug: config.debug || false
    };
    this.userId = null;
  }

  log(...args) {
    if (this.config.debug) console.log('[REZ-DoApp]', ...args);
  }

  async init(user) {
    this.userId = user.id;
    try {
      await this.resolveIdentity({
        phone: user.phone,
        email: user.email,
        sourceApp: 'do-app',
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

  // Track activity view
  async trackActivityView(activity) {
    return this.track('activity_view', {
      activityId: activity.id,
      category: activity.category,
      providerId: activity.providerId
    });
  }

  // Track booking started
  async trackBookingStarted(booking) {
    return this.track('booking_started', {
      bookingId: booking.id,
      activityId: booking.activityId,
      date: booking.date,
      participants: booking.participants,
      amount: booking.total
    });
  }

  // Track booking confirmed
  async trackBookingConfirmed(booking) {
    return this.track('booking_confirmed', {
      bookingId: booking.id,
      paymentMethod: booking.paymentMethod,
      amount: booking.total
    });
  }

  // Track experience completed
  async trackExperienceCompleted(experience) {
    return this.track('experience_completed', {
      bookingId: experience.bookingId,
      rating: experience.rating,
      feedback: experience.feedback
    });
  }

  // Track provider signup
  async trackProviderSignup(provider) {
    return this.track('signup', {
      type: 'provider',
      providerId: provider.id,
      category: provider.category
    });
  }

  // Track search
  async trackSearch(search) {
    return this.track('search', {
      query: search.query,
      category: search.category,
      location: search.location,
      results: search.resultCount
    });
  }

  // Track QR scan
  async trackQrScan(qr) {
    return this.track('qr_scan', {
      merchantId: qr.merchantId,
      source: qr.source || 'do-app'
    });
  }

  // Get activity recommendations
  async getRecommendations(options = {}) {
    if (!this.userId) return [];
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/api/recommendations/${this.userId}`,
        {
          params: {
            types: options.types || 'personalized,trending,nearby',
            limit: options.limit || 10,
            context: 'do_activity'
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

  // Track conversion
  async trackConversion(nudgeId, bookingId, amount) {
    if (!nudgeId) return;
    try {
      await axios.post(`${this.config.baseUrl}/api/feedback/conversion`, {
        nudgeId,
        userId: this.userId,
        appId: 'do-app',
        converted: true,
        orderId: bookingId,
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
        appId: 'do-app',
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
  req.rez = new REZDoAppConnector();
  if (req.user) req.rez.init(req.user).catch(() => {});
  next();
}

module.exports = { REZDoAppConnector, rezMiddleware };
