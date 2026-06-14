/**
 * REZ Trust & Governance Service
 *
 * Data ownership, consent, privacy, and access control
 *
 * Features:
 * - Consent management
 * - Privacy controls
 * - Access permissions
 * - Data residency
 * - Audit logging
 * - GDPR/DPDP compliance
 * - Federated permissions
 */

import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type ConsentType =
  | 'marketing'
  | 'analytics'
  | 'personalization'
  | 'third_party_sharing'
  | 'location_tracking'
  | 'profile_data'
  | 'purchase_history'
  | 'behavior_tracking';

export type ConsentStatus = 'granted' | 'denied' | 'withdrawn' | 'pending';

export type DataCategory =
  | 'identity'
  | 'contact'
  | 'financial'
  | 'location'
  | 'behavior'
  | 'preferences'
  | 'purchase_history'
  | 'health'
  | 'employment';

export type AccessLevel = 'none' | 'read' | 'write' | 'admin';

export interface Consent {
  id: string;
  userId: string;
  type: ConsentType;
  status: ConsentStatus;
  grantedAt?: string;
  withdrawnAt?: string;
  source: 'explicit' | 'implicit' | 'system';
  version: string;
}

export interface PrivacySettings {
  userId: string;
  dataRetention: {
    purchaseHistory: number;     // Days
    locationHistory: number;     // Days
    browsingHistory: number;     // Days
    engagementData: number;      // Days
  };
  sharingPreferences: {
    shareWithMerchants: boolean;
    shareWithPartners: boolean;
    allowAnalytics: boolean;
    allowPersonalization: boolean;
  };
  dataExportEnabled: boolean;
  dataDeletionEnabled: boolean;
}

export interface AccessPermission {
  id: string;
  subjectId: string;           // Who is accessing
  subjectType: 'user' | 'merchant' | 'service' | 'partner';
  resourceType: 'profile' | 'purchase_history' | 'location' | 'preferences' | 'segments';
  resourceId?: string;         // Specific resource
  accessLevel: AccessLevel;
  conditions?: {
    purpose?: string;
    expiresAt?: string;
    ipWhitelist?: string[];
  };
  grantedBy: string;
  grantedAt: string;
}

export interface DataAccessRequest {
  id: string;
  requesterId: string;
  requesterType: 'user' | 'merchant' | 'partner' | 'service';
  purpose: string;
  dataCategories: DataCategory[];
  resources: string[];
  status: 'pending' | 'approved' | 'denied' | 'expired';
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  reason?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    type: 'user' | 'merchant' | 'service' | 'system' | 'partner';
  };
  action: string;
  resource: {
    type: string;
    id: string;
  };
  outcome: 'success' | 'denied' | 'error';
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface Data Residency {
  region: 'IN' | 'US' | 'EU' | 'SG';
  userId: string;
  primaryDataRegion: string;
  backupRegion?: string;
  lastVerified: string;
}

// ============================================================================
// Consent Store
// ============================================================================

class ConsentStore {
  private consents: Map<string, Consent[]> = new Map();
  private consentVersions: Map<string, string> = new Map();

  constructor() {
    // Initialize with default consent version
    this.consentVersions.set('global', '1.0.0');
  }

  async grantConsent(userId: string, type: ConsentType, source: 'explicit' | 'implicit' = 'explicit'): Promise<Consent> {
    const existing = this.getConsent(userId, type);

    const consent: Consent = {
      id: randomUUID(),
      userId,
      type,
      status: 'granted',
      grantedAt: new Date().toISOString(),
      source,
      version: this.consentVersions.get('global') || '1.0.0'
    };

    const userConsents = this.consents.get(userId) || [];
    const existingIndex = userConsents.findIndex(c => c.type === type);

    if (existingIndex >= 0) {
      userConsents[existingIndex] = consent;
    } else {
      userConsents.push(consent);
    }

    this.consents.set(userId, userConsents);

    return consent;
  }

  async withdrawConsent(userId: string, type: ConsentType): Promise<Consent> {
    const userConsents = this.consents.get(userId) || [];
    const existing = userConsents.find(c => c.type === type);

    if (!existing) {
      throw new Error(`Consent ${type} not found for user ${userId}`);
    }

    existing.status = 'withdrawn';
    existing.withdrawnAt = new Date().toISOString();

    return existing;
  }

  async getConsent(userId: string, type: ConsentType): Promise<Consent | null> {
    const userConsents = this.consents.get(userId) || [];
    return userConsents.find(c => c.type === type) || null;
  }

