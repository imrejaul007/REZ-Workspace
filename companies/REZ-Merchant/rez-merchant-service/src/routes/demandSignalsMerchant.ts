import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { logger } from '../config/logger';
import { requireInternalToken } from '../middleware/internalAuth';
import { DemandForecastAgent, DemandSignal } from '../services/demandForecastAgent';

const router = Router();

const WEBHOOK_SECRET = process.env.NEXTABIZZ_WEBHOOK_SECRET || process.env.INTERNAL_SERVICE_TOKEN || '';
const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Verify webhook signature from NextaBiZ with replay attack prevention
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): string | null {
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return 'Invalid webhook timestamp format';
  }
  const now = Date.now();
  if (Math.abs(now - requestTime) > MAX_TIMESTAMP_AGE_MS) {
    return 'Webhook timestamp is too old (possible replay attack)';
  }

  const signaturePayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex');

  if (signature.length !== expectedSignature.length) {
    return 'Invalid webhook signature';
  }

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return 'Invalid webhook signature';
  }

  return null;
}

/**
 * Send demand signal to NextaBiZ
 * This is called internally when high or low demand is detected
 */
async function sendDemandSignalToNextaBiZ(
  signal: DemandSignal,
  merchantId: string,
  merchantDbId: string
): Promise<boolean> {
  const nextabizzUrl = process.env.NEXTABIZZ_WEBHOOK_URL;
  if (!nextabizzUrl) {
    logger.warn('[NextaBiZ] NEXTABIZZ_WEBHOOK_URL not configured, skipping signal');
    return false;
  }

  try {
    const payload = {
      source: 'rez-merchant-service',
      merchantId: merchantId,
      signalType: signal.type,
      severity: signal.severity,
      message: signal.message,
      suggestedAction: signal.suggestedAction,
      affectedProducts: signal.affectedProducts || [],
      timestamp: new Date().toISOString(),
      metadata: {
        triggeredBy: 'demand_forecast_agent',
        service: 'rez-merchant-service',
      },
    };

    const payloadStr = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(`${timestamp}.${payloadStr}`)
      .digest('hex');

    const response = await fetch(nextabizzUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp,
        'X-Webhook-Source': 'rez-merchant-service',
      },
      body: payloadStr,
    });

    if (!response.ok) {
      logger.error('[NextaBiZ] Failed to send demand signal', {
        status: response.status,
        merchantId,
        signalType: signal.type,
      });
      return false;
    }

    logger.info('[NextaBiZ] Demand signal sent successfully', {
      merchantId,
      signalType: signal.type,
      severity: signal.severity,
    });
    return true;
  } catch (error) {
    logger.error('[NextaBiZ] Error sending demand signal', {
      error: (error as Error).message,
      merchantId,
    });
    return false;
  }
}

/**
 * POST /internal/demand-signals/trigger
 * Internal endpoint to trigger NextaBiZ signals based on demand forecast
 * This would typically be called by a scheduled job
 *
 * Body:
 *   - merchantId: string
 *   - horizon: 7 | 14 | 30
 *   - storeId: optional string
 *   - forceSend: boolean (optional, force send even if already sent recently)
 */
