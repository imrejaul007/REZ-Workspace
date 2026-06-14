/**
 * Airzy Concierge Extension Service
 * Port 4510 - Premium Concierge for Elite/Royale Members
 */

import express, { Request, Response, NextFunction } import logger from './utils/logger';
import from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// CONFIGURATION
// ============================================

const config = {
  port: parseInt(process.env.PORT || '4510'),
  careServiceUrl: process.env.CARE_SERVICE_URL || 'http://localhost:4058',
  walletServiceUrl: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || '',
};

// ============================================
// IN-MEMORY STORE
// ============================================

interface ConciergeRequest {
  id: string;
  userId: string;
  tier: 'elite' | 'royale';
  type: 'flight' | 'hotel' | 'restaurant' | 'transport' | 'event' | 'shopping' | 'other';
  request: string;
  priority: 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ConciergeChat {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'concierge';
  message: string;
  timestamp: Date;
}

const requests = new Map<string, ConciergeRequest>();
const chats = new Map<string, ConciergeChat>();

// ============================================
// ZOD SCHEMAS
// ============================================

const CreateRequestSchema = z.object({
  userId: z.string(),
  tier: z.enum(['elite', 'royale']),
  type: z.enum(['flight', 'hotel', 'restaurant', 'transport', 'event', 'shopping', 'other']),
  request: z.string().min(10),
  priority: z.enum(['normal', 'high', 'urgent']).default('normal'),
});

const SendMessageSchema = z.object({
  userId: z.string(),
  message: z.string().min(1),
  sender: z.enum(['user', 'concierge']),
});

// ============================================
// ELITE TIER BENEFITS
// ============================================

const tierBenefits = {
  elite: {
    name: 'Airzy Elite',
    maxRequestsPerMonth: 5,
    responseTime: '4 hours',
    categories: ['flight', 'hotel', 'restaurant', 'transport', 'event', 'shopping'],
    exclusiveAccess: ['priority_lounge_booking', 'hotel_upgrades', 'restaurant_reservations'],
  },
  royale: {
    name: 'Royale Travel',
    maxRequestsPerMonth: 999, // Unlimited
    responseTime: '2 hours',
    categories: ['flight', 'hotel', 'restaurant', 'transport', 'event', 'shopping', 'other'],
    exclusiveAccess: [
      'private_concierge',
      'priority_lounge_booking',
      'hotel_upgrades',
      'restaurant_reservations',
      'event_tickets',
      'vip_transport',
      'personal_shopping',
      'gift_procurement',
    ],
  },
};

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'airzy-concierge-extension',
    port: config.port,
  });
});

// ============================================
// REQUEST ENDPOINTS
// ============================================

/**
 * POST /api/concierge/request
 * Create concierge request
 */
app.post('/api/concierge/request', async (req: Request, res: Response) => {
  try {
    const validated = CreateRequestSchema.parse(req.body);
    const { userId, tier, type, request, priority } = validated;

    // Check tier benefits
    const benefits = tierBenefits[tier];
    if (!benefits.categories.includes(type)) {
      return res.status(403).json({
        success: false,
        error: { code: 'NOT_ALLOWED', message: `Your ${tier} tier does not support ${type} requests` },
      });
    }

    // Check request limit for elite
    if (tier === 'elite') {
      const userRequests = Array.from(requests.values()).filter(
        r => r.userId === userId && r.status !== 'cancelled'
      );
      const thisMonth = userRequests.filter(r => {
        const requestDate = new Date(r.createdAt);
        const now = new Date();
        return requestDate.getMonth() === now.getMonth() && requestDate.getFullYear() === now.getFullYear();
      });

      if (thisMonth.length >= benefits.maxRequestsPerMonth) {
        return res.status(403).json({
          success: false,
          error: { code: 'LIMIT_REACHED', message: 'Monthly request limit reached. Upgrade to Royale for unlimited requests.' },
        });
      }
    }

    // Create request
    const requestId = uuidv4();
    const conciergeRequest: ConciergeRequest = {
      id: requestId,
      userId,
      tier,
      type,
      request,
      priority,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    requests.set(requestId, conciergeRequest);

    // Auto-assign based on priority
    if (priority === 'urgent') {
      conciergeRequest.assignedTo = 'concierge_urgent_queue';
    }

    res.status(201).json({
      success: true,
      data: {
        request: conciergeRequest,
        benefits: {
          responseTime: benefits.responseTime,
          remainingRequests: tier === 'elite' ? benefits.maxRequestsPerMonth - 1 : 'unlimited',
        },
      },
    });
  } catch (error) {
    console.error('Concierge request error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create request' },
    });
  }
});

