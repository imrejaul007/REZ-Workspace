import {
  validateOrThrow,
  notificationPayloadSchema,
  createTemplateSchema,
  optOutSchema,
} from '../src/utils/validators';

describe('Validators', () => {
  describe('notificationPayloadSchema', () => {
    it('should validate a valid notification payload', () => {
      const payload = {
        templateId: 'welcome-email',
        recipient: {
          email: 'test@example.com',
          channels: ['email'],
        },
        variables: {
          name: 'John',
        },
        priority: 'normal',
      };

      const result = validateOrThrow(notificationPayloadSchema, payload);
      expect(result.templateId).toBe('welcome-email');
      expect(result.recipient.email).toBe('test@example.com');
      expect(result.recipient.channels).toContain('email');
    });

    it('should reject invalid email', () => {
      const payload = {
        templateId: 'welcome-email',
        recipient: {
          email: 'invalid-email',
          channels: ['email'],
        },
        variables: {},
      };

      expect(() => validateOrThrow(notificationPayloadSchema, payload)).toThrow();
    });

    it('should reject empty channels', () => {
      const payload = {
        templateId: 'welcome-email',
        recipient: {
          email: 'test@example.com',
          channels: [],
        },
        variables: {},
      };

      expect(() => validateOrThrow(notificationPayloadSchema, payload)).toThrow();
    });

    it('should validate phone number format', () => {
      const payload = {
        templateId: 'sms-notification',
        recipient: {
          phone: '+12025551234',
          channels: ['sms'],
        },
        variables: {},
      };

      const result = validateOrThrow(notificationPayloadSchema, payload);
      expect(result.recipient.phone).toBe('+12025551234');
    });

    it('should set default priority', () => {
      const payload = {
        templateId: 'welcome-email',
        recipient: {
          email: 'test@example.com',
          channels: ['email'],
        },
        variables: {},
      };

      const result = validateOrThrow(notificationPayloadSchema, payload);
      expect(result.priority).toBe('normal');
    });
  });

  describe('createTemplateSchema', () => {
    it('should validate a valid template', () => {
      const template = {
        name: 'test-template',
        description: 'A test template',
        channel: 'email',
        category: 'test',
        content: {
          subject: 'Hello {{name}}',
          body: 'Welcome {{name}}!',
        },
      };

      const result = validateOrThrow(createTemplateSchema, template);
      expect(result.name).toBe('test-template');
      expect(result.channel).toBe('email');
      expect(result.isActive).toBe(true);
    });

    it('should reject invalid channel', () => {
      const template = {
        name: 'test-template',
        description: 'A test template',
        channel: 'invalid-channel',
        category: 'test',
        content: {
          body: 'Hello',
        },
      };

      expect(() => validateOrThrow(createTemplateSchema, template)).toThrow();
    });
  });

  describe('optOutSchema', () => {
    it('should validate opt-out payload', () => {
      const optOut = {
        userId: 'user-123',
        channel: 'email',
        reason: 'User requested unsubscribe',
      };

      const result = validateOrThrow(optOutSchema, optOut);
      expect(result.userId).toBe('user-123');
      expect(result.channel).toBe('email');
    });

    it('should accept valid channel', () => {
      const channels = ['email', 'sms', 'whatsapp', 'push'];

      for (const channel of channels) {
        const optOut = {
          userId: 'user-123',
          channel,
        };

        const result = validateOrThrow(optOutSchema, optOut);
        expect(result.channel).toBe(channel);
      }
    });
  });
});
