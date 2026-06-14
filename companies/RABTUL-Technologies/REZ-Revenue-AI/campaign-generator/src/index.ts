/**
 * REZ Revenue AI - AI Campaign Generator
 * Auto-generate multi-channel campaigns
 *
 * Merchant clicks "Generate Campaign"
 * System creates: WhatsApp, SMS, Push, Instagram, QR, Poster
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { z } from 'zod';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })],
});

// ================== TYPES ==================

interface ChannelContent {
  channel: string;
  subject?: string;
  headline: string;
  body: string;
  cta: string;
  ctaUrl?: string;
  imagePrompt?: string;
  templateId?: string;
  estimatedReach: number;
  estimatedConversion: number;
}

interface GeneratedCampaign {
  campaignId: string;
  name: string;
  objective: string;
  audience: {
    segment: string;
    count: number;
    criteria: string[];
  };
  offer: {
    type: string;
    value: number;
    description: string;
    validUntil: string;
  };
  channels: ChannelContent[];
  schedule: {
    sendTime: Date;
    timezone: string;
    frequency: 'once' | 'daily' | 'weekly';
  };
  budget: {
    estimated: number;
    costPerMessage: number;
    totalReach: number;
  };
  estimatedResults: {
    reach: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  createdAt: string;
}

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  objective: string;
  audience: string;
  tone: string;
  template: {
    whatsapp: string;
    sms: string;
    push: string;
    instagram: string;
  };
}

// ================== VALIDATION SCHEMAS ==================

const CampaignRequestSchema = z.object({
  merchantId: z.string().min(1),
  objective: z.enum(['acquisition', 'retention', 'reactivation', 'awareness', 'upsell']),
  target: z.enum(['new_users', 'existing', 'at_risk', 'dormant', 'vip', 'all']),
  offer: z.object({
    type: z.enum(['discount', 'cashback', 'bundle', 'free_item', 'upgrade', 'bogo']),
    value: z.number(),
    minOrderValue: z.number().optional(),
    maxDiscount: z.number().optional(),
    description: z.string().optional(),
  }),
  channels: z.array(z.enum(['whatsapp', 'sms', 'push', 'instagram', 'qr', 'email'])),
  tone: z.enum(['friendly', 'urgent', 'premium', 'casual']).default('friendly'),
  merchantInfo: z.object({
    name: z.string(),
    category: z.string().optional(),
    location: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
});

// ================== CAMPAIGN GENERATOR CLASS ==================

class CampaignGenerator {
  /**
   * Generate a complete multi-channel campaign
   */
  generate(request: z.infer<typeof CampaignRequestSchema>): GeneratedCampaign {
    const campaignId = uuidv4();
    const merchantName = request.merchantInfo?.name || 'Your Business';
    const category = request.merchantInfo?.category || 'service';

    const channels: ChannelContent[] = [];
    const audienceCount = this.getAudienceCount(request.target);

    // Generate content for each channel
    for (const channel of request.channels) {
      channels.push(this.generateChannelContent(channel, request, merchantName));
    }

    const estimatedReach = channels.reduce((sum, c) => sum + c.estimatedReach, 0);
    const estimatedConversion = estimatedReach * 0.03; // 3% average conversion

    const campaign: GeneratedCampaign = {
      campaignId,
      name: this.generateCampaignName(request.objective, request.target),
      objective: request.objective,
      audience: {
        segment: request.target,
        count: audienceCount,
        criteria: this.getAudienceCriteria(request.target),
      },
      offer: {
        type: request.offer.type,
        value: request.offer.value,
        description: this.getOfferDescription(request.offer),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      channels,
      schedule: {
        sendTime: this.getOptimalSendTime(request.target),
        timezone: 'Asia/Kolkata',
        frequency: 'once',
      },
      budget: {
        estimated: estimatedReach * 0.5, // ₹0.50 per message
        costPerMessage: 0.50,
        totalReach: estimatedReach,
      },
      estimatedResults: {
        reach: Math.round(estimatedReach * 0.8),
        impressions: Math.round(estimatedReach * 1.5),
        clicks: Math.round(estimatedReach * 0.05),
        conversions: Math.round(estimatedConversion),
        revenue: Math.round(estimatedConversion * (request.offer.value || 200)),
      },
      createdAt: new Date().toISOString(),
    };

    logger.info('Campaign generated', {
      campaignId,
      merchantId: request.merchantId,
      objective: request.objective,
      channels: request.channels,
    });

    return campaign;
  }

  /**
   * Generate content for specific channel
   */
  private generateChannelContent(
    channel: string,
    request: z.infer<typeof CampaignRequestSchema>,
    merchantName: string
  ): ChannelContent {
    const offerDesc = this.getOfferDescription(request.offer);
    const tone = request.tone;

    switch (channel) {
      case 'whatsapp':
        return this.generateWhatsAppContent(request, merchantName, offerDesc, tone);
      case 'sms':
        return this.generateSMSContent(request, merchantName, offerDesc);
      case 'push':
        return this.generatePushContent(request, merchantName, offerDesc);
      case 'instagram':
        return this.generateInstagramContent(request, merchantName, offerDesc);
      case 'qr':
        return this.generateQRContent(request, merchantName, offerDesc);
      case 'email':
        return this.generateEmailContent(request, merchantName, offerDesc);
      default:
        return this.generateGenericContent(channel, request, merchantName);
    }
  }

  /**
   * WhatsApp content generation
   */
  private generateWhatsAppContent(
    request: z.infer<typeof CampaignRequestSchema>,
    merchantName: string,
    offerDesc: string,
    tone: string
  ): ChannelContent {
    const templates: Record<string, string> = {
      friendly: `Hey! ✨

Great news from ${merchantName}!

${offerDesc}

Valid for a limited time only!

👉 Book now: [Link]

Reply STOP to unsubscribe`,
      urgent: `⏰ Limited Time Offer!

${offerDesc}

Only valid for the next 48 hours!

👉 Grab it now: [Link]

Don't miss out!`,
      premium: `🌟 Exclusive Offer for You

${merchantName} presents:

${offerDesc}

As a valued customer, you get priority access!

👉 Book now: [Link]`,
      casual: `Hey!

${merchantName} has something special for you!

${offerDesc}

Come visit us soon! 😊

👉 [Link]`,
    };

    const body = templates[tone] || templates.friendly;

    return {
      channel: 'whatsapp',
      headline: `${merchantName} - Special Offer!`,
      body,
      cta: 'Book Now',
      ctaUrl: 'https://rez.now/booking',
      imagePrompt: `Professional ${request.merchantInfo?.category || 'business'} promotional image with text overlay showing ${request.offer.value}% discount offer, vibrant colors, modern design`,
      estimatedReach: 5000,
      estimatedConversion: 150,
    };
  }

  /**
   * SMS content generation
   */
  private generateSMSContent(
    request: z.infer<typeof CampaignRequestSchema>,
    merchantName: string,
    offerDesc: string
  ): ChannelContent {
    const value = request.offer.value;
    const type = request.offer.type;

    let body = '';
    if (type === 'discount') {
      body = `${merchantName}: Get ${value}% OFF on your next visit! ${offerDesc} Use code REZOFF${value}. Valid 7 days. Book: [Link]`;
    } else if (type === 'cashback') {
      body = `${merchantName}: Earn ${value}% CASHBACK on every order! ${offerDesc} Valid for limited time. Book: [Link]`;
    } else if (type === 'bundle') {
      body = `${merchantName}: BOGO Alert! ${offerDesc} Don't miss this deal! Book: [Link]`;
    } else {
      body = `${merchantName}: ${offerDesc} Book now: [Link]`;
    }

    // SMS has 160 char limit
    const truncated = body.length > 160 ? body.substring(0, 157) + '...' : body;

    return {
      channel: 'sms',
      headline: `${merchantName} Offer`,
      body: truncated,
      cta: 'Book Now',
      ctaUrl: 'https://rez.now/booking',
      estimatedReach: 8000,
      estimatedConversion: 120,
    };
  }

  /**
   * Push notification content
   */
  private generatePushContent(
    request: z.infer<typeof CampaignRequestSchema>,
    merchantName: string,
    offerDesc: string
  ): ChannelContent {
    const type = request.offer.type;
    const value = request.offer.value;

    let headline = '';
    let body = '';

    if (type === 'discount') {
      headline = `🎉 ${value}% OFF at ${merchantName}!`;
      body = `Limited time offer! ${offerDesc} Tap to book your appointment.`;
    } else if (type === 'cashback') {
      headline = `💰 Earn ${value}% Cashback!`;
      body = `${merchantName} is giving you ${value}% back on every order. Don't miss it!`;
    } else {
      headline = `✨ Special Offer Just for You!`;
      body = `${offerDesc} Valid for a limited time.`;
    }

    return {
      channel: 'push',
      headline,
      body,
      cta: 'Claim Offer',
      ctaUrl: 'https://rez.now/booking',
      estimatedReach: 3000,
      estimatedConversion: 90,
    };
  }

  /**
   * Instagram content generation
   */
  private generateInstagramContent(
    request: z.infer<typeof CampaignRequestSchema>,
    merchantName: string,
    offerDesc: string
  ): ChannelContent {
    const value = request.offer.value;
    const category = request.merchantInfo?.category || 'service';

    return {
      channel: 'instagram',
      headline: `✨ ${value}% OFF at ${merchantName} ✨`,
      body: `📢 GIVEAWAY ALERT!

${offerDesc}

📍 Visit us at ${request.merchantInfo?.location || 'our store'}

⏰ Offer ends in 7 days!

#${merchantName.replace(/\s/g, '')} #${category} #Offer #Discount #Deal #MustVisit`,
      cta: 'Book Now',
      ctaUrl: 'https://rez.now/booking',
      imagePrompt: `Instagram post design for ${category} business, featuring ${value}% discount offer, modern minimalist aesthetic, pastel gradient background, elegant typography, professional food/service photography, includes text overlay "GET ${value}% OFF"`,
      estimatedReach: 2000,
      estimatedConversion: 60,
    };
  }

  /**
   * QR campaign content
   */
  private generateQRContent(
    request: z.infer<typeof CampaignRequestSchema>,
    merchantName: string,
    offerDesc: string
  ): ChannelContent {
    const value = request.offer.value;

    return {
      channel: 'qr',
      headline: `Scan & Save ${value}%!`,
      body: `Scan this QR code at ${merchantName} to redeem:

${offerDesc}

📍 Valid at our store
⏰ Limited time only`,
      cta: 'Show this to avail offer',
      imagePrompt: `QR code promotional flyer design for ${category} business, features QR code in center, ${value}% discount offer prominently displayed, professional design, can be placed on tables/walls`,
      estimatedReach: 1000,
      estimatedConversion: 50,
    };
  }

  /**
   * Email content generation
   */
  private generateEmailContent(
    request: z.infer<typeof CampaignRequestSchema>,
    merchantName: string,
    offerDesc: string
  ): ChannelContent {
    const value = request.offer.value;

    return {
      channel: 'email',
      subject: `${merchantName}: Exclusive ${value}% Off Just for You! 🎉`,
      headline: `Hi {{name}},

We have something special for you!

${offerDesc}

This offer is exclusively for our valued customers and is valid for the next 7 days.

👉 Click here to book your appointment

See you soon!

The ${merchantName} Team`,
      body: '', // Full body in headline for email
      cta: 'Book Now',
      ctaUrl: 'https://rez.now/booking',
      estimatedReach: 4000,
      estimatedConversion: 120,
    };
  }

  /**
   * Generic content fallback
   */
  private generateGenericContent(
    channel: string,
    request: z.infer<typeof CampaignRequestSchema>,
    merchantName: string
  ): ChannelContent {
    return {
      channel,
      headline: `Special Offer at ${merchantName}`,
      body: request.offer.description || `${request.offer.value}% off on your next visit!`,
      cta: 'Learn More',
      ctaUrl: 'https://rez.now/booking',
      estimatedReach: 1000,
      estimatedConversion: 30,
    };
  }

  /**
   * Generate campaign name
   */
  private generateCampaignName(objective: string, target: string): string {
    const names: Record<string, string> = {
      acquisition_new_users: 'New Customer Acquisition Drive',
      acquisition_all: 'Win New Customers',
      retention_existing: 'Thank You, Loyal Customer!',
      retention_vip: 'VIP Exclusive Offer',
      reactivation_at_risk: 'We Miss You!',
      reactivation_dormant: 'Come Back Special',
      awareness_all: 'Discover the Best',
      upsell_all: 'Treat Yourself Better',
    };

    const key = `${objective}_${target}`;
    return names[key] || `${objective.charAt(0).toUpperCase() + objective.slice(1)} Campaign`;
  }

  /**
   * Get audience count (mock)
   */
  private getAudienceCount(target: string): number {
    const counts: Record<string, number> = {
      new_users: 2500,
      existing: 5000,
      at_risk: 450,
      dormant: 800,
      vip: 350,
      all: 10000,
    };
    return counts[target] || 5000;
  }

  /**
   * Get audience criteria
   */
  private getAudienceCriteria(target: string): string[] {
    const criteria: Record<string, string[]> = {
      new_users: ['First 3 months', 'No prior bookings', 'Location-based'],
      existing: ['2+ bookings', 'Active in last 30 days', 'All locations'],
      at_risk: ['Declining visits', 'Last visit 30-45 days ago', 'Low engagement'],
      dormant: ['Last visit 60+ days ago', 'Previously active', 'All locations'],
      vip: ['Top 10% by spending', '6+ months tenure', 'High engagement'],
      all: ['All customers', 'All segments', 'All locations'],
    };
    return criteria[target] || [];
  }

  /**
   * Get offer description
   */
  private getOfferDescription(offer: z.infer<typeof CampaignRequestSchema>['offer']): string {
    if (offer.description) return offer.description;

    if (offer.type === 'discount') {
      return `${offer.value}% OFF on all services!`;
    } else if (offer.type === 'cashback') {
      return `Earn ${offer.value}% CASHBACK on every order!`;
    } else if (offer.type === 'bundle') {
      return `Get ${offer.value}% OFF on bundled packages!`;
    } else if (offer.type === 'free_item') {
      return `FREE ${offer.value} with every booking!`;
    } else if (offer.type === 'upgrade') {
      return `Upgrade to Premium - ${offer.value}% OFF!`;
    } else if (offer.type === 'bogo') {
      return `Buy 1 Get 1 FREE! Limited time!`;
    }
    return `${offer.value}% savings await you!`;
  }

  /**
   * Get optimal send time
   */
  private getOptimalSendTime(target: string): Date {
    const now = new Date();
    const times: Record<string, number> = {
      new_users: 10, // 10 AM
      existing: 9,   // 9 AM
      at_risk: 18,  // 6 PM
      dormant: 11,    // 11 AM
      vip: 10,      // 10 AM
      all: 10,      // 10 AM
    };

    const hour = times[target] || 10;
    now.setHours(hour, 0, 0, 0);

    // If time passed today, send tomorrow
    if (now.getTime() < Date.now()) {
      now.setDate(now.getDate() + 1);
    }

    return now;
  }

  /**
   * Get campaign templates
   */
  getTemplates(): CampaignTemplate[] {
    return [
      {
        id: 'welcome_new',
        name: 'Welcome New Customers',
        description: 'Attract new customers with an introductory offer',
        objective: 'acquisition',
        audience: 'new_users',
        tone: 'friendly',
        template: {
          whatsapp: 'Hey! Welcome to {{merchant}}. Get {{value}}% OFF your first visit!',
          sms: '{{merchant}}: Welcome! Get {{value}}% OFF. Code: WELCOME',
          push: '🎉 Welcome! {{value}}% OFF awaits!',
          instagram: '🌟 Welcome to {{merchant}}! Get {{value}}% OFF your first visit! #Welcome #NewOffer',
        },
      },
      {
        id: 'win_back',
        name: 'Win Back Dormant',
        description: 'Re-engage customers who haven\'t visited recently',
        objective: 'reactivation',
        audience: 'dormant',
        tone: 'urgent',
        template: {
          whatsapp: 'Hey! We miss you! 🥺 Come back and get {{value}}% OFF!',
          sms: '{{merchant}}: We miss you! {{value}}% OFF to welcome you back. Code: COMEBACK',
          push: '😢 We miss you! {{value}}% OFF to return!',
          instagram: '💔 Miss you! Come back for {{value}}% OFF! #ComeBack #SpecialOffer',
        },
      },
      {
        id: 'loyalty_reward',
        name: 'Loyal Customer Reward',
        description: 'Reward loyal customers with exclusive offer',
        objective: 'retention',
        audience: 'existing',
        tone: 'premium',
        template: {
          whatsapp: '🌟 Thank you for being amazing! Here\'s {{value}}% OFF just for you!',
          sms: '{{merchant}}: VIP reward! {{value}}% OFF. Code: VIP',
          push: '🌟 VIP Alert! {{value}}% OFF exclusive!',
          instagram: '💎 For our amazing customers: {{value}}% OFF! #VIP #Exclusive',
        },
      },
      {
        id: 'weekend_special',
        name: 'Weekend Special',
        description: 'Drive weekend traffic with a special offer',
        objective: 'upsell',
        audience: 'all',
        tone: 'casual',
        template: {
          whatsapp: 'Weekend plans? 😎 Get {{value}}% OFF at {{merchant}}!',
          sms: '{{merchant}}: Weekend special! {{value}}% OFF Sat-Sun. Book now!',
          push: '🎉 Weekend Special! {{value}}% OFF!',
          instagram: '🌴 Make it a weekend to remember! {{value}}% OFF at {{merchant}}! #WeekendVibes',
        },
      },
    ];
  }
}

