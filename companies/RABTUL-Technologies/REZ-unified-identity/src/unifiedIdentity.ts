/**
 * REZ Unified Identity Service
 *
 * Consolidates all identity services into one:
 * - REZ-identity-graph (Port 3001)
 * - REZ-consumer-graph (Port 4051)
 * - REZ-universal-user-graph (Port 4055)
 * - REZ-unified-identity (Port 4060)
 *
 * This is the SINGLE SOURCE OF TRUTH for all identity data.
 *
 * Port: 4060
 */

import axios from 'axios';

// ============================================================================
// Service URLs (Downstream Services)
// ============================================================================

const IDENTITY_GRAPH_URL = process.env.IDENTITY_GRAPH_URL || 'http://localhost:3001';
const CONSUMER_GRAPH_URL = process.env.CONSUMER_GRAPH_URL || 'http://localhost:4051';
const UNIVERSAL_GRAPH_URL = process.env.UNIVERSAL_GRAPH_URL || 'http://localhost:4055';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'your-token';

// ============================================================================
// Types
// ============================================================================

export interface IdentityLink {
  type: 'email' | 'phone' | 'device' | 'device_id' | 'cookie' | 'social';
  value: string;
  verified: boolean;
  linkedAt: string;
}

export interface UnifiedIdentity {
  primaryId: string;
  type: 'user' | 'device' | 'session';

  // Identity links
  links: IdentityLink[];

  // Profile
  profile: {
    firstSeen: string;
    lastSeen: string;
    totalSessions: number;
    source: string[];
  };

  // Cross-platform presence
  platforms: {
    platform: string;
    userId: string;
    linked: boolean;
    lastActive: string;
  }[];

  // Household/relationships
  relationships: {
    relatedId: string;
    relationship: 'household' | 'family' | 'shared_device';
    strength: number;
  }[];

  // Risk assessment
  risk: {
    score: number;
    factors: string[];
    lastAssessed: string;
  };

  // Privacy/consent
  consent: {
    marketing: boolean;
    analytics: boolean;
    thirdParty: boolean;
    updatedAt: string;
  };
}

export interface IdentityResolution {
  identity: UnifiedIdentity;
  confidence: number;
  method: 'exact' | 'probabilistic' | 'device_fingerprint';
  sources: string[];
}

// ============================================================================
// Unified Identity Service
// ============================================================================

class UnifiedIdentityService {
  // ============================================
  // Identity Resolution
  // ============================================

  /**
   * Resolve identity from unknown identifier
   * Tries all identity services to find the user
   */
  async resolve(identifier: {
    type: 'email' | 'phone' | 'device' | 'userId' | 'sessionId';
    value: string;
  }): Promise<IdentityResolution | null> {
    // Try identity graph first
    try {
      const identityResponse = await axios.get(
        `${IDENTITY_GRAPH_URL}/api/identity/${identifier.type}/${identifier.value}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );

      if (identityResponse.data) {
        return {
          identity: this.mapToUnified(identityResponse.data),
          confidence: 0.95,
          method: 'exact',
          sources: ['identity-graph']
        };
      }
    } catch (e) {
      // Continue to next service
    }

    // Try consumer graph
    try {
      const consumerResponse = await axios.get(
        `${CONSUMER_GRAPH_URL}/api/consumer/${identifier.value}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );

      if (consumerResponse.data) {
        return {
          identity: this.mapToUnified(consumerResponse.data),
          confidence: 0.90,
          method: 'exact',
          sources: ['consumer-graph']
        };
      }
    } catch (e) {
      // Continue
    }

    // Try universal graph
    try {
      const universalResponse = await axios.get(
        `${UNIVERSAL_GRAPH_URL}/api/user/${identifier.value}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );

      if (universalResponse.data) {
        return {
          identity: this.mapToUnified(universalResponse.data),
          confidence: 0.85,
          method: 'probabilistic',
          sources: ['universal-graph']
        };
      }
    } catch (e) {
      // No match found
    }

    return null;
  }

  /**
   * Link two identities
   */
  async link(sourceId: string, targetId: string, linkType: IdentityLink['type'], value: string): Promise<void> {
    // Link in identity graph
    try {
      await axios.post(
        `${IDENTITY_GRAPH_URL}/api/identity/link`,
        { sourceId, targetId, type: linkType, value },
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );
    } catch (e) {
      console.error('Failed to link in identity graph:', e);
    }

    // Link in consumer graph
    try {
      await axios.post(
        `${CONSUMER_GRAPH_URL}/api/links`,
        { sourceId, targetId, linkType, value },
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );
    } catch (e) {
      console.error('Failed to link in consumer graph:', e);
    }
  }

  /**
   * Unlink identities
   */
  async unlink(sourceId: string, targetId: string): Promise<void> {
    try {
      await axios.delete(
        `${IDENTITY_GRAPH_URL}/api/identity/link/${sourceId}/${targetId}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );
    } catch (e) {
      console.error('Failed to unlink:', e);
    }
  }

  // ============================================
  // Profile Management
  // ============================================

