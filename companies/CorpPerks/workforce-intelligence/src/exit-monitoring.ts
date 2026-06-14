// =============================================================================
// CorpPerks Workforce Intelligence - Exit Monitoring Module
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import {
  ExitMonitoring,
  ExitMonitoringStatus,
  ExitRiskAssessment,
  ExitRiskFactor,
  ClearanceItem,
  ExitEvidence,
  RiskSeverity,
  EmployeeTrustScore,
} from './types';

/**
 * Configure logger
 */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'exit-monitoring.log' }),
  ],
});

/**
 * Default monitoring configuration
 */
const DEFAULT_MONITORING_DAYS = 30;
const ENHANCED_MONITORING_TRUST_THRESHOLD = 60;

/**
 * Exit monitoring service
 */
export class ExitMonitoringService {
  private monitoringPeriod: number;

  constructor(monitoringDays: number = DEFAULT_MONITORING_DAYS) {
    this.monitoringPeriod = monitoringDays;
  }

  /**
   * Initialize exit monitoring when notice is submitted
   */
  initiateMonitoring(
    employeeId: string,
    noticeDate: string,
    lastWorkingDate: string,
    trustProfile: EmployeeTrustScore
  ): ExitMonitoring {
    const now = new Date();
    const monitoringStartDate = now.toISOString();

    // Calculate monitoring end date
    const endDate = new Date(lastWorkingDate);
    endDate.setDate(endDate.getDate() + this.monitoringPeriod);

    // Determine if enhanced monitoring is needed
    const enhancedMonitoring = trustProfile.trustScore < ENHANCED_MONITORING_TRUST_THRESHOLD ||
      trustProfile.riskFactors.some(f => f.severity === 'critical' && !f.resolved);

    const monitoring: ExitMonitoring = {
      employeeId,
      status: 'notice_period',
      noticeDate,
      lastWorkingDate,
      monitoringStartDate,
      monitoringEndDate: endDate.toISOString(),
      enhancedMonitoring,
      riskAssessment: this.generateRiskAssessment(employeeId, trustProfile),
      clearanceChecklist: this.generateClearanceChecklist(),
      evidence: [],
    };

    logger.info('Exit monitoring initiated', {
      employeeId,
      noticeDate,
      lastWorkingDate,
      enhancedMonitoring,
      trustScore: trustProfile.trustScore,
    });

    return monitoring;
  }

  /**
   * Update monitoring status
   */
  updateStatus(monitoring: ExitMonitoring, newStatus: ExitMonitoringStatus): ExitMonitoring {
    const updated = { ...monitoring, status: newStatus };

    logger.info('Exit monitoring status updated', {
      employeeId: monitoring.employeeId,
      oldStatus: monitoring.status,
      newStatus,
    });

    return updated;
  }

  /**
   * Generate risk assessment for exit
   */
  generateRiskAssessment(employeeId: string, profile: EmployeeTrustScore): ExitRiskAssessment {
    const factors: ExitRiskFactor[] = [];

    // Analyze each risk factor category
    const categoryGroups = profile.riskFactors.reduce((acc, factor) => {
      if (!acc[factor.category]) {
        acc[factor.category] = [];
      }
      acc[factor.category].push(factor);
      return acc;
    }, {} as Record<string, typeof profile.riskFactors>);

    // Generate exit-specific risk factors
    for (const [category, categoryFactors] of Object.entries(categoryGroups)) {
      const unresolvedFactors = categoryFactors.filter(f => !f.resolved);
      if (unresolvedFactors.length > 0) {
        const hasCritical = unresolvedFactors.some(f => f.severity === 'critical');
        factors.push({
          category,
          description: `${unresolvedFactors.length} unresolved ${category} risk factors`,
          risk: hasCritical ? 'critical' : unresolvedFactors.some(f => f.severity === 'high') ? 'high' : 'medium',
          evidence: unresolvedFactors.map(f => `${f.name}: ${f.description}`).join('; '),
        });
      }
    }

    // Calculate overall risk
    const riskScore = this.calculateExitRiskScore(profile, factors);
    const overallRisk = this.determineOverallRisk(riskScore);

    return {
      id: uuidv4(),
      employeeId,
      assessmentDate: new Date().toISOString(),
      overallRisk,
      riskScore,
      factors,
      recommendations: this.generateRecommendations(overallRisk, factors),
      assessor: 'workforce-intelligence',
    };
  }

