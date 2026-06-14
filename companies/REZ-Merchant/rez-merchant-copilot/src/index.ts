/**
 * REZ Merchant Copilot Service
 * AI-powered business assistant for merchants
 * 
 * @author REZ Team
 * @version 1.0.0
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import winston from 'winston';
import axios from 'axios';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============== SCHEMAS ==============

interface Conversation {
  id: string;
  merchantId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Insight {
  id: string;
  merchantId: string;
  type: 'sales' | 'inventory' | 'customer' | 'staff';
  title: string;
  description: string;
  suggestion: string;
  createdAt: Date;
}

// In-memory store (replace with DB)
const conversations = new Map<string, Conversation>();
const insights = new Map<string, Insight[]>();

// ============== ROUTES ==============

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-merchant-copilot', timestamp: new Date().toISOString() });
});

/**
 * Chat with AI
 * POST /api/chat
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { merchantId, message, conversationId } = req.body;
    
    if (!merchantId || !message) {
      return res.status(400).json({ success: false, error: 'merchantId and message required' });
    }
    
    // Create or update conversation
    let conv = conversations.get(conversationId || merchantId);
    if (!conv) {
      conv = {
        id: conversationId || merchantId,
        merchantId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    // Add user message
    conv.messages.push({ role: 'user', content: message, timestamp: new Date() });
    
    // Generate AI response (mock - integrate with AI service)
    const response = await generateAIResponse(conv.messages);
    
    // Add assistant message
    conv.messages.push({ role: 'assistant', content: response, timestamp: new Date() });
    conv.updatedAt = new Date();
    conversations.set(conv.id, conv);
    
    res.json({
      success: true,
      data: {
        response,
        conversationId: conv.id,
        messages: conv.messages
      }
    });
  } catch (error) {
    logger.error('Chat error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Get conversation history
 * GET /api/chat/:conversationId
 */
app.get('/api/chat/:conversationId', (req: Request, res: Response) => {
  const conv = conversations.get(req.params.conversationId);
  if (!conv) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }
  res.json({ success: true, data: conv });
});

/**
 * Get AI insights for merchant
 * GET /api/insights/:merchantId
 */
app.get('/api/insights/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { type } = req.query;
    
    const merchantInsights = insights.get(merchantId) || [];
    const filtered = type ? merchantInsights.filter(i => i.type === type) : merchantInsights;
    
    res.json({ success: true, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Generate insights
 * POST /api/insights/generate
 */
app.post('/api/insights/generate', async (req: Request, res: Response) => {
  try {
    const { merchantId, type } = req.body;
    
    // Generate mock insights
    const newInsights: Insight[] = [
      {
        id: `insight-${Date.now()}`,
        merchantId,
        type: type || 'sales',
        title: 'Peak Hours Identified',
        description: 'Your sales peak between 12-2 PM and 7-9 PM',
        suggestion: 'Consider adding staff during these hours',
        createdAt: new Date()
      },
      {
        id: `insight-${Date.now() + 1}`,
        merchantId,
        type: type || 'inventory',
        title: 'Low Stock Alert',
        description: '3 items are running low based on sales velocity',
        suggestion: 'Reorder before stockout',
        createdAt: new Date()
      }
    ];
    
    const existing = insights.get(merchantId) || [];
    insights.set(merchantId, [...existing, ...newInsights]);
    
    res.json({ success: true, data: newInsights });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Ask a specific question
 * POST /api/ask
 */
app.post('/api/ask', async (req: Request, res: Response) => {
  try {
    const { merchantId, question } = req.body;
    
    const answer = await answerBusinessQuestion(merchantId, question);
    
    res.json({ success: true, data: { answer } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Get suggestions
 * GET /api/suggestions/:merchantId
 */
app.get('/api/suggestions/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    
    // Generate suggestions based on merchant data
    const suggestions = [
      { category: 'pricing', title: 'Consider dynamic pricing', priority: 'medium' },
      { category: 'inventory', title: 'Stock up on top sellers', priority: 'high' },
      { category: 'marketing', title: 'Launch loyalty program', priority: 'low' }
    ];
    
    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============== HELPER FUNCTIONS ==============

async function generateAIResponse(messages: Message[]): Promise<string> {
  const lastMessage = messages[messages.length - 1].content;
  
  // Simple keyword-based responses (replace with actual AI integration)
  if (lastMessage.toLowerCase().includes('sales')) {
    return "Based on your data, your sales have increased by 15% this week compared to last week. Your best performing items are Biryani and Naan.";
  }
  if (lastMessage.toLowerCase().includes('inventory')) {
    return "You have 3 items running low: Rice, Cooking Oil, and Chicken. Would you like me to create a purchase order?";
  }
  if (lastMessage.toLowerCase().includes('customer')) {
    return "You have 45 new customers this month. 60% are returning customers. Your NPS score is 72.";
  }
  
  return "I've analyzed your data and can help you with sales trends, inventory management, customer insights, and business recommendations. What would you like to know?";
}

async function answerBusinessQuestion(merchantId: string, question: string): Promise<string> {
  // Mock AI response
  return `Based on your merchant data (${merchantId}), here's my analysis of: "${question}"\n\nThis is a sample AI-generated response. In production, this would connect to an AI model for intelligent answers.`;
}

// ============== SERVER ==============

const PORT = process.env.PORT || 4022;

app.listen(PORT, () => {
  logger.info(`REZ Merchant Copilot started on port ${PORT}`);
  logger.info(`Health: http://localhost:${PORT}/health`);
});

export default app;
