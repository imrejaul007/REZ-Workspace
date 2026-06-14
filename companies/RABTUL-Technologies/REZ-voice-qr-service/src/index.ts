/**
 * REZ Voice QR Service
 *
 * Voice AI for QR ordering and POS
 * - Voice menu navigation
 * - Voice ordering
 * - Voice checkout
 *
 * Port: 4096
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const app = express();

// Config
const PORT = parseInt(process.env.PORT || '4096', 10);
const GENIE_VOICE_URL = process.env.GENIE_VOICE_URL || 'http://localhost:4760';
const REZ_QR_URL = process.env.REZ_QR_URL || 'http://localhost:4090';
const TRAINING_URL = process.env.TRAINING_URL || 'http://localhost:4760/api/training';

// Types
interface VoiceOrder {
  id: string;
  qrCode: string;
  userId: string;
  businessId: string;
  items: VoiceOrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed';
  total: number;
  voiceTranscript?: string;
  createdAt: Date;
}

interface VoiceOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

// In-memory storage
const voiceOrders = new Map<string, VoiceOrder>();
const activeSessions = new Map<string, { userId: string; qrCode: string; context: any }>();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// ============================================
// HEALTH
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-voice-qr-service',
    version: '1.0.0',
    capabilities: {
      voiceMenu: true,
      voiceOrder: true,
      voiceCheckout: true,
    },
    stats: {
      activeSessions: activeSessions.size,
      totalOrders: voiceOrders.size,
    },
  });
});

// ============================================
// VOICE QR SESSION
// ============================================

/**
 * POST /api/voice-qr/session
 * Start voice QR session
 */