router.post('/trigger', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { merchantId, horizon = 7, storeId, forceSend = false } = req.body;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        message: 'merchantId is required',
      });
      return;
    }

    const validHorizons = [7, 14, 30];
    if (!validHorizons.includes(horizon)) {
      res.status(400).json({
        success: false,
        message: 'horizon must be 7, 14, or 30',
      });
      return;
    }

    // Get merchant's MongoDB ID
    const Merchant = mongoose.model('Merchant');
    let merchant = await Merchant.findOne({ merchantId: merchantId }).select('_id merchantId name');

    if (!merchant && mongoose.Types.ObjectId.isValid(merchantId)) {
      merchant = await Merchant.findById(merchantId).select('_id merchantId name');
    }

    if (!merchant) {
      res.status(404).json({
        success: false,
        message: 'Merchant not found',
      });
      return;
    }

    // Generate demand forecast
    const forecast = await DemandForecastAgent.forecast(
      merchantId,
      horizon,
      storeId
    );

    // Filter signals that should trigger NextaBiZ
    const nextabizzSignals = forecast.demandSignals.filter(
      signal => signal.triggerNextabiz === 'procurement' || signal.triggerNextabiz === 'marketing'
    );

    // Send signals to NextaBiZ
    const results: Array<{ signalType: string; triggerNextabiz?: string; sent: boolean }> = [];
    for (const signal of nextabizzSignals) {
      const sent = await sendDemandSignalToNextaBiZ(signal, merchantId, merchant._id.toString());
      results.push({
        signalType: signal.type,
        triggerNextabiz: signal.triggerNextabiz,
        sent,
      });
    }

    // Create notifications for merchant
    const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false, collection: 'notifications' }));

    for (const signal of forecast.demandSignals) {
      const priority = signal.severity === 'critical' ? 'high' :
                       signal.severity === 'high' ? 'medium' : 'low';

      const notification = new Notification({
        recipient: merchant._id,
        type: 'demand_signal',
        title: signal.type === 'high_demand' ? 'High Demand Alert' :
               signal.type === 'low_demand' ? 'Low Demand Alert' :
               signal.type === 'opportunity' ? 'Opportunity Alert' : 'Demand Update',
        message: signal.message,
        data: {
          signalType: signal.type,
          severity: signal.severity,
          suggestedAction: signal.suggestedAction,
          triggerNextabiz: signal.triggerNextabiz,
          source: 'demand_forecast_agent',
        },
        priority,
        isRead: false,
        createdAt: new Date(),
      });

      await notification.save();
    }

    logger.info('[DemandSignals] Signals processed', {
      merchantId,
      horizon,
      totalSignals: forecast.demandSignals.length,
      nextabizzTriggers: nextabizzSignals.length,
      notificationsCreated: forecast.demandSignals.length,
    });

    res.json({
      success: true,
      data: {
        merchantId,
        horizon,
        forecastGeneratedAt: forecast.generatedAt,
        signals: forecast.demandSignals,
        nextabizzResults: results,
        notificationsCreated: forecast.demandSignals.length,
      },
    });
  } catch (err: unknown) {
    logger.error('[DemandSignals] Error processing signals', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /internal/demand-signals/status
 * Get demand signal status for a merchant
 *
 * Query params:
 *   - merchantId: string
 *   - horizon: number (default 7)
 */
router.get('/status', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;
    const horizon = Math.min(Math.max(parseInt(req.query.horizon as string) || 7, 7), 30) as 7 | 14 | 30;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        message: 'merchantId is required',
      });
      return;
    }

    const forecast = await DemandForecastAgent.forecast(merchantId, horizon);

    const highDemandSignals = forecast.demandSignals.filter(s => s.type === 'high_demand');
    const lowDemandSignals = forecast.demandSignals.filter(s => s.type === 'low_demand');

    res.json({
      success: true,
      data: {
        merchantId,
        horizon,
        summary: {
          totalSignals: forecast.demandSignals.length,
          highDemandAlerts: highDemandSignals.length,
          lowDemandAlerts: lowDemandSignals.length,
          procurementRecommended: highDemandSignals.some(s => s.triggerNextabiz === 'procurement'),
          marketingRecommended: lowDemandSignals.some(s => s.triggerNextabiz === 'marketing'),
        },
        recommendations: forecast.recommendations,
        generatedAt: forecast.generatedAt,
      },
    });
  } catch (err: unknown) {
    logger.error('[DemandSignals] Error getting status', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /internal/demand-signals/health
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response) => {
  res.json({ success: true, service: 'demand-signals', status: 'healthy' });
});

export default router;
