import express from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { adROITrackingService } from './services/adbazaar/roiTrackingService';
import { channelManager, SwiggyAdapter, ZomatoAdapter } from './services/aggregators/channelManager';
import { deliveryPartnerService } from './services/delivery/deliveryService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4040;

// ==================== SECURITY MIDDLEWARE ====================

// Security headers
app.use(helmet());

// CORS - restrict to known origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://merchant.rez.money').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('CORS blocked'));
  },
  credentials: true,
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Rate limit exceeded' },
}));

// Body size limits
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ==================== AUTHENTICATION ====================

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';
const TOKENS_JSON = process.env.INTERNAL_SERVICE_TOKENS_JSON || '{}';

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function verifyToken(token: string): boolean {
  if (INTERNAL_TOKEN && timingSafeCompare(token, INTERNAL_TOKEN)) return true;
  try {
    const tokens = JSON.parse(TOKENS_JSON);
    return Object.values(tokens).some((t: string) => timingSafeCompare(token, t));
  } catch {
    return false;
  }
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({ success: false, error: 'Missing authentication token' });
    return;
  }

  if (!verifyToken(token)) {
    res.status(403).json({ success: false, error: 'Invalid authentication token' });
    return;
  }

  next();
}

// ==================== INPUT VALIDATION ====================

function validateInput(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid input' };
  }
  return { valid: true };
}

// Request logging (use logger in production)
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ==================== ADBAZAAR ROUTES ====================

