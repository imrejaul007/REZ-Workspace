import { v4 as uuidv4 } from 'uuid';
import { HealthcareConsent } from '../models/HealthcareConsent';
import logger from '../utils/logger';

// Record-level consent document interface
export interface IRecordConsent {
  id: string;
  recordId: string;
  recordType: 'visit' | 'medication' | 'lab-result' | 'imaging' | 'procedure' | 'vitals' | 'document';
  profileId: string;
  consentType: 'share' | 'view' | 'edit' | 'delete';
  grantedTo: {
    entityId: string;
    entityType: 'provider' | 'organization' | 'app' | 'care-circle' | 'individual';
    entityName: string;
  };
  status: 'active' | 'expired' | 'revoked';
  grantedAt: Date;
  expiresAt?: Date;
  purpose: string;
  conditions?: {
    timeLimited?: boolean;
    useLimited?: boolean;
    maxUses?: number;
    requiresReconsent?: boolean;
  };
  usageCount: number;
  lastUsedAt?: Date;
  grantedBy: string;
  grantedVia: 'web' | 'mobile' | 'api';
  ipAddress?: string;
  auditLog: Array<{
    action: string;
    performedBy: string;
    performedAt: Date;
    details?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store for record consents (can be moved to separate MongoDB collection)
const recordConsents: Map<string, IRecordConsent> = new Map();

export interface GrantRecordConsentDto {
  recordId: string;
  recordType: IRecordConsent['recordType'];
  profileId: string;
  grantedTo: {
    entityId: string;
    entityType: IRecordConsent['grantedTo']['entityType'];
    entityName: string;
  };
  consentType: IRecordConsent['consentType'];
  purpose: string;
  expiresAt?: Date;
  conditions?: IRecordConsent['conditions'];
  grantedBy: string;
  grantedVia?: 'web' | 'mobile' | 'api';
  ipAddress?: string;
}

export interface CheckRecordAccessDto {
  recordId: string;
  entityId: string;
  requiredPermission?: 'view' | 'share' | 'edit' | 'delete';
}

export class RecordConsentService {
  /**
   * Grant record-level consent
   */
  async grantRecordConsent(dto: GrantRecordConsentDto): Promise<IRecordConsent> {
    try {
      logger.info('Granting record consent', {
        recordId: dto.recordId,
        grantedTo: dto.grantedTo.entityId
      });

      // Check for existing consent
      const existingKey = this.getConsentKey(dto.recordId, dto.grantedTo.entityId);
      let consent = recordConsents.get(existingKey);

      if (consent && consent.status === 'active') {
        // Update existing consent
        consent.consentType = dto.consentType;
        consent.purpose = dto.purpose;
        consent.expiresAt = dto.expiresAt;
        consent.conditions = dto.conditions;
        consent.auditLog.push({
          action: 'modified',
          performedBy: dto.grantedBy,
          performedAt: new Date()
        });
      } else {
        // Create new consent
        consent = {
          id: uuidv4(),
          recordId: dto.recordId,
          recordType: dto.recordType,
          profileId: dto.profileId,
          consentType: dto.consentType,
          grantedTo: dto.grantedTo,
          status: 'active',
          grantedAt: new Date(),
          expiresAt: dto.expiresAt,
          purpose: dto.purpose,
          conditions: dto.conditions,
          usageCount: 0,
          grantedBy: dto.grantedBy,
          grantedVia: dto.grantedVia || 'web',
          ipAddress: dto.ipAddress,
          auditLog: [{
            action: 'granted',
            performedBy: dto.grantedBy,
            performedAt: new Date()
          }]
        };
      }

      recordConsents.set(existingKey, consent);

      logger.info('Record consent granted', { consentId: consent.id });

      return consent;
    } catch (error) {
      logger.error('Failed to grant record consent', { error, dto });
      throw error;
    }
  }

  /**
   * Revoke record consent
   */
  async revokeRecordConsent(
    recordId: string,
    entityId: string,
    revokedBy: string,
    reason?: string
  ): Promise<boolean> {
    try {
      logger.info('Revoking record consent', { recordId, entityId });

      const key = this.getConsentKey(recordId, entityId);
      const consent = recordConsents.get(key);

      if (!consent || consent.status !== 'active') {
        logger.warn('No active consent found to revoke', { recordId, entityId });
        return false;
      }

      consent.status = 'revoked';
      consent.auditLog.push({
        action: 'revoked',
        performedBy: revokedBy,
        performedAt: new Date(),
        details: reason
      });

      recordConsents.set(key, consent);

      logger.info('Record consent revoked', { consentId: consent.id });

      return true;
    } catch (error) {
      logger.error('Failed to revoke record consent', { error, recordId });
      throw error;
    }
  }

  /**
   * Check if entity has access to record
   */
  async checkRecordAccess(dto: CheckRecordAccessDto): Promise<boolean> {
    try {
      logger.debug('Checking record access', dto);

      const key = this.getConsentKey(dto.recordId, dto.entityId);
      const consent = recordConsents.get(key);

      if (!consent || consent.status !== 'active') {
        return false;
      }

      // Check expiration
      if (consent.expiresAt && consent.expiresAt < new Date()) {
        return false;
      }

      // Check usage limits
      if (consent.conditions?.useLimited && consent.conditions?.maxUses) {
        if (consent.usageCount >= consent.conditions.maxUses) {
          return false;
        }
      }

      // Check specific permission
      if (dto.requiredPermission) {
        const hasPermission = this.hasPermission(consent.consentType, dto.requiredPermission);
        if (!hasPermission) {
          return false;
        }
      }

      // Update usage
      consent.usageCount++;
      consent.lastUsedAt = new Date();
      recordConsents.set(key, consent);

      return true;
    } catch (error) {
      logger.error('Failed to check record access', { error, dto });
      return false;
    }
  }

  /**
   * Record access to a record
   */
  async recordAccess(
    recordId: string,
    entityId: string,
    accessedBy: string,
    accessType: 'view' | 'share' | 'edit' | 'download'
  ): Promise<void> {
    try {
      const key = this.getConsentKey(recordId, entityId);
      const consent = recordConsents.get(key);

      if (consent && consent.status === 'active') {
        consent.usageCount++;
        consent.lastUsedAt = new Date();

        consent.auditLog.push({
          action: `accessed-${accessType}`,
          performedBy: accessedBy,
          performedAt: new Date()
        });

        recordConsents.set(key, consent);
      }
    } catch (error) {
      logger.error('Failed to record access', { error, recordId });
    }
  }

  /**
   * Get consents for a record
   */
  async getRecordConsents(recordId: string): Promise<IRecordConsent[]> {
    try {
      const consents: IRecordConsent[] = [];

      recordConsents.forEach((consent) => {
        if (consent.recordId === recordId) {
          consents.push(consent);
        }
      });

      return consents.sort((a, b) =>
        new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime()
      );
    } catch (error) {
      logger.error('Failed to get record consents', { error, recordId });
      return [];
    }
  }

  /**
   * Get consents granted by a profile
   */
  async getProfileRecordConsents(profileId: string): Promise<IRecordConsent[]> {
    try {
      const consents: IRecordConsent[] = [];

      recordConsents.forEach((consent) => {
        if (consent.profileId === profileId) {
          consents.push(consent);
        }
      });

      return consents.sort((a, b) =>
        new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime()
      );
    } catch (error) {
      logger.error('Failed to get profile record consents', { error, profileId });
      return [];
    }
  }

  /**
   * Get consents for an entity
   */
  async getEntityConsents(entityId: string): Promise<IRecordConsent[]> {
    try {
      const consents: IRecordConsent[] = [];

      recordConsents.forEach((consent) => {
        if (consent.grantedTo.entityId === entityId && consent.status === 'active') {
          // Check expiration
          if (!consent.expiresAt || consent.expiresAt > new Date()) {
            consents.push(consent);
          }
        }
      });

      return consents;
    } catch (error) {
      logger.error('Failed to get entity consents', { error, entityId });
      return [];
    }
  }

  /**
   * Expire old consents
   */
  async expireOldConsents(): Promise<number> {
    try {
      const now = new Date();
      let expiredCount = 0;

      recordConsents.forEach((consent, key) => {
        if (consent.status === 'active' && consent.expiresAt && consent.expiresAt < now) {
          consent.status = 'expired';
          consent.auditLog.push({
            action: 'expired',
            performedBy: 'system',
            performedAt: now
          });
          recordConsents.set(key, consent);
          expiredCount++;
        }

        // Check usage limits
        if (consent.status === 'active' && consent.conditions?.useLimited && consent.conditions?.maxUses) {
          if (consent.usageCount >= consent.conditions.maxUses) {
            consent.status = 'expired';
            consent.auditLog.push({
              action: 'expired',
              performedBy: 'system',
              performedAt: now,
              details: 'Maximum usage reached'
            });
            recordConsents.set(key, consent);
            expiredCount++;
          }
        }
      });

      if (expiredCount > 0) {
        logger.info('Expired old consents', { count: expiredCount });
      }

      return expiredCount;
    } catch (error) {
      logger.error('Failed to expire old consents', { error });
      return 0;
    }
  }

  /**
   * Bulk grant consent to multiple records
   */
  async bulkGrantConsent(
    recordIds: string[],
    profileId: string,
    recordType: IRecordConsent['recordType'],
    grantedTo: IRecordConsent['grantedTo'],
    consentType: IRecordConsent['consentType'],
    purpose: string,
    grantedBy: string
  ): Promise<IRecordConsent[]> {
    try {
      logger.info('Bulk granting record consent', {
        recordCount: recordIds.length,
        grantedTo: grantedTo.entityId
      });

      const consents: IRecordConsent[] = [];

      for (const recordId of recordIds) {
        const consent = await this.grantRecordConsent({
          recordId,
          recordType,
          profileId,
          grantedTo,
          consentType,
          purpose,
          grantedBy
        });
        consents.push(consent);
      }

      logger.info('Bulk consent granted', { count: consents.length });

      return consents;
    } catch (error) {
      logger.error('Failed to bulk grant consent', { error, recordIds });
      throw error;
    }
  }

  private getConsentKey(recordId: string, entityId: string): string {
    return `${recordId}:${entityId}`;
  }

  private hasPermission(grantedPermission: string, requiredPermission: string): boolean {
    const permissionHierarchy: Record<string, string[]> = {
      'delete': ['delete', 'edit', 'share', 'view'],
      'edit': ['edit', 'share', 'view'],
      'share': ['share', 'view'],
      'view': ['view']
    };

    const allowedPermissions = permissionHierarchy[grantedPermission] || [];
    return allowedPermissions.includes(requiredPermission);
  }
}

export const recordConsentService = new RecordConsentService();
