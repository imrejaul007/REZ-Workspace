/**
 * AdBazaar Backend - Production Entry Point
 * Screen marketplace connecting owners with advertisers
 *
 * Features:
 * - Structured logging with PII redaction
 * - Health checks (liveness + readiness)
 * - Rate limiting
 * - Security middleware (helmet, CORS)
 * - Graceful shutdown
 * - MongoDB with retry logic
 */

import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// @ts-expect-error - express-mongo-sanitize types not included
import mongoSanitize from 'express-mongo-sanitize';
import { z } from 'zod';
import { createLogger } from 'utils/logger.js';
import { connectDB, disconnectDB } from './config/database';
import { screenOwnerService } from './services/screenOwnerService';
import { advertiserService } from './services/advertiserService';

// Initialize logger
const logger = createLogger('adbazaar-backend');

const app = express();
const PORT = parseInt(process.env.PORT || '4085', 10);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().default('India'),
});

const ownerRegistrationSchema = z.object({
  userId: z.string().min(1),
  businessName: z.string().min(1),
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number'),
  email: z.string().email().optional(),
  businessType: z.enum(['individual', 'company']),
  address: addressSchema.optional(),
  gstin: z.string().optional(),
});

const screenSchema = z.object({
  name: z.string().min(1),
  screenType: z.enum(['hotel_tv', 'cab_screen', 'flight_seat', 'bus_seat', 'train_seat', 'mall_kiosk', 'office_lobby', 'university_display', 'gym_screen', 'cinema_screen', 'restaurant_tv', 'billboard_led', 'bus_shelter', 'other']),
  captivityLevel: z.enum(['personal', 'captive_private', 'semi_captive', 'public']),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(['inches', 'cm']).default('inches'),
  }),
  orientation: z.enum(['landscape', 'portrait', 'both']).default('landscape'),
  address: z.object({
    street: z.string().default(''),
    city: z.string().min(1),
    state: z.string().default(''),
    country: z.string().default('India'),
    pincode: z.string().default(''),
  }),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  availability: z.object({
    timezone: z.string().default('Asia/Kolkata'),
    slots: z.array(z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
    })).default([]),
  }).optional(),
  floorPrice: z.object({
    cpm: z.number().positive(),
    currency: z.string().default('INR'),
    minCampaignBudget: z.number().positive().default(1000),
  }),
});

const advertiserRegistrationSchema = z.object({
  userId: z.string().min(1),
  companyName: z.string().min(1),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().min(1),
});

const campaignSchema = z.object({
  name: z.string().min(1).max(100),
  budget: z.object({
    total: z.number().positive(),
    daily: z.number().positive().optional(),
  }),
  objective: z.enum(['awareness', 'traffic', 'engagement', 'conversions', 'footfall', 'app_install']),
  targeting: z.object({
    demographics: z.object({
      ageRange: z.tuple([z.number(), z.number()]).optional(),
      gender: z.enum(['male', 'female', 'all']).optional(),
      locations: z.array(z.string()).optional(),
    }).optional(),
    screenTypes: z.array(z.string()).optional(),
    captiveOnly: z.boolean().optional(),
  }),
  schedule: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
  }),
});

const pricingQuoteSchema = z.object({
  campaignId: z.string().min(1),
  screenId: z.string().min(1),
});

const screenStatusUpdateSchema = z.object({
  status: z.enum(['active', 'inactive', 'pending_approval', 'suspended']),
});

const screenPriceUpdateSchema = z.object({
  cpm: z.number().positive(),
  currency: z.string().default('INR'),
  minCampaignBudget: z.number().positive().optional(),
});

const campaignStatusUpdateSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed', 'rejected']),
});

const creativeSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['image', 'video', 'html']),
  assets: z.object({
    url: z.string().url(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    mimeType: z.string(),
  }),
  clickUrl: z.string().url(),
  status: z.enum(['active', 'paused']).default('active'),
});

// Validate environment
function validateEnv(): void {
  const required: string[] = [];

  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
    required.push('MONGODB_URI or MONGO_URI');
  }

  if (!process.env.JWT_SECRET) {
    required.push('JWT_SECRET');
  }

  if (required.length > 0) {
    throw new Error(`Missing required environment variables: ${required.join(', ')}`);
  }
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim()),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  message: { success: false, error: 'Too many requests, please try again later.' } as unknown as string,
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http({
      method: req.method,
      url: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  next();
});

// ============================================================================
// HEALTH CHECKS
// ============================================================================

app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/health', async (_req: Request, res: Response) => {
  const { isDatabaseConnected, getConnectionStatus } = await import('./config/database');

  const checks = {
    api: 'up' as const,
    database: getConnectionStatus(),
  };

  const isHealthy = isDatabaseConnected();
  const status = isHealthy ? 'healthy' : 'degraded';

  res.status(isHealthy ? 200 : 503).json({
    status,
    service: 'adbazaar-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.SERVICE_VERSION || '1.0.0',
    checks,
  });
});

// ============================================================================
// SCREEN OWNER ROUTES
// ============================================================================

