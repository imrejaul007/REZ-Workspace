/**
 * REZ Assistant - Chat Service
 */

import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../types/index.js';

const chatHistory = new Map<string, ChatMessage[]>();

const SYSTEM_PROMPT = `You are REZ Assistant, an AI assistant for the REZ Consumer app.
You help users with:
- Finding restaurants and food
- Managing orders
- Checking warranty and product verification
- Understanding their preferences
- Making personalized recommendations

Keep responses concise and helpful.`;

/**
 * Process a chat message and generate response
 */
export async function processMessage(
  userId: string,
  message: string,
  context?: Record<string, any>
): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
  // Store user message
  const userMessage: ChatMessage = {
    id: uuidv4(),
    userId,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  };

  if (!chatHistory.has(userId)) {
    chatHistory.set(userId, []);
  }
  chatHistory.get(userId)!.push(userMessage);

  // Get history for context
  const history = chatHistory.get(userId) || [];

  // Generate response (mock - use Claude in production)
  const responseContent = generateResponse(message, history, context);

  const assistantMessage: ChatMessage = {
    id: uuidv4(),
    userId,
    role: 'assistant',
    content: responseContent,
    timestamp: new Date().toISOString(),
    metadata: { intent: detectIntent(message) },
  };

  chatHistory.get(userId)!.push(assistantMessage);

  return { userMessage, assistantMessage };
}

/**
 * Get chat history
 */
export async function getHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
  const history = chatHistory.get(userId) || [];
  return history.slice(-limit);
}

/**
 * Clear chat history
 */
export async function clearHistory(userId: string): Promise<void> {
  chatHistory.delete(userId);
}

/**
 * Generate AI response
 */
function generateResponse(
  message: string,
  history: ChatMessage[],
  context?: Record<string, any>
): string {
  const lowerMessage = message.toLowerCase();

  // Intent-based responses
  if (lowerMessage.includes('food') || lowerMessage.includes('restaurant')) {
    return "I can help you find great food! What cuisine are you craving today? We have restaurants from Swiggy, Zomato, and more.";
  }

  if (lowerMessage.includes('order') || lowerMessage.includes('track')) {
    return "I can help you track your orders. Which order would you like to check?";
  }

  if (lowerMessage.includes('warranty') || lowerMessage.includes('verify')) {
    return "I can help you verify products and check warranty status. Do you have a QR code or serial number?";
  }

  if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
    return "Based on your preferences, I'd recommend checking out Pizza Palace for Italian or Green Bowl for healthy options.";
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm REZ Assistant. How can I help you today?";
  }

  if (lowerMessage.includes('thanks') || lowerMessage.includes('thank')) {
    return "You're welcome! Is there anything else I can help you with?";
  }

  return "I understand you're looking for help. Could you tell me more about what you need? I can assist with food ordering, product verification, order tracking, and more!";
}

/**
 * Detect user intent
 */
function detectIntent(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('food') || lower.includes('restaurant')) return 'food_search';
  if (lower.includes('order') || lower.includes('track')) return 'order_tracking';
  if (lower.includes('warranty') || lower.includes('verify')) return 'product_verification';
  if (lower.includes('recommend')) return 'recommendation';
  if (lower.includes('help')) return 'help_request';
  if (lower.includes('complaint')) return 'complaint';

  return 'general';
}

export const chatService = {
  processMessage,
  getHistory,
  clearHistory,
};
