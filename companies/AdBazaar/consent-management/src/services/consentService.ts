import { Consent, ConsentType, ComplianceFramework, IConsent } from '../models/Consent';
import { ConsentHistory } from '../models/ConsentHistory';
import { ConsentAudit } from '../models/ConsentAudit';
import { logger } from 'utils/logger.js';
import { metrics } from '../utils/metrics';

interface ConsentInput {
  userId: string;
  type: ConsentType;
  framework?: ComplianceFramework;
  granted: boolean;
  source?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

interface ConsentUpdate {
  granted?: boolean;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  source?: string;
}

interface BulkConsentInput {
  userId: string;
  consents: {
    type: ConsentType;
    granted: boolean;
  }[];
  framework?: ComplianceFramework;
  source?: string;
  ip?: string;
  userAgent?: string;
}

class ConsentService {
  /**
   * Create or update a consent record
   */
  async recordConsent(input: ConsentInput): Promise<IConsent> {
    const framework = input.framework || ComplianceFramework.GDPR;

    logger.info('Recording consent', {
      userId: input.userId,
      type: input.type,
      framework,
      granted: input.granted
    });

    const existingConsent = await Consent.findOne({
      userId: input.userId,
      type: input.type,
      framework
    });

    let consent: IConsent;
    const changes: { field: string; oldValue: any; newValue: any }[] = [];

    if (existingConsent) {
      // Update existing consent
      const oldGranted = existingConsent.granted;
      existingConsent.granted = input.granted;
      existingConsent.version += 1;

      if (input.granted) {
        existingConsent.grantedAt = new Date();
        existingConsent.withdrawnAt = undefined;
      } else {
        existingConsent.withdrawnAt = new Date();
      }

      if (input.metadata) {
        existingConsent.metadata = { ...existingConsent.metadata, ...input.metadata };
      }

      if (input.expiresAt) {
        existingConsent.expiresAt = input.expiresAt;
      }

      if (input.ip) existingConsent.ip = input.ip;
      if (input.userAgent) existingConsent.userAgent = input.userAgent;

      changes.push({
        field: 'granted',
        oldValue: oldGranted,
        newValue: input.granted
      });

      await existingConsent.save();
      consent = existingConsent;

      // Record history
      await ConsentHistory.create({
        userId: input.userId,
        consentType: input.type,
        framework,
        changes,
        action: input.granted ? 'granted' : 'withdrawn',
        source: input.source || 'api',
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: input.metadata,
        timestamp: new Date()
      });
    } else {
      // Create new consent
      consent = await Consent.create({
        userId: input.userId,
        type: input.type,
        framework,
        granted: input.granted,
        grantedAt: input.granted ? new Date() : undefined,
        withdrawnAt: input.granted ? undefined : new Date(),
        source: input.source || 'direct',
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: input.metadata || {},
        expiresAt: input.expiresAt,
        version: 1
      });

      // Record history
      await ConsentHistory.create({
        userId: input.userId,
        consentType: input.type,
        framework,
        changes: [{ field: 'created', oldValue: null, newValue: input.granted }],
        action: input.granted ? 'granted' : 'withdrawn',
        source: input.source || 'direct',
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: input.metadata,
        timestamp: new Date()
      });
    }

    // Record audit
    await ConsentAudit.create({
      userId: input.userId,
      consentType: input.type,
      framework,
      action: input.granted ? 'granted' : 'withdrawn',
      actor: 'user',
      ip: input.ip,
      userAgent: input.userAgent,
      timestamp: new Date()
    });

    // Update metrics
    if (input.granted) {
      metrics.consentGranted.inc({ type: input.type, framework });
    } else {
      metrics.consentWithdrawn.inc({ type: input.type, framework });
    }

    logger.info('Consent recorded successfully', {
      userId: input.userId,
      type: input.type,
      consentId: consent._id
    });

    return consent;
  }

  /**
   * Get all consents for a user
   */
  async getUserConsents(userId: string, framework?: ComplianceFramework): Promise<IConsent[]> {
    const query: any = { userId };
    if (framework) {
      query.framework = framework;
    }

    logger.info('Fetching user consents', { userId, framework });

    const consents = await Consent.find(query).sort({ createdAt: -1 });

    // Record access audit
    await ConsentAudit.create({
      userId,
      consentType: ConsentType.DATA_PROCESSING,
      framework: framework || ComplianceFramework.GDPR,
      action: 'accessed',
      actor: 'system',
      timestamp: new Date()
    });

    metrics.consentQueries.inc({ type: 'user' });

    return consents;
  }

  /**
   * Get a specific consent
   */
  async getConsent(userId: string, type: ConsentType, framework?: ComplianceFramework): Promise<IConsent | null> {
    const query: any = { userId, type };
    if (framework) {
      query.framework = framework;
    }

    return Consent.findOne(query);
  }

