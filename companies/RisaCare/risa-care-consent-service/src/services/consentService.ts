import { v4 as uuidv4 } from 'uuid';
import {
  HealthcareConsent,
  IHealthcareConsent,
  IConsentPurpose,
  IGrantedEntity
} from '../models/HealthcareConsent';
import logger from '../utils/logger';

export interface GrantConsentDto {
  profileId: string;
  consentType: IHealthcareConsent['consentType'];
  version: string;
  purposes: Array<{
    category: IConsentPurpose['category'];
    description: string;
    allowed: boolean;
  }>;
  grantedEntities?: Array<{
    entityId: string;
    entityType: 'provider' | 'organization' | 'app';
    entityName: string;
    permissions: string[];
    expiresAt?: Date;
  }>;
  expiresAt?: Date;
  grantedVia?: 'web' | 'mobile' | 'verbal' | 'written' | 'api';
  signature?: {
    signedBy: string;
    signature: string;
    method: 'electronic' | 'manual' | 'verbal';
  };
  documents?: Array<{
    documentId: string;
    documentType: string;
    url?: string;
    hash?: string;
  }>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface RevokeConsentDto {
  profileId: string;
  consentType: IHealthcareConsent['consentType'];
  reason: string;
  revokedBy: string;
}

export interface UpdateConsentDto {
  profileId: string;
  consentType: IHealthcareConsent['consentType'];
  purposes?: IConsentPurpose[];
  grantedEntities?: IGrantedEntity[];
  metadata?: Record<string, unknown>;
}

export interface AddEntityDto {
  profileId: string;
  consentType: IHealthcareConsent['consentType'];
  entity: {
    entityId: string;
    entityType: 'provider' | 'organization' | 'app';
    entityName: string;
    permissions: string[];
    expiresAt?: Date;
  };
}

export class ConsentService {
  /**
   * Grant healthcare consent
   */
  async grantConsent(dto: GrantConsentDto): Promise<IHealthcareConsent> {
    try {
      logger.info('Granting healthcare consent', {
        profileId: dto.profileId,
        consentType: dto.consentType
      });

      // Check for existing active consent of same type
      const existingConsent = await HealthcareConsent.findOne({
        profileId: dto.profileId,
        consentType: dto.consentType,
        status: 'active'
      });

      if (existingConsent) {
        logger.warn('Active consent already exists, revoking old one', {
          existingId: existingConsent.id
        });

        // Revoke existing consent
        existingConsent.status = 'revoked';
        existingConsent.revokedAt = new Date();
        existingConsent.revokedBy = dto.profileId;
        existingConsent.revocationReason = 'Replaced by new consent grant';

        existingConsent.auditLog.push({
          action: 'revoked',
          performedBy: dto.profileId,
          performedAt: new Date(),
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          reason: 'Replaced by new consent grant'
        });

        await existingConsent.save();
      }

      // Create new consent
      const consentId = uuidv4();
      const now = new Date();

      const consent = new HealthcareConsent({
        id: consentId,
        profileId: dto.profileId,
        consentType: dto.consentType,
        version: dto.version,
        status: 'active',
        purposes: dto.purposes,
        grantedEntities: dto.grantedEntities?.map(e => ({
          ...e,
          grantedAt: now
        })) || [],
        grantedAt: now,
        grantedVia: dto.grantedVia || 'web',
        expiresAt: dto.expiresAt,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        signatures: dto.signature ? [{
          signedBy: dto.signature.signedBy,
          signature: dto.signature.signature,
          signedAt: now,
          method: dto.signature.method
        }] : [],
        documents: dto.documents || [],
        auditLog: [{
          action: 'granted',
          performedBy: dto.profileId,
          performedAt: now,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent
        }],
        metadata: dto.metadata
      });

      await consent.save();

      logger.info('Healthcare consent granted', {
        consentId,
        profileId: dto.profileId,
        consentType: dto.consentType
      });

      return consent.toJSON() as IHealthcareConsent;
    } catch (error) {
      logger.error('Failed to grant consent', { error, dto });
      throw error;
    }
  }

