import { Router, Request, Response } from 'express';
import logger from './utils/logger';
import { WhatsAppService } from '../services/WhatsAppService';
import { verifyWebhookSignature } from '../middleware/webhookAuth';

export interface WebhookPayload {
  event: 'message.received' | 'message.sent' | 'status.change' | 'qr.generated' | 'connection.ready';
  timestamp: number;
  data: {
    messageId?: string;
    from?: string;
    to?: string;
    content?: string;
    type?: string;
    status?: string;
    qrCode?: string;
  };
}

export function createWebhookRouter(whatsAppService: WhatsAppService): Router {
  const router = Router();

  router.get('/webhook', async (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  router.post('/webhook', verifyWebhookSignature, async (req: Request, res: Response) => {
    try {
      const payload: WebhookPayload = req.body;

      console.log('Webhook received:', JSON.stringify(payload, null, 2));

      if (payload.event === 'message.received' && payload.data) {
        const webhookPayload = {
          from: payload.data.from || '',
          to: payload.data.to || '',
          content: payload.data.content || '',
          type: payload.data.type || 'text',
          timestamp: new Date(payload.timestamp),
          metadata: {
            messageId: payload.data.messageId,
            source: 'webhook'
          }
        };

        const handlers = (whatsAppService as unknown).messageHandlers;
        if (handlers) {
          for (const handler of handlers.values()) {
            await handler(webhookPayload);
          }
        }
      }

      if (payload.event === 'qr.generated' && payload.data.qrCode) {
        console.log('QR Code received via webhook:', payload.data.qrCode);
      }

      if (payload.event === 'connection.ready') {
        logger.info('WhatsApp connection ready');
      }

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/status', async (req: Request, res: Response) => {
    const status = whatsAppService.getConnectionStatus();
    res.json({
      connected: status.isConnected,
      qrCode: status.qrCode ? 'available' : null,
      timestamp: Date.now()
    });
  });

  return router;
}
