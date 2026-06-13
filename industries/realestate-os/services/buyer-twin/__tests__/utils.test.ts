import { formatCurrency, parsePhoneNumber, validateEmail, formatPhoneNumber } from '../src/utils';

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency with no decimals', () => {
      expect(formatCurrency(500000)).toBe('$500,000');
      expect(formatCurrency(1000000)).toBe('$1,000,000');
      expect(formatCurrency(100)).toBe('$100');
    });

    it('should handle large numbers with proper formatting', () => {
      expect(formatCurrency(1500000)).toBe('$1,500,000');
      expect(formatCurrency(999999)).toBe('$999,999');
    });
  });

  describe('parsePhoneNumber', () => {
    it('should remove all non-digit characters', () => {
      expect(parsePhoneNumber('123-456-7890')).toBe('1234567890');
      expect(parsePhoneNumber('(123) 456-7890')).toBe('1234567890');
      expect(parsePhoneNumber('123.456.7890')).toBe('1234567890');
      expect(parsePhoneNumber('1234567890')).toBe('1234567890');
    });

    it('should handle phone with extension (strips all non-digits)', () => {
      // The function removes all non-digit characters
      expect(parsePhoneNumber('123-456-7890 ext 123')).toBe('1234567890123');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('no@domain')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 10-digit phone numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    });

    it('should return original string for non-10-digit numbers', () => {
      expect(formatPhoneNumber('12345')).toBe('12345');
      expect(formatPhoneNumber('123456789012')).toBe('123456789012');
    });
  });
});