app.post('/api/owners/register', async (req: Request, res: Response) => {
  try {
    const validation = ownerRegistrationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.format(),
      });
    }

    const owner = screenOwnerService.registerOwner(validation.data);
    logger.info('Screen owner registered', { ownerId: owner.ownerId });
    res.status(201).json({ success: true, data: owner });
  } catch (error) {
    logger.error('Failed to register screen owner', { error: error instanceof Error ? error.message : String(error) });
    res.status(400).json({ success: false, error: 'Registration failed' });
  }
});

app.get('/api/owners/:id', (req: Request, res: Response) => {
  const owner = screenOwnerService.getOwner(req.params.id);
  if (!owner) {
    res.status(404).json({ success: false, error: 'Owner not found' });
    return;
  }
  res.json({ success: true, data: owner });
});

app.post('/api/owners/:id/screens', (req: Request, res: Response) => {
  try {
    const validation = screenSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.format(),
      });
    }

    const screen = screenOwnerService.addScreen(req.params.id, validation.data);
    if (!screen) {
      res.status(404).json({ success: false, error: 'Owner not found' });
      return;
    }
    logger.info('Screen added', { ownerId: req.params.id, screenId: screen.screenId });
    res.status(201).json({ success: true, data: screen });
  } catch (error) {
    logger.error('Failed to add screen', { error: error instanceof Error ? error.message : String(error) });
    res.status(400).json({ success: false, error: 'Failed to add screen' });
  }
});

app.get('/api/owners/:id/screens', (req: Request, res: Response) => {
  const screens = screenOwnerService.getOwnerScreens(req.params.id);
  res.json({ success: true, data: screens });
});

app.patch('/api/owners/:id/screens/:screenId', (req: Request, res: Response) => {
  const screen = screenOwnerService.updateScreen(req.params.id, req.params.screenId, req.body);
  if (!screen) {
    res.status(404).json({ success: false, error: 'Screen not found' });
    return;
  }
  res.json({ success: true, data: screen });
});

app.patch('/api/owners/:id/screens/:screenId/status', (req: Request, res: Response) => {
  const validation = screenStatusUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.error.format(),
    });
  }

  const screen = screenOwnerService.updateScreenStatus(req.params.id, req.params.screenId, validation.data.status);
  if (!screen) {
    res.status(404).json({ success: false, error: 'Screen not found' });
    return;
  }
  res.json({ success: true, data: screen });
});

app.patch('/api/owners/:id/screens/:screenId/price', (req: Request, res: Response) => {
  const validation = screenPriceUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.error.format(),
    });
  }

  const screen = screenOwnerService.updateScreenPrice(req.params.id, req.params.screenId, validation.data);
  if (!screen) {
    res.status(404).json({ success: false, error: 'Screen not found' });
    return;
  }
  res.json({ success: true, data: screen });
});

// ============================================================================
// ADVERTISER ROUTES
// ============================================================================

app.post('/api/advertisers/register', (req: Request, res: Response) => {
  try {
    const validation = advertiserRegistrationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.format(),
      });
    }

    const advertiser = advertiserService.registerAdvertiser(validation.data);
    logger.info('Advertiser registered', { advertiserId: advertiser.advertiserId });
    res.status(201).json({ success: true, data: advertiser });
  } catch (error) {
    logger.error('Failed to register advertiser', { error: error instanceof Error ? error.message : String(error) });
    res.status(400).json({ success: false, error: 'Registration failed' });
  }
});

app.get('/api/advertisers/:id', (req: Request, res: Response) => {
  const advertiser = advertiserService.getAdvertiser(req.params.id);
  if (!advertiser) {
    res.status(404).json({ success: false, error: 'Advertiser not found' });
    return;
  }
  res.json({ success: true, data: advertiser });
});

// ============================================================================
// CAMPAIGN ROUTES
// ============================================================================

app.post('/api/campaigns', (req: Request, res: Response) => {
  try {
    const validation = campaignSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.format(),
      });
    }

    const { advertiserId, ...campaignData } = req.body;
    const campaign = advertiserService.createCampaign(advertiserId, campaignData);
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Advertiser not found' });
      return;
    }
    logger.info('Campaign created', { advertiserId, campaignId: campaign.campaignId });
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    logger.error('Failed to create campaign', { error: error instanceof Error ? error.message : String(error) });
    res.status(400).json({ success: false, error: 'Failed to create campaign' });
  }
});

app.get('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = advertiserService.getCampaign(req.params.id);
  if (!campaign) {
    res.status(404).json({ success: false, error: 'Campaign not found' });
    return;
  }
  res.json({ success: true, data: campaign });
});

app.get('/api/advertisers/:id/campaigns', (req: Request, res: Response) => {
  const campaigns = advertiserService.getAdvertiserCampaigns(req.params.id);
  res.json({ success: true, data: campaigns });
});

app.patch('/api/campaigns/:id/status', (req: Request, res: Response) => {
  const validation = campaignStatusUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.error.format(),
    });
  }

  const campaign = advertiserService.updateCampaignStatus(req.params.id, validation.data.status);
  if (!campaign) {
    res.status(404).json({ success: false, error: 'Campaign not found' });
    return;
  }
  res.json({ success: true, data: campaign });
});

