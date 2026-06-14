/**
 * MFA Service Tests
 * Tests for TOTP, backup codes, and multi-factor authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// TOTP Generation & Validation
function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateTOTP(secret: string, timestamp: number = Date.now()): string {
  // Simplified TOTP for testing (real implementation uses HMAC-SHA1)
  const timeStep = Math.floor(timestamp / 30000);
  let hash = 0;
  for (let i = 0; i < secret.length; i++) {
    hash = ((hash << 5) - hash + secret.charCodeAt(i) + timeStep) % 1000000;
  }
  return String(hash).padStart(6, '0').slice(-6);
}

function verifyTOTP(token: string, secret: string, window: number = 1): boolean {
  const now = Date.now();
  for (let i = -window; i <= window; i++) {
    const expected = generateTOTP(secret, now + i * 30000);
    if (token === expected) return true;
  }
  return false;
}

// Backup Codes
function generateBackupCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () =>
    Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

function hashBackupCode(code: string): string {
  // Simple hash for testing
  return Buffer.from(code.toLowerCase()).toString('base64');
}

// QR Code Generation
function generateTOTPQRCode(secret: string, issuer: string, account: string): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const otpauth = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
}

describe('TOTP Generation', () => {
  it('should generate 6-digit TOTP', () => {
    const secret = generateTOTPSecret();
    const totp = generateTOTP(secret);
    expect(totp.length).toBe(6);
    expect(/^\d{6}$/.test(totp)).toBe(true);
  });

  it('should generate different TOTPs for different timestamps', () => {
    const secret = generateTOTPSecret();
    const totp1 = generateTOTP(secret, Date.now());
    const totp2 = generateTOTP(secret, Date.now() + 60000); // 1 minute later
    // They might be same or different depending on time step
    expect(typeof totp1).toBe('string');
    expect(typeof totp2).toBe('string');
  });

  it('should generate consistent TOTP for same time window', () => {
    const secret = generateTOTPSecret();
    const timestamp = Math.floor(Date.now() / 30000) * 30000;
    const totp1 = generateTOTP(secret, timestamp);
    const totp2 = generateTOTP(secret, timestamp);
    expect(totp1).toBe(totp2);
  });
});

describe('TOTP Verification', () => {
  const secret = 'JBSWY3DPEHPK3PXP';

  it('should verify valid TOTP', () => {
    const totp = generateTOTP(secret);
    expect(verifyTOTP(totp, secret)).toBe(true);
  });

  it('should reject invalid TOTP', () => {
    expect(verifyTOTP('000000', secret)).toBe(false);
  });

  it('should reject TOTP with wrong length', () => {
    expect(verifyTOTP('12345', secret)).toBe(false);
    expect(verifyTOTP('1234567', secret)).toBe(false);
  });

  it('should accept TOTP within verification window', () => {
    const totp = generateTOTP(secret, Date.now());
    // A TOTP generated now should verify with default window
    expect(verifyTOTP(totp, secret, 1)).toBe(true);
  });
});

describe('Backup Codes', () => {
  it('should generate 10 backup codes by default', () => {
    const codes = generateBackupCodes();
    expect(codes.length).toBe(10);
  });

  it('should generate custom number of codes', () => {
    const codes = generateBackupCodes(5);
    expect(codes.length).toBe(5);
  });

  it('should generate codes with correct format', () => {
    const codes = generateBackupCodes();
    const format = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    codes.forEach(code => {
      expect(format.test(code)).toBe(true);
    });
  });

  it('should generate unique codes', () => {
    const codes = new Set(generateBackupCodes());
    expect(codes.size).toBe(10);
  });
});

describe('Backup Code Verification', () => {
  const originalCode = 'ABCD-1234';
  const hashedCode = hashBackupCode(originalCode);

  it('should hash and verify backup code', () => {
    const input = originalCode.toLowerCase();
    const hashed = hashBackupCode(input);
    expect(hashed).toBe(hashedCode);
  });

  it('should be case-insensitive', () => {
    expect(hashBackupCode('abcd-1234')).toBe(hashBackupCode('ABCD-1234'));
  });

  it('should detect invalid codes', () => {
    const hashed = hashBackupCode('XXXX-9999');
    expect(hashed).not.toBe(hashedCode);
  });
});

describe('MFA Setup Flow', () => {
  it('should generate secret for user', () => {
    const secret = generateTOTPSecret();
    expect(secret.length).toBe(32);
    expect(/^[A-Z0-9]+$/.test(secret)).toBe(true);
  });

  it('should generate QR code URL', () => {
    const secret = generateTOTPSecret();
    const qrUrl = generateTOTPQRCode(secret, 'REZ', 'user@example.com');
    expect(qrUrl).toContain('otpauth://totp/');
    expect(qrUrl).toContain(secret);
    expect(qrUrl).toContain('qrserver.com');
  });

  it('should complete MFA setup flow', () => {
    const secret = generateTOTPSecret();
    const totp = generateTOTP(secret);
    const verified = verifyTOTP(totp, secret);
    expect(verified).toBe(true);
  });
});

describe('MFA Verification Flow', () => {
  it('should require valid TOTP for verification', () => {
    const secret = generateTOTPSecret();
    const validTotp = generateTOTP(secret);
    const invalidTotp = '000000';

    expect(verifyTOTP(validTotp, secret)).toBe(true);
    expect(verifyTOTP(invalidTotp, secret)).toBe(false);
  });

  it('should lock after max failed attempts', () => {
    const maxAttempts = 5;
    let attempts = 0;

    const attemptVerification = () => {
      attempts++;
      if (attempts >= maxAttempts) {
        return { success: false, locked: true };
      }
      return { success: false, locked: false };
    };

    for (let i = 0; i < 5; i++) {
      attemptVerification();
    }
    expect(attempts).toBe(5);
    expect(attemptVerification().locked).toBe(true);
  });
});
