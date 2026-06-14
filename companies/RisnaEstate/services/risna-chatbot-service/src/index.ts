import { logger } from './logger';
/**
 * RisnaEstate - AI Chatbot Service
 *
 * 24/7 AI-powered property assistant.
 * Uses REZ Intelligence for NLP and intent detection.
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 4123;

app.use(express.json());
app.use(cors());
app.use(helmet());

// REZ Intelligence
const INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4018';

// =============================================
// SCHEMAS
// =============================================

const ConversationSchema = new Schema({
  conversationId: { type: String, unique: true, index: true },
  userId: String,
  platform: { type: String, enum: ['web', 'whatsapp', 'app'], default: 'web' },
  messages: [{
    role: { type: String, enum: ['user', 'bot', 'agent'] },
    content: String,
    timestamp: Date,
    metadata: Schema.Types.Mixed
  }],
  context: {
    browsing: { propertyId: String, lastViewed: Date },
    intent: String,
    budget: Number,
    location: String
  },
  status: { type: String, enum: ['active', 'transferred', 'closed'], default: 'active' },
  assignedAgent: String,
  createdAt: Date,
  updatedAt: Date
});

const Conversation = mongoose.model('Conversation', ConversationSchema);

// =============================================
// INTENT HANDLERS
// =============================================

const PROPERTY_INTENTS = [
  { intent: 'search', keywords: ['find', 'search', 'looking for', 'want', 'need'] },
  { intent: 'view_property', keywords: ['show', 'view', 'see', 'details'] },
  { intent: 'price_inquiry', keywords: ['price', 'cost', 'how much', 'budget'] },
  { intent: 'location_info', keywords: ['where', 'location', 'area', 'nearby'] },
  { intent: 'amenities', keywords: ['amenities', 'features', 'facilities', 'has'] }
];

const BOOKING_INTENTS = [
  { intent: 'book_visit', keywords: ['visit', 'schedule', 'book', 'appointment'] },
  { intent: 'buy', keywords: ['buy', 'purchase', 'interested'] },
  { intent: 'payment', keywords: ['pay', 'payment', 'cost', 'EMI'] },
  { intent: 'documents', keywords: ['document', 'paper', 'KYC', 'required'] }
];

const VISA_INTENTS = [
  { intent: 'visa_eligibility', keywords: ['visa', 'eligibility', 'qualify', 'golden'] },
  { intent: 'visa_benefits', keywords: ['benefits', 'advantage', 'why'] }
];

function detectIntent(message: string): string {
  const lower = message.toLowerCase();

  for (const intent of [...PROPERTY_INTENTS, ...BOOKING_INTENTS, ...VISA_INTENTS]) {
    for (const keyword of intent.keywords) {
      if (lower.includes(keyword)) {
        return intent.intent;
      }
    }
  }

  return 'general';
}

// =============================================
// RESPONSE GENERATORS
// =============================================

const RESPONSES: Record<string, (ctx: any) => string> = {
  greeting: () => `Hi! I'm your RisnaEstate assistant 🏠

I can help you with:
• Finding properties
• Checking Golden Visa eligibility
• Booking site visits
• Investment calculations

What are you looking for?`,

  search: (ctx) => `Great! I can help you find properties.

What type of property are you looking for?
• Apartment
• Villa
• Plot
• Commercial

And which location?`,

  price_inquiry: () => `Our properties range from AED 500K to 50M+.

To give you accurate pricing, could you tell me:
• Your budget range?
• Preferred location?
• Number of bedrooms?`,

  visa_eligibility: () => `🌟 Golden Visa Information

You may be eligible for UAE Golden Visa if:
• Property investment ≥ AED 2 Million (10-year visa)
• Property investment ≥ AED 545K (3-year investor visa)

Would you like me to check your eligibility? Just share your investment amount and currency.`,

  book_visit: (ctx) => `I'd be happy to help you schedule a site visit!

To book, I'll need:
• Property you're interested in
• Preferred date and time
• Your contact number

Shall I proceed?`,

  transfer_agent: () => `Let me connect you with one of our property experts. Please hold for a moment...`,

  default: () => `I'm here to help! Here are some things I can assist with:

🔍 Search properties
📅 Book site visits
🌍 Golden Visa eligibility
💰 Investment calculations
📞 Connect with agents

What would you like to do?`
};

function generateResponse(intent: string, context: any): string {
  return RESPONSES[intent] ? RESPONSES[intent](context) : RESPONSES.default(context);
}

// =============================================
// API ROUTES
// =============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({ service: 'risna-chatbot', status: 'healthy' });
});

/**
 * Start new conversation
 * POST /api/conversations
 */