// ================== EXPRESS APP ==================

const app = express();
const generator = new CampaignGenerator();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '5mb' }));

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-revenue-ai-campaign-generator',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/v1/campaigns/generate
 * Generate a complete multi-channel campaign
 */
app.post('/api/v1/campaigns/generate', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    const validationResult = CampaignRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: validationResult.error.issues,
        },
      });
    }

    const campaign = generator.generate(validationResult.data);

    res.json({
      success: true,
      data: campaign,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        calculationTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error('Campaign generation error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to generate campaign' },
    });
  }
});

/**
 * GET /api/v1/campaigns/templates
 * Get campaign templates
 */
app.get('/api/v1/campaigns/templates', (req: Request, res: Response) => {
  const templates = generator.getTemplates();
  res.json({ success: true, data: templates });
});

/**
 * POST /api/v1/campaigns/customize
 * Customize an existing template
 */
app.post('/api/v1/campaigns/customize', async (req: Request, res: Response) => {
  try {
    const { templateId, merchantId, offer, merchantInfo } = req.body;

    const templates = generator.getTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template not found' },
      });
    }

    const campaign = generator.generate({
      merchantId,
      objective: template.objective as 'acquisition' | 'retention' | 'reactivation' | 'awareness' | 'upsell',
      target: template.audience as 'new_users' | 'existing' | 'at_risk' | 'dormant' | 'vip' | 'all',
      offer: offer || { type: 'discount', value: 15 },
      channels: ['whatsapp', 'sms', 'push'],
      tone: template.tone as 'friendly' | 'urgent' | 'premium' | 'casual',
      merchantInfo,
    });

    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to customize campaign' },
    });
  }
});

