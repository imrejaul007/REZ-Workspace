import { describe, it, expect } from 'vitest';
import DOMPurify from 'isomorphic-dompurify';

describe('XSS Sanitization Tests', () => {
  const sanitizeString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const clean = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
    return clean.trim().slice(0, 500);
  };

  describe('XSS Payloads Blocked', () => {
    const xssPayloads = [
      // Script injection
      { input: '<script>alert(1)</script>', desc: 'script tag' },
      { input: '<img src=x onerror=alert(1)>', desc: 'img onerror' },
      { input: '<svg onload=alert(1)>', desc: 'svg onload' },
      { input: '<iframe src="javascript:alert(1)">', desc: 'javascript iframe' },
      { input: '<body onload=alert(1)>', desc: 'body onload' },
      { input: '<input onfocus=alert(1) autofocus>', desc: 'input onfocus' },
      // Event handlers
      { input: '<div onclick="alert(1)">click</div>', desc: 'div onclick' },
      { input: '<a href="javascript:alert(1)">click</a>', desc: 'javascript href' },
      // Encoded variants
      { input: '&lt;script&gt;alert(1)&lt;/script&gt;', desc: 'encoded script' },
      // Expression injection (CSS)
      { input: '<div style="width:expression(alert(1))">', desc: 'css expression' },
      // Data URIs
      { input: '<a href="data:text/html,<script>alert(1)</script>">', desc: 'data URI' },
      // Null byte injection
      { input: '<script\x00>alert(1)</script>', desc: 'null byte injection' },
    ];

    for (const { input, desc } of xssPayloads) {
      it(`blocks: ${desc}`, () => {
        const result = sanitizeString(input);
        // Should not contain script-related keywords
        expect(result?.toLowerCase()).not.toContain('script');
        expect(result?.toLowerCase()).not.toContain('onerror');
        expect(result?.toLowerCase()).not.toContain('onload');
        expect(result?.toLowerCase()).not.toContain('onclick');
        expect(result?.toLowerCase()).not.toContain('javascript:');
        expect(result?.toLowerCase()).not.toContain('expression(');
      });
    }
  });

  describe('Valid Input Preserved', () => {
    it('preserves plain text', () => {
      expect(sanitizeString('Hello World')).toBe('Hello World');
    });

    it('preserves names with special chars', () => {
      expect(sanitizeString("John O'Brien")).toBe("John O'Brien");
      expect(sanitizeString('Marie-Claire')).toBe('Marie-Claire');
    });

    it('preserves email-like text', () => {
      expect(sanitizeString('user@example.com')).toBe('user@example.com');
    });

    it('preserves numbers', () => {
      expect(sanitizeString('123456')).toBe('123456');
      expect(sanitizeString('+919876543210')).toBe('+919876543210');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('handles whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('truncates long strings', () => {
      const long = 'a'.repeat(600);
      const result = sanitizeString(long);
      expect(result?.length).toBe(500);
    });

    it('returns undefined for non-strings', () => {
      expect(sanitizeString(123)).toBeUndefined();
      expect(sanitizeString(null)).toBeUndefined();
      expect(sanitizeString(undefined)).toBeUndefined();
      expect(sanitizeString({})).toBeUndefined();
    });
  });
});