  /**
   * Generate clearance checklist
   */
  generateClearanceChecklist(): ClearanceItem[] {
    return [
      // Asset return items
      {
        id: uuidv4(),
        category: 'asset',
        name: 'Laptop/Computer',
        description: 'Return company laptop and accessories',
        required: true,
        completed: false,
      },
      {
        id: uuidv4(),
        category: 'asset',
        name: 'Mobile Phone',
        description: 'Return company mobile device if provided',
        required: false,
        completed: false,
      },
      {
        id: uuidv4(),
        category: 'asset',
        name: 'Access Cards/Keys',
        description: 'Return all access cards, keys, and badges',
        required: true,
        completed: false,
      },
      {
        id: uuidv4(),
        category: 'asset',
        name: 'Other Company Property',
        description: 'Return uniforms, tools, equipment',
        required: false,
        completed: false,
      },

      // Access items
      {
        id: uuidv4(),
        category: 'access',
        name: 'System Access Revocation',
        description: 'Revoke all system and application access',
        required: true,
        completed: false,
      },
      {
        id: uuidv4(),
        category: 'access',
        name: 'Email Account',
        description: 'Disable email account, set up auto-reply or forwarding',
        required: true,
        completed: false,
      },
      {
        id: uuidv4(),
        category: 'access',
        name: 'VPN Access',
        description: 'Remove VPN access credentials',
        required: true,
        completed: false,
      },
      {
        id: uuidv4(),
        category: 'access',
        name: 'Cloud Services',
        description: 'Remove access to AWS, Azure, GCP, and other cloud services',
        required: true,
        completed: false,
      },
      {
        id: uuidv4(),
        category: 'access',
        name: 'Code Repositories',
        description: 'Remove access to GitHub, GitLab, Bitbucket',
        required: true,
        completed: false,
      },

      // Document items
      {
        id: uuidv4(),
        category: 'document',
        name: 'Project Handover',
        description: 'Complete project documentation and handover notes',
        required: true,
        completed: false,
      },
      {
        id: uuidv4(),
        category: 'document',
        name: 'Knowledge Transfer',
        description: 'Complete knowledge transfer documentation',
        required: true,
        completed: false,
      },
      {
        id: uuidv4(),
        category: 'document',
        name: 'Client Files',
        description: 'Ensure all client files are properly organized and accessible',
        required: true,
        completed: false,
      },

      // Financial items
      {
        id: uuidv4(),
        category: 'financial',
        name: 'Expense Reimbursement',
        description: 'Settle all pending expense reports',
        required: true,
        completed: false,
      },
      {
        id: uuidv4(),
        category: 'financial',
        name: 'Final Settlement',
        description: 'Process final salary, leave encashment, and dues',
        required: true,
        completed: false,
      },
      {
        id: uuidv4(),
        category: 'financial',
        name: 'Company Credit Card',
        description: 'Return company credit card and settle dues',
        required: true,
        completed: false,
      },

      // Compliance items
      {
        id: uuidv4(),
        category: 'compliance',
        name: 'NDA Review',
        description: 'Review and acknowledge ongoing NDA obligations',
        required: true,
        completed: false,
      },
      {
        id: uuidv4(),
        category: 'compliance',
        name: 'Non-Compete Acknowledgment',
        description: 'Review non-compete and non-solicitation clauses',
        required: false,
        completed: false,
      },
      {
        id: uuidv4(),
        category: 'compliance',
        name: 'Exit Interview',
        description: 'Complete exit interview',
        required: true,
        completed: false,
      },
    ];
  }