  /**
   * Revoke consent
   */
  async revokeConsent(dto: RevokeConsentDto): Promise<IHealthcareConsent | null> {
    try {
      logger.info('Revoking consent', {
        profileId: dto.profileId,
        consentType: dto.consentType
      });

      const consent = await HealthcareConsent.findOne({
        profileId: dto.profileId,
        consentType: dto.consentType,
        status: 'active'
      });

      if (!consent) {
        logger.warn('No active consent found to revoke', {
          profileId: dto.profileId,
          consentType: dto.consentType
        });
        return null;
      }

      consent.status = 'revoked';
      consent.revokedAt = new Date();
      consent.revocationReason = dto.reason;
      consent.revokedBy = dto.revokedBy;

      consent.auditLog.push({
        action: 'revoked',
        performedBy: dto.revokedBy,
        performedAt: new Date(),
        reason: dto.reason
      });

      await consent.save();

      logger.info('Consent revoked', { consentId: consent.id });

      return consent.toJSON() as IHealthcareConsent;
    } catch (error) {
      logger.error('Failed to revoke consent', { error, dto });
      throw error;
    }
  }

  /**
   * Get consent record
   */
  async getConsentRecord(
    profileId: string,
    consentType?: IHealthcareConsent['consentType']
  ): Promise<IHealthcareConsent[]> {
    try {
      logger.info('Fetching consent records', { profileId, consentType });

      const query: Record<string, unknown> = { profileId };
      if (consentType) {
        query.consentType = consentType;
      }

      const consents = await HealthcareConsent.find(query)
        .sort({ createdAt: -1 })
        .lean();

      return consents as IHealthcareConsent[];
    } catch (error) {
      logger.error('Failed to fetch consent records', { error, profileId });
      throw error;
    }
  }

