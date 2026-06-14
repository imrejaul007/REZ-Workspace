/**
 * Signature Verification Service
 * Handles cryptographic signature verification for various webhook providers
 * SECURITY HARDENED - Fixed critical vulnerabilities
 */

import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { VerificationAlgorithm, VerificationResult, ProviderConfig } from '../types';
import { providerConfigs } from './providerConfigs';
import { logger } from '../utils/logger';

export class SignatureVerifier {
  // SECURITY FIX (CRITICAL-03): Removed HMAC-SHA1 and HMAC-MD5 - cryptographically broken
  private readonly supportedAlgorithms: Set<VerificationAlgorithm> = new Set([
    VerificationAlgorithm.HMAC_SHA256,
    // REMOVED: VerificationAlgorithm.HMAC_SHA1 - BROKEN
    // REMOVED: VerificationAlgorithm.HMAC_MD5 - BROKEN
    VerificationAlgorithm.JWT,
    VerificationAlgorithm.RSA_SHA256,
    VerificationAlgorithm.ECDSA_SHA256,
    VerificationAlgorithm.CUSTOM
  ]);

  /**
   * Timing-safe string comparison to prevent timing attacks
   * SECURITY FIX (CRITICAL-02): Properly handles buffer length mismatch
   */
  private timingSafeCompare(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);

      // Return false immediately if lengths differ (constant-time check)
      if (bufA.length !== bufB.length) {
        return false;
      }

