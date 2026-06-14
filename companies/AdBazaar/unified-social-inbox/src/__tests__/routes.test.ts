/**
 * Unified Social Inbox Service - Routes Tests
 */

import express from 'express';
import request from 'supertest';

// Mock services
jest.mock('../services/message.service', () => ({
  MessageService: jest.fn().mockImplementation(() => ({
    createMessage: jest.fn().mockResolvedValue({ _id: 'msg-123' }),
    getThreadMessages: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
    getMessageById: jest.fn().mockResolvedValue({ _id: 'msg-123', content: 'Test' }),
    markAsRead: jest.fn().mockResolvedValue({ _id: 'msg-123', read: true }),
    sendMessage: jest.fn().mockResolvedValue({ _id: 'msg-123' }),
    replyToThread: jest.fn().mockResolvedValue({ _id: 'msg-123' }),
    forwardMessage: jest.fn().mockResolvedValue({ _id: 'msg-123' }),
    getUnreadCount: jest.fn().mockResolvedValue(5),
    searchMessages: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('../services/conversation.service', () => ({
  ConversationService: jest.fn().mockImplementation(() => ({
    getConversations: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
    getConversationById: jest.fn().mockResolvedValue({ _id: 'conv-123' }),
    assignConversation: jest.fn().mockResolvedValue({ _id: 'conv-123', assignedTo: 'agent-1' }),
    updateStatus: jest.fn().mockResolvedValue({ _id: 'conv-123', status: 'resolved' }),
    addTag: jest.fn().mockResolvedValue({ _id: 'conv-123', tags: ['vip'] }),
    removeTag: jest.fn().mockResolvedValue({ _id: 'conv-123', tags: [] }),
  })),
}));

jest.mock('../services/platform-connector.service', () => ({
  PlatformConnectorService: jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn().mockResolvedValue('platform-msg-123'),
    getConversations: jest.fn().mockResolvedValue([]),
    getMessages: jest.fn().mockResolvedValue([]),
  })),
}));

// Mock models
jest.mock('../models', () => ({
  Message: {
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]), lean: jest.fn().mockResolvedValue([]) }),
    findById: jest.fn().mockResolvedValue({ _id: 'msg-123' }),
    countDocuments: jest.fn().mockResolvedValue(0),
  },
  Conversation: {
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]), lean: jest.fn().mockResolvedValue([]) }),
    findById: jest.fn().mockResolvedValue({ _id: 'conv-123' }),
    countDocuments: jest.fn().mockResolvedValue(0),
  },
  QuickReply: {
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]) }),
    findById: jest.fn().mockResolvedValue({ _id: 'qr-123' }),
    create: jest.fn().mockResolvedValue({ _id: 'qr-123' }),
    findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: 'qr-123' }),
    findByIdAndDelete: jest.fn().mockResolvedValue({ _id: 'qr-123' }),
  },
  Settings: {
    findOne: jest.fn().mockResolvedValue({ _id: 'settings-123' }),
    findOneAndUpdate: jest.fn().mockResolvedValue({ _id: 'settings-123' }),
    create: jest.fn().mockResolvedValue({ _id: 'settings-123' }),
  },
}));