  /**
   * Update clearance item status
   */
  updateClearanceItem(
    checklist: ClearanceItem[],
    itemId: string,
    completed: boolean,
    completedBy: string,
    notes?: string
  ): ClearanceItem[] {
    return checklist.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
          completedBy,
          notes: notes || item.notes,
        };
      }
      return item;
    });
  }

  /**
   * Add evidence to monitoring
   */
  addEvidence(monitoring: ExitMonitoring, evidence: Omit<ExitEvidence, 'id'>): ExitMonitoring {
    const newEvidence: ExitEvidence = {
      ...evidence,
      id: uuidv4(),
    };

    logger.info('Evidence added to exit monitoring', {
      employeeId: monitoring.employeeId,
      evidenceType: evidence.type,
    });

    return {
      ...monitoring,
      evidence: [...monitoring.evidence, newEvidence],
    };
  }

  /**
   * Check if monitoring is complete
   */
  isMonitoringComplete(monitoring: ExitMonitoring): boolean {
    const requiredItems = monitoring.clearanceChecklist?.filter(item => item.required) || [];
    const completedItems = requiredItems.filter(item => item.completed);

    return completedItems.length === requiredItems.length;
  }

  /**
   * Get completion status
   */
  getCompletionStatus(monitoring: ExitMonitoring): {
    total: number;
    completed: number;
    percentage: number;
    pending: ClearanceItem[];
  } {
    const checklist = monitoring.clearanceChecklist || [];
    const completed = checklist.filter(item => item.completed);
    const pending = checklist.filter(item => !item.completed);

    return {
      total: checklist.length,
      completed: completed.length,
      percentage: checklist.length > 0 ? Math.round((completed.length / checklist.length) * 100) : 100,
      pending,
    };
  }

  /**
   * Calculate exit risk score
   */
  private calculateExitRiskScore(profile: EmployeeTrustScore, factors: ExitRiskFactor[]): number {
    let score = profile.trustScore;

    // Penalty for unresolved critical factors
    const criticalFactors = factors.filter(f => f.risk === 'critical');
    score -= criticalFactors.length * 20;

    // Penalty for high-risk factors
    const highFactors = factors.filter(f => f.risk === 'high');
    score -= highFactors.length * 10;

    // Bonus for completed risk mitigation
    const resolvedFactors = profile.riskFactors.filter(f => f.resolved);
    score += Math.min(resolvedFactors.length * 2, 10);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Determine overall risk
   */
  private determineOverallRisk(score: number): RiskSeverity {
    if (score >= 70) return 'low';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'high';
    return 'critical';
  }

  /**
   * Generate recommendations based on risk
   */
  private generateRecommendations(risk: RiskSeverity, factors: ExitRiskFactor[]): string[] {
    const recommendations: string[] = [];

    if (risk === 'critical' || risk === 'high') {
      recommendations.push('Enable enhanced monitoring mode');
      recommendations.push('Review all recent access logs');
      recommendations.push('Conduct security interview before last day');
      recommendations.push('Consider accelerating access revocation timeline');
    }

    // Category-specific recommendations
    const hasAccessRisk = factors.some(f => f.category === 'access');
    if (hasAccessRisk) {
      recommendations.push('Prioritize access revocation review');
      recommendations.push('Audit recent privileged access activity');
    }

    const hasDataRisk = factors.some(f => f.category === 'technical');
    if (hasDataRisk) {
      recommendations.push('Review data export activities');
      recommendations.push('Monitor file access patterns');
    }

    const hasComplianceRisk = factors.some(f => f.category === 'compliance');
    if (hasComplianceRisk) {
      recommendations.push('Ensure all compliance documentation is signed');
      recommendations.push('Review ongoing legal obligations');
    }

    if (recommendations.length === 0) {
      recommendations.push('Proceed with standard exit process');
    }

    return recommendations;
  }
}

/**
 * Create exit monitoring service
 */
export function createExitMonitoringService(monitoringDays: number = DEFAULT_MONITORING_DAYS): ExitMonitoringService {
  return new ExitMonitoringService(monitoringDays);
}

/**
 * Export for testing
 */
export const __testExports = {
  ExitMonitoringService,
  createExitMonitoringService,
  DEFAULT_MONITORING_DAYS,
  ENHANCED_MONITORING_TRUST_THRESHOLD,
};