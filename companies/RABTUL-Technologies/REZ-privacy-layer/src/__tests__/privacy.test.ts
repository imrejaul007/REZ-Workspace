/**
 * Privacy Layer Tests
 * Tests for PII masking, consent management, and data anonymization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface Consent {
  userId: string;
  type: string;
  granted: boolean;
  timestamp: Date;
}

interface DataSubject {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  address?: string;
}

// PII Masking
function maskEmail(email: string): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return '**@' + domain;
  return local.substring(0, 2) + '***@' + domain;
}

function maskPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '****';
  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
}

function maskName(name: string): string {
  if (!name) return '';
  const parts = name.split(' ');
  return parts.map(part =>
    part.length <= 1 ? part : part[0] + '*'.repeat(part.length - 1)
  ).join(' ');
}

function maskAadhaar(aadhaar: string): string {
  const cleaned = aadhaar.replace(/\D/g, '');
  if (cleaned.length !== 12) return aadhaar;
  return 'XXXX-XXXX-' + cleaned.slice(-4);
}

function maskPAN(pan: string): string {
  if (pan.length !== 10) return pan;
  return pan.substring(0, 5) + '*****' + pan.slice(-1);
}

// Full PII mask
function maskPII(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    if (lowerKey.includes('email')) {
      result[key] = typeof value === 'string' ? maskEmail(value) : value;
    } else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
      result[key] = typeof value === 'string' ? maskPhone(value) : value;
    } else if (lowerKey.includes('name') || lowerKey === 'fullname') {
      result[key] = typeof value === 'string' ? maskName(value) : value;
    } else if (lowerKey.includes('aadhaar')) {
      result[key] = typeof value === 'string' ? maskAadhaar(value) : value;
    } else if (lowerKey === 'pan' || lowerKey.includes('pancard')) {
      result[key] = typeof value === 'string' ? maskPAN(value) : value;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = maskPII(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// Consent management
function checkConsent(consents: Consent[], userId: string, type: string): boolean {
  const consent = consents.find(c => c.userId === userId && c.type === type);
  return consent?.granted ?? false;
}

function grantConsent(consents: Consent[], userId: string, type: string): Consent {
  const existing = consents.findIndex(c => c.userId === userId && c.type === type);

  const consent: Consent = {
    userId,
    type,
    granted: true,
    timestamp: new Date(),
  };

  if (existing >= 0) {
    consents[existing] = consent;
  } else {
    consents.push(consent);
  }

  return consent;
}

function revokeConsent(consents: Consent[], userId: string, type: string): boolean {
  const index = consents.findIndex(c => c.userId === userId && c.type === type);
  if (index === -1) return false;

  consents[index] = {
    ...consents[index],
    granted: false,
    timestamp: new Date(),
  };
  return true;
}

// Data anonymization
function anonymizeData<T extends Record<string, unknown>>(
  data: T,
  fields: string[]
): T {
  const result = { ...data };

  for (const field of fields) {
    if (field in result) {
      result[field] = '[REDACTED]' as any;
    }
  }

  return result;
}

function hashData(data: string, salt: string): string {
  // Simple hash for testing
  const combined = data + salt;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

describe('Email Masking', () => {
  it('should mask email correctly', () => {
    expect(maskEmail('john.doe@example.com')).toBe('jo***@example.com');
  });

  it('should handle short email local part', () => {
    expect(maskEmail('ab@example.com')).toBe('**@example.com');
  });

  it('should handle empty email', () => {
    expect(maskEmail('')).toBe('');
  });
});

describe('Phone Masking', () => {
  it('should mask Indian phone number', () => {
    expect(maskPhone('+919876543210')).toBe('****3210');
  });

  it('should mask US phone number', () => {
    expect(maskPhone('+1-234-567-8900')).toBe('****8900');
  });

  it('should handle short number', () => {
    expect(maskPhone('123')).toBe('****');
  });
});

describe('Name Masking', () => {
  it('should mask full name', () => {
    expect(maskName('John Doe')).toBe('J*** D**');
  });

  it('should mask single name', () => {
    expect(maskName('Madonna')).toBe('M****a');
  });
});

describe('Aadhaar Masking', () => {
  it('should mask Aadhaar number', () => {
    expect(maskAadhaar('1234-5678-9012')).toBe('XXXX-XXXX-9012');
  });

  it('should handle invalid length', () => {
    expect(maskAadhaar('12345')).toBe('12345');
  });
});

describe('PAN Masking', () => {
  it('should mask PAN number', () => {
    expect(maskPAN('ABCDE1234F')).toBe('ABCDE*****F');
  });

  it('should handle invalid length', () => {
    expect(maskPAN('ABC12')).toBe('ABC12');
  });
});

describe('Full PII Masking', () => {
  it('should mask all PII fields', () => {
    const data = {
      email: 'user@example.com',
      phoneNumber: '9876543210',
      fullName: 'John Doe',
      orderId: 'order_123',
      amount: 1000,
    };

    const masked = maskPII(data);

    expect(masked.email).toBe('us***@example.com');
    expect(masked.phoneNumber).toBe('******3210');
    expect(masked.fullName).toBe('Jo** D**');
    expect(masked.orderId).toBe('order_123'); // Not PII
    expect(masked.amount).toBe(1000); // Not PII
  });
});

describe('Consent Management', () => {
  let consents: Consent[] = [];

  beforeEach(() => {
    consents = [];
  });

  it('should grant consent', () => {
    const consent = grantConsent(consents, 'user_1', 'marketing');
    expect(consent.granted).toBe(true);
  });

  it('should check consent', () => {
    grantConsent(consents, 'user_1', 'marketing');
    expect(checkConsent(consents, 'user_1', 'marketing')).toBe(true);
    expect(checkConsent(consents, 'user_1', 'analytics')).toBe(false);
  });

  it('should revoke consent', () => {
    grantConsent(consents, 'user_1', 'marketing');
    const result = revokeConsent(consents, 'user_1', 'marketing');
    expect(result).toBe(true);
    expect(checkConsent(consents, 'user_1', 'marketing')).toBe(false);
  });
});

describe('Data Anonymization', () => {
  it('should redact specified fields', () => {
    const data = { name: 'John', email: 'john@example.com', id: '123' };
    const anonymized = anonymizeData(data, ['name', 'email']);

    expect(anonymized.name).toBe('[REDACTED]');
    expect(anonymized.email).toBe('[REDACTED]');
    expect(anonymized.id).toBe('123');
  });
});

describe('Data Hashing', () => {
  it('should hash data consistently', () => {
    const hash1 = hashData('sensitive-data', 'salt123');
    const hash2 = hashData('sensitive-data', 'salt123');
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different data', () => {
    const hash1 = hashData('data1', 'salt');
    const hash2 = hashData('data2', 'salt');
    expect(hash1).not.toBe(hash2);
  });

  it('should produce different hashes for different salts', () => {
    const hash1 = hashData('data', 'salt1');
    const hash2 = hashData('data', 'salt2');
    expect(hash1).not.toBe(hash2);
  });
});
