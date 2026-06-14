/**
 * AdBazaar Universal Pixel
 * Website, Server-side, and Mobile tracking
 *
 * Port: 4962
 * Purpose: Equivalent to Meta Pixel, Google Tag, TikTok Pixel
 *
 * Features:
 * - Web pixel (JavaScript SDK)
 * - Server-side tracking
 * - Mobile SDK events
 * - Event deduplication
 * - Cross-device identity
 * - Conversion tracking
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import crypto from 'crypto';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4962;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/pixel.log' })
  ]
});

// Configuration
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5000,
  message: { error: 'Too many requests' }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// MongoDB Schemas

// Pixel Configuration
const pixelConfigSchema = new mongoose.Schema({
  pixelId: { type: String, unique: true, index: true },
  merchantId: String,
  name: String,
  type: String, // web, server, mobile
  domain: String,
  events: [{
    name: String,
    enabled: Boolean
  }],
  settings: {
    deduplication: Boolean,
    crossDomain: Boolean,
    advancedMatching: Boolean
  },
  createdAt: Date,
  updatedAt: Date
});

const PixelConfig = mongoose.model('PixelConfig', pixelConfigSchema);

// Event Record
const pixelEventSchema = new mongoose.Schema({
  eventId: String,
  pixelId: String,
  merchantId: String,

  event: {
    name: String,
    category: String,
    properties: mongoose.Schema.Types.Mixed
  },

  // User identification
  user: {
    fbp: String, // Facebook Browser ID
    fbc: String, // Facebook Click ID
    gp: String, // Google Pixel ID
    ttp: String, // TikTok Pixel ID
    email: String,
    phone: String,
    externalId: String
  },

  // Context
  context: {
    url: String,
    referrer: String,
    userAgent: String,
    ip: String,
    language: String
  },

  // Device
  device: {
    type: String,
    os: String,
    browser: String,
    mobile: Boolean
  },

  // Location
  location: {
    country: String,
    region: String,
    city: String
  },

  // Attribution
  attribution: {
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String
  },

  // Metadata
  timestamp: Date,
  processed: Boolean,
  processedAt: Date
});

const PixelEvent = mongoose.model('PixelEvent', pixelEventSchema);

// Conversion Record
const conversionSchema = new mongoose.Schema({
  conversionId: String,
  pixelId: String,
  merchantId: String,

  event: {
    name: String,
    value: Number,
    currency: String
  },

  user: {
    fbp: String,
    externalId: String
  },

  attribution: {
    campaignId: String,
    channel: String,
    touchpoint: String
  },

  status: String, // attributed, reported, duplicate
  reportedAt: Date,

  timestamp: Date
});

const Conversion = mongoose.model('Conversion', conversionSchema);

// Models
const PixelConfigModel = mongoose.model('PixelConfig', pixelConfigSchema);
const PixelEventModel = mongoose.model('PixelEvent', pixelEventSchema);
const ConversionModel = mongoose.model('Conversion', conversionSchema);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'adbazaar-pixel',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// WEB PIXEL - JAVASCRIPT SDK
// ============================================

/**
 * Get Pixel SDK JavaScript
 * GET /sdk.js?pixel_id=xxx
 */
app.get('/sdk.js', async (req: Request, res: Response) => {
  const { pixel_id } = req.query;

  if (!pixel_id) {
    res.status(400).send('Pixel ID required');
    return;
  }

  // Get pixel config
  const pixel = await PixelConfig.findOne({ pixelId: pixel_id });

  if (!pixel) {
    res.status(404).send('Pixel not found');
    return;
  }

  // Generate custom SDK
  const sdk = generateWebSDK(pixel);

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(sdk);
});

/**
 * Track event from web
 * POST /track
 */
