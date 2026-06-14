import logger from 'utils/logger.js';

/**
 * REZ MIND INTEGRATION
 *
 * Connects all messaging to ReZ Mind for:
 * - Intent detection
 * - AI response generation
 * - Learning from interactions
 * - Personalization
 */

import fetch from 'node-fetch';

// ============================================
// CONFIG
// ============================================

const REZMIND_URL = process.env.REZMIND_URL || 'http://localhost:4010';

// ============================================
// TYPES
// ============================================

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface AIResponse {
  reply: string;
  confidence: number;
  suggestedActions?: {
    type: string;
    payload;
  }[];
  personalization?: {
    userName?: string;
    merchantName?: string;
    offer?: string;
  };
}

export interface UserContext {
  userId: string;
  phone: string;
  name?: string;
  segments: string[];
  preferences?: Record<string, unknown>;
}

export interface MerchantContext {
  merchantId?: string;
  name?: string;
  category?: string;
  whatsappNumberId?: string;
}

// ============================================
// INTENT DETECTION
// ============================================

export async function detectIntent(
  text: string,
  context?: { userId?: string; merchantId?: string; channel?: string }
): Promise<IntentResult> {
  try {
    const response = await fetch(`${REZMIND_URL}/api/intent/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        context: {
          userId: context?.userId,
          merchantId: context?.merchantId,
          channel: context?.channel || 'whatsapp',
        },
      }),
    });

    if (!response.ok) {
      return localIntentDetection(text);
    }

    return await response.json();

  } catch (error) {
    logger.error('[ReZ Mind] Intent detection failed:', error);
    return localIntentDetection(text);
  }
}

// ============================================
// AI RESPONSE GENERATION
// ============================================

export async function generateAIResponse(
  userContext: { user?: UserContext; merchant?: MerchantContext; conversation?; signals?: unknown },
  intentResult: IntentResult,
  conversationHistory?: unknown[]
): Promise<AIResponse> {
  try {
    const response = await fetch(`${REZMIND_URL}/api/ai/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          user: userContext.user,
          merchant: userContext.merchant,
          conversation: userContext.conversation,
          signals: userContext.signals,
        },
        intent: intentResult.intent,
        entities: intentResult.entities,
        history: conversationHistory,
        persona: userContext.merchant?.name || 'helpful_assistant',
      }),
    });

    if (!response.ok) {
      return generateTemplateResponse(intentResult);
    }

    return await response.json();

  } catch (error) {
    logger.error('[ReZ Mind] AI response failed:', error);
    return generateTemplateResponse(intentResult);
  }
}

// ============================================
// CAPTURE FOR LEARNING
// ============================================