// Error handler helper
function handleError(res, error: unknown, action: string): void {
  const message = process.env.NODE_ENV === 'production'
    ? `Failed to ${action}`
    : error instanceof Error ? error.message : 'Unknown error';
  logger.error([${action}] Error:`, error);
  res.status(500).json({ success: false, message });
}

// ==================== INPUT VALIDATION ====================

function validateClickData(body): boolean {
  return body && body.campaignId && body.merchantId && body.deviceId;
}

/**
 * Track ad click
 * POST /api/ads/track/click
 * SECURITY: Added requireAuth middleware
 */
app.post('/api/ads/track/click', requireAuth, async (req, res) => {
  try {
    const { campaignId, merchantId, userId, deviceId } = req.body;
    await adROITrackingService.trackClick({ campaignId, merchantId, userId, deviceId });
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, 'track click');
  }
});

/**
 * Track ad view
 * POST /api/ads/track/view
 */
app.post('/api/ads/track/view', requireAuth, async (req, res) => {
  try {
    const { campaignId, merchantId, userId, deviceId } = req.body;
    await adROITrackingService.trackView({ campaignId, merchantId, userId, deviceId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track conversion
 * POST /api/ads/track/conversion
 */
app.post('/api/ads/track/conversion', requireAuth, async (req, res) => {
  try {
    const { orderId, merchantId, userId, deviceId, amount } = req.body;
    const result = await adROITrackingService.trackConversion({
      orderId, merchantId, userId, deviceId, amount
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get campaign ROI
 * GET /api/ads/campaign/:id/roi
 */
app.get('/api/ads/campaign/:id/roi', requireAuth, async (req, res) => {
  try {
    const roi = await adROITrackingService.getCampaignROI(req.params.id);
    res.json(roi);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get merchant ad performance
 * GET /api/ads/merchant/:id/performance
 */
app.get('/api/ads/merchant/:id/performance', requireAuth, async (req, res) => {
  try {
    const performance = await adROITrackingService.getMerchantAdPerformance(req.params.id);
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Sync campaigns with AdBazaar
 * POST /api/ads/sync
 */
app.post('/api/ads/sync', requireAuth, async (req, res) => {
  try {
    await adROITrackingService.syncCampaigns();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AGGREGATOR ROUTES ====================

/**
 * Register aggregator
 * POST /api/aggregators/register
 */
app.post('/api/aggregators/register', requireAuth, async (req, res) => {
  try {
    const { aggregatorId, apiKey, storeId } = req.body;

    switch (aggregatorId) {
      case 'swiggy':
        channelManager.registerAggregator(aggregatorId, new SwiggyAdapter(aggregatorId, apiKey, storeId));
        break;
      case 'zomato':
        channelManager.registerAggregator(aggregatorId, new ZomatoAdapter(aggregatorId, apiKey, storeId));
        break;
      default:
        return res.status(400).json({ error: 'Unknown aggregator' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get new orders from all aggregators
 * GET /api/aggregators/orders
 */
app.get('/api/aggregators/orders', requireAuth, async (req, res) => {
  try {
    const orders = await channelManager.fetchAllNewOrders();
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update aggregator order status
 * POST /api/aggregators/:id/status
 */
app.post('/api/aggregators/:id/status', requireAuth, async (req, res) => {
  try {
    const aggregatorId = req.params.id;
    const { externalOrderId, status } = req.body;
    await channelManager.updateOrderStatus(aggregatorId, externalOrderId, status);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Push menu to all aggregators
 * POST /api/aggregators/menu
 */
app.post('/api/aggregators/menu', requireAuth, async (req, res) => {
  try {
    await channelManager.pushMenuToAll(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DELIVERY ROUTES ====================

/**
 * Get delivery quotes
 * POST /api/delivery/quotes
 */
app.post('/api/delivery/quotes', requireAuth, async (req, res) => {
  try {
    const quotes = await deliveryPartnerService.getDeliveryQuotes(req.body);
    res.json({ quotes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Book delivery
 * POST /api/delivery/book
 */
app.post('/api/delivery/book', requireAuth, async (req, res) => {
  try {
    const { order, partnerId, quoteId } = req.body;
    const booking = await deliveryPartnerService.bookDelivery({ order, partnerId, quoteId });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track delivery
 * GET /api/delivery/:id/track
 */
app.get('/api/delivery/:id/track', requireAuth, async (req, res) => {
  try {
    const { partnerId } = req.query;
    const tracking = await deliveryPartnerService.trackDelivery(req.params.id, partnerId as unknown);
    res.json(tracking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cancel delivery
 * POST /api/delivery/:id/cancel
 */
app.post('/api/delivery/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { partnerId } = req.body;
    await deliveryPartnerService.cancelDelivery(req.params.id, partnerId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Webhook for delivery status updates
 * POST /api/delivery/webhook/:partner
 * SECURITY: Added webhook signature verification
 */
app.post('/api/delivery/webhook/:partner', async (req, res) => {
  try {
    const { partner } = req.params;
    const signature = req.headers['x-webhook-signature'] as string;
    const webhookSecret = process.env[`${partner.toUpperCase()}_WEBHOOK_SECRET`] as string;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const payload = JSON.stringify(req.body);
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const sig = signature.startsWith('sha256=') ? signature.substring(7) : signature;
      const expectedBuf = Buffer.from(expected, 'hex');
      const sigBuf = Buffer.from(sig, 'hex');
      if (sig.length !== expected.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }
    }

    // Process webhook and update order status
    logger.info(Delivery webhook from ${partner}:`, req.body);
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH ROUTES ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'merchant-integrations',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, () => {
  logger.info(`Merchant Integrations Service running on port ${PORT}`);

  // Register default aggregators if configured
  if (process.env.SWIGGY_API_KEY) {
    channelManager.registerAggregator(
      'swiggy',
      new SwiggyAdapter('swiggy', process.env.SWIGGY_API_KEY, process.env.SWIGGY_STORE_ID || '')
    );
  }

  if (process.env.ZOMATO_API_KEY) {
    channelManager.registerAggregator(
      'zomato',
      new ZomatoAdapter('zomato', process.env.ZOMATO_API_KEY, process.env.ZOMATO_STORE_ID || '')
    );
  }
});

// Graceful shutdown handler
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Force close after timeout
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    // Close database connections, etc.
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
