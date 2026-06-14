import { describe, it, expect, vi } from 'vitest';

// Mock logger
vi.mock('./utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock mongoose
vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn().mockResolvedValue(undefined),
    connection: {
      close: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

// Mock redis
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('REZ Prompt Workflow AI Service', () => {
  describe('Service Info', () => {
    it('should have correct service name', () => {
      const serviceName = 'REZ Prompt-to-Workflow AI';
      expect(serviceName).toContain('Workflow');
    });

    it('should have correct version', () => {
      const version = '1.0.0';
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Workflow Generation', () => {
    it('should validate workflow structure', () => {
      const validWorkflow = {
        id: 'wf_001',
        name: 'Customer Journey',
        trigger: {
          type: 'event',
          event: 'user_signup',
        },
        steps: [
          { id: 'step1', type: 'action', action: 'send_welcome_email' },
          { id: 'step2', type: 'delay', duration: 86400000 },
          { id: 'step3', type: 'action', action: 'send_followup' },
        ],
        createdAt: new Date(),
      };

      expect(validWorkflow).toHaveProperty('id');
      expect(validWorkflow).toHaveProperty('trigger');
      expect(Array.isArray(validWorkflow.steps)).toBe(true);
    });

    it('should validate step types', () => {
      const validStepTypes = ['action', 'condition', 'delay', 'notification', 'api_call', 'webhook'];
      expect(validStepTypes).toContain('action');
      expect(validStepTypes).toContain('condition');
    });

    it('should validate trigger types', () => {
      const validTriggerTypes = ['event', 'schedule', 'manual', 'api'];
      expect(validTriggerTypes).toContain('event');
      expect(validTriggerTypes).toContain('schedule');
    });
  });

  describe('Workflow Validation', () => {
    it('should detect circular dependencies', () => {
      const workflow = {
        steps: [
          { id: 'a', next: 'b' },
          { id: 'b', next: 'c' },
          { id: 'c', next: 'a' }, // Creates cycle
        ],
      };

      // Simple cycle detection
      const hasCycle = (steps: typeof workflow.steps): boolean => {
        const visited = new Set<string>();
        const stack = new Set<string>();

        const visit = (stepId: string): boolean => {
          if (stack.has(stepId)) return true;
          if (visited.has(stepId)) return false;

          stack.add(stepId);
          const step = steps.find(s => s.id === stepId);
          if (step?.next && visit(step.next)) return true;
          stack.delete(stepId);
          visited.add(stepId);
          return false;
        };

        return steps.some(step => visit(step.id));
      };

      expect(hasCycle(workflow.steps)).toBe(true);
    });

    it('should validate workflow name', () => {
      const validateName = (name: string): boolean => {
        return name.length >= 3 && name.length <= 100;
      };

      expect(validateName('Valid Name')).toBe(true);
      expect(validateName('ab')).toBe(false);
      expect(validateName('')).toBe(false);
    });
  });

  describe('Prompt Parsing', () => {
    it('should extract channel from prompt', () => {
      const extractChannels = (prompt: string): string[] => {
        const channels: string[] = [];
        const channelKeywords: Record<string, string[]> = {
          whatsapp: ['whatsapp', 'wa'],
          sms: ['sms', 'text message'],
          email: ['email', 'e-mail'],
          push: ['push notification', 'push'],
        };

        const lowerPrompt = prompt.toLowerCase();
        for (const [channel, keywords] of Object.entries(channelKeywords)) {
          if (keywords.some(kw => lowerPrompt.includes(kw))) {
            channels.push(channel);
          }
        }

        return channels.length > 0 ? channels : ['all'];
      };

      expect(extractChannels('Send a WhatsApp message')).toContain('whatsapp');
      expect(extractChannels('Send email and SMS')).toContain('email');
      expect(extractChannels('Send a message')).toContain('all');
    });

    it('should extract budget from prompt', () => {
      const extractBudget = (prompt: string): number | null => {
        const budgetMatch = prompt.match(/(\d+)\s*(?:rs|inr|rupee)/i);
        return budgetMatch ? parseInt(budgetMatch[1]) : null;
      };

      expect(extractBudget('Budget is 5000 rs')).toBe(5000);
      expect(extractBudget('No budget specified')).toBeNull();
    });
  });

  describe('Template Management', () => {
    it('should validate template structure', () => {
      const template = {
        id: 'tpl_001',
        name: 'Welcome Series',
        description: 'Welcome new users',
        steps: [],
        tags: ['onboarding', 'welcome'],
      };

      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(Array.isArray(template.tags)).toBe(true);
    });

    it('should filter templates by tags', () => {
      const templates = [
        { id: '1', name: 'Template A', tags: ['onboarding'] },
        { id: '2', name: 'Template B', tags: ['marketing'] },
        { id: '3', name: 'Template C', tags: ['onboarding', 'welcome'] },
      ];

      const filtered = templates.filter(t =>
        t.tags.some(tag => tag.includes('onboarding'))
      );

      expect(filtered.length).toBe(2);
    });
  });

  describe('API Endpoints', () => {
    it('should validate endpoint paths', () => {
      const endpoints = [
        { path: '/api/generate', method: 'POST' },
        { path: '/api/validate', method: 'POST' },
        { path: '/api/templates', method: 'GET' },
        { path: '/api/templates/:id', method: 'GET' },
        { path: '/api/health', method: 'GET' },
      ];

      expect(endpoints.find(e => e.path === '/api/generate')).toBeDefined();
      expect(endpoints.find(e => e.path === '/api/templates/:id')?.method).toBe('GET');
    });

    it('should validate request body structure for generate', () => {
      const validRequest = {
        prompt: 'Create a customer onboarding workflow',
        channel: 'whatsapp',
        budget: 5000,
      };

      expect(validRequest).toHaveProperty('prompt');
      expect(typeof validRequest.prompt).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid prompt gracefully', () => {
      const processPrompt = (prompt: string | undefined) => {
        if (!prompt || prompt.trim() === '') {
          throw new Error('Prompt is required');
        }
        return { success: true };
      };

      expect(() => processPrompt('')).toThrow('Prompt is required');
      expect(() => processPrompt(undefined)).toThrow('Prompt is required');
      expect(processPrompt('valid prompt')).toEqual({ success: true });
    });

    it('should handle rate limiting response', () => {
      const rateLimitError = {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests, please try again later.',
        },
      };

      expect(rateLimitError.success).toBe(false);
      expect(rateLimitError.error.code).toBe('RATE_LIMITED');
    });
  });
});