app.post('/api/conversations', async (req: Request, res: Response) => {
  try {
    const { userId, platform } = req.body;

    const conversation = new Conversation({
      conversationId: `conv_${Date.now()}`,
      userId,
      platform: platform || 'web',
      messages: [{
        role: 'bot',
        content: RESPONSES.greeting(),
        timestamp: new Date()
      }],
      status: 'active'
    });

    await conversation.save();

    res.json({ success: true, conversation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send message
 * POST /api/conversations/:id/message
 */
app.post('/api/conversations/:id/message', async (req: Request, res: Response) => {
  try {
    const { content, metadata } = req.body;

    const conversation = await Conversation.findOne({ conversationId: req.params.id });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Add user message
    conversation.messages.push({
      role: 'user',
      content,
      timestamp: new Date(),
      metadata
    });

    // Update context
    if (metadata?.propertyId) {
      conversation.context.browsing = {
        propertyId: metadata.propertyId,
        lastViewed: new Date()
      };
    }

    // Detect intent
    const intent = detectIntent(content);
    conversation.context.intent = intent;

    // Generate response
    let responseContent = generateResponse(intent, {
      propertyId: conversation.context.browsing?.propertyId
    });

    // Check if transfer needed
    if (content.includes('agent') || content.includes('human') || content.includes('speak')) {
      responseContent = RESPONSES.transfer_agent();
      conversation.status = 'transferred';
    }

    // Add bot response
    conversation.messages.push({
      role: 'bot',
      content: responseContent,
      timestamp: new Date()
    });

    await conversation.save();

    res.json({
      success: true,
      message: conversation.messages[conversation.messages.length - 1],
      intent,
      needsTransfer: conversation.status === 'transferred'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get conversation
 * GET /api/conversations/:id
 */
app.get('/api/conversations/:id', async (req: Request, res: Response) => {
  try {
    const conversation = await Conversation.findOne({ conversationId: req.params.id });
    if (!conversation) return res.status(404).json({ error: 'Not found' });
    res.json({ conversation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Transfer to agent
 * POST /api/conversations/:id/transfer
 */
app.post('/api/conversations/:id/transfer', async (req: Request, res: Response) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      { conversationId: req.params.id },
      {
        status: 'transferred',
        messages: [{
          role: 'bot',
          content: 'You have been connected with our property expert. They will respond shortly.',
          timestamp: new Date()
        }]
      },
      { new: true }
    );

    // Would notify available agent here

    res.json({ success: true, conversation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Quick reply (button clicks)
 * POST /api/conversations/:id/quick-reply
 */
app.post('/api/conversations/:id/quick-reply', async (req: Request, res: Response) => {
  try {
    const { action } = req.body;

    const responses: Record<string, string> = {
      'search': RESPONSES.search({}),
      'visa': RESPONSES.visa_eligibility(),
      'visit': RESPONSES.book_visit({}),
      'contact': RESPONSES.transfer_agent()
    };

    const content = responses[action] || RESPONSES.default();

    const conversation = await Conversation.findOneAndUpdate(
      { conversationId: req.params.id },
      {
        $push: {
          messages: {
            role: 'bot',
            content,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    res.json({ success: true, message: content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// START
// =============================================

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-chatbot');
    logger.info('✅ Connected to MongoDB');
    await Conversation.createIndexes();
    app.listen(PORT, () => logger.info(`🚀 Chatbot Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
