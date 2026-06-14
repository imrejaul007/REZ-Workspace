import { Consent, ConsentType, ComplianceFramework } from '../models/Consent';
import { ConsentHistory } from '../models/ConsentHistory';
import { logger } from 'utils/logger.js';

interface ComplianceReport {
  framework: ComplianceFramework;
  generatedAt: Date;
  summary: {
    totalUsers: number;
    totalConsents: number;
    grantedConsents: number;
    withdrawnConsents: number;
    consentRate: number;
  };
  byType: {
    type: ConsentType;
    total: number;
    granted: number;
    withdrawn: number;
    rate: number;
  }[];
  recentActivity: {
    date: string;
    granted: number;
    withdrawn: number;
  }[];
  missingConsents: {
    type: ConsentType;
    count: number;
    required: boolean;
  }[];
  complianceStatus: 'compliant' | 'partial' | 'non-compliant';
}

class ComplianceService {
  /**
   * Generate compliance report for a specific framework
   */
  async generateComplianceReport(
    framework: ComplianceFramework,
    startDate?: Date,
    endDate?: Date
  ): Promise<ComplianceReport> {
    logger.info('Generating compliance report', { framework, startDate, endDate });

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;

    // Get all consents for the framework
    const consentFilter: any = { framework };
    if (Object.keys(dateFilter).length > 0) {
      consentFilter.createdAt = dateFilter;
    }

    const allConsents = await Consent.find(consentFilter);
    const totalUsers = new Set(allConsents.map(c => c.userId)).size;
    const totalConsents = allConsents.length;
    const grantedConsents = allConsents.filter(c => c.granted).length;
    const withdrawnConsents = totalConsents - grantedConsents;
    const consentRate = totalConsents > 0 ? (grantedConsents / totalConsents) * 100 : 0;

    // Stats by consent type
    const byType: { type: ConsentType; total: number; granted: number; withdrawn: number; rate: number }[] = [];
    for (const type of Object.values(ConsentType)) {
      const typeConsents = allConsents.filter(c => c.type === type);
      const typeGranted = typeConsents.filter(c => c.granted).length;
      byType.push({
        type,
        total: typeConsents.length,
        granted: typeGranted,
        withdrawn: typeConsents.length - typeGranted,
        rate: typeConsents.length > 0 ? (typeGranted / typeConsents.length) * 100 : 0
      });
    }

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentHistory = await ConsentHistory.aggregate([
      {
        $match: {
          framework,
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          granted: {
            $sum: { $cond: [{ $eq: ['$action', 'granted'] }, 1, 0] }
          },
          withdrawn: {
            $sum: { $cond: [{ $eq: ['$action', 'withdrawn'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Missing consents (users who haven't given consent for required types)
    const requiredTypes = [ConsentType.MARKETING, ConsentType.DATA_PROCESSING];
    const missingConsents: { type: ConsentType; count: number; required: boolean }[] = [];

    for (const type of requiredTypes) {
      const typeConsents = allConsents.filter(c => c.type === type && c.granted);
      const usersWithConsent = new Set(typeConsents.map(c => c.userId));
      const usersWithoutConsent = totalUsers - usersWithConsent.size;

      missingConsents.push({
        type,
        count: usersWithoutConsent,
        required: true
      });
    }

    // Determine compliance status
    let complianceStatus: 'compliant' | 'partial' | 'non-compliant' = 'compliant';
    if (consentRate < 50) {
      complianceStatus = 'non-compliant';
    } else if (consentRate < 80) {
      complianceStatus = 'partial';
    }

    return {
      framework,
      generatedAt: new Date(),
      summary: {
        totalUsers,
        totalConsents,
        grantedConsents,
        withdrawnConsents,
        consentRate: Math.round(consentRate * 100) / 100
      },
      byType,
      recentActivity: recentHistory.map(r => ({
        date: r._id,
        granted: r.granted,
        withdrawn: r.withdrawn
      })),
      missingConsents,
      complianceStatus
    };
  }

  /**
   * Check if user is compliant for a specific framework
   */
  async checkUserCompliance(userId: string, framework: ComplianceFramework): Promise<any> {
    const consents = await Consent.find({ userId, framework });

    const requiredConsents = [
      ConsentType.DATA_PROCESSING,
      ConsentType.ADVERTISING
    ];

    const compliance = {
      userId,
      framework,
      isCompliant: true,
      missingConsents: [] as ConsentType[],
      expiredConsents: [] as ConsentType[],
      consents: consents.map(c => ({
        type: c.type,
        granted: c.granted,
        valid: !c.expiresAt || c.expiresAt > new Date(),
        expiresAt: c.expiresAt
      }))
    };

    for (const required of requiredConsents) {
      const consent = consents.find(c => c.type === required);
      if (!consent || !consent.granted) {
        compliance.missingConsents.push(required);
        compliance.isCompliant = false;
      } else if (consent.expiresAt && consent.expiresAt < new Date()) {
        compliance.expiredConsents.push(required);
        compliance.isCompliant = false;
      }
    }

    return compliance;
  }

  /**
   * Get GDPR-specific compliance report
   */
  async getGDPRCompliance(): Promise<any> {
    const report = await this.generateComplianceReport(ComplianceFramework.GDPR);

    // Add GDPR-specific requirements
    const gdprRequirements = {
      lawfulBasis: 'consent',
      rightToWithdraw: true,
      dataPortability: true,
      rightToErasure: true,
      privacyByDesign: true
    };

    // Check for consent withdrawal handling
    const withdrawalHandling = await ConsentHistory.aggregate([
      { $match: { framework: ComplianceFramework.GDPR, action: 'withdrawn' } },
      {
        $group: {
          _id: null,
          totalWithdrawals: { $sum: 1 },
          lastWithdrawal: { $max: '$timestamp' }
        }
      }
    ]);

    return {
      ...report,
      framework: 'GDPR',
      requirements: gdprRequirements,
      withdrawalHandling: withdrawalHandling[0] || { totalWithdrawals: 0, lastWithdrawal: null },
      dataController: 'AdBazaar',
      dataProtectionOfficer: process.env.DPO_EMAIL || 'privacy@adbazaar.com'
    };
  }

  /**
   * Get CCPA-specific compliance report
   */
  async getCCPACompliance(): Promise<any> {
    const report = await this.generateComplianceReport(ComplianceFramework.CCPA);

    // CCPA-specific requirements
    const ccpaRequirements = {
      rightToKnow: true,
      rightToDelete: true,
      rightToOptOut: true,
      nonDiscrimination: true
    };

    // Check opt-out statistics
    const optOutStats = await Consent.aggregate([
      { $match: { framework: ComplianceFramework.CCPA, granted: false } },
      {
        $group: {
          _id: '$type',
          optOutCount: { $sum: 1 }
        }
      }
    ]);

    return {
      ...report,
      framework: 'CCPA',
      requirements: ccpaRequirements,
      optOutStatistics: optOutStats,
      businessCategories: ['advertising', 'marketing', 'analytics']
    };
  }

  /**
   * Verify consent proof for audit
   */
  async verifyConsentProof(userId: string, type: ConsentType): Promise<any> {
    const consent = await Consent.findOne({ userId, type });
    const history = await ConsentHistory.find({ userId, consentType: type }).sort({ timestamp: -1 });

    return {
      userId,
      consentType: type,
      currentState: consent ? {
        granted: consent.granted,
        grantedAt: consent.grantedAt,
        withdrawnAt: consent.withdrawnAt,
        version: consent.version
      } : null,
      history,
      isValid: consent?.granted && (!consent.expiresAt || consent.expiresAt > new Date()),
      verificationTimestamp: new Date()
    };
  }
}

export const complianceService = new ComplianceService();