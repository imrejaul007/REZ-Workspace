/**
 * REZ Chat Service - Intercom Competitor
 * Live chat + AI chatbot
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4103;

app.use(express.json());

// In-memory storage
const conversations = new Map();
const messages = new Map();
const articles = new Map();
const bots = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'REZ Chat', version: '1.0.0' });
});

// Create conversation
app.post('/api/conversations', (req, res) => {
  const { userId, visitorId, email, name, metadata } = req.body;

  const conversation = {
    id: uuidv4(),
    userId,
    visitorId,
    email: email || null,
    name: name || 'Anonymous',
    status: 'open', // open, closed, pending
    assignee: null,
    tags: [],
    metadata: metadata || {},
    unread: 1,
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  conversations.set(conversation.id, conversation);

  // Create initial message if provided
  if (req.body.initialMessage) {
    const message = {
      id: uuidv4(),
      conversationId: conversation.id,
      sender: 'visitor',
      senderId: visitorId,
      content: req.body.initialMessage,
      createdAt: new Date(),
    };
    messages.set(message.id, message);
    conversation.lastMessageAt = new Date();
  }

  res.status(201).json(conversation);
});

// List conversations
app.get('/api/conversations', (req, res) => {
  const { status, assignee, page = 1, pageSize = 20 } = req.query;

  let convs = Array.from(conversations.values())
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

  if (status) {
    convs = convs.filter(c => c.status === status);
  }
  if (assignee) {
    convs = convs.filter(c => c.assignee === assignee);
  }

  const total = convs.length;
  const start = (page - 1) * pageSize;
  convs = convs.slice(start, start + pageSize);

  res.json({ conversations: convs, total, page, pageSize });
});

// Get conversation
app.get('/api/conversations/:id', (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Get messages
  const convMessages = Array.from(messages.values())
    .filter(m => m.conversationId === req.params.id)
    .sort((a, b) => a.createdAt - b.createdAt);

  res.json({ ...conversation, messages: convMessages });
});

// Update conversation
app.patch('/api/conversations/:id', (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const updated = {
    ...conversation,
    ...req.body,
    id: conversation.id,
    updatedAt: new Date(),
  };

  conversations.set(conversation.id, updated);
  res.json(updated);
});

// Send message
app.post('/api/messages', (req, res) => {
  const { conversationId, sender, senderId, content, attachments } = req.body;

  const conversation = conversations.get(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const message = {
    id: uuidv4(),
    conversationId,
    sender, // 'visitor', 'agent', 'bot'
    senderId,
    content,
    attachments: attachments || [],
    read: sender === 'visitor', // Agent messages are unread for visitor
    createdAt: new Date(),
  };

  messages.set(message.id, message);

  conversation.lastMessageAt = new Date();
  conversation.unread = sender === 'agent' ? conversation.unread + 1 : 0;
  conversations.set(conversation.id, conversation);

  res.status(201).json(message);
});

// Get messages
app.get('/api/conversations/:id/messages', (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const convMessages = Array.from(messages.values())
    .filter(m => m.conversationId === req.params.id)
    .sort((a, b) => a.createdAt - b.createdAt);

  // Mark as read
  conversation.unread = 0;
  conversations.set(conversation.id, conversation);

  res.json({ messages: convMessages });
});

// Bot response (simulated AI)
app.post('/api/bot/respond', (req, res) => {
  const { conversationId, message, knowledgeBase } = req.body;

  // Simulate AI response
  const responses = [
    "Thanks for reaching out! I'll help you with that.",
    "I understand. Let me check that for you.",
    "Great question! Here's what I found...",
    "I'm not sure about that, but I can connect you with our team.",
  ];

  const botMessage = {
    id: uuidv4(),
    conversationId,
    sender: 'bot',
    senderId: 'bot',
    content: responses[Math.floor(Math.random() * responses.length)],
    createdAt: new Date(),
  };

  messages.set(botMessage.id, botMessage);

  res.json(botMessage);
});

// Knowledge base articles
app.get('/api/articles', (req, res) => {
  const { search, category } = req.query;

  let arts = Array.from(articles.values());

  if (search) {
    const searchLower = search.toLowerCase();
    arts = arts.filter(a =>
      a.title.toLowerCase().includes(searchLower) ||
      a.content.toLowerCase().includes(searchLower)
    );
  }
  if (category) {
    arts = arts.filter(a => a.category === category);
  }

  res.json({ articles: arts });
});

app.get('/api/articles/:id', (req, res) => {
  const article = articles.get(req.params.id);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json(article);
});

app.listen(PORT, () => {
  console.log(`✅ REZ Chat running on port ${PORT}`);
});

export default app;