import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimit.js';
import { workflowEngine } from '../../services/workflowEngine.js';
import { salesAgent } from '../../services/salesAgent.js';
import { unifiedIntentDetector } from '../../services/unifiedIntentDetector.js';
import { complaintRefundHandler } from '../../services/complaintRefundHandler.js';
import { UnifiedIntent } from '../../services/unifiedTrainingData.js';
import { logger } from '../../utils/logger.js';
import { waitronClient } from '../../services/waitronClient.js';

export const chatRouter = Router();

const sendMessageSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(1000),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

// In-memory session store
const sessionStore = new Map<string, {
  id: string;
  userId?: string;
  messages: unknown[];
  createdAt: Date;
  lastActivity: Date;
}>();

// POST /do/chat/message - Send a message
chatRouter.post(
  '/message',
  optionalAuth,
  chatLimiter,
  asyncHandler(async (req, res) => {
    const { sessionId, message, location } = sendMessageSchema.parse(req.body);
    const userId = req.user?.id;

    // Get or create session
    let session = sessionStore.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        userId,
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date(),
      };
      sessionStore.set(sessionId, session);
    }

    // Add user message
    const userMessage = {
      id: uuidv4(),
      type: 'user' as const,
      content: message,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(userMessage);

    // Detect intent using unified detector
    const intentResult = unifiedIntentDetector.detect(message);

    logger.info('Intent detected', {
      sessionId,
      userId,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      sentiment: intentResult.sentiment,
    });

    // Handle based on intent
    let response: unknown = { text: '', suggestions: [] };

    // Support intents
    if (intentResult.intent === UnifiedIntent.COMPLAINT) {
      const complaint = complaintRefundHandler.registerComplaint({
        userId: userId || 'anonymous',
        type: 'other',
        description: message,
      });
      response = {
        text: unifiedIntentDetector.getResponse(intentResult.intent),
        complaintId: complaint.id,
        suggestions: [
          { label: 'Request Refund', icon: '💰', action: 'request_refund' },
          { label: 'Talk to Manager', icon: '👔', action: 'escalate' },
        ],
      };
    }
    else if (intentResult.intent === UnifiedIntent.REFUND_REQUEST) {
      response = {
        text: unifiedIntentDetector.getResponse(intentResult.intent),
        suggestions: [
          { label: 'Submit Request', icon: '📝', action: 'submit_refund' },
        ],
      };
    }
    else if (intentResult.intent === UnifiedIntent.CANCEL_ORDER || intentResult.intent === UnifiedIntent.CANCEL_BOOKING) {
      response = {
        text: unifiedIntentDetector.getResponse(intentResult.intent),
        suggestions: [
          { label: 'Yes, Cancel', icon: '❌', action: 'confirm_cancel' },
          { label: 'No, Keep', icon: '✓', action: 'keep_order' },
        ],
      };
    }
    else if (intentResult.intent === UnifiedIntent.CHECK_STATUS || intentResult.intent === UnifiedIntent.TRACK_ORDER) {
      response = {
        text: unifiedIntentDetector.getResponse(intentResult.intent),
        suggestions: [
          { label: 'Track Order', icon: '📦', action: 'track_order' },
        ],
      };
    }
    else if (intentResult.intent === UnifiedIntent.CHECK_BALANCE || intentResult.intent === UnifiedIntent.CHECK_KARMA) {
      const profile = salesAgent.getUserProfile(userId || '');
      response = {
        text: `Your Karma: ${profile?.karmaTier || 'Bronze'} | Coins: ${profile?.coins || 0} | Total Spent: ₹${profile?.totalSpent || 0}`,
        suggestions: [
          { label: 'View History', icon: '📜', action: 'view_history' },
          { label: 'Redeem Coins', icon: '🎫', action: 'redeem_coins' },
        ],
      };
    }
    else if (intentResult.intent === UnifiedIntent.HELP_REQUEST) {
      response = {
        text: unifiedIntentDetector.getResponse(intentResult.intent),
        suggestions: [
          { label: 'Contact Support', icon: '📞', action: 'contact_support' },
          { label: 'View FAQ', icon: '❓', action: 'view_faq' },
        ],
      };
    }
    // Discovery intents
    else if (intentResult.intent === UnifiedIntent.ORDER_FOOD || intentResult.intent === UnifiedIntent.BOOK_TABLE) {
      // Check if this is a restaurant discovery request
      const restaurantKeywords = ['breakfast', 'lunch', 'dinner', 'nearby', 'restaurant', 'food', 'eat', 'hungry', 'cafe', 'meal'];
      const isRestaurantQuery = restaurantKeywords.some(kw => message.toLowerCase().includes(kw));

      if (isRestaurantQuery && location) {
        // Use Waitron for restaurant discovery
        const discovery = await waitronClient.discoverRestaurants({
          query: message,
          userId,
          latitude: location.lat,
          longitude: location.lng,
          limit: 3
        });

        if (discovery.success && discovery.recommendations.length > 0) {
          const topMatch = discovery.recommendations[0];
          response = {
            text: `I found ${discovery.recommendations.length} great options! ${topMatch.restaurant.name} is highly rated (${topMatch.restaurant.rating}⭐) and ${topMatch.reasons[0] || 'matches your preferences'}.`,
            restaurant: topMatch.restaurant,
            recommendations: discovery.recommendations.map(r => ({
              id: r.restaurant.id,
              name: r.restaurant.name,
              rating: r.restaurant.rating,
              locality: r.restaurant.locality,
              cuisine: r.restaurant.cuisine,
              reasons: r.reasons
            })),
            suggestions: [
              { label: 'View Menu', icon: '📋', action: 'view_menu' },
              { label: 'Book Table', icon: '🪑', action: 'book_table' },
              { label: 'Get Directions', icon: '📍', action: 'directions' },
            ],
          };
        } else {
          response = {
            text: 'Let me find some great restaurants nearby for you!',
            suggestions: [
              { label: 'Browse Places', icon: '🔍', action: 'browse' },
              { label: 'View Offers', icon: '🎁', action: 'view_offers' },
            ],
          };
        }
      } else {
        response = {
          text: unifiedIntentDetector.getResponse(intentResult.intent),
          suggestions: [
            { label: 'Browse Places', icon: '🔍', action: 'browse' },
            { label: 'View Offers', icon: '🎁', action: 'view_offers' },
          ],
        };
      }
    }
    else if (intentResult.intent === UnifiedIntent.GREETING) {
      response = {
        text: unifiedIntentDetector.getResponse(intentResult.intent),
        suggestions: [
          { label: 'Order Food', icon: '🍔', action: 'order_food' },
          { label: 'Book Table', icon: '🍽️', action: 'book_table' },
          { label: 'Check Wallet', icon: '💰', action: 'check_wallet' },
        ],
      };
    }
    // Sales opportunity injection
    else {
      // Process with workflow engine for commerce intents
      try {
        const workflowResponse = await workflowEngine.execute(message, {
          sessionId,
          userId,
          location,
          session,
          intent: intentResult,
        });
        response = workflowResponse;
      } catch (error) {
        response = {
          text: unifiedIntentDetector.getResponse(intentResult.intent),
          suggestions: intentResult.suggestedActions.map(a => ({ label: a.label, icon: a.icon, action: a.action })),
        };
      }
    }

    // Add sales intelligence for logged-in users
    if (userId) {
      const opportunities = salesAgent.analyzeUser(userId);
      if (opportunities.length > 0) {
        response.suggestions = [
          ...response.suggestions,
          { label: opportunities[0].action.replace('_', ' '), icon: '🎯', action: opportunities[0].action },
        ];
      }
    }

    // Add response messages
    const doMessages = [{
      id: uuidv4(),
      type: 'do' as const,
      content: response.text,
      timestamp: new Date().toISOString(),
    }];

    session.messages.push(...doMessages);
    session.lastActivity = new Date();

    res.json({
      success: true,
      messages: doMessages,
      suggestions: response.suggestions || [],
      intent: {
        type: intentResult.intent,
        confidence: intentResult.confidence,
        sentiment: intentResult.sentiment,
      },
      ...(response.complaintId && { complaintId: response.complaintId }),
    });
  })
);

