/**
 * REZ Atlas v2 - WhatsApp Service
 * WhatsApp Sequences & Outreach
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5162;

interface WhatsAppTemplate {
  id: string;
  name: string;
  templateId: string; // WhatsApp Business template ID
  content: string;
  variables: string[];
  category: string;
  status: 'draft' | 'approved' | 'pending';
  createdAt: string;
}

interface WhatsAppMessage {
  id: string;
  templateId: string;
  contactId: string;
  phone: string;
  content: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  repliedAt: string | null;
}

const templates: Map<string, WhatsAppTemplate> = new Map();
const messages: Map<string, WhatsAppMessage> = new Map();

// Seed templates
const seedTemplates: WhatsAppTemplate[] = [
  {
    id: uuidv4(),
    name: 'Initial Outreach',
    templateId: 'outreach_initial',
    content: `Hi {{firstName}}! 👋

This is {{senderName}} from REZ.

I came across {{company}} and thought we could help you get more repeat customers.

Would you be interested in a quick demo?

Reply YES to know more!`,
    variables: ['firstName', 'senderName', 'company'],
    category: 'outreach',
    status: 'approved',
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Follow Up',
    templateId: 'follow_up_1',
    content: `Hi {{firstName}}!

Just checking if you saw my previous message about {{company}}.

We helped similar businesses increase repeat customers by 30%.

Let me know if you'd like to chat! 📞`,
    variables: ['firstName', 'company'],
    category: 'follow-up',
    status: 'approved',
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Meeting Reminder',
    templateId: 'meeting_reminder',
    content: `Hi {{firstName}}! ⏰

Reminder: Our demo call is scheduled for {{date}} at {{time}}.

Looking forward to speaking with you!

- {{senderName}}`,
    variables: ['firstName', 'date', 'time', 'senderName'],
    category: 'meeting',
    status: 'approved',
    createdAt: new Date().toISOString()
  }
];
seedTemplates.forEach(t => templates.set(t.id, t));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'atlas-whatsapp-service', version: '2.0.0' });
});

// Get templates
app.get('/api/templates', (req, res) => {
  const { category, status } = req.query;
  let result = Array.from(templates.values());
  if (category) result = result.filter(t => t.category === category);
  if (status) result = result.filter(t => t.status === status);
  res.json({ templates: result, count: result.length });
});

// Create template
app.post('/api/templates', (req, res) => {
  const { name, content, category } = req.body;
  const template: WhatsAppTemplate = {
    id: uuidv4(),
    name,
    templateId: `wa_${uuidv4().slice(0, 8)}`,
    content,
    variables: extractVariables(content),
    category: category || 'general',
    status: 'draft',
    createdAt: new Date().toISOString()
  };
  templates.set(template.id, template);
  res.status(201).json(template);
});

// Send WhatsApp message
app.post('/api/messages/send', (req, res) => {
  const { templateId, contactId, phone, variables } = req.body;
  const template = templates.get(templateId);

  if (!template) return res.status(404).json({ error: 'Template not found' });
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const message: WhatsAppMessage = {
    id: uuidv4(),
    templateId,
    contactId,
    phone,
    content: replaceVariables(template.content, variables),
    status: 'queued',
    sentAt: null,
    deliveredAt: null,
    readAt: null,
    repliedAt: null
  };
  messages.set(message.id, message);

  // Simulate sending
  setTimeout(() => {
    message.status = 'sent';
    message.sentAt = new Date().toISOString();
    messages.set(message.id, message);

    setTimeout(() => {
      message.status = 'delivered';
      message.deliveredAt = new Date().toISOString();
      messages.set(message.id, message);
    }, 1000);
  }, 500);

  res.status(201).json({ messageId: message.id, status: 'queued' });
});

// Get message status
app.get('/api/messages/:id', (req, res) => {
  const message = messages.get(req.params.id);
  if (!message) return res.status(404).json({ error: 'Message not found' });
  res.json(message);
});

// Track reply
app.post('/api/messages/:id/reply', (req, res) => {
  const message = messages.get(req.params.id);
  if (!message) return res.status(404).json({ error: 'Message not found' });

  message.status = 'replied';
  message.repliedAt = new Date().toISOString();
  messages.set(message.id, message);

  res.json({ message, action: 'replied' });
});

// Analytics
app.get('/api/analytics', (req, res) => {
  const stats = {
    total: messages.size,
    byStatus: Array.from(messages.values()).reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    deliveryRate: 0,
    readRate: 0,
    replyRate: 0
  };

  const sent = Array.from(messages.values()).filter(m => m.sentAt);
  if (sent.length > 0) {
    stats.deliveryRate = (sent.filter(m => m.deliveredAt).length / sent.length * 100).toFixed(1);
    stats.readRate = (sent.filter(m => m.readAt).length / sent.length * 100).toFixed(1);
    stats.replyRate = (sent.filter(m => m.repliedAt).length / sent.length * 100).toFixed(1);
  }

  res.json(stats);
});

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
}

function replaceVariables(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
}

app.listen(PORT, () => {
  console.log(`💬 Atlas WhatsApp Service running on port ${PORT}`);
});

export default app;