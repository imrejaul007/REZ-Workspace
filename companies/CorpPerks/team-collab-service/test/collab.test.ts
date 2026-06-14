import {
  generateChannelId,
  generateMessageId,
  generateAnnouncementId,
  generateMeetingId,
  createChannelSchema,
  createMessageSchema,
  createAnnouncementSchema,
  createMeetingSchema,
  createActionItemSchema,
} from '../src/types/index';

describe('Team Collaboration Service - Type Tests', () => {
  describe('ID Generation', () => {
    test('generateChannelId returns valid format', () => {
      const id = generateChannelId();
      expect(id).toMatch(/^CHAN-[A-Z0-9]+$/i);
    });

    test('generateMessageId returns valid format', () => {
      const id = generateMessageId();
      expect(id).toMatch(/^MSG-[A-Z0-9]+$/i);
    });

    test('generateAnnouncementId returns valid format', () => {
      const id = generateAnnouncementId();
      expect(id).toMatch(/^ANNC-[A-Z0-9]+$/i);
    });

    test('generateMeetingId returns valid format', () => {
      const id = generateMeetingId();
      expect(id).toMatch(/^MEET-[A-Z0-9]+$/i);
    });

    test('IDs are unique', () => {
      const ids = new Set([
        generateChannelId(),
        generateChannelId(),
        generateChannelId(),
        generateMessageId(),
        generateMessageId(),
        generateAnnouncementId(),
        generateMeetingId(),
      ]);
      expect(ids.size).toBe(7);
    });
  });

  describe('Channel Schema Validation', () => {
    test('valid channel data passes validation', () => {
      const data = {
        name: 'general',
        description: 'General discussion',
        type: 'public',
        companyId: 'COMP-123',
        members: ['user-1', 'user-2'],
      };

      const result = createChannelSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('channel without optional fields passes validation', () => {
      const data = {
        name: 'general',
        type: 'public',
        companyId: 'COMP-123',
      };

      const result = createChannelSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('channel without required fields fails validation', () => {
      const data = {
        name: 'general',
      };

      const result = createChannelSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('channel with invalid type fails validation', () => {
      const data = {
        name: 'general',
        type: 'invalid',
        companyId: 'COMP-123',
      };

      const result = createChannelSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Message Schema Validation', () => {
    test('valid message data passes validation', () => {
      const data = {
        channelId: 'CHAN-123',
        senderId: 'user-1',
        senderName: 'John Doe',
        content: 'Hello, world!',
      };

      const result = createMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('message without required fields fails validation', () => {
      const data = {
        channelId: 'CHAN-123',
        content: 'Hello, world!',
      };

      const result = createMessageSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('message with mentions passes validation', () => {
      const data = {
        channelId: 'CHAN-123',
        senderId: 'user-1',
        senderName: 'John Doe',
        content: 'Hey @Jane, check this out!',
        mentions: ['user-2'],
      };

      const result = createMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('empty content fails validation', () => {
      const data = {
        channelId: 'CHAN-123',
        senderId: 'user-1',
        senderName: 'John Doe',
        content: '',
      };

      const result = createMessageSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('content exceeding max length fails validation', () => {
      const data = {
        channelId: 'CHAN-123',
        senderId: 'user-1',
        senderName: 'John Doe',
        content: 'x'.repeat(10001),
      };

      const result = createMessageSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Announcement Schema Validation', () => {
    test('valid announcement data passes validation', () => {
      const data = {
        title: 'New Policy Update',
        content: 'We are implementing a new remote work policy...',
        category: 'policy',
        companyId: 'COMP-123',
        authorId: 'user-1',
        authorName: 'HR Manager',
      };

      const result = createAnnouncementSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('announcement with all optional fields passes validation', () => {
      const data = {
        title: 'Company Event',
        content: 'Join us for the annual party!',
        summary: 'Annual company celebration',
        category: 'event',
        priority: 'high',
        departmentIds: ['dept-1', 'dept-2'],
        companyId: 'COMP-123',
        authorId: 'user-1',
        authorName: 'Event Team',
        scheduledFor: new Date('2026-06-15'),
        expiresAt: new Date('2026-06-20'),
      };

      const result = createAnnouncementSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('announcement with invalid category fails validation', () => {
      const data = {
        title: 'Test',
        content: 'Test content',
        category: 'invalid',
        companyId: 'COMP-123',
        authorId: 'user-1',
        authorName: 'Test',
      };

      const result = createAnnouncementSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('announcement with invalid priority fails validation', () => {
      const data = {
        title: 'Test',
        content: 'Test content',
        category: 'company',
        priority: 'super-urgent',
        companyId: 'COMP-123',
        authorId: 'user-1',
        authorName: 'Test',
      };

      const result = createAnnouncementSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Meeting Schema Validation', () => {
    test('valid meeting data passes validation', () => {
      const data = {
        title: 'Sprint Planning',
        description: 'Q2 sprint planning session',
        hostId: 'user-1',
        hostName: 'John Doe',
        attendees: ['user-1', 'user-2', 'user-3'],
        startTime: new Date('2026-06-01T10:00:00Z'),
        endTime: new Date('2026-06-01T11:00:00Z'),
      };

      const result = createMeetingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('meeting with meeting type passes validation', () => {
      const data = {
        title: 'Team Standup',
        hostId: 'user-1',
        hostName: 'John Doe',
        attendees: ['user-1', 'user-2'],
        startTime: new Date('2026-06-01T09:00:00Z'),
        endTime: new Date('2026-06-01T09:15:00Z'),
        meetingType: 'video',
        meetingLink: 'https://meet.example.com/standup',
      };

      const result = createMeetingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('meeting without attendees fails validation', () => {
      const data = {
        title: 'Solo Meeting',
        hostId: 'user-1',
        hostName: 'John Doe',
        attendees: [],
        startTime: new Date('2026-06-01T10:00:00Z'),
        endTime: new Date('2026-06-01T11:00:00Z'),
      };

      const result = createMeetingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('meeting with invalid type fails validation', () => {
      const data = {
        title: 'Test Meeting',
        hostId: 'user-1',
        hostName: 'John Doe',
        attendees: ['user-1'],
        startTime: new Date('2026-06-01T10:00:00Z'),
        endTime: new Date('2026-06-01T11:00:00Z'),
        meetingType: 'teleport',
      };

      const result = createMeetingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Action Item Schema Validation', () => {
    test('valid action item passes validation', () => {
      const data = {
        task: 'Complete the design mockups',
        assigneeId: 'user-1',
        assigneeName: 'John Doe',
        dueDate: new Date('2026-06-05'),
      };

      const result = createActionItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('action item without optional dueDate passes validation', () => {
      const data = {
        task: 'Review PR',
        assigneeId: 'user-1',
        assigneeName: 'Jane Doe',
      };

      const result = createActionItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('action item without required fields fails validation', () => {
      const data = {
        task: 'Some task',
      };

      const result = createActionItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('empty task fails validation', () => {
      const data = {
        task: '',
        assigneeId: 'user-1',
        assigneeName: 'John Doe',
      };

      const result = createActionItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Channel Type Enums', () => {
  test('valid channel types are recognized', () => {
    const validTypes = ['public', 'private', 'project', 'direct'];
    validTypes.forEach((type) => {
      const data = {
        name: 'test',
        type,
        companyId: 'COMP-123',
      };
      const result = createChannelSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

describe('Message Type Enums', () => {
  test('valid message types are recognized', () => {
    const validTypes = ['text', 'file', 'image', 'system', 'poll'];
    validTypes.forEach((type) => {
      const data = {
        channelId: 'CHAN-123',
        senderId: 'user-1',
        senderName: 'John',
        content: 'Test',
        messageType: type,
      };
      const result = createMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

describe('Announcement Category Enums', () => {
  test('valid announcement categories are recognized', () => {
    const validCategories = ['hr', 'company', 'team', 'event', 'policy', 'milestone'];
    validCategories.forEach((category) => {
      const data = {
        title: 'Test',
        content: 'Content',
        category,
        companyId: 'COMP-123',
        authorId: 'user-1',
        authorName: 'Author',
      };
      const result = createAnnouncementSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