  async getUserConsents(userId: string): Promise<Consent[]> {
    return this.consents.get(userId) || [];
  }

  async hasConsent(userId: string, type: ConsentType): Promise<boolean> {
    const consent = await this.getConsent(userId, type);
    return consent?.status === 'granted';
  }

  async checkConsentForDataAccess(userId: string, dataCategory: DataCategory): Promise<boolean> {
    const consentMap: Record<DataCategory, ConsentType[]> = {
      'identity': ['profile_data'],
      'contact': ['profile_data'],
      'financial': ['purchase_history'],
      'location': ['location_tracking'],
      'behavior': ['behavior_tracking', 'analytics'],
      'preferences': ['personalization'],
      'purchase_history': ['purchase_history'],
      'health': ['profile_data'],
      'employment': ['profile_data']
    };

    const requiredConsents = consentMap[dataCategory] || [];
    for (const consentType of requiredConsents) {
      const has = await this.hasConsent(userId, consentType);
      if (!has) return false;
    }

    return true;
  }
}

// ============================================================================
// Privacy Store
// ============================================================================

class PrivacyStore {
  private settings: Map<string, PrivacySettings> = new Map();

  constructor() {}

  async getSettings(userId: string): Promise<PrivacySettings> {
    return this.settings.get(userId) || this.getDefaultSettings(userId);
  }

  async updateSettings(userId: string, updates: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const current = await this.getSettings(userId);
    const updated = { ...current, ...updates };
    this.settings.set(userId, updated);
    return updated;
  }

  private getDefaultSettings(userId: string): PrivacySettings {
    return {
      userId,
      dataRetention: {
        purchaseHistory: 365,
        locationHistory: 90,
        browsingHistory: 30,
        engagementData: 180
      },
      sharingPreferences: {
        shareWithMerchants: true,
        shareWithPartners: false,
        allowAnalytics: true,
        allowPersonalization: true
      },
      dataExportEnabled: true,
      dataDeletionEnabled: true
    };
  }
}

// ============================================================================
// Access Control
// ============================================================================

class AccessControl {
  private permissions: Map<string, AccessPermission[]> = new Map();
  private pendingRequests: DataAccessRequest[] = [];

  constructor() {}

  async grantAccess(permission: Omit<AccessPermission, 'id' | 'grantedAt'>): Promise<AccessPermission> {
    const fullPermission: AccessPermission = {
      ...permission,
      id: randomUUID(),
      grantedAt: new Date().toISOString()
    };

    const key = `${permission.subjectId}:${permission.resourceType}`;
    const existing = this.permissions.get(key) || [];
    existing.push(fullPermission);
    this.permissions.set(key, existing);

    return fullPermission;
  }