/**
 * GET /api/concierge/requests/:userId
 * Get user's concierge requests
 */
app.get('/api/concierge/requests/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    let userRequests = Array.from(requests.values()).filter(r => r.userId === userId);

    if (status) {
      userRequests = userRequests.filter(r => r.status === status);
    }

    userRequests.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      success: true,
      data: { requests: userRequests },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get requests' },
    });
  }
});

/**
 * GET /api/concierge/request/:requestId
 * Get request details
 */
app.get('/api/concierge/request/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const request = requests.get(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Request not found' },
      });
    }

    res.json({
      success: true,
      data: { request },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get request' },
    });
  }
});

/**
 * POST /api/concierge/request/:requestId/respond
 * Add response to request
 */
app.post('/api/concierge/request/:requestId/respond', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { response, status } = req.body;

    const request = requests.get(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Request not found' },
      });
    }

    request.response = response;
    if (status) {
      request.status = status;
    }
    request.updatedAt = new Date();

    requests.set(requestId, request);

    res.json({
      success: true,
      data: { request },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to respond' },
    });
  }
});

// ============================================
// CHAT ENDPOINTS
// ============================================

/**
 * GET /api/concierge/chat/:userId
 * Get user's chat
 */
app.get('/api/concierge/chat/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    let chat = chats.get(userId);

    if (!chat) {
      chat = {
        id: userId,
        userId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      chats.set(userId, chat);
    }

    res.json({
      success: true,
      data: { chat },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get chat' },
    });
  }
});

/**
 * POST /api/concierge/chat/:userId/message
 * Send message
 */
app.post('/api/concierge/chat/:userId/message', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const validated = SendMessageSchema.parse(req.body);
    const { message, sender } = validated;

    let chat = chats.get(userId);

    if (!chat) {
      chat = {
        id: userId,
        userId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const chatMessage: ChatMessage = {
      id: uuidv4(),
      sender,
      message,
      timestamp: new Date(),
    };

    chat.messages.push(chatMessage);
    chat.updatedAt = new Date();
    chats.set(userId, chat);

    // Auto-response for user messages (simulated AI concierge)
    if (sender === 'user') {
      setTimeout(() => {
        const autoResponse: ChatMessage = {
          id: uuidv4(),
          sender: 'concierge',
          message: 'Thank you for your message. A concierge will respond shortly.',
          timestamp: new Date(),
        };
        chat!.messages.push(autoResponse);
        chat!.updatedAt = new Date();
        chats.set(userId, chat!);
      }, 2000);
    }

    res.status(201).json({
      success: true,
      data: { message: chatMessage },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to send message' },
    });
  }
});

// ============================================
// BENEFITS ENDPOINTS
// ============================================

/**
 * GET /api/concierge/benefits/:tier
 * Get tier benefits
 */
app.get('/api/concierge/benefits/:tier', async (req: Request, res: Response) => {
  try {
    const { tier } = req.params;

    if (!tierBenefits[tier as keyof typeof tierBenefits]) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tier not found' },
      });
    }

    res.json({
      success: true,
      data: { benefits: tierBenefits[tier as keyof typeof tierBenefits] },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get benefits' },
    });
  }
});

/**
 * GET /api/concierge/stats/:userId
 * Get user stats
 */
app.get('/api/concierge/stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userRequests = Array.from(requests.values()).filter(r => r.userId === userId);

    const thisMonth = userRequests.filter(r => {
      const requestDate = new Date(r.createdAt);
      const now = new Date();
      return requestDate.getMonth() === now.getMonth() && requestDate.getFullYear() === now.getFullYear();
    });

    res.json({
      success: true,
      data: {
        totalRequests: userRequests.length,
        thisMonth: thisMonth.length,
        completed: userRequests.filter(r => r.status === 'completed').length,
        pending: userRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get stats' },
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(config.port, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════╗
║       Airzy Concierge Extension Started              ║
╠══════════════════════════════════════════════════════════╣
║  Port:        ${config.port}                                 ║
║  Tiers:      Elite, Royale                           ║
║  Response:   2-4 hours                              ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
