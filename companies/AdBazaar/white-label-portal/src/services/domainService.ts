import { v4 as uuidv4 } from 'uuid';
import { CustomDomain, ICustomDomain } from '../models';
import { logger } from 'utils/logger.js';

export interface CreateDomainDTO {
  portalId: string;
  domain: string;
  subdomain?: string;
  method?: 'CNAME' | 'TXT' | 'A';
  updatedBy: string;
}

export interface VerifyDomainDTO {
  verifiedBy: string;
}

export class DomainService {
  /**
   * Create custom domain for a portal
   */
  async createDomain(data: CreateDomainDTO): Promise<ICustomDomain> {
    logger.info('Creating custom domain', { portalId: data.portalId, domain: data.domain });

    // Check if domain already exists
    const existing = await CustomDomain.findOne({ domain: data.domain.toLowerCase() });
    if (existing) {
      throw new Error(`Domain '${data.domain}' already exists`);
    }

    // Generate verification token
    const verificationToken = uuidv4();

    const domain = new CustomDomain({
      portalId: data.portalId,
      domain: data.domain.toLowerCase(),
      subdomain: data.subdomain,
      verification: {
        method: data.method || 'CNAME',
        token: verificationToken,
      },
      ssl: {
        enabled: false,
        autoRenew: true,
      },
      dns: {
        target: `portal.adbazaar.io`,
        records: this.generateDNSRecords(data.domain, data.subdomain, verificationToken, data.method || 'CNAME'),
      },
      status: 'pending',
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await domain.save();
    logger.info('Custom domain created', { domainId: domain._id, domain: domain.domain });

    return domain;
  }

  /**
   * Get domain by ID
   */
  async getDomainById(domainId: string): Promise<ICustomDomain | null> {
    return CustomDomain.findById(domainId);
  }

  /**
   * Get domain by domain string
   */
  async getDomainByString(domain: string): Promise<ICustomDomain | null> {
    return CustomDomain.findOne({ domain: domain.toLowerCase() });
  }

  /**
   * Get domains by portal ID
   */
  async getDomainsByPortalId(portalId: string): Promise<ICustomDomain[]> {
    return CustomDomain.find({ portalId }).sort({ 'metadata.createdAt': -1 });
  }

  /**
   * Verify domain ownership
   */
  async verifyDomain(domainId: string, data: VerifyDomainDTO): Promise<ICustomDomain> {
    logger.info('Verifying domain', { domainId });

    const domain = await CustomDomain.findById(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    if (domain.status === 'active') {
      throw new Error('Domain is already verified and active');
    }

    // Update verification status
    domain.verification.verifiedAt = new Date();
    domain.verification.verifiedBy = data.verifiedBy;
    domain.status = 'verifying';

    // Simulate SSL certificate provisioning
    domain.ssl.enabled = true;
    domain.ssl.issuedAt = new Date();
    domain.ssl.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
    domain.ssl.certificateId = `cert_${uuidv4()}`;

    await domain.save();

    // In production, this would trigger SSL provisioning via Let's Encrypt or similar
    logger.info('Domain verification initiated', { domainId, certificateId: domain.ssl.certificateId });

    // Simulate async SSL provisioning
    setTimeout(async () => {
      try {
        domain.status = 'active';
        domain.metadata.lastCheckedAt = new Date();
        await domain.save();
        logger.info('Domain SSL provisioned successfully', { domainId });
      } catch (error) {
        logger.error('SSL provisioning failed', { domainId, error });
        domain.status = 'failed';
        domain.metadata.errorMessage = 'SSL provisioning failed';
        domain.metadata.lastCheckedAt = new Date();
        await domain.save();
      }
    }, 2000);

    return domain;
  }

  /**
   * Check domain DNS configuration
   */
  async checkDNS(domainId: string): Promise<{
    configured: boolean;
    records: {
      type: string;
      name: string;
      value: string;
      expected: string;
      match: boolean;
    }[];
    nextCheck?: Date;
  }> {
    const domain = await CustomDomain.findById(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    // In production, this would check actual DNS records via API
    // For now, simulate the check
    const records = domain.dns.records.map((record) => ({
      type: record.type,
      name: record.name,
      value: record.value,
      expected: record.value,
      match: true, // Simulated - would be actual comparison
    }));

    domain.metadata.lastCheckedAt = new Date();
    await domain.save();

    return {
      configured: records.every((r) => r.match),
      records,
      nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next check in 24 hours
    };
  }

  /**
   * Delete custom domain
   */
  async deleteDomain(domainId: string): Promise<boolean> {
    logger.info('Deleting custom domain', { domainId });

    const domain = await CustomDomain.findById(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    // In production, trigger SSL certificate revocation
    if (domain.ssl.enabled && domain.ssl.certificateId) {
      logger.info('Revoking SSL certificate', { certificateId: domain.ssl.certificateId });
    }

    const result = await CustomDomain.deleteOne({ _id: domainId });
    return result.deletedCount > 0;
  }

  /**
   * Get DNS records for domain verification
   */
  getDNSRecords(domain: string): {
    cname: { name: string; value: string };
    txt: { name: string; value: string };
  } {
    return {
      cname: {
        name: `_adbazaar`,
        value: `${uuidv4().substring(0, 8)}.portal.adbazaar.io`,
      },
      txt: {
        name: `_adbazaar-verification`,
        value: `adbazaar-verification=${uuidv4()}`,
      },
    };
  }

  /**
   * Generate DNS records based on verification method
   */
  private generateDNSRecords(
    domain: string,
    subdomain?: string,
    token?: string,
    method?: string
  ): { type: string; name: string; value: string; ttl: number }[] {
    const records: { type: string; name: string; value: string; ttl: number }[] = [];

    if (method === 'CNAME') {
      records.push({
        type: 'CNAME',
        name: subdomain ? `${subdomain}` : 'www',
        value: `portal.adbazaar.io`,
        ttl: 3600,
      });
    } else if (method === 'A') {
      records.push({
        type: 'A',
        name: subdomain || '@',
        value: '76.76.21.21', // Example IP - would be actual server IP
        ttl: 3600,
      });
    }

    // Add TXT record for verification
    records.push({
      type: 'TXT',
      name: subdomain ? `_adbazaar.${subdomain}` : '_adbazaar',
      value: `adbazaar-verification=${token || uuidv4()}`,
      ttl: 3600,
    });

    return records;
  }

  /**
   * Check SSL certificate expiry
   */
  async checkSSLExpiry(domainId: string): Promise<{
    valid: boolean;
    expiresAt?: Date;
    daysUntilExpiry?: number;
    autoRenew: boolean;
  }> {
    const domain = await CustomDomain.findById(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    if (!domain.ssl.enabled || !domain.ssl.expiresAt) {
      return { valid: false, autoRenew: domain.ssl.autoRenew };
    }

    const now = new Date();
    const expiresAt = new Date(domain.ssl.expiresAt);
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      valid: daysUntilExpiry > 0,
      expiresAt,
      daysUntilExpiry,
      autoRenew: domain.ssl.autoRenew,
    };
  }

  /**
   * Renew SSL certificate
   */
  async renewSSL(domainId: string): Promise<ICustomDomain> {
    logger.info('Renewing SSL certificate', { domainId });

    const domain = await CustomDomain.findById(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    if (domain.status !== 'active') {
      throw new Error('Domain must be active to renew SSL');
    }

    // Generate new certificate
    domain.ssl.issuedAt = new Date();
    domain.ssl.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    domain.ssl.certificateId = `cert_${uuidv4()}`;
    domain.metadata.updatedAt = new Date();

    await domain.save();
    logger.info('SSL certificate renewed', { domainId, expiresAt: domain.ssl.expiresAt });

    return domain;
  }

  /**
   * Validate domain format
   */
  validateDomain(domain: string): { valid: boolean; error?: string } {
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return { valid: false, error: 'Invalid domain format' };
    }
    return { valid: true };
  }
}

export const domainService = new DomainService();