  /**
   * Get unified profile
   */
  async getProfile(identifier: {
    type: 'email' | 'phone' | 'device' | 'userId';
    value: string;
  }): Promise<UnifiedIdentity | null> {
    const resolution = await this.resolve(identifier);
    return resolution?.identity || null;
  }

  /**
   * Update consent
   */
  async updateConsent(userId: string, consent: Partial<UnifiedIdentity['consent']>): Promise<void> {
    try {
      await axios.patch(
        `${IDENTITY_GRAPH_URL}/api/identity/${userId}/consent`,
        consent,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );
    } catch (e) {
      console.error('Failed to update consent:', e);
    }
  }

  // ============================================
  // Device Management
  // ============================================

  /**
   * Add device to identity
   */
  async addDevice(userId: string, deviceId: string, deviceInfo: {
    type: 'ios' | 'android' | 'web' | 'kiosk';
    fingerprint?: string;
    riskScore?: number;
  }): Promise<void> {
    await this.link(userId, deviceId, 'device_id', deviceInfo.fingerprint || deviceId);
  }

  /**
   * Get all devices for user
   */
  async getDevices(userId: string): Promise<string[]> {
    const resolution = await this.resolve({ type: 'userId', value: userId });
    if (!resolution) return [];

    return resolution.identity.links
      .filter(l => l.type === 'device_id')
      .map(l => l.value);
  }

  // ============================================
  // Household/Family
  // ============================================

  /**
   * Create household
   */
  async createHousehold(memberIds: string[]): Promise<string> {
    const householdId = `hh_${Date.now()}`;

    for (const memberId of memberIds) {
      try {
        await axios.post(
          `${CONSUMER_GRAPH_URL}/api/household`,
          { householdId, memberId, relationship: 'household' },
          { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
        );
      } catch (e) {
        console.error('Failed to create household:', e);
      }
    }

    return householdId;
  }

  /**
   * Get household members
   */
  async getHousehold(userId: string): Promise<string[]> {
    try {
      const response = await axios.get(
        `${CONSUMER_GRAPH_URL}/api/household/${userId}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );
      return response.data.members || [];
    } catch (e) {
      return [];
    }
  }

  // ============================================
  // Risk Assessment
  // ============================================

  /**
   * Get risk score for identity
   */
  async getRiskScore(identifier: {
    type: 'email' | 'phone' | 'device' | 'userId';
    value: string;
  }): Promise<{ score: number; factors: string[] }> {
    try {
      const response = await axios.get(
        `${IDENTITY_GRAPH_URL}/api/risk/${identifier.type}/${identifier.value}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );
      return response.data;
    } catch (e) {
      return { score: 0.5, factors: ['unknown'] };
    }
  }

  // ============================================
  // Privacy/GDPR
  // ============================================

  /**
   * Export all data for user (GDPR)
   */
  async exportData(userId: string): Promise<Record<string, unknown>> {
    const exportData: Record<string, unknown> = {};

    // Get from identity graph
    try {
      const identityData = await axios.get(
        `${IDENTITY_GRAPH_URL}/api/export/${userId}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 5000 }
      );
      exportData.identity = identityData.data;
    } catch (e) {
      exportData.identity = null;
    }

    // Get from consumer graph
    try {
      const consumerData = await axios.get(
        `${CONSUMER_GRAPH_URL}/api/export/${userId}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 5000 }
      );
      exportData.consumer = consumerData.data;
    } catch (e) {
      exportData.consumer = null;
    }

    return exportData;
  }

  /**
   * Delete all data for user (GDPR Right to Erasure)
   */
  async deleteData(userId: string): Promise<void> {
    const deletionPromises = [
      // Identity graph
      axios.delete(`${IDENTITY_GRAPH_URL}/api/identity/${userId}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 5000 }).catch(() => {}),

      // Consumer graph
      axios.delete(`${CONSUMER_GRAPH_URL}/api/consumer/${userId}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 5000 }).catch(() => {}),

      // Universal graph
      axios.delete(`${UNIVERSAL_GRAPH_URL}/api/user/${userId}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 5000 }).catch(() => {})
    ];

    await Promise.all(deletionPromises);
  }

  // ============================================
  // Helper Methods
  // ============================================

  private mapToUnified(data): UnifiedIdentity {
    // Map any service's format to unified format
    return {
      primaryId: data.userId || data.id || data.primaryId,
      type: data.type || 'user',
      links: data.links || data.identities || [],
      profile: data.profile || {
        firstSeen: data.firstSeen || data.createdAt,
        lastSeen: data.lastSeen || data.updatedAt,
        totalSessions: data.sessions || 0,
        source: data.sources || []
      },
      platforms: data.platforms || [],
      relationships: data.relationships || [],
      risk: data.risk || { score: 0.5, factors: [], lastAssessed: new Date().toISOString() },
      consent: data.consent || {
        marketing: false,
        analytics: true,
        thirdParty: false,
        updatedAt: new Date().toISOString()
      }
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const unifiedIdentityService = new UnifiedIdentityService();
export default unifiedIdentityService;