app.post('/api/voice-qr/session', async (req: Request, res: Response) => {
  try {
    const { qrCode, userId } = req.body;

    if (!qrCode) {
      return res.status(400).json({ error: 'QR code required' });
    }

    // Get business info from QR
    const qrResponse = await axios.get(`${REZ_QR_URL}/api/qr/${qrCode}`);
    const business = qrResponse.data.business;

    const sessionId = uuidv4();
    activeSessions.set(sessionId, {
      userId: userId || 'guest',
      qrCode,
      context: {
        businessId: business.id,
        businessName: business.name,
        tableNumber: business.tableNumber,
        orderType: 'dine-in',
      },
    });

    // Speak welcome
    await speak(`Welcome to ${business.name}! How can I help you order?`);

    res.json({
      sessionId,
      business,
      welcome: `Welcome to ${business.name}!`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voice-qr/session/:id/speak
 * Voice command in session
 */
app.post('/api/voice-qr/session/:id/speak', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { audio, text } = req.body;

    const session = activeSessions.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    let transcript: string;
    let intent: string;
    let entities: Record<string, any> = {};

    if (audio) {
      // Voice input - transcribe
      const formData = new FormData();
      formData.append('audio', new Blob([Buffer.from(audio, 'base64')]), 'audio.wav');

      const sttResponse = await axios.post(`${GENIE_VOICE_URL}/api/stt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      transcript = sttResponse.data.text;
    } else if (text) {
      // Text input
      transcript = text;
    } else {
      return res.status(400).json({ error: 'Audio or text required' });
    }

    // Process intent
    const intentResponse = await axios.post(`${GENIE_VOICE_URL}/api/intent`, {
      text: transcript,
      context: session.context,
    });

    intent = intentResponse.data.action;
    entities = intentResponse.data.entities;

    // Handle different intents
    let response = '';
    let orderItem: VoiceOrderItem | null = null;

    switch (intent) {
      case 'add_item':
        // Add item to order
        const itemName = entities.itemName || 'Unknown Item';
        const quantity = entities.quantity || 1;
        orderItem = {
          id: uuidv4(),
          name: itemName,
          quantity,
          price: entities.price || 0,
        };

        // Get/create order
        let order = Array.from(voiceOrders.values()).find(
          (o) => o.qrCode === session.qrCode && o.status === 'pending'
        );

        if (!order) {
          order = {
            id: uuidv4(),
            qrCode: session.qrCode,
            userId: session.userId,
            businessId: session.context.businessId,
            items: [],
            status: 'pending',
            total: 0,
            voiceTranscript: '',
          };
          voiceOrders.set(order.id, order);
        }

        order.items.push(orderItem);
        order.total += orderItem.price * orderItem.quantity;
        order.voiceTranscript = (order.voiceTranscript || '') + ' ' + transcript;

        response = `Added ${quantity} ${itemName} to your order. Anything else?`;
        break;

      case 'view_order':
        const currentOrder = Array.from(voiceOrders.values()).find(
          (o) => o.qrCode === session.qrCode && o.status === 'pending'
        );
        if (currentOrder && currentOrder.items.length > 0) {
          const itemList = currentOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
          response = `Your order: ${itemList}. Total: Rs. ${currentOrder.total}`;
        } else {
          response = 'Your order is empty. What would you like?';
        }
        break;

      case 'checkout':
        const checkoutOrder = Array.from(voiceOrders.values()).find(
          (o) => o.qrCode === session.qrCode && o.status === 'pending'
        );
        if (checkoutOrder) {
          checkoutOrder.status = 'confirmed';
          response = `Your order of Rs. ${checkoutOrder.total} is confirmed!`;
        } else {
          response = 'No items in your order.';
        }
        break;

      case 'cancel':
        const cancelOrder = Array.from(voiceOrders.values()).find(
          (o) => o.qrCode === session.qrCode && o.status === 'pending'
        );
        if (cancelOrder) {
          voiceOrders.delete(cancelOrder.id);
          response = 'Order cancelled.';
        } else {
          response = 'No order to cancel.';
        }
        break;

      default:
        response = intentResponse.data.response || "I'm not sure I understood. Can you repeat?";
    }

    // Collect training data
    await collectTrainingData({
      sessionId: id,
      transcript,
      intent,
      entities,
      qrCode: session.qrCode,
      businessId: session.context.businessId,
    });

    // Speak response
    await speak(response);

    res.json({
      transcript,
      intent,
      entities,
      response,
      orderItem,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/voice-qr/session/:id
 * End session
 */
app.delete('/api/voice-qr/session/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  activeSessions.delete(id);
  res.json({ success: true });
});

// ============================================
// ORDERS
// ============================================

/**
 * GET /api/voice-qr/orders
 * List voice orders
 */
app.get('/api/voice-qr/orders', async (req: Request, res: Response) => {
  const { businessId, status } = req.query;

  let orders = Array.from(voiceOrders.values());

  if (businessId) {
    orders = orders.filter((o) => o.businessId === businessId);
  }
  if (status) {
    orders = orders.filter((o) => o.status === status);
  }

  res.json({ orders, total: orders.length });
});

/**
 * GET /api/voice-qr/orders/:id
 * Get order by ID
 */
app.get('/api/voice-qr/orders/:id', async (req: Request, res: Response) => {
  const order = voiceOrders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// ============================================
// TRAINING DATA
// ============================================

async function collectTrainingData(data: {
  sessionId: string;
  transcript: string;
  intent: string;
  entities: Record<string, any>;
  qrCode: string;
  businessId: string;
}): Promise<void> {
  try {
    await axios.post(`${TRAINING_URL}/collect`, {
      type: 'voice-qr',
      source: 'rez-voice-qr-service',
      ...data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[VoiceQR] Failed to collect training data');
  }
}

// ============================================
// HELPERS
// ============================================

async function speak(text: string): Promise<void> {
  try {
    await axios.post(`${GENIE_VOICE_URL}/api/tts`, {
      text,
      voice: 'alloy',
      language: 'en-IN',
    });
  } catch (error) {
    console.warn('[VoiceQR] TTS failed:', error);
  }
}

// ============================================
// START
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎤 REZ Voice QR Service                               ║
║                                                           ║
║   Port: ${PORT}                                              ║
║                                                           ║
║   Features:                                                ║
║   ✅ Voice menu navigation                               ║
║   ✅ Voice ordering                                       ║
║   ✅ Voice checkout                                       ║
║   ✅ Training data collection                            ║
║                                                           ║
║   Connected to:                                           ║
║   📞 Genie Voice (${GENIE_VOICE_URL})                    ║
║   📷 REZ QR (${REZ_QR_URL})                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;