app.post('/api/campaigns/:id/creatives', (req: Request, res: Response) => {
  const validation = creativeSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.error.format(),
    });
  }

  const campaign = advertiserService.addCreative(req.params.id, validation.data);
  if (!campaign) {
    res.status(404).json({ success: false, error: 'Campaign not found' });
    return;
  }
  res.status(201).json({ success: true, data: campaign });
});

// ============================================================================
// MARKETPLACE ROUTES
// ============================================================================

app.get('/api/marketplace/screens', async (req: Request, res: Response) => {
  try {
    const search = {
      filters: {
        screenTypes: req.query.screenTypes
          ? req.query.screenTypes.toString().split(',') as import('./types').ScreenType[]
          : undefined,
        cities: req.query.cities
          ? req.query.cities.toString().split(',')
          : undefined,
        captivityLevels: req.query.captivityLevels
          ? req.query.captivityLevels.toString().split(',') as import('./types').CaptivityLevel[]
          : undefined,
      },
      sort: (req.query.sort as import('./types').MarketplaceSearch['sort']) || 'popularity',
      pagination: {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      },
    };

    const result = await advertiserService.searchMarketplace(search);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Marketplace search failed', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

app.get('/api/marketplace/screens/:id', (req: Request, res: Response) => {
  const screen = screenOwnerService.getScreen(req.params.id);
  if (!screen) {
    res.status(404).json({ success: false, error: 'Screen not found' });
    return;
  }
  res.json({ success: true, data: screen });
});

app.post('/api/marketplace/quote', async (req: Request, res: Response) => {
  try {
    const validation = pricingQuoteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.format(),
      });
    }

    const { campaignId, screenId } = validation.data;
    const quote = await advertiserService.getPricingQuote(campaignId, screenId);
    if (!quote) {
      res.status(404).json({ success: false, error: 'Campaign or screen not found' });
      return;
    }
    res.json({ success: true, data: quote });
  } catch (error) {
    logger.error('Failed to get pricing quote', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to get quote' });
  }
});

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

app.get('/api/owners/:id/analytics', (req: Request, res: Response) => {
  const owner = screenOwnerService.getOwner(req.params.id);
  if (!owner) {
    res.status(404).json({ success: false, error: 'Owner not found' });
    return;
  }

  const analytics = {
    ownerId: owner.ownerId,
    revenue: {
      total: owner.stats.totalEarnings,
      pending: owner.stats.pendingPayout,
    },
    screens: {
      total: owner.stats.totalScreens,
      active: owner.stats.activeScreens,
    },
    impressions: {
      total: owner.stats.totalImpressions,
      fillRate: owner.stats.avgFillRate,
    },
  };

  res.json({ success: true, data: analytics });
});

app.get('/api/campaigns/:id/analytics', (req: Request, res: Response) => {
  const campaign = advertiserService.getCampaign(req.params.id);
  if (!campaign) {
    res.status(404).json({ success: false, error: 'Campaign not found' });
    return;
  }
  res.json({ success: true, data: campaign.stats });
});

app.get('/api/reference/screen-types', (_req: Request, res: Response) => {
  const screenTypes = [
    { type: 'hotel_tv', captivity: 'captive_private', description: 'Hotel Smart TV', baseCPM: 200 },
    { type: 'cab_screen', captivity: 'captive_private', description: 'Cab/Taxi Screens', baseCPM: 150 },
    { type: 'flight_seat', captivity: 'captive_private', description: 'Flight Seat', baseCPM: 200 },
    { type: 'bus_seat', captivity: 'captive_private', description: 'Bus Seat', baseCPM: 100 },
    { type: 'mall_kiosk', captivity: 'semi_captive', description: 'Mall Kiosk', baseCPM: 80 },
    { type: 'office_lobby', captivity: 'semi_captive', description: 'Office Lobby', baseCPM: 100 },
    { type: 'gym_screen', captivity: 'semi_captive', description: 'Gym Screen', baseCPM: 70 },
    { type: 'cinema_screen', captivity: 'semi_captive', description: 'Cinema', baseCPM: 90 },
    { type: 'billboard_led', captivity: 'public', description: 'Billboard LED', baseCPM: 40 },
    { type: 'bus_shelter', captivity: 'public', description: 'Bus Shelter', baseCPM: 20 },
  ];

  res.json({ success: true, data: screenTypes });
});

// ============================================================================
// ERROR HANDLERS
// ============================================================================

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: _req.path,
    method: _req.method,
  });

  const statusCode = 'statusCode' in err ? (err as { statusCode: number }).statusCode : 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({ success: false, error: message });
});

// ============================================================================
// BOOT & SHUTDOWN
// ============================================================================

async function boot() {
  try {
    validateEnv();
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(`AdBazaar Backend listening on port ${PORT}`, {
        env: process.env.NODE_ENV,
        version: process.env.SERVICE_VERSION,
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDB();
        process.exit(0);
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled promise rejection', reason);
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

boot();