  async revokeAccess(permissionId: string): Promise<boolean> {
    for (const [key, perms] of this.permissions) {
      const index = perms.findIndex(p => p.id === permissionId);
      if (index >= 0) {
        perms.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  async checkAccess(
    subjectId: string,
    subjectType: AccessPermission['subjectType'],
    resourceType: string,
    resourceId?: string,
    purpose?: string
  ): Promise<AccessLevel> {
    const key = `${subjectId}:${resourceType}`;
    const permissions = this.permissions.get(key) || [];

    for (const perm of permissions) {
      // Check if permission applies
      if (perm.resourceId && perm.resourceId !== resourceId) continue;
      if (perm.conditions?.expiresAt && new Date(perm.conditions.expiresAt) < new Date()) continue;

      // Check purpose if required
      if (perm.conditions?.purpose && purpose && perm.conditions.purpose !== purpose) continue;

      // Check IP whitelist
      // In production, check against IP whitelist

      return perm.accessLevel;
    }

    // Default: check system-wide permissions
    if (subjectType === 'service') {
      return 'read'; // Services can read by default
    }

    return 'none';
  }

  async requestAccess(request: Omit<DataAccessRequest, 'id' | 'status' | 'requestedAt'>): Promise<DataAccessRequest> {
    const fullRequest: DataAccessRequest = {
      ...request,
      id: randomUUID(),
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    this.pendingRequests.push(fullRequest);
    return fullRequest;
  }

  async approveRequest(requestId: string, approvedBy: string, reason?: string): Promise<DataAccessRequest | null> {
    const request = this.pendingRequests.find(r => r.id === requestId);
    if (!request) return null;

    request.status = 'approved';
    request.decidedAt = new Date().toISOString();
    request.decidedBy = approvedBy;
    request.reason = reason;

    // Grant the permission
    await this.grantAccess({
      subjectId: request.requesterId,
      subjectType: request.requesterType,
      resourceType: request.dataCategories[0],
      accessLevel: 'read',
      grantedBy: approvedBy,
      conditions: { purpose: request.purpose }
    });

    return request;
  }

  async denyRequest(requestId: string, deniedBy: string, reason: string): Promise<DataAccessRequest | null> {
    const request = this.pendingRequests.find(r => r.id === requestId);
    if (!request) return null;

    request.status = 'denied';
    request.decidedAt = new Date().toISOString();
    request.decidedBy = deniedBy;
    request.reason = reason;

    return request;
  }
}

// ============================================================================
// Audit Logger
// ============================================================================

class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs = 100000;

  constructor() {}

  async log(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const fullLog: AuditLog = {
      ...log,
      id: randomUUID(),
      timestamp: new Date().toISOString()
    };

    this.logs.push(fullLog);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    return fullLog;
  }

  async query(filters: {
    actorId?: string;
    actorType?: AuditLog['actor']['type'];
    action?: string;
    resourceType?: string;
    startTime?: string;
    endTime?: string;
    outcome?: AuditLog['outcome'];
  }): Promise<AuditLog[]> {
    let results = [...this.logs];

    if (filters.actorId) {
      results = results.filter(l => l.actor.id === filters.actorId);
    }
    if (filters.actorType) {
      results = results.filter(l => l.actor.type === filters.actorType);
    }
    if (filters.action) {
      results = results.filter(l => l.action === filters.action);
    }
    if (filters.resourceType) {
      results = results.filter(l => l.resource.type === filters.resourceType);
    }
    if (filters.outcome) {
      results = results.filter(l => l.outcome === filters.outcome);
    }
    if (filters.startTime) {
      const start = new Date(filters.startTime).getTime();
      results = results.filter(l => new Date(l.timestamp).getTime() >= start);
    }
    if (filters.endTime) {
      const end = new Date(filters.endTime).getTime();
      results = results.filter(l => new Date(l.timestamp).getTime() <= end);
    }

    return results.slice(-1000); // Return last 1000
  }

  async getUserAuditTrail(userId: string, limit = 100): Promise<AuditLog[]> {
    return this.logs.filter(l =>
      l.actor.id === userId ||
      l.resource.id === userId
    ).slice(-limit);
  }
}

// ============================================================================
// Data Residency
// ============================================================================

class DataResidencyManager {
  private residency: Map<string, DataResidency> = new Map();

  constructor() {}

  async setResidency(userId: string, region: DataResidency['region']): Promise<DataResidency> {
    const residency: DataResidency = {
      region,
      userId,
      primaryDataRegion: region,
      lastVerified: new Date().toISOString()
    };

    this.residency.set(userId, residency);
    return residency;
  }

  async getResidency(userId: string): Promise<DataResidency | null> {
    return this.residency.get(userId) || null;
  }

  async getStorageLocation(userId: string, dataCategory: DataCategory): Promise<string> {
    const residency = await this.getResidency(userId);

    // Sensitive data stays in primary region
    const sensitiveCategories: DataCategory[] = ['health', 'financial', 'employment'];
    if (sensitiveCategories.includes(dataCategory)) {
      return residency?.primaryDataRegion || 'IN';
    }

    // Non-sensitive can use any region
    return 'IN'; // Default to India for now
  }
}

// ============================================================================
// Governance Service
// ============================================================================

export class GovernanceService {
  private consentStore: ConsentStore;
  private privacyStore: PrivacyStore;
  private accessControl: AccessControl;
  private auditLogger: AuditLogger;
  private dataResidency: DataResidencyManager;

  constructor() {
    this.consentStore = new ConsentStore();
    this.privacyStore = new PrivacyStore();
    this.accessControl = new AccessControl();
    this.auditLogger = new AuditLogger();
    this.dataResidency = new DataResidencyManager();
  }

  // ============================================
  // Consent Management
  // ============================================

  async grantConsent(userId: string, type: ConsentType): Promise<Consent> {
    const consent = await this.consentStore.grantConsent(userId, type);

    await this.auditLogger.log({
      actor: { id: userId, type: 'user' },
      action: 'consent.granted',
      resource: { type: 'consent', id: consent.id },
      outcome: 'success',
      details: { consentType: type }
    });

    return consent;
  }

  async withdrawConsent(userId: string, type: ConsentType): Promise<Consent> {
    const consent = await this.consentStore.withdrawConsent(userId, type);

    await this.auditLogger.log({
      actor: { id: userId, type: 'user' },
      action: 'consent.withdrawn',
      resource: { type: 'consent', id: consent.id },
      outcome: 'success',
      details: { consentType: type }
    });

    return consent;
  }

  async getUserConsents(userId: string): Promise<Consent[]> {
    return this.consentStore.getUserConsents(userId);
  }

  async canAccessData(userId: string, dataCategory: DataCategory): Promise<boolean> {
    return this.consentStore.checkConsentForDataAccess(userId, dataCategory);
  }

  // ============================================
  // Privacy Settings
  // ============================================

  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    return this.privacyStore.getSettings(userId);
  }

  async updatePrivacySettings(userId: string, updates: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const settings = await this.privacyStore.updateSettings(userId, updates);

    await this.auditLogger.log({
      actor: { id: userId, type: 'user' },
      action: 'privacy.settings.updated',
      resource: { type: 'privacy_settings', id: userId },
      outcome: 'success',
      details: { updates: Object.keys(updates) }
    });

    return settings;
  }

  // ============================================
  // Access Control
  // ============================================

  async checkAccess(
    subjectId: string,
    subjectType: 'user' | 'merchant' | 'service' | 'partner',
    resourceType: string,
    resourceId?: string,
    purpose?: string
  ): Promise<AccessLevel> {
    return this.accessControl.checkAccess(subjectId, subjectType, resourceType, resourceId, purpose);
  }

  async grantAccess(permission: Omit<AccessPermission, 'id' | 'grantedAt'>): Promise<AccessPermission> {
    const access = await this.accessControl.grantAccess(permission);

    await this.auditLogger.log({
      actor: { id: permission.grantedBy, type: 'service' },
      action: 'access.granted',
      resource: { type: permission.resourceType, id: permission.resourceId || 'all' },
      outcome: 'success',
      details: {
        subjectId: permission.subjectId,
        accessLevel: permission.accessLevel
      }
    });

    return access;
  }

  async requestDataAccess(request: Omit<DataAccessRequest, 'id' | 'status' | 'requestedAt'>): Promise<DataAccessRequest> {
    return this.accessControl.requestAccess(request);
  }

  // ============================================
  // Audit
  // ============================================

  async getAuditTrail(userId: string, limit?: number): Promise<AuditLog[]> {
    return this.auditLogger.getUserAuditTrail(userId, limit);
  }

  async queryAuditLogs(filters: Parameters<typeof this.auditLogger.query>[0]): Promise<AuditLog[]> {
    return this.auditLogger.query(filters);
  }

  // ============================================
  // Data Residency
  // ============================================

  async setDataResidency(userId: string, region: DataResidency['region']): Promise<DataResidency> {
    return this.dataResidency.setResidency(userId, region);
  }

  async getStorageLocation(userId: string, dataCategory: DataCategory): Promise<string> {
    return this.dataResidency.getStorageLocation(userId, dataCategory);
  }

  // ============================================
  // Data Rights (GDPR/DPDP Compliance)
  // ============================================

  async exportUserData(userId: string): Promise<{
    profile;
    consents: Consent[];
    privacySettings: PrivacySettings;
    auditTrail: AuditLog[];
    exportedAt: string;
  }> {
    return {
      profile: null, // Would fetch from profile service
      consents: await this.getUserConsents(userId),
      privacySettings: await this.getPrivacySettings(userId),
      auditTrail: await this.getAuditTrail(userId, 1000),
      exportedAt: new Date().toISOString()
    };
  }

  async deleteUserData(userId: string): Promise<{
    success: boolean;
    deletedAt: string;
    itemsDeleted: number;
  }> {
    // Log deletion request
    await this.auditLogger.log({
      actor: { id: userId, type: 'user' },
      action: 'data.deletion.requested',
      resource: { type: 'user_data', id: userId },
      outcome: 'success'
    });

    // In production: trigger deletion workflows across all services
    return {
      success: true,
      deletedAt: new Date().toISOString(),
      itemsDeleted: 0 // Would count actual deletions
    };
  }

  // ============================================
  // Merchant Data Isolation
  // ============================================

  async getMerchantDataPermissions(merchantId: string): Promise<{
    canAccess: DataCategory[];
    cannotAccess: DataCategory[];
    conditions: string[];
  }> {
    return {
      canAccess: ['purchase_history', 'preferences', 'behavior'],
      cannotAccess: ['identity', 'contact', 'health', 'employment'],
      conditions: [
        'Purpose: improving merchant services only',
        'Cannot share with third parties',
        'Must delete upon merchant contract termination'
      ]
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const governanceService = new GovernanceService();
export default governanceService;
