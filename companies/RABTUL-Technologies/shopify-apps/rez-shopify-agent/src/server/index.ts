/**
 * ReZ Agent - Shopify App
 * AI Customer Service Chatbot
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, AgentKnowledge } from '../models/Conversation';

const { MONGODB_URI } = process.env;
const PORT = parseInt(process.env.PORT || '3004', 10);
const app = express();
app.use(express.json());

async function connectDB() {
  await mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/rez_agent');
}

// Start conversation
app.post('/api/agent/conversation/start', async (req: Request, res: Response) => {
  const { shop, customerId, customerEmail } = req.body;

  const conversation = await Conversation.create({
    conversationId: `conv_${Date.now()}_${uuidv4().substr(0, 8)}`,
    shop: shop.toLowerCase(),
    customerId,
    customerEmail,
    status: 'active',
    messages: [{
      id: uuidv4(),
      type: 'bot',
      content: 'Hi! How can I help you today? I can help with order tracking, returns, and product questions.',
      timestamp: new Date(),
    }],
  });

  res.json({ success: true, conversation });
});

// Process message
app.post('/api/agent/conversation/message', async (req: Request, res: Response) => {
  const { conversationId, message } = req.body;

  const conversation = await Conversation.findOne({ conversationId });
  if (!conversation) { res.status(404).json({ error: 'Conversation not found' }); return; }

  // Add customer message
  conversation.messages.push({ id: uuidv4(), type: 'customer', content: message, timestamp: new Date() });

  // Simple intent detection
  const intents = [
    { pattern: /order|track|delivery/i, intent: 'order_status' },
    { pattern: /return|refund|exchange/i, intent: 'return_request' },
    { pattern: /cancel/i, intent: 'cancel_order' },
    { pattern: /product|item|stock/i, intent: 'product_inquiry' },
  ];

  let response = "I'm here to help! Could you provide more details?";
  let intent = 'unknown';

  for (const i of intents) {
    if (i.pattern.test(message)) {
      intent = i.intent;
      const responses: Record<string, string> = {
        order_status: "I can help with order tracking. Please provide your order number.",
        return_request: "For returns, please visit our returns portal or I can create a ticket for you.",
        cancel_order: "I can help cancel your order. Please confirm your order number.",
        product_inquiry: "I'd be happy to help with product information. What would you like to know?",
      };
      response = responses[intent] || response;
      break;
    }
  }

  // Add bot response
  conversation.messages.push({ id: uuidv4(), type: 'bot', content: response, timestamp: new Date(), intent });
  conversation.context!.intent = intent;
  await conversation.save();

  res.json({ success: true, response, intent });
});

// Get conversation
app.get('/api/agent/conversation/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const conversation = await Conversation.findOne({ conversationId: id });
  res.json({ success: true, conversation });
});

// Add knowledge
app.post('/api/agent/knowledge', async (req: Request, res: Response) => {
  const { shop, question, answer, category } = req.body;
  const knowledge = await AgentKnowledge.create({ shop: shop.toLowerCase(), question, answer, category });
  res.json({ success: true, knowledge });
});

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', service: 'rez-agent' }));

async function main() {
  await connectDB();
  app.listen(PORT, () => console.log(`ReZ Agent running on port ${PORT}`));
}
main().catch(console.error);
