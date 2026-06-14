/**
 * Unified Social Inbox Service - Service Tests
 */

import { MessageService } from '../services/message.service';
import { ConversationService } from '../services/conversation.service';
import { PlatformConnectorService } from '../services/platform-connector.service';

// Mock models
jest.mock('../models', () => ({
  Message: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateMany: jest.fn(),
    countDocuments: jest.fn(),
  },
  Conversation: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe('MessageService', () => {
  let service: MessageService;
  let mockPlatformConnector: jest.Mocked<PlatformConnectorService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformConnector = {
      sendMessage: jest.fn(),
      getConversations: jest.fn(),
      getMessages: jest.fn(),
    } as any;
    service = new MessageService(mockPlatformConnector);
  });

  describe('createMessage', () => {
    it('should create message and update conversation', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockConversationUpdate = jest.fn().mockResolvedValue(true);

      jest.spyOn(require('../models'), 'Message').mockImplementation(() => ({
        save: mockSave,
      }));
      jest.spyOn(require('../models'), 'Conversation').mockImplementation(() => ({
        findByIdAndUpdate: mockConversationUpdate,
      }));

      const result = await service.createMessage({
        conversationId: 'conv-123',
        platform: 'instagram',
        platformMessageId: 'ig-msg-123',
        sender: { type: 'user', platformUserId: 'user-123' },
        content: 'Test message',
      });

      expect(result).toBeDefined();
    });
  });

  describe('getThreadMessages', () => {
    it('should return paginated messages', async () => {
      const mockMessages = [
        { _id: 'msg-1', content: 'Message 1' },
        { _id: 'msg-2', content: 'Message 2' },
      ];

      const Message = require('../models').Message;
      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockMessages),
        lean: jest.fn().mockResolvedValue(mockMessages),
      });
      Message.countDocuments.mockResolvedValue(10);
      Message.updateMany.mockResolvedValue({ modifiedCount: 2 });

      const result = await service.getThreadMessages('conv-123', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getMessageById', () => {
    it('should return message by ID', async () => {
      const mockMessage = { _id: 'msg-123', content: 'Test' };
      const Message = require('../models').Message;
      Message.findById.mockResolvedValue(mockMessage);

      const result = await service.getMessageById('msg-123');

      expect(result).toEqual(mockMessage);
    });

    it('should return null for non-existent message', async () => {
      const Message = require('../models').Message;
      Message.findById.mockResolvedValue(null);

      const result = await service.getMessageById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      const mockMessage = { _id: 'msg-123', read: true };
      const Message = require('../models').Message;
      const Conversation = require('../models').Conversation;
      Message.findByIdAndUpdate.mockResolvedValue(mockMessage);
      Conversation.findByIdAndUpdate.mockResolvedValue(true);

      const result = await service.markAsRead('msg-123');

      expect(result?.read).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const Message = require('../models').Message;
      Message.countDocuments.mockResolvedValue(5);

      const result = await service.getUnreadCount('conv-123');

      expect(result).toBe(5);
    });
  });

  describe('searchMessages', () => {
    it('should search messages by content', async () => {
      const mockConversations = [{ _id: 'conv-1' }, { _id: 'conv-2' }];
      const mockMessages = [{ _id: 'msg-1', content: 'Found message' }];

      const Conversation = require('../models').Conversation;
      const Message = require('../models').Message;
      Conversation.find.mockResolvedValue(mockConversations);
      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockMessages),
        lean: jest.fn().mockResolvedValue(mockMessages),
      });

      const result = await service.searchMessages('account-123', 'found');

      expect(result).toHaveLength(1);
    });
  });
});

describe('ConversationService', () => {
  let service: ConversationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConversationService();
  });

  describe('getConversations', () => {
    it('should return paginated conversations', async () => {
      const mockConversations = [
        { _id: 'conv-1', status: 'open' },
        { _id: 'conv-2', status: 'open' },
      ];

      const Conversation = require('../models').Conversation;
      Conversation.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockConversations),
        lean: jest.fn().mockResolvedValue(mockConversations),
      });
      Conversation.countDocuments.mockResolvedValue(10);

      const result = await service.getConversations('account-123', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(10);
    });
  });

  describe('assignConversation', () => {
    it('should assign conversation to agent', async () => {
      const mockConversation = { _id: 'conv-123', assignedTo: 'agent-1' };
      const Conversation = require('../models').Conversation;
      Conversation.findByIdAndUpdate.mockResolvedValue(mockConversation);

      const result = await service.assignConversation('conv-123', 'agent-1');

      expect(result?.assignedTo).toBe('agent-1');
    });
  });

  describe('updateStatus', () => {
    it('should update conversation status', async () => {
      const mockConversation = { _id: 'conv-123', status: 'resolved' };
      const Conversation = require('../models').Conversation;
      Conversation.findByIdAndUpdate.mockResolvedValue(mockConversation);

      const result = await service.updateStatus('conv-123', 'resolved');

      expect(result?.status).toBe('resolved');
    });
  });
});