  /**
   * Check if consent is valid
   */
  async isConsentValid(
    profileId: string,
    consentType: IHealthcareConsent['consentType'],
    purpose?: IConsentPurpose['category']
  ): Promise<boolean> {
    try {
      const consent = await HealthcareConsent.findOne({
        profileId,
        consentType,
        status: 'active'
      });

      if (!consent) return false;

      // Check expiration
      if (consent.expiresAt && consent.expiresAt < new Date()) {
        return false;
      }

      // Check specific purpose if provided
      if (purpose) {
        const purposeConsent = consent.purposes.find(p => p.category === purpose);
        return purposeConsent ? purposeConsent.allowed : false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to check consent validity', { error, profileId });
      return false;
    }
  }

  /**
   * Check if entity has access
   */
  async hasEntityAccess(
    profileId: string,
    entityId: string,
    permission?: string
  ): Promise<boolean> {
    try {
      const consent = await HealthcareConsent.findOne({
        profileId,
        status: 'active'
      });

      if (!consent) return false;

      const entity = consent.grantedEntities.find(
        e => e.entityId === entityId &&
        (!e.expiresAt || e.expiresAt > new Date())
      );

      if (!entity) return false;

      if (permission) {
        return entity.permissions.includes(permission);
      }

      return true;
    } catch (error) {
      logger.error('Failed to check entity access', { error, profileId });
      return false;
    }
  }

  /**
   * Add entity to consent
   */
  async addEntity(dto: AddEntityDto): Promise<IHealthcareConsent | null> {
    try {
      logger.info('Adding entity to consent', {
        profileId: dto.profileId,
        consentType: dto.consentType,
        entityId: dto.entity.entityId
      });

      const consent = await HealthcareConsent.findOne({
        profileId: dto.profileId,
        consentType: dto.consentType,
        status: 'active'
      });

      if (!consent) {
        throw new Error('No active consent found');
      }

      // Check if entity already exists
      const existingIndex = consent.grantedEntities.findIndex(
        e => e.entityId === dto.entity.entityId
      );

      if (existingIndex >= 0) {
        // Update existing entity
        consent.grantedEntities[existingIndex] = {
          ...dto.entity,
          grantedAt: new Date()
        };
      } else {
        // Add new entity
        consent.grantedEntities.push({
          ...dto.entity,
          grantedAt: new Date()
        });
      }

      consent.auditLog.push({
        action: 'modified',
        performedBy: dto.profileId,
        performedAt: new Date(),
        newValue: { entityAdded: dto.entity }
      });

      await consent.save();

      return consent.toJSON() as IHealthcareConsent;
    } catch (error) {
      logger.error('Failed to add entity to consent', { error, dto });
      throw error;
    }
  }

  /**
   * Remove entity from consent
   */
  async removeEntity(
    profileId: string,
    consentType: IHealthcareConsent['consentType'],
    entityId: string
  ): Promise<IHealthcareConsent | null> {
    try {
      logger.info('Removing entity from consent', {
        profileId,
        consentType,
        entityId
      });

      const consent = await HealthcareConsent.findOne({
        profileId,
        consentType,
        status: 'active'
      });

      if (!consent) {
        throw new Error('No active consent found');
      }

      const entityIndex = consent.grantedEntities.findIndex(
        e => e.entityId === entityId
      );

      if (entityIndex < 0) {
        throw new Error('Entity not found in consent');
      }

      const removedEntity = consent.grantedEntities[entityIndex];
      consent.grantedEntities.splice(entityIndex, 1);

      consent.auditLog.push({
        action: 'modified',
        performedBy: profileId,
        performedAt: new Date(),
        previousValue: { entityRemoved: removedEntity }
      });

      await consent.save();

      return consent.toJSON() as IHealthcareConsent;
    } catch (error) {
      logger.error('Failed to remove entity from consent', { error, profileId });
      throw error;
    }
  }

  /**
   * Update consent purposes
   */
  async updatePurposes(
    profileId: string,
    consentType: IHealthcareConsent['consentType'],
    purposes: IConsentPurpose[]
  ): Promise<IHealthcareConsent | null> {
    try {
      logger.info('Updating consent purposes', { profileId, consentType });

      const consent = await HealthcareConsent.findOne({
        profileId,
        consentType,
        status: 'active'
      });

      if (!consent) {
        throw new Error('No active consent found');
      }

      const previousPurposes = [...consent.purposes];
      consent.purposes = purposes;

      consent.auditLog.push({
        action: 'modified',
        performedBy: profileId,
        performedAt: new Date(),
        previousValue: { purposes: previousPurposes },
        newValue: { purposes }
      });

      await consent.save();

      return consent.toJSON() as IHealthcareConsent;
    } catch (error) {
      logger.error('Failed to update consent purposes', { error, profileId });
      throw error;
    }
  }

  /**
   * Verify consent (re-confirm)
   */
  async verifyConsent(
    profileId: string,
    consentType: IHealthcareConsent['consentType']
  ): Promise<IHealthcareConsent | null> {
    try {
      logger.info('Verifying consent', { profileId, consentType });

      const consent = await HealthcareConsent.findOne({
        profileId,
        consentType,
        status: 'active'
      });

      if (!consent) {
        return null;
      }

      consent.lastVerifiedAt = new Date();

      consent.auditLog.push({
        action: 'accessed',
        performedBy: profileId,
        performedAt: new Date()
      });

      await consent.save();

      return consent.toJSON() as IHealthcareConsent;
    } catch (error) {
      logger.error('Failed to verify consent', { error, profileId });
      throw error;
    }
  }

  /**
   * Get consent audit log
   */
  async getAuditLog(
    profileId: string,
    consentType?: IHealthcareConsent['consentType']
  ): Promise<any[]> {
    try {
      const consents = await this.getConsentRecord(profileId, consentType);
      const auditLogs: any[] = [];

      for (const consent of consents) {
        for (const entry of consent.auditLog) {
          auditLogs.push({
            consentId: consent.id,
            consentType: consent.consentType,
            ...entry
          });
        }
      }

      return auditLogs.sort((a, b) =>
        new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
      );
    } catch (error) {
      logger.error('Failed to get audit log', { error, profileId });
      throw error;
    }
  }
}

export const consentService = new ConsentService();
