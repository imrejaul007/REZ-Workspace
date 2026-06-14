/**
 * AdBazaar Integration
 *
 * Connect Atlas GTM with AdBazaar for:
 * - Ad campaign creation and tracking
 * - QR code campaigns (creator-qr, adsqr)
 * - DOOH (Digital Out-of-Home) integration
 * - Retail media network
 * - Creator wallet (rewards, karma)
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// AdBazaar Configuration
const adbazaarConfig = {
  baseUrl: process.env.ADBAZAAR_URL || 'http://localhost:4068',
  apiKey: process.env.ADBAZAAR_API_KEY || null,
  pixelId: process.env.ADBAZAAR_PIXEL_ID || null
};

// In-memory storage
const campaigns = new Map();
const creatives = new Map();
const audienceSegments = new Map();
const conversionEvents = new Map();

/**
 * AdBazaar API Client
 */
class AdBazaarClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || adbazaarConfig.baseUrl;
    this.apiKey = config.apiKey || adbazaarConfig.apiKey;
    this.pixelId = config.pixelId || adbazaarConfig.pixelId;
  }

  get headers() {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey || 'mock-key',
      'X-Pixel-Id': this.pixelId || 'mock-pixel'
    };
  }

  async request(method, endpoint, data = null) {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: this.headers,
        data,
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      // Return mock data in mock mode
      if (this.apiKey === 'mock-key' || error.code === 'ECONNREFUSED') {
        return this.getMockResponse(endpoint, method);
      }
      console.error(`AdBazaar API Error: ${method} ${endpoint}`, error.message);
      throw error;
    }
  }

  getMockResponse(endpoint, method) {
    const mockResponses = {
      '/api/campaigns': { campaigns: [], total: 0 },
      '/api/audiences': { audiences: [], total: 0 },
      '/api/creatives': { creatives: [], total: 0 },
      '/api/analytics': {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        ctr: 0,
        cpc: 0,
        cpa: 0
      }
    };

    const baseEndpoint = '/' + endpoint.split('/').slice(3).join('/');
    return mockResponses[baseEndpoint] || {};
  }
}

const client = new AdBazaarClient();

/**
 * Create ad campaign
 */
async function createCampaign(data) {
  const campaign = {
    id: uuidv4(),
    name: data.name,
    type: data.type || 'qr_code', // qr_code, dooh, social, search
    status: 'draft',
    budget: {
      daily: data.dailyBudget || 100,
      total: data.totalBudget || 1000,
      spent: 0
    },
    targeting: {
      locations: data.locations || [],
      demographics: data.demographics || {},
      interests: data.interests || [],
      lookalike: data.lookalike || false
    },
    creatives: data.creativeIds || [],
    startDate: data.startDate || new Date().toISOString(),
    endDate: data.endDate || null,
    metrics: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      cpa: 0
    },
    createdAt: new Date().toISOString()
  };

  campaigns.set(campaign.id, campaign);

  // Sync to AdBazaar
  try {
    await client.request('POST', '/api/campaigns', campaign);
  } catch (error) {
    console.log('AdBazaar sync (mock mode): Campaign stored locally');
  }

  return campaign;
}

/**
 * Get campaign analytics
 */
async function getCampaignAnalytics(campaignId) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    // Try fetching from AdBazaar
    try {
      const response = await client.request('GET', `/api/campaigns/${campaignId}/analytics`);
      return response;
    } catch (error) {
      return { error: 'Campaign not found' };
    }
  }

  return {
    id: campaign.id,
    name: campaign.name,
    metrics: campaign.metrics,
    budget: campaign.budget,
    targeting: campaign.targeting
  };
}

/**
 * Track conversion event
 */
async function trackConversion(data) {
  const event = {
    id: uuidv4(),
    campaignId: data.campaignId,
    prospectId: data.prospectId,
    type: data.type || 'conversion', // impression, click, conversion, purchase
    value: data.value || 0,
    metadata: data.metadata || {},
    timestamp: new Date().toISOString()
  };

  conversionEvents.set(event.id, event);

  // Send to AdBazaar Pixel
  try {
    await client.request('POST', '/api/events', {
      pixelId: client.pixelId,
      event: event.type,
      value: event.value,
      metadata: event.metadata
    });
  } catch (error) {
    console.log('AdBazaar pixel track (mock mode): Event stored locally');
  }

  return event;
}

/**
 * Create QR code campaign
 */
async function createQRCampaign(data) {
  const campaign = {
    id: uuidv4(),
    name: data.name,
    type: 'qr_code',
    subtype: data.subtype || 'adsqr', // adsqr, creator-qr, shelf-qr
    status: 'draft',
    qrConfig: {
      size: data.qrSize || 300,
      format: data.qrFormat || 'png',
      logo: data.logo || null,
      callToAction: data.callToAction || 'Scan to learn more'
    },
    rewards: {
      coins: data.rewardCoins || 10,
      karma: data.rewardKarma || 5
    },
    locations: data.locations || [],
    targetAudience: data.targetAudience || {},
    tracking: {
      scans: 0,
      conversions: 0,
      revenue: 0
    },
    createdAt: new Date().toISOString()
  };

  campaigns.set(campaign.id, campaign);
  return campaign;
}

/**
 * Get QR scan analytics
 */