      return crypto.timingSafeEqual(bufA, bufB);
    } catch (error) {
      // Log the error for debugging but return false (signature mismatch)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[SignatureVerifier] timingSafeCompare failed: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Verify webhook signature using provider configuration
   */
  async verify(
    providerId: string,
    payload: unknown,
    signature: string,
    headers?: Record<string, string>
  ): Promise<VerificationResult> {
    const provider = providerConfigs.getProvider(providerId);

    if (!provider) {
      logger.warn('Provider not found', { providerId });
      return {
        isValid: false,
        algorithm: 'none',
        error: `Provider '${providerId}' not found`
      };
    }

    if (!provider.enabled) {
      logger.warn('Provider is disabled', { providerId });
      return {
        isValid: false,
        algorithm: provider.algorithm,
        error: `Provider '${providerId}' is disabled`
      };
    }

    // Check timestamp if header is configured
    if (provider.timestampHeader && headers) {
      const timestampResult = this.verifyTimestamp(provider, headers);
      if (!timestampResult.valid) {
        return {
          isValid: false,
          algorithm: provider.algorithm,
          error: timestampResult.error
        };
      }
    }

    return this.verifyWithAlgorithm(provider, payload, signature);
  }

  /**
   * Verify timestamp from webhook header
   */
  private verifyTimestamp(
    provider: ProviderConfig,
    headers: Record<string, string>
  ): { valid: boolean; error?: string } {
    const timestampStr = headers[provider.timestampHeader];

    if (!timestampStr) {
      if (provider.requireTimestamp) {
        return { valid: false, error: 'Missing timestamp header' };
      }
      return { valid: true };
    }

    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp)) {
      return { valid: false, error: 'Invalid timestamp format' };
    }

    const now = Math.floor(Date.now() / 1000);
    const age = Math.abs(now - timestamp);

    if (age > (provider.timestampTolerance || 300)) {
      return { valid: false, error: 'Timestamp outside tolerance window' };
    }

    return { valid: true };
  }

  /**
   * Verify signature using specified algorithm
   */
  private verifyWithAlgorithm(
    provider: ProviderConfig,
    payload: unknown,
    signature: string
  ): VerificationResult {
    switch (provider.algorithm) {
      case VerificationAlgorithm.HMAC_SHA256:
        return this.verifyHmacSha256(provider, payload, signature);

      // SECURITY FIX (CRITICAL-03): Removed HMAC-SHA1 and HMAC-MD5 cases
      case VerificationAlgorithm.JWT:
        return this.verifyJwt(provider, payload, signature);

      case VerificationAlgorithm.RSA_SHA256:
        return this.verifyRsaSha256(provider, payload, signature);

      case VerificationAlgorithm.ECDSA_SHA256:
        return this.verifyEcdsaSha256(provider, payload, signature);

      case VerificationAlgorithm.CUSTOM:
        return this.verifyCustom(provider, payload, signature);

      default:
        return {
          isValid: false,
          algorithm: provider.algorithm,
          error: `Unsupported algorithm: ${provider.algorithm}`
        };
    }
  }

  /**
   * HMAC-SHA256 verification
   * SECURITY FIX (CRITICAL-01, CRITICAL-02): Removed signature exposure, fixed timing-safe compare
   */
  private verifyHmacSha256(
    provider: ProviderConfig,
    payload: unknown,
    signature: string
  ): VerificationResult {
    try {
      const payloadString = this.normalizePayload(payload);
      const expectedSignature = crypto
        .createHmac('sha256', provider.secret)
        .update(payloadString)
        .digest('hex');

      // SECURITY FIX: Use custom timing-safe comparison that handles length mismatch
      const isValid = this.timingSafeCompare(signature, expectedSignature);

      // SECURITY FIX (CRITICAL-01): Do NOT expose expectedSignature or receivedSignature
      return {
        isValid,
        algorithm: VerificationAlgorithm.HMAC_SHA256,
        details: { match: isValid }
      };
    } catch (error) {
      logger.error('HMAC-SHA256 verification error', { error });
      return {
        isValid: false,
        algorithm: VerificationAlgorithm.HMAC_SHA256,
        error: 'Verification failed'
      };
    }
  }

  /**
   * JWT verification
   */
  private verifyJwt(
    provider: ProviderConfig,
    payload: unknown,
    signature: string
  ): VerificationResult {
    try {
      const options: jwt.VerifyOptions = {
        algorithms: ['HS256', 'RS256', 'ES256'],
        ...(provider.algorithmOptions?.secret && { secret: provider.algorithmOptions.secret }),
        ...(provider.algorithmOptions?.publicKey && { publicKey: provider.algorithmOptions.publicKey }),
      };

      const decoded = jwt.verify(signature, provider.secret, options);

      return {
        isValid: true,
        algorithm: VerificationAlgorithm.JWT,
        details: { payload: decoded }
      };
    } catch (error) {
      return {
        isValid: false,
        algorithm: VerificationAlgorithm.JWT,
        error: error instanceof Error ? error.message : 'JWT verification failed'
      };
    }
  }

  /**
   * RSA-SHA256 verification
   */
  private verifyRsaSha256(
    provider: ProviderConfig,
    payload: unknown,
    signature: string
  ): VerificationResult {
    try {
      const payloadString = this.normalizePayload(payload);
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(payloadString);

      const isValid = verify.verify(provider.secret, signature, 'base64');

      return {
        isValid,
        algorithm: VerificationAlgorithm.RSA_SHA256,
        details: { match: isValid }
      };
    } catch (error) {
      return {
        isValid: false,
        algorithm: VerificationAlgorithm.RSA_SHA256,
        error: 'RSA-SHA256 verification failed'
      };
    }
  }

  /**
   * ECDSA-SHA256 verification
   */
  private verifyEcdsaSha256(
    provider: ProviderConfig,
    payload: unknown,
    signature: string
  ): VerificationResult {
    try {
      const payloadString = this.normalizePayload(payload);
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(payloadString);

      const isValid = verify.verify(provider.secret, signature, 'base64');

      return {
        isValid,
        algorithm: VerificationAlgorithm.ECDSA_SHA256,
        details: { match: isValid }
      };
    } catch (error) {
      return {
        isValid: false,
        algorithm: VerificationAlgorithm.ECDSA_SHA256,
        error: 'ECDSA-SHA256 verification failed'
      };
    }
  }

  /**
   * Custom algorithm verification
   */
  private verifyCustom(
    provider: ProviderConfig,
    payload: unknown,
    signature: string
  ): VerificationResult {
    if (!provider.algorithmOptions?.customVerify) {
      return {
        isValid: false,
        algorithm: VerificationAlgorithm.CUSTOM,
        error: 'Custom verification not configured'
      };
    }

    try {
      const payloadString = this.normalizePayload(payload);
      const isValid = provider.algorithmOptions.customVerify(payloadString, signature, provider.secret);

      return {
        isValid,
        algorithm: VerificationAlgorithm.CUSTOM,
        details: { match: isValid }
      };
    } catch (error) {
      return {
        isValid: false,
        algorithm: VerificationAlgorithm.CUSTOM,
        error: 'Custom verification failed'
      };
    }
  }

  /**
   * Normalize payload for signing
   */
  private normalizePayload(payload: unknown): string {
    if (typeof payload === 'string') {
      return payload;
    }
    return JSON.stringify(payload);
  }
}

export const signatureVerifier = new SignatureVerifier();