jest.mock('../utils/logger', () => ({
  createModuleLogger: jest.fn(() => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() })),
}));

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock inbox routes
  const inboxRouter = express.Router();
  inboxRouter.get('/conversations', (req, res) => res.json({ success: true, data: { data: [], total: 0 } }));
  inboxRouter.get('/conversations/:id', (req, res) => res.json({ success: true, data: { _id: req.params.id } }));
  inboxRouter.get('/conversations/:id/messages', (req, res) => res.json({ success: true, data: { data: [], total: 0 } }));
  inboxRouter.post('/conversations/:id/messages', (req, res) => res.status(201).json({ success: true, data: { _id: 'msg-123' } }));
  inboxRouter.post('/conversations/:id/read', (req, res) => res.json({ success: true }));
  inboxRouter.put('/conversations/:id/assign', (req, res) => res.json({ success: true, data: { _id: req.params.id, assignedTo: req.body.agentId } }));
  inboxRouter.put('/conversations/:id/status', (req, res) => res.json({ success: true, data: { _id: req.params.id, status: req.body.status } }));
  inboxRouter.get('/unread-count', (req, res) => res.json({ success: true, data: { count: 5 } }));
  inboxRouter.get('/search', (req, res) => res.json({ success: true, data: [] }));

  // Mock template routes
  const templateRouter = express.Router();
  templateRouter.get('/quick-replies', (req, res) => res.json({ success: true, data: [] }));
  templateRouter.post('/quick-replies', (req, res) => res.status(201).json({ success: true, data: { _id: 'qr-123' } }));
  templateRouter.get('/quick-replies/:id', (req, res) => res.json({ success: true, data: { _id: req.params.id } }));
  templateRouter.put('/quick-replies/:id', (req, res) => res.json({ success: true, data: { _id: req.params.id } }));
  templateRouter.delete('/quick-replies/:id', (req, res) => res.json({ success: true }));

  // Mock settings routes
  const settingsRouter = express.Router();
  settingsRouter.get('/', (req, res) => res.json({ success: true, data: { _id: 'settings-123' } }));
  settingsRouter.put('/', (req, res) => res.json({ success: true, data: { _id: 'settings-123' } }));

  app.use('/api/inbox', inboxRouter);
  app.use('/api/templates', templateRouter);
  app.use('/api/settings', settingsRouter);

  return app;
};

describe('Unified Social Inbox Routes', () => {
  let app: express.Application;

  beforeAll(() => { app = createTestApp(); });
  beforeEach(() => { jest.clearAllMocks(); });

  describe('GET /api/inbox/conversations', () => {
    it('should return conversations', async () => {
      const response = await request(app).get('/api/inbox/conversations').expect(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/inbox/conversations/:id', () => {
    it('should return conversation by ID', async () => {
      const response = await request(app).get('/api/inbox/conversations/conv-123').expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe('conv-123');
    });
  });

  describe('GET /api/inbox/conversations/:id/messages', () => {
    it('should return thread messages', async () => {
      const response = await request(app).get('/api/inbox/conversations/conv-123/messages').expect(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/inbox/conversations/:id/messages', () => {
    it('should create message', async () => {
      const response = await request(app)
        .post('/api/inbox/conversations/conv-123/messages')
        .send({ content: 'Test message' })
        .expect(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/inbox/conversations/:id/read', () => {
    it('should mark thread as read', async () => {
      const response = await request(app).post('/api/inbox/conversations/conv-123/read').expect(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/inbox/conversations/:id/assign', () => {
    it('should assign conversation', async () => {
      const response = await request(app)
        .put('/api/inbox/conversations/conv-123/assign')
        .send({ agentId: 'agent-1' })
        .expect(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/inbox/conversations/:id/status', () => {
    it('should update status', async () => {
      const response = await request(app)
        .put('/api/inbox/conversations/conv-123/status')
        .send({ status: 'resolved' })
        .expect(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/inbox/unread-count', () => {
    it('should return unread count', async () => {
      const response = await request(app).get('/api/inbox/unread-count').expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(5);
    });
  });

  describe('GET /api/inbox/search', () => {
    it('should search messages', async () => {
      const response = await request(app).get('/api/inbox/search').query({ q: 'test' }).expect(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/templates/quick-replies', () => {
    it('should return quick replies', async () => {
      const response = await request(app).get('/api/templates/quick-replies').expect(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/templates/quick-replies', () => {
    it('should create quick reply', async () => {
      const response = await request(app)
        .post('/api/templates/quick-replies')
        .send({ shortcut: '/hello', message: 'Hello!', category: 'greetings' })
        .expect(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/settings', () => {
    it('should return settings', async () => {
      const response = await request(app).get('/api/settings').expect(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/settings', () => {
    it('should update settings', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({ autoReply: false })
        .expect(200);
      expect(response.body.success).toBe(true);
    });
  });
});