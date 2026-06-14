/**
 * Unit Tests for REZ Workspace Models
 */

import { User, Workspace, Channel, Message, Meeting, Task } from '../../src/models';

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid user', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.status).toBe('offline');
    });

    it('should require name field', () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
      });

      const error = user.validateSync();
      expect(error?.errors.name).toBeDefined();
    });

    it('should require email field', () => {
      const user = new User({
        name: 'Test User',
        password: 'password123',
      });

      const error = user.validateSync();
      expect(error?.errors.email).toBeDefined();
    });

    it('should enforce unique email', async () => {
      const user1 = new User({
        name: 'User 1',
        email: 'duplicate@example.com',
        password: 'password123',
      });

      await user1.save();

      const user2 = new User({
        name: 'User 2',
        email: 'duplicate@example.com',
        password: 'password123',
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should lowercase email', () => {
      const user = new User({
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });

      expect(user.email).toBe('test@example.com');
    });

    it('should default status to offline', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(user.status).toBe('offline');
    });

    it('should accept valid status values', () => {
      const statuses = ['online', 'away', 'busy', 'offline'];
      statuses.forEach(status => {
        const user = new User({
          name: 'Test User',
          email: `test-${status}@example.com`,
          password: 'password123',
          status,
        });
        expect(user.status).toBe(status);
      });
    });

    it('should reject invalid status values', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        status: 'invalid_status',
      });

      const error = user.validateSync();
      expect(error?.errors.status).toBeDefined();
    });
  });
});

describe('Workspace Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid workspace', () => {
      const workspace = new Workspace({
        name: 'Test Workspace',
        owner_id: '507f1f77bcf86cd799439011',
        members: [],
      });

      expect(workspace.name).toBe('Test Workspace');
      expect(workspace.settings.default_channel_visibility).toBe('public');
    });

    it('should require name field', () => {
      const workspace = new Workspace({
        owner_id: '507f1f77bcf86cd799439011',
      });

      const error = workspace.validateSync();
      expect(error?.errors.name).toBeDefined();
    });

    it('should have default settings', () => {
      const workspace = new Workspace({
        name: 'Test Workspace',
        owner_id: '507f1f77bcf86cd799439011',
      });

      expect(workspace.settings.allow_guest_access).toBe(true);
      expect(workspace.settings.notification_preferences.email).toBe(true);
    });

    it('should accept custom settings', () => {
      const workspace = new Workspace({
        name: 'Test Workspace',
        owner_id: '507f1f77bcf86cd799439011',
        settings: {
          allow_guest_access: false,
          default_channel_visibility: 'private',
          notification_preferences: {
            email: false,
            push: true,
            desktop: true,
            mentions_only: true,
          },
        },
      });

      expect(workspace.settings.allow_guest_access).toBe(false);
      expect(workspace.settings.default_channel_visibility).toBe('private');
    });
  });
});

describe('Channel Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid channel', () => {
      const channel = new Channel({
        workspace_id: '507f1f77bcf86cd799439011',
        name: 'general',
        created_by: '507f1f77bcf86cd799439012',
      });

      expect(channel.name).toBe('general');
      expect(channel.type).toBe('public');
    });

    it('should require workspace_id', () => {
      const channel = new Channel({
        name: 'general',
        created_by: '507f1f77bcf86cd799439012',
      });

      const error = channel.validateSync();
      expect(error?.errors.workspace_id).toBeDefined();
    });

    it('should accept valid channel types', () => {
      const types = ['public', 'private', 'direct', 'announcement'];
      types.forEach(type => {
        const channel = new Channel({
          workspace_id: '507f1f77bcf86cd799439011',
          name: `channel-${type}`,
          type,
          created_by: '507f1f77bcf86cd799439012',
        });
        expect(channel.type).toBe(type);
      });
    });

    it('should default to not archived', () => {
      const channel = new Channel({
        workspace_id: '507f1f77bcf86cd799439011',
        name: 'general',
        created_by: '507f1f77bcf86cd799439012',
      });

      expect(channel.is_archived).toBe(false);
    });
  });
});

