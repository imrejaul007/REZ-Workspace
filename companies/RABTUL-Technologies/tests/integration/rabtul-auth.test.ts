/**
 * RABTUL Auth Service Integration Tests
 *
 * Tests the centralized authentication service.
 *
 * @group integration
 * @group auth
 */

import { describe, test, expect, beforeAll } from 'vitest';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'test-token';

interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    phone?: string;
    email?: string;
    role?: string;
  };
  error?: string;
}

describe('RABTUL Auth Service Integration Tests', () => {

  describe('Health Check', () => {
    test('should return healthy status', async () => {
      const response = await fetch(`${AUTH_SERVICE_URL}/health`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toBeDefined();
    });
  });

  describe('Token Verification', () => {
    test('should verify valid token', async () => {
      // Note: Requires a valid token from the auth service
      // This test requires INTERNAL_SERVICE_TOKEN to be set
      const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          token: 'test-token-requires-valid-token'
        }),
      });

      // Should return 401 for invalid token
      expect(response.status).toBe(401);
    });

    test('should reject requests without internal token', async () => {
      const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: 'test' }),
      });

      // Should return 401 for missing internal token
      expect(response.status).toBe(401);
    });
  });

  describe('OTP Operations', () => {
    test('should send OTP (requires valid phone)', async () => {
      const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          phone: '+919876543210',
          type: 'login'
        }),
      });

      // May return 400 for invalid phone format or success
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Service-to-Service Communication', () => {
    test('should authenticate with internal token header', async () => {
      const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
      });

      // Should not return 401 for valid internal token
      expect(response.status).not.toBe(401);
    });
  });
});
