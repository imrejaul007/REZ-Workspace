/**
 * Unit tests for Signature Verifier Service
 */

import * as crypto from 'crypto';
import { SignatureVerifier } from '../services/signatureVerifier';
import { ProviderType, VerificationAlgorithm } from '../types';

// Mock the provider configs
jest.mock('../services/providerConfigs', () => ({
  providerConfigs: {
    getProvider: jest.fn(),
    getSignatureHeader: jest.fn()
  }
}));

import { providerConfigs } from '../services/providerConfigs';

describe('SignatureVerifier', () => {
  let verifier: SignatureVerifier;
  const mockProvider = {
    id: 'test-provider',
    name: 'Test Provider',
    type: ProviderType.CUSTOM,
    algorithm: VerificationAlgorithm.HMAC_SHA256,
    secret: 'test-secret-key',
    enabled: true,
    timestampTolerance: 300,
    signatureHeader: 'x-signature'
  };

  beforeEach(() => {
    verifier = new SignatureVerifier();
    jest.clearAllMocks();
    (providerConfigs.getProvider as jest.Mock).mockReturnValue(mockProvider);
  });

  describe('HMAC-SHA256 Verification', () => {
    it('should verify valid HMAC-SHA256 signature', async () => {
      const payload = { event: 'test', data: 'sample' };
      const payloadString = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', mockProvider.secret)
        .update(payloadString)
        .digest('hex');

      const result = await verifier.verify(
        'test-provider',
        payload,
        expectedSignature
      );

      expect(result.isValid).toBe(true);
      expect(result.algorithm).toBe(VerificationAlgorithm.HMAC_SHA256);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid HMAC-SHA256 signature', async () => {
      const payload = { event: 'test', data: 'sample' };
      const invalidSignature = 'invalid-signature-that-is-64-chars-long-to-match-hex-length-';

      const result = await verifier.verify(
        'test-provider',
        payload,
        invalidSignature
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Provider Validation', () => {
    it('should reject verification for unknown provider', async () => {
      (providerConfigs.getProvider as jest.Mock).mockReturnValue(undefined);

      const result = await verifier.verify(
        'unknown-provider',
        {},
        'some-signature'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject verification for disabled provider', async () => {
      (providerConfigs.getProvider as jest.Mock).mockReturnValue({
        ...mockProvider,
        enabled: false
      });

      const result = await verifier.verify(
        'test-provider',
        {},
        'some-signature'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('disabled');
    });
  });

  describe('Signature Generation', () => {
    it('should generate valid HMAC-SHA256 signature', () => {
      const payload = { test: 'data' };
      const signature = verifier.generateSignature('test-provider', payload);

      expect(signature).toBeDefined();
      expect(signature).toHaveLength(64); // SHA-256 hex is 64 chars

      // Verify the generated signature is correct
      const expectedSignature = crypto
        .createHmac('sha256', mockProvider.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      expect(signature).toBe(expectedSignature);
    });

    it('should return undefined for unknown provider', () => {
      (providerConfigs.getProvider as jest.Mock).mockReturnValue(undefined);

      const signature = verifier.generateSignature(
        'unknown-provider',
        {}
      );

      expect(signature).toBeUndefined();
    });
  });
});

describe('Payload Normalization', () => {
  let verifier: SignatureVerifier;

  beforeEach(() => {
    verifier = new SignatureVerifier();
    jest.clearAllMocks();
  });

  it('should handle string payload', async () => {
    (providerConfigs.getProvider as jest.Mock).mockReturnValue({
      id: 'test',
      name: 'Test',
      type: ProviderType.CUSTOM,
      algorithm: VerificationAlgorithm.HMAC_SHA256,
      secret: 'secret',
      enabled: true,
      timestampTolerance: 300,
      signatureHeader: 'x-signature'
    });

    const payload = '{"key":"value"}';
    const signature = crypto
      .createHmac('sha256', 'secret')
      .update(payload)
      .digest('hex');

    const result = await verifier.verify('test', payload, signature);
    expect(result.isValid).toBe(true);
  });

  it('should handle Buffer payload', async () => {
    const payload = Buffer.from('{"key":"value"}');
    const signature = crypto
      .createHmac('sha256', 'secret')
      .update(payload.toString('utf-8'))
      .digest('hex');

    const result = await verifier.verify('test', payload, signature);
    expect(result.isValid).toBe(true);
  });
});
