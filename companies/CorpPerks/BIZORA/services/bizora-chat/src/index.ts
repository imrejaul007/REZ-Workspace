/**
 * BIZORA Chat Service
 * AI Business Concierge - Main entry point to everything
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

type IntentCategory =
  | 'business_setup'
  | 'compliance'
  | 'marketing'
  | 'technology'
  | 'finance'
  | 'legal'
  | 'operations'
  | 'general';

interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: IntentCategory;
  confidence?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface Conversation {
  id: string;
  userId?: string;
  channel: 'web' | 'whatsapp' | 'mobile';
  status: 'active' | 'closed' | 'pending';
  messages: Message[];
  context: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface IntentResult {
  category: IntentCategory;
  subcategory?: string;
  confidence: number;
  entities: Record<string, string>;
  suggestedActions: SuggestedAction[];
}

interface SuggestedAction {
  type: 'suggestion' | 'action' | 'recommendation';
  id: string;
  title: string;
  description: string;
  price?: number;
  action: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Intent Classification Engine
// ============================================================================

const INTENT_PATTERNS: Record<IntentCategory, { keywords: string[]; examples: string[] }> = {
  business_setup: {
    keywords: [
      'start', 'register', 'incorporate', 'company', 'pvt', 'llp', 'proprietorship',
      'partnership', 'setup', 'begin', 'launch', 'business', 'enterprise',
      'gst', 'fssai', 'license', 'trade', 'permission', 'registration'
    ],
    examples: [
      'I want to start a company',
      'How do I register a business',
      'I need to open a Pvt Ltd company',
      'Start my restaurant business',
      'Help me incorporate my company',
      'I need GST registration'
    ]
  },
  compliance: {
    keywords: [
      'gst', 'tds', 'itr', 'tax', 'filing', 'return', 'gstr', 'form',
      'compliant', 'compliance', 'deadline', 'due', 'annual', 'quarterly',
      'roc', 'epf', 'esi', 'payroll', 'pf', 'remittance'
    ],
    examples: [
      'File my GST return',
      'When is my next filing due',
      'I need to file TDS',
      'Help with tax planning',
      'When is GSTR-1 due',
      'I need to file my returns'
    ]
  },
  marketing: {
    keywords: [
      'market', 'ads', 'advertising', 'brand', 'logo', 'social', 'instagram',
      'facebook', 'seo', 'campaign', 'promote', 'marketing', 'content',
      'digital', 'online', 'leads', 'customers', 'reach', 'audience'
    ],
    examples: [
      'I need to market my restaurant',
      'Run ads for my business',
      'Create a brand logo',
      'Set up social media',
      'Help me get more customers',
      'I need digital marketing'
    ]
  },
  technology: {
    keywords: [
      'website', 'app', 'software', 'pos', 'crm', 'erp', 'system',
      'digital', 'online', 'automation', 'tech', 'development', 'build',
      'code', 'application', 'platform', 'integration', 'api'
    ],
    examples: [
      'Build me a website',
      'Create an app for my restaurant',
      'I need a POS system',
      'Set up a CRM',
      'Help me with automation',
      'I need software development'
    ]
  },
  finance: {
    keywords: [
      'invoice', 'payment', 'billing', 'account', 'book', 'ledger',
      'balance', 'transaction', 'credit', 'loan', 'finance', 'capital',
      'fund', 'money', 'banking', 'upi', 'neft', 'rtgs'
    ],
    examples: [
      'Create an invoice',
      'I need payment gateway',
      'Help with bookkeeping',
      'Get a business loan',
      'Track my expenses',
      'Generate a bill'
    ]
  },
  legal: {
    keywords: [
      'legal', 'contract', 'agreement', 'terms', 'privacy', 'policy',
      'nda', 'copyright', 'trademark', 'patent', 'ip', 'intellectual',
      'property', 'law', 'court', 'dispute', 'compliance', 'regulatory'
    ],
    examples: [
      'I need a contract',
      'Help with legal documents',
      'Register my trademark',
      'Create terms of service',
      'I need a privacy policy',
      'Help with legal compliance'
    ]
  },
  operations: {
    keywords: [
      'staff', 'employee', 'hire', 'recruit', 'hr', 'payroll', 'leave',
      'attendance', 'team', 'schedule', 'shift', 'vendor', 'supplier',
      'procurement', 'inventory', 'logistics', 'delivery'
    ],
    examples: [
      'I need to hire staff',
      'Help with payroll',
      'Manage my team',
      'Set up attendance',
      'I need vendor management',
      'Help with HR'
    ]
  },
  general: {
    keywords: ['help', 'hi', 'hello', 'hey', 'thanks', 'thank', 'okay', 'ok', 'yes', 'no'],
    examples: ['Hi', 'Hello', 'Help me', 'Thanks', 'What can you do']
  }
};

// ============================================================================
// Response Templates
// ============================================================================

const RESPONSE_TEMPLATES: Record<IntentCategory, { greeting: string; suggestions: SuggestedAction[] }> = {
  business_setup: {
    greeting: "Great! I'd love to help you start your business. Let me ask a few questions to guide you through the process.",
    suggestions: [
      { type: 'action', id: 'register_company', title: 'Register Company', description: 'Pvt Ltd, LLP, Partnership, or Proprietorship', action: 'navigate', metadata: { route: '/business-setup/company-registration' } },
      { type: 'action', id: 'gst_registration', title: 'GST Registration', description: 'Get your GSTIN in 3-7 days', action: 'navigate', metadata: { route: '/business-setup/gst' } },
      { type: 'action', id: 'licenses', title: 'Business Licenses', description: 'Trade, FSSAI, IEC, and more', action: 'navigate', metadata: { route: '/business-setup/licenses' } }
    ]
  },
  compliance: {
    greeting: "I'll help you stay compliant! Let me check your filing status and upcoming deadlines.",
    suggestions: [
      { type: 'action', id: 'file_gstr', title: 'File GST Return', description: 'GSTR-1, GSTR-3B, GSTR-9', action: 'navigate', metadata: { route: '/compliance/gst' } },
      { type: 'action', id: 'check_deadlines', title: 'Check Deadlines', description: 'View upcoming compliance dates', action: 'navigate', metadata: { route: '/compliance/deadlines' } },
      { type: 'action', id: 'tax_planning', title: 'Tax Planning', description: 'Optimize your tax liability', action: 'navigate', metadata: { route: '/compliance/planning' } }
    ]
  },
  marketing: {
    greeting: "Let's grow your business! I can help you with branding, advertising, and digital marketing.",
    suggestions: [
      { type: 'action', id: 'social_media', title: 'Social Media Setup', description: 'Instagram, Facebook, LinkedIn', action: 'navigate', metadata: { route: '/marketing/social-media' } },
      { type: 'action', id: 'run_ads', title: 'Run Ads', description: 'Google, Meta, Instagram campaigns', action: 'navigate', metadata: { route: '/marketing/ads' } },
      { type: 'action', id: 'branding', title: 'Branding', description: 'Logo, brand identity, guidelines', action: 'navigate', metadata: { route: '/marketing/branding' } },
      { type: 'action', id: 'find_agency', title: 'Find Marketing Agency', description: 'Browse verified agencies', action: 'navigate', metadata: { route: '/marketplace/marketing' } }
    ]
  },
  technology: {
    greeting: "I can help you find the right technology solutions for your business.",
    suggestions: [
      { type: 'action', id: 'pos_system', title: 'POS System', description: 'Restaurant, Salon, Retail POS', action: 'navigate', metadata: { route: '/products/pos' } },
      { type: 'action', id: 'website_dev', title: 'Website Development', description: 'Business, E-commerce, Landing pages', action: 'navigate', metadata: { route: '/products/websites' } },
      { type: 'action', id: 'crm_setup', title: 'CRM Setup', description: 'Customer management system', action: 'navigate', metadata: { route: '/products/crm' } },
      { type: 'action', id: 'find_dev', title: 'Find Developer', description: 'Browse verified agencies', action: 'navigate', metadata: { route: '/marketplace/technology' } }
    ]
  },
  finance: {
    greeting: "Let me help you manage your finances efficiently.",
    suggestions: [
      { type: 'action', id: 'create_invoice', title: 'Create Invoice', description: 'Generate GST-compliant invoices', action: 'navigate', metadata: { route: '/finance/invoices' } },
      { type: 'action', id: 'payment_gateway', title: 'Payment Gateway', description: 'Accept UPI, Cards, Net Banking', action: 'navigate', metadata: { route: '/finance/payments' } },
      { type: 'action', id: 'business_loan', title: 'Business Loan', description: 'Get funding for growth', action: 'navigate', metadata: { route: '/finance/loans' } },
      { type: 'action', id: 'expense_tracking', title: 'Expense Tracking', description: 'Track and manage expenses', action: 'navigate', metadata: { route: '/finance/expenses' } }
    ]
  },
  legal: {
    greeting: "I can connect you with legal experts or help you with standard legal documents.",
    suggestions: [
      { type: 'action', id: 'find_lawyer', title: 'Find Legal Expert', description: 'Browse verified advocates', action: 'navigate', metadata: { route: '/marketplace/legal' } },
      { type: 'action', id: 'trademark', title: 'Trademark Registration', description: 'Protect your brand', action: 'navigate', metadata: { route: '/legal/trademark' } },
      { type: 'action', id: 'contracts', title: 'Contract Templates', description: 'NDA, Employment, Service agreements', action: 'navigate', metadata: { route: '/legal/contracts' } }
    ]
  },
  operations: {
    greeting: "Let me help you optimize your business operations.",
    suggestions: [
      { type: 'action', id: 'hr_system', title: 'HR & Payroll', description: 'PeopleOS - Complete HR solution', action: 'navigate', metadata: { route: '/products/hr' } },
      { type: 'action', id: 'find_recruiter', title: 'Find Recruiter', description: 'Hire staff or agencies', action: 'navigate', metadata: { route: '/marketplace/hr' } },
      { type: 'action', id: 'inventory', title: 'Inventory Management', description: 'Track stock and supplies', action: 'navigate', metadata: { route: '/products/inventory' } }
    ]
  },
  general: {
    greeting: "Hi! I'm Bizora, your AI business assistant. I can help you with:",
    suggestions: [
      { type: 'suggestion', id: 'start_business', title: 'Start a Business', description: 'Registration, licenses, GST', action: 'suggest', metadata: { category: 'business_setup' } },
      { type: 'suggestion', id: 'stay_compliant', title: 'Stay Compliant', description: 'Tax filing, deadlines, returns', action: 'suggest', metadata: { category: 'compliance' } },
      { type: 'suggestion', id: 'grow_business', title: 'Grow Your Business', description: 'Marketing, branding, ads', action: 'suggest', metadata: { category: 'marketing' } },
      { type: 'suggestion', id: 'build_tech', title: 'Build Technology', description: 'Website, app, POS, CRM', action: 'suggest', metadata: { category: 'technology' } }
    ]
  }
};

// ============================================================================
// Intent Classifier
// ============================================================================

function classifyIntent(message: string): IntentResult {
  const normalized = message.toLowerCase();

  // Count keyword matches for each category
  const scores: Record<IntentCategory, number> = {
    business_setup: 0,
    compliance: 0,
    marketing: 0,
    technology: 0,
    finance: 0,
    legal: 0,
    operations: 0,
    general: 0
  };

  for (const [category, data] of Object.entries(INTENT_PATTERNS)) {
    for (const keyword of data.keywords) {
      if (normalized.includes(keyword)) {
        scores[category as IntentCategory] += 1;
      }
    }
  }

  // Find best match
  let bestCategory: IntentCategory = 'general';
  let bestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as IntentCategory;
    }
  }

  // Calculate confidence
  const confidence = Math.min(bestScore / 3, 1);

  // Extract entities
  const entities: Record<string, string> = {};

  // GST number
  const gstMatch = normalized.match(/[0-9]{2}[a-z]{5}[0-9]{4}[a-z]{1}[1-9a-z]{1}[z][0-9a-z]{1}/i);
  if (gstMatch) {
    entities.gstin = gstMatch[0].toUpperCase();
  }

  // Business type
  if (normalized.includes('pvt') || normalized.includes('private')) {
    entities.businessType = 'pvt_ltd';
  } else if (normalized.includes('llp')) {
    entities.businessType = 'llp';
  } else if (normalized.includes('proprietorship')) {
    entities.businessType = 'proprietorship';
  }

  // Industry hints
  const industries = ['restaurant', 'salon', 'hotel', 'retail', 'clinic', 'cafe'];
  for (const industry of industries) {
    if (normalized.includes(industry)) {
      entities.industry = industry;
      break;
    }
  }

  return {
    category: bestCategory,
    confidence,
    entities,
    suggestedActions: RESPONSE_TEMPLATES[bestCategory].suggestions
  };
}

// ============================================================================
// Response Generator
// ============================================================================

function generateResponse(intent: IntentResult, message: string, conversationHistory: Message[]): { response: string; actions?: SuggestedAction[] } {
  const template = RESPONSE_TEMPLATES[intent.category];

  // Generate contextual response based on conversation history
  if (conversationHistory.length > 2) {
    // Multi-turn conversation
    return {
      response: buildMultiTurnResponse(intent, message, conversationHistory),
      actions: intent.suggestedActions.slice(0, 3)
    };
  }

  return {
    response: buildSingleTurnResponse(intent, message, template),
    actions: intent.suggestedActions.slice(0, 4)
  };
}

function buildSingleTurnResponse(intent: IntentResult, message: string, template: { greeting: string; suggestions: SuggestedAction[] }): string {
  let response = template.greeting;

  // Add contextual info based on intent
  switch (intent.category) {
    case 'business_setup':
      response += "\n\nI can help you with:\n";
      response += "• Company Registration (Pvt Ltd, LLP, Partnership)\n";
      response += "• GST Registration\n";
      response += "• Licenses (FSSAI, Trade License, IEC)\n";
      response += "• Bank Account Assistance\n";
      break;

    case 'compliance':
      response += "\n\nI can help you with:\n";
      response += "• GST Return Filing (GSTR-1, GSTR-3B, GSTR-9)\n";
      response += "• TDS Filing\n";
      response += "• Deadline Reminders\n";
      response += "• Compliance Health Check\n";
      break;

    case 'marketing':
      response += "\n\nI can help you with:\n";
      response += "• Social Media Management\n";
      response += "• Google & Meta Ads\n";
      response += "• Branding & Logo Design\n";
      response += "• Content Marketing\n";
      break;

    case 'technology':
      response += "\n\nI can help you with:\n";
      response += "• POS Systems (Restaurant, Salon, Retail)\n";
      response += "• Website Development\n";
      response += "• CRM Setup\n";
      response += "• Mobile Apps\n";
      break;

    case 'finance':
      response += "\n\nI can help you with:\n";
      response += "• Invoice Generation\n";
      response += "• Payment Gateway Setup\n";
      response += "• Business Loans\n";
      response += "• Expense Tracking\n";
      break;

    case 'general':
      response += "\n";
      response += "• 📋 **Business Setup** - Register company, get licenses\n";
      response += "• 📜 **Tax & Compliance** - File returns, stay compliant\n";
      response += "• 📢 **Marketing** - Ads, branding, social media\n";
      response += "• 💻 **Technology** - Website, app, POS, CRM\n";
      response += "• 💰 **Finance** - Invoices, payments, loans\n";
      response += "• 👥 **Operations** - HR, payroll, staff\n";
      break;
  }

  return response;
}

function buildMultiTurnResponse(intent: IntentResult, message: string, history: Message[]): string {
  const lastAssistantMsg = history.filter(m => m.role === 'assistant').pop();

  // Check for specific follow-ups
  if (message.toLowerCase().includes('how') && message.toLowerCase().includes('much')) {
    return generatePricingResponse(intent);
  }

  if (message.toLowerCase().includes('how') && message.toLowerCase().includes('long')) {
    return generateTimelineResponse(intent);
  }

  if (message.toLowerCase().includes('document') || message.toLowerCase().includes('required')) {
    return generateDocumentsResponse(intent);
  }

  // Default follow-up response
  return `I understand you're asking about ${intent.category.replace('_', ' ')}. Let me help you get started with that.\n\nWhat specific aspect would you like to explore first?`;
}

function generatePricingResponse(intent: IntentResult): string {
  const pricing: Record<string, string> = {
    business_setup: "Pricing varies by company type:\n• Sole Proprietorship: ₹2,000-5,000\n• Partnership: ₹5,000-15,000\n• LLP: ₹10,000-30,000\n• Private Limited: ₹15,000-50,000\n\nWould you like me to connect you with a CA for exact pricing?",
    compliance: "Our TaxFlow service starts at ₹999/month for:\n• Unlimited GST filings\n• Automated reminders\n• Compliance dashboard\n\nGSTR-3B filing: ₹500-2,000 per return\nGSTR-9 Annual: ₹3,000-15,000 per year\n\nShall I set up a call with our tax expert?",
    marketing: "Marketing costs vary by scope:\n• Social Media (20 posts/mo): ₹5,000-15,000/month\n• Google Ads Management: 15-20% of ad spend\n• Logo Design: ₹5,000-50,000\n• Complete Branding: ₹30,000-2,00,000\n\nShall I show you agency options in your budget?",
    technology: "Technology costs:\n• POS System: ₹2,999-15,000/month\n• Website: ₹30,000-3,00,000\n• CRM Setup: ₹50,000-5,00,000\n• Custom App: ₹8,00,000+\n\nWhat type of solution are you looking for?"
  };

  return pricing[intent.category] || "Pricing depends on your specific requirements. Would you like me to connect you with a specialist who can provide a custom quote?";
}

function generateTimelineResponse(intent: IntentResult): string {
  const timelines: Record<string, string> = {
    business_setup: "Timeline by company type:\n• Sole Proprietorship: 1-3 days\n• Partnership: 3-7 days\n• LLP: 7-15 days\n• Private Limited: 15-25 days\n\nAfter documents are submitted. Want me to start the process?",
    compliance: "Filing timelines:\n• GSTR-1: By 11th of next month\n• GSTR-3B: By 20th of next month\n• GSTR-9: By 31st December\n• TDS Quarterly: By 31st of next month\n\nShall I help you prepare for your upcoming filing?",
    marketing: "Typical timelines:\n• Logo Design: 3-7 days\n• Social Media Setup: 1-2 weeks\n• Website Development: 4-12 weeks\n• Ad Campaigns: Can launch in 1-3 days\n\nReady to get started?",
    technology: "Development timelines:\n• POS Setup: 1-3 days\n• Website (5-10 pages): 4-8 weeks\n• E-commerce: 8-16 weeks\n• Mobile App: 12-24 weeks\n\nWhat solution are you interested in?"
  };

  return timelines[intent.category] || "Timeline depends on complexity. Would you like me to connect you with an expert for a project estimate?";
}

function generateDocumentsResponse(intent: IntentResult): string {
  const docs: Record<string, string> = {
    business_setup: "Typically required:\n• PAN Card (Directors/Partners)\n• Aadhaar Card\n• Address Proof (Personal & Business)\n• Bank Statement (Last 3 months)\n• Office Address Proof (NOC if rented)\n• Passport size photos\n\nSpecific documents depend on company type. Want me to send a complete checklist?",
    compliance: "For GST filing, you'll need:\n• Sales Invoices (B2B & B2C)\n• Purchase Invoices\n• Expense Bills\n• Bank Statements\n• E-Way Bills (if applicable)\n\nWould you like me to send a document checklist?",
    technology: "Requirements depend on the solution:\n\nFor POS: Business documents, bank details\nFor Website: Content, brand guidelines, images\nFor CRM: Contact lists, workflow requirements\n\nShall I connect you with a specialist to understand your needs?"
  };

  return docs[intent.category] || "Document requirements vary by service. Would you like me to connect you with an expert who can guide you?";
}

// ============================================================================
// Store (In-memory, replace with database)
// ============================================================================

const conversations = new Map<string, Conversation>();

// ============================================================================
// Express App
// ============================================================================

const app = express();

app.use(cors());
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'bizora-chat', timestamp: new Date().toISOString() });
});

// Create conversation
app.post('/api/chat/conversations', (req: Request, res: Response) => {
  const { userId, channel = 'web' } = req.body;

  const conversation: Conversation = {
    id: uuidv4(),
    userId,
    channel,
    status: 'active',
    messages: [],
    context: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Add welcome message
  const welcomeMessage: Message = {
    id: uuidv4(),
    conversationId: conversation.id,
    role: 'assistant',
    content: RESPONSE_TEMPLATES.general.greeting + "\n\n" +
      "• 📋 **Business Setup** - Register company, get licenses\n" +
      "• 📜 **Tax & Compliance** - File returns, stay compliant\n" +
      "• 📢 **Marketing** - Ads, branding, social media\n" +
      "• 💻 **Technology** - Website, app, POS, CRM\n" +
      "• 💰 **Finance** - Invoices, payments, loans\n" +
      "• 👥 **Operations** - HR, payroll, staff\n\n" +
      "What would you like help with today?",
    intent: 'general',
    confidence: 1,
    createdAt: new Date()
  };

  conversation.messages.push(welcomeMessage);
  conversations.set(conversation.id, conversation);

  res.json(conversation);
});

// Get conversations
app.get('/api/chat/conversations', (req: Request, res: Response) => {
  const { userId } = req.query;

  const userConversations = Array.from(conversations.values())
    .filter(c => !userId || c.userId === userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  res.json(userConversations);
});

// Get messages
app.get('/api/chat/conversations/:conversationId/messages', (req: Request, res: Response) => {
  const { conversationId } = req.params;

  const conversation = conversations.get(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  res.json(conversation.messages);
});

// Send message
app.post('/api/chat/message', (req: Request, res: Response) => {
  const { conversationId, message, userId, channel = 'web' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Get or create conversation
  let conversation: Conversation;
  if (conversationId) {
    conversation = conversations.get(conversationId) || createNewConversation(userId, channel);
  } else {
    conversation = createNewConversation(userId, channel);
  }

  // Add user message
  const userMessage: Message = {
    id: uuidv4(),
    conversationId: conversation.id,
    role: 'user',
    content: message,
    createdAt: new Date()
  };
  conversation.messages.push(userMessage);

  // Classify intent
  const intent = classifyIntent(message);

  // Generate response
  const { response, actions } = generateResponse(intent, message, conversation.messages);

  // Add assistant message
  const assistantMessage: Message = {
    id: uuidv4(),
    conversationId: conversation.id,
    role: 'assistant',
    content: response,
    intent: intent.category,
    confidence: intent.confidence,
    metadata: { entities: intent.entities, actions },
    createdAt: new Date()
  };
  conversation.messages.push(assistantMessage);

  // Update conversation
  conversation.updatedAt = new Date();
  conversations.set(conversation.id, conversation);

  // Return response
  res.json({
    conversationId: conversation.id,
    message: response,
    intent: {
      category: intent.category,
      subcategory: intent.subcategory,
      confidence: intent.confidence
    },
    actions: actions?.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      price: a.price,
      action: a.action
    }))
  });
});

function createNewConversation(userId?: string, channel: 'web' | 'whatsapp' | 'mobile' = 'web'): Conversation {
  const conversation: Conversation = {
    id: uuidv4(),
    userId,
    channel,
    status: 'active',
    messages: [],
    context: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };
  conversations.set(conversation.id, conversation);
  return conversation;
}

// Get categories
app.get('/api/chat/categories', (_req: Request, res: Response) => {
  const categories = Object.entries(RESPONSE_TEMPLATES).map(([key, value]) => ({
    id: key,
    name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: getCategoryIcon(key as IntentCategory),
    description: value.greeting.split('.')[0],
    popularActions: value.suggestions.slice(0, 3)
  }));

  res.json(categories);
});

function getCategoryIcon(category: IntentCategory): string {
  const icons: Record<IntentCategory, string> = {
    business_setup: '📋',
    compliance: '📜',
    marketing: '📢',
    technology: '💻',
    finance: '💰',
    legal: '⚖️',
    operations: '👥',
    general: '🤖'
  };
  return icons[category];
}

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🤖 BIZORA Chat Service                                 ║
║   AI Business Concierge                                  ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Status: Running                                         ║
║                                                           ║
║   Intent Categories:                                      ║
║   • business_setup  • compliance                        ║
║   • marketing       • technology                         ║
║   • finance        • legal                              ║
║   • operations     • general                            ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST /api/chat/message                               ║
║   • POST /api/chat/conversations                        ║
║   • GET  /api/chat/conversations                        ║
║   • GET  /api/chat/categories                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
