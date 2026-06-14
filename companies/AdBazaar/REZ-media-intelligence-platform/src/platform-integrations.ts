/**
 * Platform API Integrations
 * Connect to Instagram, Facebook, WhatsApp Business, Google Ads
 *
 * Port: 5002
 * Purpose: Publishing content to social platforms
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import axios from 'axios';
import FormData from 'form-data';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 5002;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'logs/platforms.log' })]
});

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

app.use(helmet()); app.use(cors()); app.use(express.json({ limit: '50mb' }));
app.use(rateLimit({ windowMs: 60000, max: 50 })(app.request, app.response, () => {}));

// ============================================
// META (Instagram + Facebook)
// ============================================

const META_CONFIG = {
  ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '',
  APP_ID: process.env.META_APP_ID || '',
  APP_SECRET: process.env.META_APP_SECRET || '',
  BUSINESS_ACCOUNT_ID: process.env.META_BUSINESS_ACCOUNT_ID || '',
  API_VERSION: 'v18.0',
  BASE_URL: 'https://graph.facebook.com',
};

// Instagram Graph API
export class InstagramAPI {
  private accessToken: string;
  private baseUrl = META_CONFIG.BASE_URL;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Get Instagram Business Account
   */
  async getBusinessAccount(): Promise<any> {
    try {
      // Get all pages and find one with Instagram
      const response = await axios.get(`${this.baseUrl}/me/accounts`, {
        params: { access_token: this.accessToken },
      });

      if (!response.data.data?.length) {
        throw new Error('No Facebook Pages found');
      }

      // Get Instagram account from first page
      const pageId = response.data.data[0].id;
      const igResponse = await axios.get(
        `${this.baseUrl}/${pageId}?fields=instagram_business_account&access_token=${this.accessToken}`
      );

      return igResponse.data.instagram_business_account;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create media item
   */
  async createMedia(imageUrl: string, caption: string, igAccountId: string): Promise<string> {
    try {
      // First upload image
      const uploadResponse = await axios.post(
        `${this.baseUrl}/${igAccountId}/media`,
        {
          image_url: imageUrl,
          caption,
        },
        {
          params: { access_token: this.accessToken },
        }
      );

      return uploadResponse.data.id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Publish media
   */
  async publishMedia(mediaId: string, igAccountId: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${igAccountId}/media_publish`,
        { creation_id: mediaId },
        { params: { access_token: this.accessToken } }
      );

      return response.data.id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create Reel (Video)
   */
  async createReel(videoUrl: string, caption: string, igAccountId: string): Promise<string> {
    try {
      // Upload video
      const uploadResponse = await axios.post(
        `${this.baseUrl}/${igAccountId}/media`,
        {
          video_url: videoUrl,
          caption,
          media_type: 'REELS',
        },
        {
          params: { access_token: this.accessToken },
        }
      );

      return uploadResponse.data.id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get media insights
   */
  async getMediaInsights(mediaId: string, igAccountId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${mediaId}/insights`,
        {
          params: {
            metric: 'impressions,reach,saved,video_views,likes,comments,shares',
            access_token: this.accessToken,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get account insights
   */
  async getAccountInsights(igAccountId: string, period = '30d'): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${igAccountId}/insights`,
        {
          params: {
            metric: 'follower_count,profile_views,reach,impressions',
            period,
            access_token: this.accessToken,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return null;
    }
  }
}

// Facebook Marketing API
export class FacebookAdsAPI {
  private accessToken: string;
  private adAccountId: string;
  private baseUrl = META_CONFIG.BASE_URL;

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
  }

  /**
   * Create Ad Campaign
   */
  async createCampaign(name: string, objective: string, budget: number): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/act_${this.adAccountId}/campaigns`,
        {
          name,
          objective,
          status: 'PAUSED',
          daily_budget: budget * 100, // Convert to cents
        },
        {
          params: { access_token: this.accessToken },
        }
      );

      return response.data.id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create Ad Set
   */
  async createAdSet(campaignId: string, targeting: any, budget: number): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/act_${this.adAccountId}/adsets`,
        {
          name: `Ad Set ${Date.now()}`,
          campaign_id: campaignId,
          targeting,
          daily_budget: budget * 100,
          optimization_goal: 'CONVERSIONS',
          billing_event: 'IMPRESSIONS',
        },
        {
          params: { access_token: this.accessToken },
        }
      );

      return response.data.id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create Ad
   */
  async createAd(adSetId: string, creative: any): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/act_${this.adAccountId}/ads`,
        {
          name: `Ad ${Date.now()}`,
          adset_id: adSetId,
          creative,
          status: 'PAUSED',
        },
        {
          params: { access_token: this.accessToken },
        }
      );

      return response.data.id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get campaign insights
   */
  async getCampaignInsights(campaignId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${campaignId}/insights`,
        {
          params: {
            fields: 'impressions,reach,spend,clicks,actions',
            access_token: this.accessToken,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return null;
    }
  }
}

// ============================================
// WhatsApp Business API
// ============================================

export class WhatsAppBusinessAPI {
  private phoneNumberId: string;
  private accessToken: string;
  private baseUrl = 'https://graph.facebook.com';
  private apiVersion = 'v18.0';

  constructor(phoneNumberId: string, accessToken: string) {
    this.phoneNumberId = phoneNumberId;
    this.accessToken = accessToken;
  }

  /**
   * Send text message
   */
  async sendMessage(to: string, message: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to.replace(/\D/g, ''),
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.messages[0].id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send image
   */
  async sendImage(to: string, imageUrl: string, caption: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to.replace(/\D/g, ''),
          type: 'image',
          image: { link: imageUrl, caption },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.messages[0].id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send template message
   */
  async sendTemplate(to: string, templateName: string, languageCode = 'en'): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to.replace(/\D/g, ''),
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.messages[0].id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send bulk messages
   */
  async sendBulkMessages(recipients: string[], message: string): Promise<any[]> {
    const results = [];

    for (const to of recipients) {
      try {
        const messageId = await this.sendMessage(to, message);
        results.push({ to, success: true, messageId });
      } catch (error) {
        results.push({ to, success: false, error: String(error) });
      }
    }

    return results;
  }
}

// ============================================
// Google Ads API
// ============================================

export class GoogleAdsAPI {
  private developerToken: string;
  private customerId: string;
  private accessToken: string;
  private baseUrl = 'https://googleads.googleapis.com';

  constructor(developerToken: string, customerId: string, accessToken: string) {
    this.developerToken = developerToken;
    this.customerId = customerId;
    this.accessToken = accessToken;
  }

  /**
   * Create campaign
   */
  async createCampaign(name: string, budget: number, targeting: any): Promise<string> {
    try {
      // Using Google Ads API
      const response = await axios.post(
        `${this.baseUrl}/v16/customers/${this.customerId}/campaigns`,
        {
          campaign: {
            name,
            advertising_channel_type: 'PERFORMANCE_MAX',
            status: 'PAUSED',
            campaign_budget: `customers/${this.customerId}/campaignBudgets/-1`,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'developer-token': this.developerToken,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.results[0].resource_name;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(campaignId: string, startDate: string, endDate: string): Promise<any> {
    try {
      const query = `
        SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks,
               metrics.cost_micros, metrics.conversions
        FROM campaign
        WHERE campaign.id = ${campaignId}
        AND segments.date BETWEEN '${startDate}' AND '${endDate}'
      `;

      const response = await axios.post(
        `${this.baseUrl}/v16/customers/${this.customerId}/googleAds:search`,
        { query },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'developer-token': this.developerToken,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.results;
    } catch (error) {
      return [];
    }
  }
}

// ============================================
// EXPRESS SERVER
// ============================================

const publishLogSchema = new mongoose.Schema({
  publishId: String,
  platform: String, // instagram, facebook, whatsapp, google
  contentId: String,
  merchantId: String,
  status: String, // pending, published, failed
  result: mongoose.Schema.Types.Mixed,
  timestamp: Date,
});

const PublishLog = mongoose.model('PublishLog', publishLogSchema);

// Health check
app.get('/health', (req, res) => res.json({
  status: 'healthy',
  service: 'platform-integrations',
  port: PORT,
  platforms: {
    meta: !!META_CONFIG.ACCESS_TOKEN,
    whatsapp: !!process.env.WHATSAPP_ACCESS_TOKEN,
    google: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  },
  timestamp: new Date().toISOString(),
}));

/**
 * Publish to Instagram
 * POST /api/publish/instagram
 */
app.post('/api/publish/instagram', async (req: res) => {
  try {
    const { imageUrl, caption, contentId, merchantId } = req.body;

    if (!META_CONFIG.ACCESS_TOKEN) {
      res.status(400).json({ success: false, error: 'Meta access token not configured' });
      return;
    }

    const ig = new InstagramAPI(META_CONFIG.ACCESS_TOKEN);
    const account = await ig.getBusinessAccount();

    const mediaId = await ig.createMedia(imageUrl, caption, account.id);
    const postId = await ig.publishMedia(mediaId, account.id);

    const log = new PublishLog({
      publishId: `pub_${Date.now()}`,
      platform: 'instagram',
      contentId,
      merchantId,
      status: 'published',
      result: { mediaId, postId },
      timestamp: new Date(),
    });
    await log.save();

    res.json({ success: true, postId, mediaId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Publish to Facebook
 * POST /api/publish/facebook
 */
app.post('/api/publish/facebook', async (req: res) => {
  try {
    const { pageId, message, contentId, merchantId } = req.body;

    if (!META_CONFIG.ACCESS_TOKEN) {
      res.status(400).json({ success: false, error: 'Meta access token not configured' });
      return;
    }

    const response = await axios.post(
      `${META_CONFIG.BASE_URL}/${pageId}/feed`,
      { message },
      { params: { access_token: META_CONFIG.ACCESS_TOKEN } }
    );

    const log = new PublishLog({
      publishId: `pub_${Date.now()}`,
      platform: 'facebook',
      contentId,
      merchantId,
      status: 'published',
      result: { postId: response.data.id },
      timestamp: new Date(),
    });
    await log.save();

    res.json({ success: true, postId: response.data.id });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Publish to WhatsApp
 * POST /api/publish/whatsapp
 */
app.post('/api/publish/whatsapp', async (req: res) => {
  try {
    const { to, message, imageUrl, template, contentId, merchantId } = req.body;

    const whatsapp = new WhatsAppBusinessAPI(
      process.env.WHATSAPP_PHONE_ID || '',
      process.env.WHATSAPP_ACCESS_TOKEN || ''
    );

    let messageId;
    if (imageUrl) {
      messageId = await whatsapp.sendImage(to, imageUrl, message || '');
    } else if (template) {
      messageId = await whatsapp.sendTemplate(to, template);
    } else {
      messageId = await whatsapp.sendMessage(to, message);
    }

    const log = new PublishLog({
      publishId: `pub_${Date.now()}`,
      platform: 'whatsapp',
      contentId,
      merchantId,
      status: 'published',
      result: { messageId },
      timestamp: new Date(),
    });
    await log.save();

    res.json({ success: true, messageId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Get publish history
 * GET /api/publish/history/:merchantId
 */
app.get('/api/publish/history/:merchantId', async (req: res) => {
  try {
    const { platform, limit = 50 } = req.query;
    const query: any = { merchantId: req.params.merchantId };
    if (platform) query.platform = platform;

    const logs = await PublishLog.find(query).sort({ timestamp: -1 }).limit(Number(limit));

    res.json({ success: true, logs, count: logs.length });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Get platform analytics
 * GET /api/analytics/:platform
 */
app.get('/api/analytics/:platform', async (req: res) => {
  try {
    const { igAccountId } = req.query;

    if (req.params.platform === 'instagram' && igAccountId && META_CONFIG.ACCESS_TOKEN) {
      const ig = new InstagramAPI(META_CONFIG.ACCESS_TOKEN);
      const insights = await ig.getAccountInsights(igAccountId as string, '30d');

      res.json({ success: true, insights });
    } else {
      res.json({ success: true, insights: [] });
    }
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.listen(PORT, () => {
  logger.info(`🚀 Platform Integrations started on port ${PORT}`);
  logger.info('📱 Instagram, Facebook, WhatsApp, Google Ads');

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/platforms')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB error:', err));
});

export default app;