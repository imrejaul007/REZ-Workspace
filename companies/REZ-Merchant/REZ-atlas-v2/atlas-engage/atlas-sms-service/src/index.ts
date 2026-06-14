/**
 * REZ Atlas v2 - SMS Service
 * SMS Sequences & Campaigns
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5163;

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  maxLength: number;
  category: string;
}

interface SMSMessage {
  id: string;
  templateId: string;
  contactId: string;
  phone: string;
  content: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  sentAt: string | null;
  deliveredAt: string | null;
}

const templates: Map<string, SMSTemplate> = new Map();
const messages: Map<string, SMSMessage> = new Map();

// Seed templates
[
  { name: 'Quick Intro', content: 'Hi {{firstName}}! This is {{senderName}} from REZ. We help businesses like {{company}} increase repeat customers. Interested? Reply YES!', category: 'outreach' },
  { name: 'Follow Up', content: 'Hi {{firstName}}, just following up on our message. Would love to show you how we helped similar businesses. Reply to connect!', category: 'follow-up' },
  { name: 'Meeting Reminder', content: 'Reminder: Demo call at {{time}} today. Reply CONFIRM or RESCHEDULE. - {{senderName}}', category: 'meeting' }
].forEach(t => {
  const template = { id: uuidv4(), ...t, maxLength: 160 };
  templates.set(template.id, template);
});

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'atlas-sms-service', version: '2.0.0' }));

app.get('/api/templates', (req, res) => res.json({ templates: Array.from(templates.values()) }));

app.post('/api/send', (req, res) => {
  const { templateId, contactId, phone, variables } = req.body;
  const template = templates.get(templateId);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const content = template.content.replace(/\{\{(\w+)\}\}/g, (_, k) => variables?.[k] || '');
  const message: SMSMessage = {
    id: uuidv4(),
    templateId,
    contactId,
    phone,
    content: content.slice(0, 160),
    status: 'queued',
    sentAt: null,
    deliveredAt: null
  };
  messages.set(message.id, message);

  setTimeout(() => {
    message.status = 'sent';
    message.sentAt = new Date().toISOString();
    messages.set(message.id, message);
  }, 500);

  res.status(201).json({ messageId: message.id });
});

app.get('/api/analytics', (req, res) => {
  const stats = { total: messages.size };
  res.json(stats);
});

app.listen(PORT, () => console.log(`📱 Atlas SMS Service running on port ${PORT}`));
export default app;