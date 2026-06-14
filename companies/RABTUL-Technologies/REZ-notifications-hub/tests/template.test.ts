import Handlebars from 'handlebars';
import { NotificationTemplate, TemplateContent } from '../src/types';

// Mock template service for unit testing
describe('Template Rendering', () => {
  // Simple render function for testing
  const renderTemplate = (
    content: string,
    variables: Record<string, string>
  ): string => {
    const template = Handlebars.compile(content);
    return template(variables);
  };

  describe('Basic Variable Substitution', () => {
    it('should replace single variable', () => {
      const template = 'Hello {{name}}!';
      const variables = { name: 'World' };
      const result = renderTemplate(template, variables);
      expect(result).toBe('Hello World!');
    });

    it('should replace multiple variables', () => {
      const template = '{{greeting}} {{name}}, you have {{count}} messages.';
      const variables = { greeting: 'Hi', name: 'John', count: '5' };
      const result = renderTemplate(template, variables);
      expect(result).toBe('Hi John, you have 5 messages.');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, your order #{{orderId}} is ready.';
      const variables = { name: 'Jane' };
      const result = renderTemplate(template, variables);
      expect(result).toBe('Hello Jane, your order # is ready.');
    });

    it('should render conditional blocks', () => {
      const template = '{{#if discount}}Use code: {{discount}}{{/if}}';
      const withDiscount = { discount: 'SAVE20' };
      const withoutDiscount = {};

      expect(renderTemplate(template, withDiscount)).toBe('Use code: SAVE20');
      expect(renderTemplate(template, withoutDiscount)).toBe('');
    });
  });

  describe('Helper Functions', () => {
    it('should uppercase text', () => {
      Handlebars.registerHelper('uppercase', (str: string) =>
        str ? str.toUpperCase() : ''
      );

      const template = '{{uppercase name}}';
      const result = renderTemplate(template, { name: 'hello' });
      expect(result).toBe('HELLO');
    });

    it('should truncate long text', () => {
      Handlebars.registerHelper('truncate', (str: string, length: number) => {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + '...' : str;
      });

      const template = '{{truncate message 10}}';
      const result = renderTemplate(template, { message: 'This is a very long message' });
      expect(result).toBe('This is a ...');
    });

    it('should format currency', () => {
      Handlebars.registerHelper('formatCurrency', (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount);
      });

      const template = '{{formatCurrency amount}}';
      const result = renderTemplate(template, { amount: 99.99 });
      expect(result).toBe('$99.99');
    });
  });

  describe('Email Content Parsing', () => {
    it('should parse subject and body', () => {
      const content = `Subject: Welcome {{name}}!

Hi {{name}},

Welcome to our platform. Click here: {{actionUrl}}

Best,
Team`;

      const subjectMatch = content.match(/^Subject:\s*(.+?)\n/i);
      const bodyMatch = content.match(/\n\n([\s\S]+)$/);

      expect(subjectMatch?.[1]).toBe('Welcome {{name}}!');
      expect(bodyMatch?.[1]).toBe(`Hi {{name}},

Welcome to our platform. Click here: {{actionUrl}}

Best,
Team`);
    });
  });

  describe('Variable Validation', () => {
    const validateVariables = (
      template: NotificationTemplate,
      provided: Record<string, string>
    ): { valid: boolean; missing: string[] } => {
      const missing: string[] = [];

      for (const variable of template.variables) {
        if (variable.required && !provided[variable.name]) {
          missing.push(variable.name);
        }
      }

      return {
        valid: missing.length === 0,
        missing,
      };
    };

    it('should pass when all required variables are provided', () => {
      const template: NotificationTemplate = {
        id: 'test',
        name: 'test',
        description: '',
        channel: 'email',
        category: 'test',
        content: { body: 'test' },
        variables: [
          { name: 'name', required: true, type: 'string' },
          { name: 'email', required: true, type: 'string' },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const provided = { name: 'John', email: 'john@example.com' };
      const result = validateVariables(template, provided);

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should fail when required variables are missing', () => {
      const template: NotificationTemplate = {
        id: 'test',
        name: 'test',
        description: '',
        channel: 'email',
        category: 'test',
        content: { body: 'test' },
        variables: [
          { name: 'name', required: true, type: 'string' },
          { name: 'email', required: true, type: 'string' },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const provided = { name: 'John' };
      const result = validateVariables(template, provided);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('email');
    });

    it('should ignore non-required variables', () => {
      const template: NotificationTemplate = {
        id: 'test',
        name: 'test',
        description: '',
        channel: 'email',
        category: 'test',
        content: { body: 'test' },
        variables: [
          { name: 'name', required: true, type: 'string' },
          { name: 'optional', required: false, type: 'string' },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const provided = { name: 'John' };
      const result = validateVariables(template, provided);

      expect(result.valid).toBe(true);
    });
  });
});
