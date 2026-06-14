/**
 * REZ Business AI - Integration Hub
 * Connects REZ Business AI to all ecosystem services
 */

const axios = require('axios');

// Service URLs from environment
const SERVICES = {
  // REZ Intelligence
  intelligence: {
    url: process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4123',
    key: process.env.INTELLIGENCE_API_KEY,
  },

  // RABTUL Services
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:4000',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },
  wallet: {
    url: process.env.WALLET_SERVICE_URL || 'http://localhost:4002',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },
  payment: {
    url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },
  notifications: {
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },
  coupon: {
    url: process.env.COUPON_SERVICE_URL || 'http://localhost:4009',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },
  referral: {
    url: process.env.REFERRAL_SERVICE_URL || 'http://localhost:4007',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },

  // REZ Media
  engagement: {
    url: process.env.ENGAGEMENT_SERVICE_URL || 'http://localhost:4017',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },
  adAI: {
    url: process.env.AD_AI_URL || 'http://localhost:4021',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },
  dooh: {
    url: process.env.DOOH_SERVICE_URL || 'http://localhost:4018',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },
  journey: {
    url: process.env.JOURNEY_SERVICE_URL || 'http://localhost:4019',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },
  adsqr: {
    url: process.env.ADSQR_URL || 'http://localhost:4068',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },
  whatsapp: {
    url: process.env.WHATSAPP_COMMERCE_URL || 'http://localhost:4030',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },

  // CorpPerks
  corpperks: {
    url: process.env.CORP_PERKS_URL || 'http://localhost:4000',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },
  nextabizz: {
    url: process.env.NEXTA_BIZZ_URL || 'http://localhost:4020',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },
  restopapa: {
    url: process.env.RESTO_PAPA_URL || 'http://localhost:4021',
    key: process.env.INTERNAL_SERVICE_TOKEN,
  },
};

/**
 * Make authenticated request to service
 */