// GET /do/chat/history/:sessionId - Get chat history
chatRouter.get(
  '/history/:sessionId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const session = sessionStore.get(sessionId);

    res.json({
      success: true,
      messages: session?.messages || [],
    });
  })
);

// DELETE /do/chat/history/:sessionId - Clear chat history
chatRouter.delete(
  '/history/:sessionId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    sessionStore.delete(sessionId);

    res.json({
      success: true,
      message: 'Chat history cleared',
    });
  })
);

// ==================== COMPLAINT ENDPOINTS ====================

// POST /do/complaint - Register complaint
chatRouter.post(
  '/complaint',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { type, description, orderId, merchantId } = req.body;
    const userId = req.user?.id || 'anonymous';

    const complaint = complaintRefundHandler.registerComplaint({
      userId,
      type: type || 'other',
      description,
      orderId,
      merchantId,
    });

    res.json({
      success: true,
      complaintId: complaint.id,
      message: 'Your complaint has been registered. We\'ll get back to you shortly.',
    });
  })
);

// GET /do/complaints - Get user complaints
chatRouter.get(
  '/complaints',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const complaints = complaintRefundHandler.getUserComplaints(userId);

    res.json({
      success: true,
      complaints,
    });
  })
);

// GET /do/complaint/:complaintId - Get complaint details
chatRouter.get(
  '/complaint/:complaintId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    const complaint = complaintRefundHandler.getComplaint(complaintId);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({
      success: true,
      complaint,
    });
  })
);

