/**
 * VOICE-AI Service - Voice AI Interface
 *
 * REE Service for voice AI capabilities:
 * - Voice command processing
 * - Natural language understanding
 * - Voice agent management
 * - Conversation tracking
 *
 * Port: 3011
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3011;
const SERVICE_KEY = process.env.SERVICE_KEY || 'ree-voice-ai-key';

// ============================================
// IN-MEMORY STORAGE
// ============================================

interface VoiceCommand {
  id: string;
  userId: string;
  text: string;
  transcript: string;
  confidence: number;
  intent: string;
  entities: Record<string, any>;
  language: string;
  channel: 'app' | 'ivr' | 'smart_speaker' | 'webhook';
  processed: boolean;
  result?: string;
  error?: string;
  createdAt: string;
  processedAt?: string;
}

interface VoiceAgent {
  id: string;
  name: string;
  description: string;
  type: 'customer_support' | 'sales' | 'assistant' | 'ivr' | 'custom';
  status: 'active' | 'inactive' | 'training' | 'error';
  language: string[];
  greeting?: string;
  capabilities: string[];
  intents: string[];
  configurations: Record<string, any>;
  stats: {
    totalConversations: number;
    successfulConversations: number;
    avgResponseTime: number;
    avgSatisfaction: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  id: string;
  agentId: string;
  userId: string;
  status: 'active' | 'completed' | 'transferred' | 'failed';
  messages: ConversationMessage[];
  metadata: Record<string, any>;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  satisfactionScore?: number;
}

interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  audioUrl?: string;
  transcript?: string;
  confidence?: number;
  intent?: string;
  entities?: Record<string, any>;
  createdAt: string;
}

interface Intent {
  id: string;
  name: string;
  description: string;
  examples: string[];
  response: string;
  action?: string;
  entities?: string[];
  requiresConfirmation: boolean;
  fallbackIntent?: string;
  active: boolean;
}

interface TrainingData {
  id: string;
  agentId: string;
  text: string;
  intent: string;
  entities?: Record<string, string>;
  annotated: boolean;
  createdAt: string;
}

// Storage
const commands: Map<string, VoiceCommand> = new Map();
const agents: Map<string, VoiceAgent> = new Map();
const conversations: Map<string, Conversation> = new Map();
const intents: Map<string, Intent> = new Map();
const trainingData: Map<string, TrainingData> = new Map();

// ============================================
// SEED DATA
// ============================================

function seedInitialData() {
  // Seed intents
  const seedIntents: Intent[] = [
    {
      id: 'intent-001',
      name: 'order_status',
      description: 'Check order delivery status',
      examples: [
        'Where is my order?',
        'Track my shipment',
        'When will my order arrive?',
        'What is my order status?'
      ],
      response: 'I can help you check your order status. Your order {order_id} is currently {status} and expected to be delivered by {date}.',
      action: 'query_order_status',
      entities: ['order_id'],
      requiresConfirmation: false,
      active: true
    },
    {
      id: 'intent-002',
      name: 'cancel_order',
      description: 'Cancel an existing order',
      examples: [
        'Cancel my order',
        'I want to cancel',
        'Please cancel order number',
        'Stop my delivery'
      ],
      response: 'I have initiated the cancellation for order {order_id}. You will receive a confirmation SMS shortly.',
      action: 'cancel_order',
      entities: ['order_id'],
      requiresConfirmation: true,
      fallbackIntent: 'transfer_human',
      active: true
    },
    {
      id: 'intent-003',
      name: 'return_request',
      description: 'Request a return for an order',
      examples: [
        'I want to return my order',
        'Return my product',
        'Send it back',
        'Product damaged, need return'
      ],
      response: 'I am processing your return request for order {order_id}. Our courier partner will pick up the package on {date}.',
      action: 'initiate_return',
      entities: ['order_id'],
      requiresConfirmation: true,
      active: true
    },
    {
      id: 'intent-004',
      name: 'payment_issue',
      description: 'Report a payment problem',
      examples: [
        'Payment failed',
        'Money deducted but order not placed',
        'Payment issue',
        'Transaction failed'
      ],
      response: 'I understand you are facing a payment issue. Let me connect you with our payments team.',
      action: 'flag_payment_issue',
      entities: ['order_id', 'amount'],
      requiresConfirmation: false,
      fallbackIntent: 'transfer_human',
      active: true
    },
    {
      id: 'intent-005',
      name: 'product_inquiry',
      description: 'Ask about a product',
      examples: [
        'Do you have this product?',
        'Is this in stock?',
        'What is the price?',
        'Tell me about this item'
      ],
      response: 'Product {product_id} is {availability} and priced at Rs.{price}.',
      action: 'query_product',
      entities: ['product_id', 'query_type'],
      requiresConfirmation: false,
      active: true
    },
    {
      id: 'intent-006',
      name: 'refund_status',
      description: 'Check refund status',
      examples: [
        'Where is my refund?',
        'When will I get my money back?',
        'Refund status',
        'Pending refund'
      ],
      response: 'Your refund of Rs.{amount} for order {order_id} is {status} and will be credited by {date}.',
      action: 'query_refund_status',
      entities: ['order_id'],
      requiresConfirmation: false,
      active: true
    },
    {
      id: 'intent-007',
      name: 'contact_support',
      description: 'Speak to human agent',
      examples: [
        'Connect me to an agent',
        'Talk to customer care',
        'I need human help',
        'Transfer to support'
      ],
      response: 'I am transferring you to a customer support executive. Please hold.',
      action: 'transfer_to_human',
      requiresConfirmation: false,
      active: true
    },
    {
      id: 'intent-008',
      name: 'greeting',
      description: 'Simple greeting',
      examples: [
        'Hello',
        'Hi',
        'Hey',
        'Good morning'
      ],
      response: 'Hello! How can I help you today?',
      requiresConfirmation: false,
      active: true
    }
  ];

  seedIntents.forEach(i => intents.set(i.id, i));

  // Seed voice agents
  const seedAgents: VoiceAgent[] = [
    {
      id: 'agent-001',
      name: 'REZ Customer Support',
      description: 'Main customer support voice agent for REZ ecosystem',
      type: 'customer_support',
      status: 'active',
      language: ['en-IN', 'hi'],
      greeting: 'Namaste! I am your REZ assistant. How can I help you today?',
      capabilities: ['order_tracking', 'cancellation', 'returns', 'refunds', 'complaints'],
      intents: ['order_status', 'cancel_order', 'return_request', 'payment_issue', 'refund_status'],
      configurations: {
        maxResponseTime: 3000,
        confidenceThreshold: 0.7,
        transferThreshold: 0.5,
        sentimentThreshold: 0.3
      },
      stats: {
        totalConversations: 15420,
        successfulConversations: 12890,
        avgResponseTime: 2100,
        avgSatisfaction: 4.2
      },
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2026-06-01T14:30:00Z'
    },
    {
      id: 'agent-002',
      name: 'REZ Sales Bot',
      description: 'Voice agent for sales inquiries and product recommendations',
      type: 'sales',
      status: 'active',
      language: ['en-IN'],
      greeting: 'Hello! Welcome to REZ shopping. How can I assist you today?',
      capabilities: ['product_search', 'recommendations', 'offers', 'comparisons'],
      intents: ['product_inquiry', 'offers', 'recommendations'],
      configurations: {
        maxResponseTime: 2500,
        confidenceThreshold: 0.75,
        crossSellEnabled: true
      },
      stats: {
        totalConversations: 8920,
        successfulConversations: 7560,
        avgResponseTime: 1800,
        avgSatisfaction: 4.5
      },
      createdAt: '2025-03-20T09:00:00Z',
      updatedAt: '2026-05-28T11:00:00Z'
    },
    {
      id: 'agent-003',
      name: 'REZ IVR System',
      description: 'Interactive voice response system for call center',
      type: 'ivr',
      status: 'active',
      language: ['en-IN', 'hi', 'bn'],
      greeting: 'Welcome to REZ customer service. Press 1 for English, 2 for Hindi.',
      capabilities: ['menu_navigation', 'balance_inquiry', 'mini_statement'],
      intents: ['balance_inquiry', 'menu_navigation'],
      configurations: {
        ivrLevels: 3,
        maxTransferDepth: 2
      },
      stats: {
        totalConversations: 45600,
        successfulConversations: 38900,
        avgResponseTime: 500,
        avgSatisfaction: 3.8
      },
      createdAt: '2024-06-01T08:00:00Z',
      updatedAt: '2026-06-05T16:00:00Z'
    },
    {
      id: 'agent-004',
      name: 'Merchant Assistant',
      description: 'Voice assistant for merchant partners',
      type: 'custom',
      status: 'training',
      language: ['en-IN'],
      greeting: 'Hello merchant partner! How can I help manage your store today?',
      capabilities: ['order_management', 'inventory', 'payments', 'reports'],
      intents: ['order_status', 'inventory_check', 'payout_status'],
      configurations: {
        merchantMode: true
      },
      stats: {
        totalConversations: 1200,
        successfulConversations: 980,
        avgResponseTime: 2400,
        avgSatisfaction: 4.3
      },
      createdAt: '2026-01-10T12:00:00Z',
      updatedAt: '2026-06-08T10:00:00Z'
    }
  ];

  seedAgents.forEach(a => agents.set(a.id, a));

  // Seed sample conversations
  const seedConversations: Conversation[] = [
    {
      id: 'conv-001',
      agentId: 'agent-001',
      userId: 'user-001',
      status: 'completed',
      messages: [
        {
          id: 'msg-001',
          conversationId: 'conv-001',
          role: 'agent',
          content: 'Namaste! I am your REZ assistant. How can I help you today?',
          createdAt: '2026-06-10T10:00:00Z'
        },
        {
          id: 'msg-002',
          conversationId: 'conv-001',
          role: 'user',
          content: 'Where is my order?',
          transcript: 'Where is my order?',
          confidence: 0.95,
          intent: 'order_status',
          entities: {},
          createdAt: '2026-06-10T10:01:00Z'
        },
        {
          id: 'msg-003',
          conversationId: 'conv-001',
          role: 'agent',
          content: 'Your order ORD-12345 is currently out for delivery and expected to arrive by 6 PM today.',
          createdAt: '2026-06-10T10:01:15Z'
        },
        {
          id: 'msg-004',
          conversationId: 'conv-001',
          role: 'user',
          content: 'Thank you',
          createdAt: '2026-06-10T10:02:00Z'
        }
      ],
      metadata: { device: 'mobile', location: 'Mumbai' },
      startedAt: '2026-06-10T10:00:00Z',
      endedAt: '2026-06-10T10:02:30Z',
      duration: 150,
      sentiment: 'positive',
      satisfactionScore: 5
    },
    {
      id: 'conv-002',
      agentId: 'agent-001',
      userId: 'user-002',
      status: 'transferred',
      messages: [
        {
          id: 'msg-005',
          conversationId: 'conv-002',
          role: 'agent',
          content: 'Hello! How can I help you today?',
          createdAt: '2026-06-10T11:00:00Z'
        },
        {
          id: 'msg-006',
          conversationId: 'conv-002',
          role: 'user',
          content: 'My payment failed but money got deducted',
          transcript: 'My payment failed but money got deducted',
          confidence: 0.88,
          intent: 'payment_issue',
          entities: {},
          createdAt: '2026-06-10T11:00:45Z'
        }
      ],
      metadata: { device: 'web' },
      startedAt: '2026-06-10T11:00:00Z',
      sentiment: 'negative'
    },
    {
      id: 'conv-003',
      agentId: 'agent-002',
      userId: 'user-003',
      status: 'active',
      messages: [
        {
          id: 'msg-007',
          conversationId: 'conv-003',
          role: 'agent',
          content: 'Hello! Welcome to REZ shopping. How can I assist you today?',
          createdAt: '2026-06-11T09:30:00Z'
        },
        {
          id: 'msg-008',
          conversationId: 'conv-003',
          role: 'user',
          content: 'Do you have Samsung phones?',
          transcript: 'Do you have Samsung phones?',
          confidence: 0.92,
          intent: 'product_inquiry',
          entities: { category: 'smartphone', brand: 'Samsung' },
          createdAt: '2026-06-11T09:30:30Z'
        }
      ],
      metadata: { device: 'smart_speaker' },
      startedAt: '2026-06-11T09:30:00Z',
      sentiment: 'neutral'
    }
  ];

  seedConversations.forEach(c => conversations.set(c.id, c));

  console.log(`[Voice-AI] Seeded ${agents.size} agents, ${intents.size} intents, ${conversations.size} conversations`);
}

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Auth middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-service-key'];
  if (key !== SERVICE_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'voice-ai',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', (req, res) => {
  res.json({
    status: 'ready',
    agents: agents.size,
    intents: intents.size,
    conversations: conversations.size
  });
});

// ============================================
// VOICE COMMAND PROCESSING
// ============================================

// Process voice command
app.post('/api/commands/process', (req, res) => {
  const { userId, text, language, channel } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, error: 'Text is required' });
  }

  // Simple intent matching (in production, this would call ML models)
  const intent = matchIntent(text.toLowerCase());
  const entities = extractEntities(text, intent);

  const command: VoiceCommand = {
    id: `cmd-${Date.now()}`,
    userId: userId || 'anonymous',
    text,
    transcript: text,
    confidence: intent ? 0.85 + Math.random() * 0.1 : 0.4 + Math.random() * 0.2,
    intent: intent?.name || 'unknown',
    entities,
    language: language || 'en-IN',
    channel: channel || 'app',
    processed: !!intent,
    result: intent ? generateResponse(intent, entities) : undefined,
    error: intent ? undefined : 'Intent not recognized',
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString()
  };

  commands.set(command.id, command);

  res.json({
    success: true,
    data: {
      commandId: command.id,
      intent: command.intent,
      confidence: command.confidence,
      entities: command.entities,
      response: command.result,
      requiresConfirmation: intent?.requiresConfirmation || false
    }
  });
});

// Match intent from text
function matchIntent(text: string): Intent | null {
  for (const intent of intents.values()) {
    if (!intent.active) continue;

    for (const example of intent.examples) {
      const normalizedExample = example.toLowerCase();
      const words = normalizedExample.split(' ');

      // Check if majority of key words match
      const matches = words.filter(w => text.includes(w)).length / words.length;

      if (matches >= 0.5) {
        return intent;
      }
    }
  }

  // Check for transfer intent
  if (text.includes('agent') || text.includes('human') || text.includes('help')) {
    return Array.from(intents.values()).find(i => i.name === 'contact_support') || null;
  }

  // Check for greeting
  if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
    return Array.from(intents.values()).find(i => i.name === 'greeting') || null;
  }

  return null;
}

// Extract entities from text
function extractEntities(text: string, intent: Intent | null): Record<string, any> {
  const entities: Record<string, any> = {};

  // Order ID pattern
  const orderMatch = text.match(/order\s*#?\s*([a-z0-9-]+)/i) || text.match(/ord[-]?\d+/i);
  if (orderMatch) {
    entities.order_id = orderMatch[1] || orderMatch[0];
  }

  // Amount pattern
  const amountMatch = text.match(/rs\.?\s*(\d+)/i) || text.match(/(\d+)\s*rupees?/i);
  if (amountMatch) {
    entities.amount = parseInt(amountMatch[1]);
  }

  // Product pattern
  if (text.includes('phone') || text.includes('laptop') || text.includes('tv')) {
    entities.category = text.includes('phone') ? 'smartphone' :
      text.includes('laptop') ? 'laptop' : 'tv';
  }

  // Brand pattern
  const brands = ['samsung', 'apple', 'oneplus', 'xiaomi', 'realme', 'moto'];
  for (const brand of brands) {
    if (text.includes(brand)) {
      entities.brand = brand.charAt(0).toUpperCase() + brand.slice(1);
      break;
    }
  }

  return entities;
}

// Generate response for intent
function generateResponse(intent: Intent, entities: Record<string, any>): string {
  let response = intent.response;

  // Replace placeholders with entities
  for (const [key, value] of Object.entries(entities)) {
    response = response.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }

  // Add default values for missing entities
  response = response.replace(/\{(\w+)\}/g, 'your');

  return response;
}

// Get command by ID
app.get('/api/commands/:id', (req, res) => {
  const command = commands.get(req.params.id);
  if (!command) {
    return res.status(404).json({ success: false, error: 'Command not found' });
  }
  res.json({ success: true, data: command });
});

// Get commands by user
app.get('/api/commands', (req, res) => {
  const { userId, intent, channel, processed } = req.query;

  let result = Array.from(commands.values());

  if (userId) {
    result = result.filter(c => c.userId === userId);
  }
  if (intent) {
    result = result.filter(c => c.intent === intent);
  }
  if (channel) {
    result = result.filter(c => c.channel === channel);
  }
  if (processed !== undefined) {
    result = result.filter(c => c.processed === (processed === 'true'));
  }

  res.json({ success: true, data: result, total: result.length });
});

// ============================================
// VOICE AGENT MANAGEMENT
// ============================================

// Get all agents
app.get('/api/agents', (req, res) => {
  const { status, type, language } = req.query;

  let result = Array.from(agents.values());

  if (status) {
    result = result.filter(a => a.status === status);
  }
  if (type) {
    result = result.filter(a => a.type === type);
  }
  if (language) {
    result = result.filter(a => a.language.includes(language as string));
  }

  res.json({ success: true, data: result, total: result.length });
});

// Get single agent
app.get('/api/agents/:id', (req, res) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    return res.status(404).json({ success: false, error: 'Agent not found' });
  }

  // Get recent conversations
  const recentConversations = Array.from(conversations.values())
    .filter(c => c.agentId === agent.id)
    .slice(-10);

  res.json({
    success: true,
    data: {
      ...agent,
      recentConversations
    }
  });
});

// Create agent
app.post('/api/agents', authMiddleware, (req, res) => {
  const { name, description, type, language, greeting, capabilities, intents: agentIntents } = req.body;

  if (!name || !type) {
    return res.status(400).json({ success: false, error: 'Name and type are required' });
  }

  const now = new Date().toISOString();
  const agent: VoiceAgent = {
    id: `agent-${Date.now()}`,
    name,
    description: description || '',
    type,
    status: 'inactive',
    language: language || ['en-IN'],
    greeting,
    capabilities: capabilities || [],
    intents: agentIntents || [],
    configurations: {},
    stats: {
      totalConversations: 0,
      successfulConversations: 0,
      avgResponseTime: 0,
      avgSatisfaction: 0
    },
    createdAt: now,
    updatedAt: now
  };

  agents.set(agent.id, agent);
  res.status(201).json({ success: true, data: agent });
});

// Update agent
app.put('/api/agents/:id', authMiddleware, (req, res) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    return res.status(404).json({ success: false, error: 'Agent not found' });
  }

  const updated: VoiceAgent = {
    ...agent,
    ...req.body,
    id: agent.id,
    updatedAt: new Date().toISOString()
  };

  agents.set(agent.id, updated);
  res.json({ success: true, data: updated });
});

// Update agent status
app.put('/api/agents/:id/status', authMiddleware, (req, res) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    return res.status(404).json({ success: false, error: 'Agent not found' });
  }

  const { status } = req.body;
  if (!['active', 'inactive', 'training', 'error'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  agent.status = status;
  agent.updatedAt = new Date().toISOString();

  agents.set(agent.id, agent);
  res.json({ success: true, data: agent });
});

// ============================================
// CONVERSATION MANAGEMENT
// ============================================

// Get conversations
app.get('/api/conversations', (req, res) => {
  const { agentId, userId, status, sentiment } = req.query;

  let result = Array.from(conversations.values());

  if (agentId) {
    result = result.filter(c => c.agentId === agentId);
  }
  if (userId) {
    result = result.filter(c => c.userId === userId);
  }
  if (status) {
    result = result.filter(c => c.status === status);
  }
  if (sentiment) {
    result = result.filter(c => c.sentiment === sentiment);
  }

  // Sort by start time (newest first)
  result.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  res.json({ success: true, data: result, total: result.length });
});

// Get single conversation
app.get('/api/conversations/:id', (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }
  res.json({ success: true, data: conversation });
});

// Start new conversation
app.post('/api/conversations', (req, res) => {
  const { agentId, userId, metadata } = req.body;

  if (!agentId || !userId) {
    return res.status(400).json({ success: false, error: 'Agent ID and User ID are required' });
  }

  const agent = agents.get(agentId);
  if (!agent) {
    return res.status(404).json({ success: false, error: 'Agent not found' });
  }

  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: `conv-${Date.now()}`,
    agentId,
    userId,
    status: 'active',
    messages: [
      {
        id: `msg-${Date.now()}`,
        conversationId: `conv-${Date.now()}`,
        role: 'agent',
        content: agent.greeting || 'Hello! How can I help you today?',
        createdAt: now
      }
    ],
    metadata: metadata || {},
    startedAt: now
  };

  conversations.set(conversation.id, conversation);

  // Update agent stats
  agent.stats.totalConversations++;
  agents.set(agent.id, agent);

  res.status(201).json({ success: true, data: conversation });
});

// Add message to conversation
app.post('/api/conversations/:id/messages', (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }

  const { role, content, audioUrl } = req.body;

  if (!role || !content) {
    return res.status(400).json({ success: false, error: 'Role and content are required' });
  }

  // Process user message for intent
  let intent: Intent | null = null;
  let entities: Record<string, any> = {};
  let confidence = 1;

  if (role === 'user') {
    intent = matchIntent(content.toLowerCase());
    entities = extractEntities(content, intent);
    confidence = intent ? 0.85 + Math.random() * 0.1 : 0.4 + Math.random() * 0.2;
  }

  const message: ConversationMessage = {
    id: `msg-${Date.now()}`,
    conversationId: conversation.id,
    role,
    content,
    audioUrl,
    transcript: role === 'user' ? content : undefined,
    confidence: role === 'user' ? confidence : undefined,
    intent: intent?.name,
    entities: Object.keys(entities).length > 0 ? entities : undefined,
    createdAt: new Date().toISOString()
  };

  conversation.messages.push(message);

  // Generate agent response if user message
  if (role === 'user') {
    const agent = agents.get(conversation.agentId);
    let responseContent: string;

    if (intent) {
      responseContent = generateResponse(intent, entities);

      // Check if needs confirmation or transfer
      if (intent.requiresConfirmation) {
        responseContent += ' Can I proceed?';
      }
      if (intent.fallbackIntent === 'transfer_human' && confidence < 0.7) {
        responseContent = 'I am connecting you to a human agent for better assistance.';
        conversation.status = 'transferred';
      }
    } else {
      responseContent = 'I am not sure I understood that. Could you please rephrase?';
    }

    const agentMessage: ConversationMessage = {
      id: `msg-${Date.now() + 1}`,
      conversationId: conversation.id,
      role: 'agent',
      content: responseContent,
      createdAt: new Date().toISOString()
    };

    conversation.messages.push(agentMessage);
  }

  // Update sentiment based on recent messages
  updateConversationSentiment(conversation);

  conversations.set(conversation.id, conversation);
  res.json({ success: true, data: message });
});

function updateConversationSentiment(conversation: Conversation) {
  // Simple sentiment analysis based on keywords
  const negativeWords = ['bad', 'worst', 'terrible', 'angry', 'frustrated', 'disappointed', 'not happy', 'cancel', 'refund', 'complaint'];
  const positiveWords = ['good', 'great', 'excellent', 'thank', 'thanks', 'perfect', 'love', 'happy', 'satisfied', 'awesome'];

  const lastMessages = conversation.messages.slice(-5);
  let positiveCount = 0;
  let negativeCount = 0;

  for (const msg of lastMessages) {
    const text = msg.content.toLowerCase();
    positiveCount += positiveWords.filter(w => text.includes(w)).length;
    negativeCount += negativeWords.filter(w => text.includes(w)).length;
  }

  if (negativeCount > positiveCount) {
    conversation.sentiment = 'negative';
  } else if (positiveCount > negativeCount) {
    conversation.sentiment = 'positive';
  } else {
    conversation.sentiment = 'neutral';
  }
}

// End conversation
app.post('/api/conversations/:id/end', authMiddleware, (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }

  const { satisfactionScore, status } = req.body;

  conversation.status = status || 'completed';
  conversation.endedAt = new Date().toISOString();
  conversation.duration = Math.floor(
    (new Date(conversation.endedAt).getTime() - new Date(conversation.startedAt).getTime()) / 1000
  );

  if (satisfactionScore !== undefined) {
    conversation.satisfactionScore = satisfactionScore;

    // Update agent satisfaction stats
    const agent = agents.get(conversation.agentId);
    if (agent) {
      const totalScore = agent.stats.avgSatisfaction * agent.stats.totalConversations + satisfactionScore;
      agent.stats.totalConversations++;
      agent.stats.successfulConversations++;
      agent.stats.avgSatisfaction = totalScore / agent.stats.totalConversations;
      agents.set(agent.id, agent);
    }
  }

  if (conversation.status === 'completed' || conversation.status === 'transferred') {
    // Mark as successful
    const agent = agents.get(conversation.agentId);
    if (agent) {
      agent.stats.successfulConversations++;
      agents.set(agent.id, agent);
    }
  }

  conversations.set(conversation.id, conversation);
  res.json({ success: true, data: conversation });
});

// ============================================
// INTENT MANAGEMENT
// ============================================

// Get all intents
app.get('/api/intents', (req, res) => {
  const { active, type } = req.query;

  let result = Array.from(intents.values());

  if (active !== undefined) {
    result = result.filter(i => i.active === (active === 'true'));
  }

  res.json({ success: true, data: result });
});

// Get single intent
app.get('/api/intents/:id', (req, res) => {
  const intent = intents.get(req.params.id);
  if (!intent) {
    return res.status(404).json({ success: false, error: 'Intent not found' });
  }

  // Get training data for this intent
  const intentTrainingData = Array.from(trainingData.values())
    .filter(t => t.intent === intent.name);

  res.json({
    success: true,
    data: {
      ...intent,
      trainingData: intentTrainingData
    }
  });
});

// Create intent
app.post('/api/intents', authMiddleware, (req, res) => {
  const { name, description, examples, response, action, entities, requiresConfirmation, fallbackIntent } = req.body;

  if (!name || !response) {
    return res.status(400).json({ success: false, error: 'Name and response are required' });
  }

  const intent: Intent = {
    id: `intent-${Date.now()}`,
    name,
    description: description || '',
    examples: examples || [],
    response,
    action,
    entities,
    requiresConfirmation: requiresConfirmation || false,
    fallbackIntent,
    active: true
  };

  intents.set(intent.id, intent);
  res.status(201).json({ success: true, data: intent });
});

// Update intent
app.put('/api/intents/:id', authMiddleware, (req, res) => {
  const intent = intents.get(req.params.id);
  if (!intent) {
    return res.status(404).json({ success: false, error: 'Intent not found' });
  }

  const updated: Intent = {
    ...intent,
    ...req.body,
    id: intent.id
  };

  intents.set(intent.id, updated);
  res.json({ success: true, data: updated });
});

// Add training example
app.post('/api/intents/:id/examples', authMiddleware, (req, res) => {
  const intent = intents.get(req.params.id);
  if (!intent) {
    return res.status(404).json({ success: false, error: 'Intent not found' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, error: 'Example text is required' });
  }

  intent.examples.push(text);
  intents.set(intent.id, intent);

  res.json({ success: true, data: intent });
});

// ============================================
// ANALYTICS
// ============================================

// Get voice AI analytics
app.get('/api/analytics/dashboard', (req, res) => {
  const allConversations = Array.from(conversations.values());
  const allCommands = Array.from(commands.values());
  const allAgents = Array.from(agents.values());

  // Conversation statistics
  const convStats = {
    total: allConversations.length,
    active: allConversations.filter(c => c.status === 'active').length,
    completed: allConversations.filter(c => c.status === 'completed').length,
    transferred: allConversations.filter(c => c.status === 'transferred').length,
    failed: allConversations.filter(c => c.status === 'failed').length
  };

  // Average metrics
  const avgDuration = allConversations.length > 0
    ? allConversations.reduce((s, c) => s + (c.duration || 0), 0) / allConversations.length
    : 0;

  const avgSatisfaction = allAgents.length > 0
    ? allAgents.reduce((s, a) => s + a.stats.avgSatisfaction, 0) / allAgents.length
    : 0;

  // Command statistics
  const cmdStats = {
    total: allCommands.length,
    processed: allCommands.filter(c => c.processed).length,
    failed: allCommands.filter(c => !c.processed).length
  };

  // Intent distribution
  const intentDistribution: Record<string, number> = {};
  allCommands.forEach(c => {
    if (c.intent && c.intent !== 'unknown') {
      intentDistribution[c.intent] = (intentDistribution[c.intent] || 0) + 1;
    }
  });

  // Channel distribution
  const channelDistribution: Record<string, number> = {};
  allCommands.forEach(c => {
    channelDistribution[c.channel] = (channelDistribution[c.channel] || 0) + 1;
  });

  // Sentiment distribution
  const sentimentDistribution: Record<string, number> = {};
  allConversations.forEach(c => {
    if (c.sentiment) {
      sentimentDistribution[c.sentiment] = (sentimentDistribution[c.sentiment] || 0) + 1;
    }
  });

  // Agent performance
  const agentPerformance = allAgents.map(a => ({
    name: a.name,
    type: a.type,
    status: a.status,
    totalConversations: a.stats.totalConversations,
    successfulConversations: a.stats.successfulConversations,
    successRate: a.stats.totalConversations > 0
      ? (a.stats.successfulConversations / a.stats.totalConversations * 100).toFixed(1) + '%'
      : '0%',
    avgSatisfaction: a.stats.avgSatisfaction.toFixed(1),
    avgResponseTime: (a.stats.avgResponseTime / 1000).toFixed(1) + 's'
  }));

  res.json({
    success: true,
    data: {
      conversationStats: convStats,
      commandStats: cmdStats,
      intentDistribution,
      channelDistribution,
      sentimentDistribution,
      agentPerformance,
      metrics: {
        avgDuration: Math.round(avgDuration) + 's',
        avgSatisfaction: avgSatisfaction.toFixed(1),
        totalAgents: allAgents.length,
        activeAgents: allAgents.filter(a => a.status === 'active').length,
        totalIntents: intents.size
      }
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Voice-AI] Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// ============================================
// SERVER START
// ============================================

function startServer() {
  seedInitialData();

  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║              VOICE-AI - Voice AI Interface              ║
╠════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                          ║
║  Health:   http://localhost:${PORT}/health                    ║
║  API:      http://localhost:${PORT}/api                       ║
║  Agents:   ${agents.size}                                       ║
║  Intents:  ${intents.size}                                       ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
}

process.on('SIGTERM', () => {
  console.log('[Voice-AI] SIGTERM received, shutting down...');
  process.exit(0);
});

startServer();

export default app;