/**
 * GET /api/v1/campaigns/estimate
 * Estimate campaign results
 */
app.get('/api/v1/campaigns/estimate', (req: Request, res: Response) => {
  const { channel, audience, offer } = req.query;

  // Mock estimation based on parameters
  const baseReach: Record<string, number> = {
    whatsapp: 5000,
    sms: 8000,
    push: 3000,
    instagram: 2000,
    email: 4000,
  };

  const reach = baseReach[channel as string] || 5000;
  const audienceMultiplier: Record<string, number> = {
    new_users: 1.2,
    existing: 1.0,
    at_risk: 0.8,
    dormant: 0.6,
    vip: 0.5,
    all: 1.5,
  };

  const estimatedReach = reach * (audienceMultiplier[audience as string] || 1);

  res.json({
    success: true,
    data: {
      channel,
      audience,
      estimatedReach: Math.round(estimatedReach),
      estimatedClicks: Math.round(estimatedReach * 0.05),
      estimatedConversions: Math.round(estimatedReach * 0.03),
      estimatedRevenue: Math.round(estimatedReach * 0.03 * 300),
      estimatedCost: Math.round(estimatedReach * 0.5),
    },
  });
});

const PORT = process.env.PORT || 4311;

app.listen(PORT, () => {
  logger.info('REZ Revenue AI Campaign Generator started', { port: PORT });
});

export default app;
