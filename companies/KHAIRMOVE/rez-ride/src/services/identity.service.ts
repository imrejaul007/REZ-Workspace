/**
 * Identity Graph Service Integration
 *
 * Connects to REZ-identity-graph (4050)
 * - Links user identity across platforms
 * - Device fingerprinting
 * - Cross-device tracking
 */

import axios from 'axios';
import { Logger } from '@nestjs/common';

export interface IdentityLink {
  userId: string;
  deviceIds: string[];
  emails: string[];
  phones: string[];
  anonymousIds: string[];
  crossPlatformIds: {
    platform: string;
    id: string;
  }[];
}

export interface IdentityProfile {
  primaryId: string;
  confidence: number;
  links: IdentityLink;
  firstSeen: Date;
  lastSeen: Date;
  platforms: string[];
  totalTransactions: number;
}

export class IdentityService {
  private readonly logger = new Logger('IdentityService');

  private readonly IDENTITY_URL = process.env.REZ_IDENTITY_URL || 'http://localhost:4050';
  private readonly INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

  private http = axios.create({
    timeout: 500,
    headers: {
      'X-Internal-Token': this.INTERNAL_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  /**
   * Link new identity to existing user
   */
  async linkIdentity(data: {
    primaryId: string;
    deviceId?: string;
    phone?: string;
    email?: string;
    anonymousId?: string;
  }): Promise<void> {
    try {
      await this.http.post(`${this.IDENTITY_URL}/api/link`, data);
    } catch (error) {
      this.logger.warn(`Identity link failed: ${error.message}`);
    }
  }

  /**
   * Get unified identity profile
   */
  async getIdentityProfile(identifier: {
    userId?: string;
    deviceId?: string;
    phone?: string;
    email?: string;
  }): Promise<IdentityProfile | null> {
    try {
      const response = await this.http.get(`${this.IDENTITY_URL}/api/profile`, {
        params: identifier,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Identity lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Track event with device fingerprint
   */
  async trackEvent(data: {
    event: string;
    userId?: string;
    anonymousId?: string;
    deviceId?: string;
    properties: Record<string, any>;
    timestamp: Date;
  }): Promise<void> {
    try {
      await this.http.post(`${this.IDENTITY_URL}/api/events`, data);
    } catch (error) {
      this.logger.warn(`Identity event tracking failed: ${error.message}`);
    }
  }

  /**
   * Resolve user from multiple signals
   */
  async resolveIdentity(signals: {
    deviceId?: string;
    ip?: string;
    userAgent?: string;
    location?: { lat: number; lng: number };
  }): Promise<{
    userId: string | null;
    confidence: number;
    isKnown: boolean;
  }> {
    try {
      const response = await this.http.post(`${this.IDENTITY_URL}/api/resolve`, signals);
      return response.data;
    } catch (error) {
      this.logger.warn(`Identity resolution failed: ${error.message}`);
      return { userId: null, confidence: 0, isKnown: false };
    }
  }

  /**
   * Get all linked accounts
   */
  async getLinkedAccounts(userId: string): Promise<{
    platforms: { name: string; linkedAt: Date }[];
    totalAccounts: number;
  }> {
    try {
      const response = await this.http.get(`${this.IDENTITY_URL}/api/${userId}/accounts`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Linked accounts lookup failed: ${error.message}`);
      return { platforms: [], totalAccounts: 0 };
    }
  }

  /**
   * Merge two user identities
   */
  async mergeIdentities(sourceId: string, targetId: string): Promise<void> {
    try {
      await this.http.post(`${this.IDENTITY_URL}/api/merge`, {
        sourceId,
        targetId,
      });
    } catch (error) {
      this.logger.error(`Identity merge failed: ${error.message}`);
    }
  }
}

export const identityService = new IdentityService();