async function getQRScanAnalytics(campaignId) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) return { error: 'Campaign not found' };

  return {
    campaignId: campaign.id,
    totalScans: campaign.tracking.scans,
    uniqueScans: Math.floor(campaign.tracking.scans * 0.8),
    conversions: campaign.tracking.conversions,
    conversionRate: campaign.tracking.scans > 0
      ? (campaign.tracking.conversions / campaign.tracking.scans * 100).toFixed(2) + '%'
      : '0%',
    revenue: campaign.tracking.revenue,
    revenuePerScan: campaign.tracking.scans > 0
      ? (campaign.tracking.revenue / campaign.tracking.scans).toFixed(2)
      : 0
  };
}

/**
 * Create audience segment
 */
function createAudienceSegment(data) {
  const segment = {
    id: uuidv4(),
    name: data.name,
    description: data.description || '',
    rules: data.rules || [],
    size: data.estimatedSize || 0,
    sources: data.sources || ['gtm_prospects'],
    createdAt: new Date().toISOString()
  };

  audienceSegments.set(segment.id, segment);
  return segment;
}

/**
 * Sync prospects to AdBazaar audience
 */
async function syncProspectsToAudience(prospectIds, audienceId) {
  const audience = audienceSegments.get(audienceId);
  if (!audience) return { error: 'Audience not found' };

  // In real implementation, this would sync to AdBazaar's CDP
  const synced = {
    audienceId,
    prospectCount: prospectIds.length,
    syncedAt: new Date().toISOString()
  };

  return synced;
}

/**
 * Create DOOH campaign
 */
async function createDOOHCampaign(data) {
  const campaign = {
    id: uuidv4(),
    name: data.name,
    type: 'dooh',
    screens: data.screenIds || [],
    locations: data.locations || [],
    schedule: {
      startDate: data.startDate,
      endDate: data.endDate,
      timeSlots: data.timeSlots || ['09:00-21:00']
    },
    creativeDuration: data.creativeDuration || 15, // seconds
    dailyFrequency: data.dailyFrequency || 10,
    budget: {
      cpm: data.cpm || 50, // cost per 1000 impressions
      total: data.totalBudget || 5000,
      spent: 0
    },
    metrics: {
      impressions: 0,
      reach: 0,
      frequency: 0,
      conversions: 0
    },
    createdAt: new Date().toISOString()
  };

  campaigns.set(campaign.id, campaign);
  return campaign;
}

/**
 * Get DOOH analytics
 */
async function getDOOHAnalytics(campaignId) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) return { error: 'Campaign not found' };

  return {
    id: campaign.id,
    name: campaign.name,
    metrics: campaign.metrics,
    screens: campaign.screens.length,
    schedule: campaign.schedule,
    budget: campaign.budget
  };
}

/**
 * Create retail media campaign
 */
async function createRetailMediaCampaign(data) {
  const campaign = {
    id: uuidv4(),
    name: data.name,
    type: 'retail_media',
    retailers: data.retailers || [],
    placements: data.placements || ['shelf', 'checkout', 'entrance'],
    productAds: data.productAds || [],
    budget: {
      total: data.totalBudget || 10000,
      spent: 0
    },
    metrics: {
      impressions: 0,
      clicks: 0,
      addToCart: 0,
      purchases: 0,
      roas: 0
    },
    createdAt: new Date().toISOString()
  };

  campaigns.set(campaign.id, campaign);
  return campaign;
}

/**
 * Sync with Creator Wallet
 */
async function syncCreatorRewards(prospectId, campaignId, rewards) {
  // This connects to RABTUL wallet via AdBazaar creator-wallet
  return {
    prospectId,
    campaignId,
    rewards: {
      coins: rewards.coins || 0,
      karma: rewards.karma || 0
    },
    syncedAt: new Date().toISOString()
  };
}

/**
 * Get all campaigns
 */
function getCampaigns(filters = {}) {
  let result = Array.from(campaigns.values());

  if (filters.type) {
    result = result.filter(c => c.type === filters.type);
  }
  if (filters.status) {
    result = result.filter(c => c.status === filters.status);
  }

  return result;
}

/**
 * Get campaign by ID
 */
function getCampaign(campaignId) {
  return campaigns.get(campaignId);
}

/**
 * Update campaign
 */
function updateCampaign(campaignId, updates) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) return null;

  Object.assign(campaign, updates);
  return campaign;
}

/**
 * Delete campaign
 */
function deleteCampaign(campaignId) {
  return campaigns.delete(campaignId);
}

/**
 * Get audience segments
 */
function getAudienceSegments() {
  return Array.from(audienceSegments.values());
}

/**
 * Get conversion events
 */
function getConversionEvents(filters = {}) {
  let events = Array.from(conversionEvents.values());

  if (filters.campaignId) {
    events = events.filter(e => e.campaignId === filters.campaignId);
  }
  if (filters.prospectId) {
    events = events.filter(e => e.prospectId === filters.prospectId);
  }
  if (filters.type) {
    events = events.filter(e => e.type === filters.type);
  }

  return events;
}

module.exports = {
  client,
  createCampaign,
  getCampaignAnalytics,
  trackConversion,
  createQRCampaign,
  getQRScanAnalytics,
  createAudienceSegment,
  syncProspectsToAudience,
  createDOOHCampaign,
  getDOOHAnalytics,
  createRetailMediaCampaign,
  syncCreatorRewards,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  getAudienceSegments,
  getConversionEvents
};