app.post('/track', async (req: Request, res: Response) => {
  try {
    const {
      pixel_id,
      event_name,
      event_data,
      user_data,
      context_data
    } = req.body;

    const eventId = generateEventId();
    const timestamp = new Date();

    // Create event record
    const event = new PixelEventModel({
      eventId,
      pixelId: pixel_id,
      merchantId: user_data?.merchantId,
      event: {
        name: event_name,
        properties: event_data
      },
      user: {
        fbp: user_data?.fbp,
        fbc: user_data?.fbc,
        gp: user_data?.gp,
        ttp: user_data?.ttp,
        email: user_data?.email ? hashEmail(user_data.email) : undefined,
        phone: user_data?.phone ? hashPhone(user_data.phone) : undefined,
        externalId: user_data?.externalId
      },
      context: {
        url: context_data?.url || req.headers.referer,
        referrer: context_data?.referrer,
        userAgent: req.headers['user-agent'],
        ip: getClientIP(req),
        language: req.headers['accept-language']?.split(',')[0]
      },
      device: detectDevice(req.headers['user-agent']),
      attribution: user_data?.attribution,
      timestamp,
      processed: false
    });

    await event.save();

    // Send to CDP
    await sendToCDP(event);

    // Send to ad channels
    await sendToAdChannels(event);

    // Check for conversions
    if (isConversionEvent(event_name)) {
      await recordConversion(event, event_data);
    }

    res.json({
      success: true,
      event_id: eventId
    });
  } catch (error) {
    logger.error('Track error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// SERVER-SIDE TRACKING API
// ============================================

/**
 * Server-side event tracking
 * POST /server/track
 */
app.post('/server/track', async (req: Request, res: Response) => {
  try {
    const {
      pixel_id,
      merchant_id,
      event_name,
      event_data,
      user_data,
      context_data,
      test_event_code
    } = req.body;

    // Validate test mode
    if (test_event_code && test_event_code !== process.env.TEST_EVENT_CODE) {
      res.status(401).json({ success: false, error: 'Invalid test code' });
      return;
    }

    const eventId = generateEventId();

    const event = new PixelEventModel({
      eventId,
      pixelId: pixel_id,
      merchantId: merchant_id,
      event: {
        name: event_name,
        properties: event_data
      },
      user: {
        email: user_data?.email ? hashEmail(user_data.email) : undefined,
        phone: user_data?.phone ? hashPhone(user_data.phone) : undefined,
        externalId: user_data?.externalId,
        fbp: user_data?.fbp,
        fbc: user_data?.fbc
      },
      context: {
        url: context_data?.url,
        referrer: context_data?.referrer,
        ip: getClientIP(req),
        userAgent: req.headers['user-agent']
      },
      attribution: context_data?.attribution,
      timestamp: new Date(),
      processed: false
    });

    await event.save();

    // Process event
    await processServerEvent(event);

    res.json({
      success: true,
      event_id: eventId
    });
  } catch (error) {
    logger.error('Server track error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Server-side conversion event
 * POST /server/conversion
 */
app.post('/server/conversion', async (req: Request, res: Response) => {
  try {
    const {
      pixel_id,
      merchant_id,
      conversion_data,
      test_event_code
    } = req.body;

    if (test_event_code && test_event_code !== process.env.TEST_EVENT_CODE) {
      res.status(401).json({ success: false, error: 'Invalid test code' });
      return;
    }

    // Deduplicate conversions
    const existing = await ConversionModel.findOne({
      pixelId: pixel_id,
      'event.name': conversion_data.event_name,
      'user.externalId': conversion_data.user_data?.externalId,
      timestamp: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    });

    if (existing) {
      res.json({
        success: true,
        duplicate: true,
        conversion_id: existing.conversionId
      });
      return;
    }

    const conversionId = generateEventId();

    const conversion = new ConversionModel({
      conversionId,
      pixelId: pixel_id,
      merchantId: merchant_id,
      event: {
        name: conversion_data.event_name,
        value: conversion_data.value,
        currency: conversion_data.currency || 'INR'
      },
      user: {
        fbp: conversion_data.user_data?.fbp,
        externalId: conversion_data.user_data?.externalId
      },
      attribution: conversion_data.attribution,
      status: 'attributed',
      reportedAt: new Date(),
      timestamp: new Date()
    });

    await conversion.save();

    // Report to ad channels
    await reportConversion(conversion);

    res.json({
      success: true,
      conversion_id: conversionId
    });
  } catch (error) {
    logger.error('Conversion error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// PIXEL MANAGEMENT API
// ============================================

/**
 * Create pixel
 * POST /api/pixels
 */
app.post('/api/pixels', async (req: Request, res: Response) => {
  try {
    const { merchantId, name, type, domain } = req.body;

    const pixelId = generatePixelId();

    const pixel = new PixelConfigModel({
      pixelId,
      merchantId,
      name,
      type: type || 'web',
      domain,
      events: getDefaultEvents(type),
      settings: {
        deduplication: true,
        crossDomain: true,
        advancedMatching: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await pixel.save();

    res.json({
      success: true,
      pixel: {
        id: pixelId,
        name: pixel.name,
        type: pixel.type,
        sdk_code: getSDKInstallCode(pixelId)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get pixels for merchant
 * GET /api/pixels/:merchantId
 */
app.get('/api/pixels/:merchantId', async (req: Request, res: Response) => {
  try {
    const pixels = await PixelConfigModel.find({ merchantId: req.params.merchantId });

    res.json({
      success: true,
      pixels: pixels.map(p => ({
        id: p.pixelId,
        name: p.name,
        type: p.type,
        domain: p.domain,
        events: p.events.filter(e => e.enabled).map(e => e.name)
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get pixel events
 * GET /api/pixels/:pixelId/events
 */
app.get('/api/pixels/:pixelId/events', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;

    const events = await PixelEventModel.find({
      pixelId: req.params.pixelId,
      timestamp: {
        $gte: startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        $lte: endDate ? new Date(endDate as string) : new Date()
      }
    })
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    const total = await PixelEventModel.countDocuments({ pixelId: req.params.pixelId });

    res.json({
      success: true,
      events: events.map(e => ({
        eventId: e.eventId,
        name: e.event.name,
        properties: e.event.properties,
        timestamp: e.timestamp
      })),
      total,
      limit
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// CONVERSION API
// ============================================

/**
 * Get conversions
 * GET /api/pixels/:pixelId/conversions
 */
app.get('/api/conversions/:merchantId', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, event } = req.query;

    const query: any = { merchantId: req.params.merchantId };

    if (event) query['event.name'] = event;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const conversions = await ConversionModel.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    const stats = await ConversionModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$event.name',
          count: { $sum: 1 },
          totalValue: { $sum: '$event.value' }
        }
      }
    ]);

    res.json({
      success: true,
      conversions,
      stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// WEBHOOK FOR MOBILE SDK
// ============================================

/**
 * Mobile SDK webhook
 * POST /mobile/track
 */
app.post('/mobile/track', async (req: Request, res: Response) => {
  try {
    const { pixel_id, merchant_id, events } = req.body;

    const eventIds = [];

    for (const mobileEvent of events) {
      const eventId = generateEventId();

      const event = new PixelEventModel({
        eventId,
        pixelId: pixel_id,
        merchantId: merchant_id,
        event: {
          name: mobileEvent.name,
          properties: mobileEvent.data
        },
        user: {
          externalId: mobileEvent.userId,
          fbp: mobileEvent.fbp
        },
        device: {
          type: 'mobile',
          os: mobileEvent.os,
          mobile: true
        },
        context: {
          url: mobileEvent.deepLink,
          ip: getClientIP(req)
        },
        timestamp: mobileEvent.timestamp || new Date(),
        processed: false
      });

      await event.save();
      eventIds.push(eventId);
    }

    res.json({
      success: true,
      event_ids: eventIds
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateEventId(): string {
  return `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function generatePixelId(): string {
  return `pix_${crypto.randomBytes(8).toString('hex')}`;
}

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

function hashPhone(phone: string): string {
  return crypto.createHash('sha256').update(phone.replace(/\D/g, '')).digest('hex');
}

function getClientIP(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    '';
}

function detectDevice(userAgent: string) {
  const ua = userAgent || '';

  return {
    type: /mobile|android|iphone/i.test(ua) ? 'mobile' : 'desktop',
    os: /android/i.test(ua) ? 'Android' : /ios|iphone|ipad/i.test(ua) ? 'iOS' : 'Other',
    browser: /chrome/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : 'Other',
    mobile: /mobile|android|iphone/i.test(ua)
  };
}

function isConversionEvent(eventName: string): boolean {
  const conversionEvents = [
    'purchase', 'lead', 'signup', 'checkout', 'add_to_cart',
    'complete_registration', 'subscribe', 'make_offer', 'donate'
  ];
  return conversionEvents.includes(eventName);
}

async function sendToCDP(event: any): Promise<void> {
  try {
    // In production, publish to Kafka or call CDP API
    logger.info('Event sent to CDP', { eventId: event.eventId });
  } catch (error) {
    logger.error('CDP send error:', { error: error instanceof Error ? error.message : String(error) });
  }
}

async function sendToAdChannels(event: any): Promise<void> {
  try {
    // Send to Facebook, Google, TikTok conversion APIs
    logger.info('Event sent to ad channels', { eventId: event.eventId });
  } catch (error) {
    logger.error('Ad channel send error:', { error: error instanceof Error ? error.message : String(error) });
  }
}

async function processServerEvent(event: any): Promise<void> {
  event.processed = true;
  event.processedAt = new Date();
  await event.save();

  await sendToCDP(event);
  await sendToAdChannels(event);
}

async function recordConversion(event: any, eventData: any): Promise<void> {
  const conversionId = generateEventId();

  const conversion = new ConversionModel({
    conversionId,
    pixelId: event.pixelId,
    merchantId: event.merchantId,
    event: {
      name: event.event.name,
      value: eventData?.value || 0,
      currency: eventData?.currency || 'INR'
    },
    user: {
      fbp: event.user.fbp,
      externalId: event.user.externalId
    },
    attribution: event.attribution,
    status: 'attributed',
    reportedAt: new Date(),
    timestamp: event.timestamp
  });

  await conversion.save();
}

async function reportConversion(conversion: any): Promise<void> {
  logger.info('Reporting conversion', { conversionId: conversion.conversionId });
  // In production, call Facebook Conversions API, Google Enhanced Conversions, etc.
}

function getDefaultEvents(type: string) {
  const standardEvents = [
    { name: 'PageView', enabled: true },
    { name: 'ViewContent', enabled: true },
    { name: 'AddToCart', enabled: true },
    { name: 'AddToWishlist', enabled: true },
    { name: 'InitiateCheckout', enabled: true },
    { name: 'AddPaymentInfo', enabled: true },
    { name: 'Purchase', enabled: true },
    { name: 'Lead', enabled: true },
    { name: 'CompleteRegistration', enabled: true },
    { name: 'Contact', enabled: true },
    { name: 'FindLocation', enabled: true },
    { name: 'Schedule', enabled: true },
    { name: 'StartTrial', enabled: true },
    { name: 'SubmitApplication', enabled: true },
    { name: 'Subscribe', enabled: true }
  ];

  return standardEvents;
}

function generateWebSDK(pixel: any): string {
  return `
(function() {
  var AdBazaarPixel = {
    pixelId: '${pixel.pixelId}',
    events: [],
    config: ${JSON.stringify(pixel.settings)},

    // Initialize
    init: function() {
      this.loadEvents();
      this.setupListeners();
    },

    // Track event
    track: function(eventName, eventData) {
      var event = {
        pixel_id: this.pixelId,
        event_name: eventName,
        event_data: eventData,
        user_data: this.getUserData(),
        context_data: this.getContextData()
      };

      this.send('/track', event);
    },

    // Get user data
    getUserData: function() {
      return {
        fbp: this.getCookie('_fbp'),
        fbc: this.getCookie('_fbc'),
        email: this.getCookie('_ab_email'),
        externalId: this.getCookie('_ab_user')
      };
    },

    // Get context
    getContextData: function() {
      return {
        url: window.location.href,
        referrer: document.referrer
      };
    },

    // Send to server
    send: function(endpoint, data) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(function(e) { logger.error('Pixel error:', e); });
    },

    // Cookie helper
    getCookie: function(name) {
      var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    },

    // Auto track page view
    loadEvents: function() {
      var self = this;

      // PageView
      self.track('PageView');

      // Scroll depth
      var scrollDepthTracked = {};
      window.addEventListener('scroll', function() {
        var depth = Math.floor(window.scrollY / (document.body.scrollHeight / 4)) * 25;
        if (depth > 0 && !scrollDepthTracked[depth]) {
          scrollDepthTracked[depth] = true;
          self.track('ScrollDepth', { depth: depth + '%' });
        }
      });

      // Form submissions
      document.querySelectorAll('form').forEach(function(form) {
        form.addEventListener('submit', function() {
          self.track('FormSubmit');
        });
      });

      // Add to cart
      document.querySelectorAll('[data-action="add-to-cart"], .add-to-cart, [class*="cart"]').forEach(function(el) {
        el.addEventListener('click', function() {
          self.track('AddToCart');
        });
      });
    },

    // Setup additional listeners
    setupListeners: function() {
      var self = this;

      //  button clicks
      document.querySelectorAll('button, a.btn, [class*="checkout"]').forEach(function(el) {
        el.addEventListener('click', function() {
          var text = el.textContent || el.className;
          if (text.includes('checkout') || text.includes('buy') || text.includes('pay')) {
            self.track('Lead');
          }
        });
      });
    }
  };

  // Auto init
  AdBazaarPixel.init();
  window.AdBazaarPixel = AdBazaarPixel;
})();
  `.trim();
}

function getSDKInstallCode(pixelId: string): string {
  return `
<!-- AdBazaar Pixel -->
<script>
  !function(w,d,s) {
    var f = d.createElement(s),
        p = d.getElementsByTagName(s)[0];
    f.async = 1;
    f.src = 'https://cdn.adbazaar.com/pixel/sdk.js?pixel_id=${pixelId}';
    p.parentNode.insertBefore(f, p);
  }(window, document, 'script');
</script>

<!-- Example: Track button click -->
<button onclick="AdBazaarPixel.track('Lead')">Get Started</button>
  `.trim();
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AdBazaar Universal Pixel started on port ${PORT}`);
  logger.info('🎯 Website, Server-side, and Mobile tracking');

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar_pixel')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;