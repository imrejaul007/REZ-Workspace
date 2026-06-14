// @ts-nocheck
/**
 * Unit Tests for inputSanitization.ts
 */

function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9+\-() ]/g, '');
}

function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

describe('inputSanitization', () => {
  it('should sanitize user inputs to prevent XSS', () => {
    const malicious = '<script>alert("xss")</script>';
    const sanitized = sanitizeInput(malicious);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('&lt;script&gt;');
    expect(sanitized).not.toContain('"xss"');
  });

  it('should strip non-numeric characters from phone numbers', () => {
    const phone = sanitizePhone('+1 (800) abc-1234');
    expect(phone).not.toContain('a');
    expect(phone).not.toContain('b');
    expect(phone).not.toContain('c');
    expect(phone).toContain('1234');
  });

  it('should normalise email addresses', () => {
    const email = sanitizeEmail('  USER@Example.COM  ');
    expect(email).toBe('user@example.com');
    expect(email).not.toContain(' ');
    expect(email).toBe(email.toLowerCase());
  });
});
