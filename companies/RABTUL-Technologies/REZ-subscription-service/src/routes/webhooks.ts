import { Router, Request, Response } from 'express';
import { paymentCollector } from '../services';
import { webhookLogger as logger, verifyWebhookSignature } from '../utils';

const router = Router();

const isProduction = process.env.NODE_ENV === 'production';

/**
 * POST /api/v1/webhooks/stripe
 * Handle Stripe webhooks
 */
router.post(
  '/stripe',
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // SECURITY: Require webhook secret in production
    if (isProduction && !webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    // SECURITY: Require valid signature - reject requests without it
    if (!signature) {
      logger.warn('Missing Stripe webhook signature');
      res.status(400).json({ error: 'Missing signature' });
      return;
    }

    if (!webhookSecret) {
      logger.error('Cannot verify webhook: STRIPE_WEBHOOK_SECRET not set');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      JSON.stringify(req.body),
      signature,
      webhookSecret
    );

    if (!isValid) {
      logger.warn('Invalid Stripe webhook signature');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    const event = req.body;

    logger.info('Received Stripe webhook', {
      type: event.type,
      id: event.id
    });

    try {
      await paymentCollector.handleWebhook({
        type: event.type,
        data: {
          object: event.data.object
        }
      });

      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook processing failed', {
        type: event.type,
        error
      });

      // Return 500 so Stripe will retry the webhook
      // Returning 2xx on failure would lose webhook events
      res.status(500).json({
        received: false,
        error: 'Webhook processing failed'
      });
    }
  }
);

/**
 * POST /api/v1/webhooks/payment
 * Handle generic payment service webhooks
 */
router.post(
  '/payment',
  async (req: Request, res: Response) => {
    const { type, data } = req.body;

    logger.info('Received payment webhook', { type });

    try {
      if (type === 'payment_intent.succeeded') {
        await paymentCollector.handleWebhook({
          type: 'payment_intent.succeeded',
          data: { object: data }
        });
      } else if (type === 'payment_intent.failed') {
        await paymentCollector.handleWebhook({
          type: 'payment_intent.payment_failed',
          data: { object: data }
        });
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Payment webhook processing failed', { type, error });
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

/**
 * GET /api/v1/webhooks/health
 * Webhook endpoint health check
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