export async function captureIntentSignal(signal: {
  userId?: string;
  merchantId?: string;
  channel: string;
  eventType: string;
  category: string;
  query?: string;
  response?: string;
  outcome?: 'converted' | 'ignored' | 'escalated';
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch(`${REZMIND_URL}/api/intent/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...signal,
        appType: 'messaging',
        timestamp: new Date().toISOString(),
      }),
    });

    logger.info(`[ReZ Mind] Captured: ${signal.eventType}`);

  } catch (error) {
    logger.error('[ReZ Mind] Capture failed:', error);
  }
}

export async function captureConversation(
  conversationId: string,
  messages: unknown[],
  outcome: 'resolved' | 'escalated' | 'converted'
): Promise<void> {
  try {
    await fetch(`${REZMIND_URL}/api/intent/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        messages,
        outcome,
        channel: 'whatsapp',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    logger.error('[ReZ Mind] Conversation capture failed:', error);
  }
}

// ============================================
// USER CONTEXT
// ============================================

export async function getUserContextForMessaging(userId: string): Promise<{
  preferences: Record<string, unknown>;
  recentIntents: string[];
  segments: string[];
  affinity: Record<string, number>;
}> {
  try {
    const response = await fetch(`${REZMIND_URL}/api/user/${userId}/messaging-context`);

    if (!response.ok) {
      return getDefaultUserContext();
    }

    return await response.json();

  } catch (error) {
    logger.error('[ReZ Mind] User context failed:', error);
    return getDefaultUserContext();
  }
}

// ============================================
// PERSONALIZATION
// ============================================

export async function getPersonalizedOffer(
  userId: string,
  merchantId: string,
  context: string
): Promise<{
  offerText?: string;
  discount?: number;
  coins?: number;
  productRecommendation?: string;
} | null> {
  try {
    const response = await fetch(`${REZMIND_URL}/api/personalization/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, merchantId, context }),
    });

    if (!response.ok) return null;

    return await response.json();

  } catch (error) {
    return null;
  }
}

// ============================================
// LEAD SCORING
// ============================================

export async function getLeadScore(
  userId: string
): Promise<{
  score: number;
  temperature: 'hot' | 'warm' | 'cold';
  signals: Record<string, number>;
  recommendedAction: string;
}> {
  try {
    const response = await fetch(`${REZMIND_URL}/api/user/${userId}/lead-score`);

    if (!response.ok) {
      return { score: 50, temperature: 'warm', signals: {}, recommendedAction: 'nurture' };
    }

    return await response.json();

  } catch (error) {
    return { score: 50, temperature: 'warm', signals: {}, recommendedAction: 'nurture' };
  }
}

// ============================================
// AREA CONTEXT (for DOOH)
// ============================================

export async function getAreaContext(
  areaId: string
): Promise<{
  areaId: string;
  demographics: Record<string, unknown>;
  topIntents: string[];
  activeUsers: number;
} | null> {
  try {
    const response = await fetch(`${REZMIND_URL}/api/area/${areaId}/context`);

    if (!response.ok) return null;

    return await response.json();

  } catch (error) {
    return null;
  }
}

// ============================================
// FALLBACK FUNCTIONS
// ============================================

function localIntentDetection(text: string): IntentResult {
  const lower = text.toLowerCase();

  const patterns: [string, RegExp, number][] = [
    ['order_status', /order|track|delivery|Where's my|order id/i, 0.85],
    ['menu_inquiry', /menu|card|food|item|what do you have|show me/i, 0.80],
    ['hours_inquiry', /open|hour|time|close|closing|available/i, 0.90],
    ['location_inquiry', /address|where|location|directions|find you/i, 0.85],
    ['reservation', /book|table|reserve|reservation|appointment/i, 0.85],
    ['complaint', /bad|worst|terrible|angry|issue|problem|not happy/i, 0.80],
    ['feedback', /good|great|amazing|love|best|review|excellent/i, 0.75],
    ['offer_inquiry', /offer|deal|discount|off|special|promo/i, 0.80],
    ['support_request', /help|support|assistant|speak|human|agent/i, 0.85],
    ['payment_issue', /pay|payment|card|upi|failed|transaction/i, 0.90],
    ['greeting', /hi|hello|hey|good morning|good evening/i, 0.95],
    ['goodbye', /bye|thanks|thank you|see you/i, 0.90],
  ];

  for (const [intent, regex, confidence] of patterns) {
    if (regex.test(lower)) {
      return { intent, confidence, entities: {} };
    }
  }

  return { intent: 'general_inquiry', confidence: 0.60, entities: {} };
}

function generateTemplateResponse(intent: IntentResult): AIResponse {
  const templates: Record<string, AIResponse> = {
    order_status: {
      reply: "I can help you with your order! Please share your order ID or the phone number used for ordering.",
      confidence: 0.90,
    },
    menu_inquiry: {
      reply: "Here's our menu! Would you like to see our popular items or the full menu?",
      confidence: 0.85,
    },
    hours_inquiry: {
      reply: "We're open from 11 AM to 11 PM today! Is there anything else I can help you with?",
      confidence: 0.95,
    },
    location_inquiry: {
      reply: "We're located in the heart of the city! Here's our address: [Address]. Would you like directions?",
      confidence: 0.85,
    },
    reservation: {
      reply: "I'd be happy to help you book a table! How many people and what time would you like?",
      confidence: 0.90,
    },
    complaint: {
      reply: "I'm sorry to hear that. Let me help you right away. Could you share more details?",
      confidence: 0.85,
    },
    feedback: {
      reply: "Thank you so much for your kind words! We're glad you enjoyed your experience!",
      confidence: 0.90,
    },
    offer_inquiry: {
      reply: "Great timing! We have some exciting offers right now. Would you like to hear about them?",
      confidence: 0.85,
    },
    support_request: {
      reply: "Of course! I'm here to help. What can I assist you with today?",
      confidence: 0.80,
    },
    payment_issue: {
      reply: "I'm sorry you're having trouble with payment. Let me connect you with our team right away.",
      confidence: 0.90,
    },
    greeting: {
      reply: "Hi there! Welcome! How can I help you today?",
      confidence: 0.95,
    },
    goodbye: {
      reply: "Thank you for chatting with us! Have a great day!",
      confidence: 0.90,
    },
  };

  return templates[intent.intent] || {
    reply: "Thanks for reaching out! How can I help you today?",
    confidence: 0.70,
  };
}

function getDefaultUserContext() {
  return {
    preferences: {},
    recentIntents: [],
    segments: [],
    affinity: {},
  };
}
