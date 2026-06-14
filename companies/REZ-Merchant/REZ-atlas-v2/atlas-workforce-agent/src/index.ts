/**
 * Atlas Workforce Agent - AI Sales Agent
 * Autonomous merchant outreach and engagement
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 5210;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// In-memory storage
const conversations: Map<string, any[]> = new Map();

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'atlas-workforce-agent',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get AI agent status
app.get('/api/agents', (req: Request, res: Response) => {
  res.json({
    active: 5,
    idle: 2,
    total: 10,
    agents: [
      { id: 'agent-1', name: 'Sales Bot Alpha', status: 'active', tasks: 45 },
      { id: 'agent-2', name: 'Sales Bot Beta', status: 'active', tasks: 38 },
      { id: 'agent-3', name: 'Outreach Bot', status: 'idle', tasks: 0 }
    ]
  });
});

// Send outreach message
app.post('/api/outreach', (req: Request, res: Response) => {
  const { merchantId, channel, template, personalized } = req.body;

  const id = uuidv4();
  const outreach = {
    id,
    merchantId,
    channel: channel || 'whatsapp',
    template,
    personalized: personalized || false,
    status: 'sent',
    sentAt: new Date().toISOString()
  };

  res.status(201).json(outreach);
});

// Get conversation history
app.get('/api/conversations/:merchantId', (req: Request, res: Response) => {
  const messages = conversations.get(req.params.merchantId) || [];
  res.json({ count: messages.length, messages });
});

// AI Response generation
app.post('/api/respond', (req: Request, res: Response) => {
  const { context, intent } = req.body;

  const responses: Record<string, string> = {
    'greeting': 'Hi! Thanks for reaching out. How can I help you today?',
    'pricing': 'Our pricing starts at ₹999/month for the basic plan. Would you like to know more?',
    'demo': 'I\'d be happy to schedule a demo! What time works best for you?',
    'support': 'I understand your concern. Let me connect you with our support team.',
    'default': 'Thank you for your message. Our team will get back to you shortly.'
  };

  res.json({
    response: responses[intent] || responses['default'],
    confidence: 0.95,
    suggestedActions: ['Schedule Demo', 'View Pricing', 'Talk to Sales']
  });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: Function) => {
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`🤖 Atlas AI Sales Agent running on port ${PORT}`);
});

export default app;