async function request(service, method, path, data = null) {
  const svc = SERVICES[service];
  if (!svc) throw new Error(`Unknown service: ${service}`);

  try {
    const config = {
      method,
      url: `${svc.url}${path}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': svc.key,
      },
    };

    if (data) config.data = data;

    const res = await axios(config);
    return res.data;
  } catch (err) {
    logger.error(`[Integration] ${service} ${method} ${path} failed:`, err.message);
    return { error: err.message };
  }
}

// ============== INTELLIGENCE CONNECTIONS ==============

const Intelligence = {
  // Get demand prediction
  async getDemand(params) {
    return request('intelligence', 'GET', '/api/demand', params);
  },

  // Get churn risk
  async getChurnRisk(customerId) {
    return request('intelligence', 'GET', `/api/churn/${customerId}`);
  },

  // Get LTV prediction
  async getLTV(customerId) {
    return request('intelligence', 'GET', `/api/ltv/${customerId}`);
  },

  // Get revisit prediction
  async getRevisit(customerId) {
    return request('intelligence', 'GET', `/api/revisit/${customerId}`);
  },

  // Get weather signals
  async getWeather(location) {
    return request('intelligence', 'GET', `/api/weather/${location}`);
  },

  // Get event signals
  async getEvents(location, date) {
    return request('intelligence', 'GET', `/api/events?location=${location}&date=${date}`);
  },

  // Get competitor signals
  async getCompetitors(location) {
    return request('intelligence', 'GET', `/api/competitors?location=${location}`);
  },

  // Get all signals combined
  async getSignals(merchantId) {
    const [demand, events, weather, competitors] = await Promise.all([
      this.getDemand({ merchantId }),
      this.getEvents(merchantId),
      this.getWeather(merchantId),
      this.getCompetitors(merchantId),
    ]);
    return { demand, events, weather, competitors };
  },
};

// ============== RABTUL CONNECTIONS ==============

const RABTUL = {
  // Notifications
  async sendNotification(params) {
    const { customerId, channel, template, data } = params;
    return request('notifications', 'POST', '/api/send', {
      customerId,
      channel, // 'whatsapp' | 'push' | 'sms' | 'email'
      template,
      data,
    });
  },

  // Bulk notification
  async sendBulkNotification(params) {
    const { customerIds, channel, template, data } = params;
    return request('notifications', 'POST', '/api/bulk/send', {
      customerIds,
      channel,
      template,
      data,
    });
  },

  // Wallet credit
  async creditWallet(params) {
    const { userId, amount, reason, merchantId } = params;
    return request('wallet', 'POST', '/api/credit', {
      userId,
      amount,
      reason,
      merchantId,
    });
  },

  // Wallet debit
  async debitWallet(params) {
    const { userId, amount, reason, merchantId } = params;
    return request('wallet', 'POST', '/api/debit', {
      userId,
      amount,
      reason,
      merchantId,
    });
  },

  // Create coupon
  async createCoupon(params) {
    const { merchantId, discount, type, maxUses, expiresAt } = params;
    return request('coupon', 'POST', '/api/coupons', {
      merchantId,
      discount,
      type, // 'percentage' | 'fixed'
      maxUses,
      expiresAt,
    });
  },

  // Verify coupon
  async verifyCoupon(code) {
    return request('coupon', 'GET', `/api/coupons/verify/${code}`);
  },

  // Referral tracking
  async trackReferral(params) {
    const { referrerId, refereeId, campaign } = params;
    return request('referral', 'POST', '/api/track', {
      referrerId,
      refereeId,
      campaign,
    });
  },

  // Auth verify
  async verifyUser(userId) {
    return request('auth', 'GET', `/api/users/${userId}/verify`);
  },
};

// ============== REZ MEDIA CONNECTIONS ==============

const Media = {
  // Create campaign
  async createCampaign(params) {
    const { merchantId, type, audience, channels, offer } = params;
    return request('engagement', 'POST', '/api/campaigns', {
      merchantId,
      type,
      audience,
      channels,
      offer,
    });
  },

  // Launch ad campaign
  async launchAd(params) {
    const { merchantId, budget, targeting, creative } = params;
    return request('adAI', 'POST', '/api/campaigns', {
      merchantId,
      budget,
      targeting,
      creative,
    });
  },

  // Create loyalty program
  async createLoyalty(params) {
    const { merchantId, name, tiers, rules } = params;
    return request('engagement', 'POST', '/api/loyalty', {
      merchantId,
      name,
      tiers,
      rules,
    });
  },

  // Create offer
  async createOffer(params) {
    const { merchantId, type, value, conditions } = params;
    return request('engagement', 'POST', '/api/offers', {
      merchantId,
      type,
      value,
      conditions,
    });
  },

  // Track QR scan
  async trackQR(params) {
    const { campaignId, customerId, location } = params;
    return request('adsqr', 'POST', '/api/track', {
      campaignId,
      customerId,
      location,
    });
  },

  // WhatsApp message
  async sendWhatsApp(params) {
    const { customerId, template, variables } = params;
    return request('whatsapp', 'POST', '/api/send', {
      customerId,
      template,
      variables,
    });
  },

  // Create journey
  async createJourney(params) {
    const { merchantId, name, steps, trigger } = params;
    return request('journey', 'POST', '/api/journeys', {
      merchantId,
      name,
      steps,
      trigger,
    });
  },

  // DOOH screen update
  async updateDOOH(params) {
    const { screenId, content, schedule } = params;
    return request('dooh', 'POST', '/api/screens/update', {
      screenId,
      content,
      schedule,
    });
  },
};

// ============== CORPPERKS CONNECTIONS ==============

const CorpPerks = {
  // Identify corporate user
  async identifyCorporate(email) {
    return request('corpperks', 'GET', `/api/identify?email=${email}`);
  },

  // Create B2B deal
  async createB2BDeal(params) {
    const { companyId, merchantId, discount, minQty } = params;
    return request('nextabizz', 'POST', '/api/deals', {
      companyId,
      merchantId,
      discount,
      minQty,
    });
  },

  // Launch chain campaign (RestoPapa)
  async launchChainCampaign(params) {
    const { chainIds, campaign, offer } = params;
    return request('restopapa', 'POST', '/api/campaigns', {
      chainIds,
      campaign,
      offer,
    });
  },
};

// ============== COMPLETE CAMPAIGN EXECUTION ==============

const CampaignExecutor = {
  /**
   * Execute complete campaign across all services
   */
  async execute(params) {
    const { merchantId, campaign, audience, channels, offer } = params;
    const results = [];

    // 1. Get intelligence signals
    const signals = await Intelligence.getSignals(merchantId);

    // 2. Identify if corporate
    const isCorporate = audience.isCorporate;
    if (isCorporate) {
      const corp = await CorpPerks.identifyCorporate(audience.email);
      results.push({ service: 'corpperks', result: corp });
    }

    // 3. Execute via RABTUL
    if (channels.includes('whatsapp')) {
      const whatsapp = await RABTUL.sendNotification({
        customerId: audience.customerIds,
        channel: 'whatsapp',
        template: 'campaign_launch',
        data: offer,
      });
      results.push({ service: 'notifications', result: whatsapp });
    }

    if (channels.includes('push')) {
      const push = await RABTUL.sendNotification({
        customerId: audience.customerIds,
        channel: 'push',
        template: 'campaign_launch',
        data: offer,
      });
      results.push({ service: 'notifications', result: push });
    }

    // 4. Credit wallet for reward
    if (offer.cashback) {
      const credit = await RABTUL.creditWallet({
        userId: audience.customerIds,
        amount: offer.cashback,
        reason: `Campaign: ${campaign}`,
        merchantId,
      });
      results.push({ service: 'wallet', result: credit });
    }

    // 5. Create coupon
    if (offer.discount) {
      const coupon = await RABTUL.createCoupon({
        merchantId,
        discount: offer.discount,
        type: 'percentage',
        maxUses: 1000,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      results.push({ service: 'coupon', result: coupon });
    }

    // 6. Execute via REZ Media
    const mediaCampaign = await Media.createCampaign({
      merchantId,
      type: campaign,
      audience,
      channels,
      offer,
    });
    results.push({ service: 'engagement', result: mediaCampaign });

    // 7. Launch ads
    if (channels.includes('ads')) {
      const ad = await Media.launchAd({
        merchantId,
        budget: offer.adBudget || 5000,
        targeting: { location: '5km' },
        creative: 'auto',
      });
      results.push({ service: 'adAI', result: ad });
    }

    // 8. QR tracking
    if (channels.includes('qr')) {
      const qr = await Media.trackQR({
        campaignId: mediaCampaign.id,
        customerId: audience.customerIds,
        location: 'in-store',
      });
      results.push({ service: 'adsqr', result: qr });
    }

    // 9. B2B via CorpPerks
    if (isCorporate) {
      const b2bDeal = await CorpPerks.createB2BDeal({
        companyId: corp.companyId,
        merchantId,
        discount: offer.discount,
        minQty: 50,
      });
      results.push({ service: 'nextabizz', result: b2bDeal });

      const chainCampaign = await CorpPerks.launchChainCampaign({
        chainIds: corp.restaurantChains,
        campaign,
        offer,
      });
      results.push({ service: 'restopapa', result: chainCampaign });
    }

    // 10. Learn from execution
    await this.recordExecution({
      merchantId,
      campaign,
      signals,
      results,
    });

    return {
      success: true,
      campaignId: mediaCampaign.id,
      services: results.map(r => r.service),
      signals,
    };
  },

  /**
   * Record execution for learning
   */
  async recordExecution(params) {
    // Store execution data for ML training
    logger.info('[CampaignExecutor] Execution recorded:', params.merchantId, params.campaign);
  },
};

// Export all integrations
module.exports = {
  Intelligence,
  RABTUL,
  Media,
  CorpPerks,
  CampaignExecutor,
  SERVICES,
};
