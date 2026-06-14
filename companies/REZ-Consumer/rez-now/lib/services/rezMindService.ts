/**
 * REZ MIND Integration Service
 * Connects rez-now to REZ MIND AI services
 */

const REZ_SUPPORT_URL = process.env.REZ_SUPPORT_COPILOT_URL || 'https://REZ-support-copilot.onrender.com';

interface ChatMessage {
  text: string;
  userId?: string;
  sessionId?: string;
}

interface ChatResponse {
  message: string;
  intent: string;
  confidence: number;
  actions?: { type: string; data: unknown }[];
}

/**
 * Send chat message to REZ MIND
 */
export async function sendChatMessage(message: ChatMessage): Promise<ChatResponse> {
  try {
    const response = await fetch(`${REZ_SUPPORT_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message.text,
        userId: message.userId || 'anonymous',
        sessionId: message.sessionId || `rez-now-${Date.now()}`,
        source: 'rez-now',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) throw new Error('Chat failed');
    return await response.json();
  } catch (error) {
    logger.error('REZ MIND chat error:', error);
    return {
      message: 'Sorry, AI is temporarily unavailable. Please try again.',
      intent: 'ERROR',
      confidence: 0,
    };
  }
}

/**
 * Detect intent without full chat
 */
export async function detectIntent(text: string) {
  try {
    const response = await fetch(`${REZ_SUPPORT_URL}/api/intent/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return await response.json();
  } catch (error) {
    logger.error('Intent detection error:', error);
    return { intent: 'UNKNOWN', confidence: 0 };
  }
}

/**
 * Get merchant info from knowledge base
 */
export async function getMerchantInfo(merchantId: string) {
  try {
    const response = await fetch(`${REZ_SUPPORT_URL}/api/merchant/${merchantId}`);
    return await response.json();
  } catch (error) {
    logger.error('Merchant info error:', error);
    return null;
  }
}

/**
 * Search restaurants
 */
export async function searchRestaurants(query: string) {
  try {
    const response = await fetch(`${REZ_SUPPORT_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    return await response.json();
  } catch (error) {
    logger.error('Search error:', error);
    return [];
  }
}