describe('Message Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid message', () => {
      const message = new Message({
        channel_id: '507f1f77bcf86cd799439011',
        sender_id: '507f1f77bcf86cd799439012',
        content: 'Hello, World!',
      });

      expect(message.content).toBe('Hello, World!');
      expect(message.is_pinned).toBe(false);
      expect(message.is_deleted).toBe(false);
    });

    it('should require content', () => {
      const message = new Message({
        channel_id: '507f1f77bcf86cd799439011',
        sender_id: '507f1f77bcf86cd799439012',
      });

      const error = message.validateSync();
      expect(error?.errors.content).toBeDefined();
    });

    it('should support reactions', () => {
      const message = new Message({
        channel_id: '507f1f77bcf86cd799439011',
        sender_id: '507f1f77bcf86cd799439012',
        content: 'Hello!',
        reactions: [
          { emoji: '👍', user_ids: ['user1', 'user2'], count: 2 },
          { emoji: '❤️', user_ids: ['user1'], count: 1 },
        ],
      });

      expect(message.reactions.length).toBe(2);
      expect(message.reactions[0].emoji).toBe('👍');
    });

    it('should support attachments', () => {
      const message = new Message({
        channel_id: '507f1f77bcf86cd799439011',
        sender_id: '507f1f77bcf86cd799439012',
        content: 'Check this file!',
        attachments: [
          { id: 'att-1', type: 'file', url: 'https://example.com/file.pdf', name: 'document.pdf' },
        ],
      });

      expect(message.attachments.length).toBe(1);
      expect(message.attachments[0].type).toBe('file');
    });
  });
});

describe('Meeting Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid meeting', () => {
      const now = new Date();
      const meeting = new Meeting({
        title: 'Team Standup',
        host_id: '507f1f77bcf86cd799439011',
        start_time: now,
        end_time: new Date(now.getTime() + 3600000),
        duration: 60,
      });

      expect(meeting.title).toBe('Team Standup');
      expect(meeting.status).toBe('scheduled');
      expect(meeting.timezone).toBe('Asia/Kolkata');
    });

    it('should require title', () => {
      const now = new Date();
      const meeting = new Meeting({
        host_id: '507f1f77bcf86cd799439011',
        start_time: now,
        end_time: new Date(now.getTime() + 3600000),
        duration: 60,
      });

      const error = meeting.validateSync();
      expect(error?.errors.title).toBeDefined();
    });

    it('should support recurring meetings', () => {
      const now = new Date();
      const meeting = new Meeting({
        title: 'Weekly Standup',
        host_id: '507f1f77bcf86cd799439011',
        start_time: now,
        end_time: new Date(now.getTime() + 3600000),
        duration: 60,
        is_recurring: true,
        recurrence_rule: 'RRULE:FREQ=WEEKLY;BYDAY=MO',
      });

      expect(meeting.is_recurring).toBe(true);
      expect(meeting.recurrence_rule).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO');
    });

    it('should support meeting notes', () => {
      const now = new Date();
      const meeting = new Meeting({
        title: 'Team Meeting',
        host_id: '507f1f77bcf86cd799439011',
        start_time: now,
        end_time: new Date(now.getTime() + 3600000),
        duration: 60,
        notes: {
          summary: 'Discussed project status',
          action_items: [
            { id: '1', title: 'Complete task', status: 'pending', priority: 'high' },
          ],
          key_decisions: ['Decision 1'],
          topics_discussed: ['Topic 1'],
          generated_by_ai: true,
        },
      });

      expect(meeting.notes?.summary).toBe('Discussed project status');
      expect(meeting.notes?.generated_by_ai).toBe(true);
    });
  });
});

describe('Task Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid task', () => {
      const task = new Task({
        title: 'Implement feature',
        workspace_id: '507f1f77bcf86cd799439011',
        reporter_id: '507f1f77bcf86cd799439012',
        priority: 'high',
        status: 'todo',
      });

      expect(task.title).toBe('Implement feature');
      expect(task.priority).toBe('high');
      expect(task.status).toBe('todo');
    });

    it('should require title', () => {
      const task = new Task({
        workspace_id: '507f1f77bcf86cd799439011',
        reporter_id: '507f1f77bcf86cd799439012',
      });

      const error = task.validateSync();
      expect(error?.errors.title).toBeDefined();
    });

    it('should support subtasks', () => {
      const task = new Task({
        title: 'Complex Task',
        workspace_id: '507f1f77bcf86cd799439011',
        reporter_id: '507f1f77bcf86cd799439012',
        subtasks: [
          { id: 'st-1', title: 'Subtask 1', completed: false },
          { id: 'st-2', title: 'Subtask 2', completed: true },
        ],
      });

      expect(task.subtasks.length).toBe(2);
      expect(task.subtasks[1].completed).toBe(true);
    });

    it('should support labels', () => {
      const task = new Task({
        title: 'Task with labels',
        workspace_id: '507f1f77bcf86cd799439011',
        reporter_id: '507f1f77bcf86cd799439012',
        labels: ['backend', 'urgent', 'feature'],
      });

      expect(task.labels).toContain('backend');
      expect(task.labels).toContain('urgent');
    });

    it('should support comments', () => {
      const task = new Task({
        title: 'Task with comments',
        workspace_id: '507f1f77bcf86cd799439011',
        reporter_id: '507f1f77bcf86cd799439012',
        comments: [
          { id: 'c-1', user_id: '507f1f77bcf86cd799439013', content: 'Looks good!', created_at: new Date() },
        ],
      });

      expect(task.comments.length).toBe(1);
      expect(task.comments[0].content).toBe('Looks good!');
    });
  });
});