// ==================== REFUND ENDPOINTS ====================

// POST /do/refund - Request refund
chatRouter.post(
  '/refund',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { orderId, amount, reason, complaintId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const refund = complaintRefundHandler.requestRefund({
      userId,
      orderId,
      amount,
      reason: reason || 'other',
      complaintId,
    });

    res.json({
      success: true,
      refundId: refund.id,
      status: refund.status,
      processingDays: refund.processingDays,
      message: `Refund requested. Will be processed in ${refund.processingDays} days.`,
    });
  })
);

// GET /do/refunds - Get user refunds
chatRouter.get(
  '/refunds',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const refunds = complaintRefundHandler.getUserRefunds(userId);

    res.json({
      success: true,
      refunds,
    });
  })
);

// GET /do/refund/:refundId - Get refund details
chatRouter.get(
  '/refund/:refundId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { refundId } = req.params;
    const refund = complaintRefundHandler.getRefund(refundId);

    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund not found' });
    }

    res.json({
      success: true,
      refund,
    });
  })
);

// ==================== SALES TRAINING ENDPOINTS ====================

// Transaction schema
const transactionSchema = z.object({
  userId: z.string().min(1),
  transactionId: z.string().min(1).optional(),
  type: z.enum(['purchase', 'refund', 'bonus']),
  category: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().datetime().optional(),
  occasion: z.string().optional(),
});

// POST /do/sales/transaction - Record a transaction for training
chatRouter.post(
  '/sales/transaction',
  chatLimiter,
  asyncHandler(async (req, res) => {
    const data = transactionSchema.parse(req.body);

    salesAgent.recordTransaction(data.userId, {
      id: data.transactionId || uuidv4(),
      type: data.type,
      category: data.category,
      amount: data.amount,
      date: data.date ? new Date(data.date) : new Date(),
      occasion: data.occasion,
    });

    logger.info('Transaction recorded', {
      userId: data.userId,
      category: data.category,
      amount: data.amount,
    });

    const opportunities = salesAgent.analyzeUser(data.userId);

    res.json({
      success: true,
      transactionId: data.transactionId || uuidv4(),
      opportunities: opportunities.slice(0, 3),
    });
  })
);

// GET /do/sales/opportunities/:userId - Get sales opportunities
chatRouter.get(
  '/sales/opportunities/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const opportunities = salesAgent.analyzeUser(userId);

    res.json({
      success: true,
      opportunities,
      total: opportunities.length,
    });
  })
);

// GET /do/sales/recommendation/:userId - Get personalized recommendation
chatRouter.get(
  '/sales/recommendation/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const opportunities = salesAgent.analyzeUser(userId);
    const topOpportunity = opportunities[0];

    res.json({
      success: true,
      recommendation: topOpportunity ? {
        type: topOpportunity.type,
        message: topOpportunity.message,
        action: topOpportunity.action,
        confidence: topOpportunity.confidence,
      } : null,
    });
  })
);

// POST /do/sales/feedback - Record sales feedback
chatRouter.post(
  '/sales/feedback',
  asyncHandler(async (req, res) => {
    const { userId, opportunityType, action, accepted } = req.body;

    logger.info('Sales feedback recorded', {
      userId,
      opportunityType,
      action,
      accepted,
    });

    res.json({
      success: true,
      message: 'Feedback recorded for model improvement',
    });
  })
);

// GET /do/sales/profile/:userId - Get user profile
chatRouter.get(
  '/sales/profile/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const profile = salesAgent.getUserProfile(userId);

    res.json({
      success: true,
      profile,
    });
  })
);

// Cleanup old sessions (call periodically)
export const cleanupSessions = () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  for (const [sessionId, session] of sessionStore.entries()) {
    if (session.lastActivity < oneHourAgo) {
      sessionStore.delete(sessionId);
      logger.debug('Cleaned up old session', { sessionId });
    }
  }
};