  /**
   * Update consent
   */
  async updateConsent(
    userId: string,
    type: ConsentType,
    update: ConsentUpdate,
    framework?: ComplianceFramework,
    ip?: string,
    userAgent?: string
  ): Promise<IConsent | null> {
    const query: any = { userId, type };
    if (framework) {
      query.framework = framework;
    }

    const existingConsent = await Consent.findOne(query);
    if (!existingConsent) {
      return null;
    }

    const changes: { field: string; oldValue: any; newValue: any }[] = [];

    if (update.granted !== undefined && update.granted !== existingConsent.granted) {
      changes.push({
        field: 'granted',
        oldValue: existingConsent.granted,
        newValue: update.granted
      });
      existingConsent.granted = update.granted;

      if (update.granted) {
        existingConsent.grantedAt = new Date();
        existingConsent.withdrawnAt = undefined;
      } else {
        existingConsent.withdrawnAt = new Date();
      }
    }

    if (update.metadata) {
      existingConsent.metadata = { ...existingConsent.metadata, ...update.metadata };
      changes.push({
        field: 'metadata',
        oldValue: {},
        newValue: update.metadata
      });
    }

    if (update.expiresAt) {
      existingConsent.expiresAt = update.expiresAt;
    }

    existingConsent.version += 1;
    existingConsent.ip = ip || existingConsent.ip;
    existingConsent.userAgent = userAgent || existingConsent.userAgent;

    await existingConsent.save();

    // Record history
    await ConsentHistory.create({
      userId,
      consentType: type,
      framework: framework || ComplianceFramework.GDPR,
      changes,
      action: 'updated',
      source: update.source || 'api',
      ip,
      userAgent,
      timestamp: new Date()
    });

    // Record audit
    await ConsentAudit.create({
      userId,
      consentType: type,
      framework: framework || ComplianceFramework.GDPR,
      action: 'updated',
      actor: 'user',
      ip,
      userAgent,
      timestamp: new Date()
    });

    metrics.consentUpdated.inc({ type, framework: framework || 'gdpr' });

    logger.info('Consent updated successfully', { userId, type });

    return existingConsent;
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    userId: string,
    type: ConsentType,
    framework?: ComplianceFramework,
    ip?: string,
    userAgent?: string
  ): Promise<IConsent | null> {
    return this.updateConsent(
      userId,
      type,
      { granted: false },
      framework,
      ip,
      userAgent
    );
  }

  /**
   * Bulk consent update
   */
  async bulkUpdateConsents(input: BulkConsentInput): Promise<{ success: number; failed: number; results: any[] }> {
    const results: any[] = [];
    let success = 0;
    let failed = 0;

    const framework = input.framework || ComplianceFramework.GDPR;

    logger.info('Processing bulk consent update', {
      userId: input.userId,
      consentCount: input.consents.length
    });

    for (const consent of input.consents) {
      try {
        const result = await this.recordConsent({
          userId: input.userId,
          type: consent.type,
          framework,
          granted: consent.granted,
          source: input.source || 'bulk',
          ip: input.ip,
          userAgent: input.userAgent
        });

        results.push({
          type: consent.type,
          success: true,
          consentId: result._id
        });
        success++;
      } catch (error: any) {
        results.push({
          type: consent.type,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    metrics.bulkOperations.inc();

    logger.info('Bulk consent update completed', { success, failed });

    return { success, failed, results };
  }

  /**
   * Delete all consents for a user (for GDPR right to erasure)
   */
  async deleteAllConsents(userId: string, framework?: ComplianceFramework): Promise<number> {
    const query: any = { userId };
    if (framework) {
      query.framework = framework;
    }

    const result = await Consent.deleteMany(query);

    // Record audit
    await ConsentAudit.create({
      userId,
      consentType: ConsentType.DATA_PROCESSING,
      framework: framework || ComplianceFramework.GDPR,
      action: 'deleted',
      actor: 'system',
      details: { deletedCount: result.deletedCount },
      timestamp: new Date()
    });

    logger.info('All consents deleted for user', { userId, deletedCount: result.deletedCount });

    return result.deletedCount;
  }

  /**
   * Export all consent data for a user
   */
  async exportUserConsentData(userId: string): Promise<any> {
    const consents = await Consent.find({ userId });
    const history = await ConsentHistory.find({ userId }).sort({ timestamp: -1 });
    const audits = await ConsentAudit.find({ userId }).sort({ timestamp: -1 });

    // Record audit
    await ConsentAudit.create({
      userId,
      consentType: ConsentType.DATA_PROCESSING,
      framework: ComplianceFramework.GDPR,
      action: 'exported',
      actor: 'user',
      timestamp: new Date()
    });

    return {
      userId,
      exportedAt: new Date().toISOString(),
      consents,
      history,
      auditTrail: audits
    };
  }
}

export const consentService = new ConsentService();