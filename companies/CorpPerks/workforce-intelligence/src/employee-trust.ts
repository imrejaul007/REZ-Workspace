// =============================================================================
// CorpPerks Workforce Intelligence - Employee Trust Scoring
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import {
  EmployeeTrustScore,
  TrustLevel,
  RiskFactor,
  RiskSeverity,
  RiskCategory,
  AssessmentRecord,
  SyncStatus,
  ExitMonitoringStatus,
  PerformanceMetrics,
  RiskWeights,
} from './types';

const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  behavioral: 25,
  technical: 20,
  organizational: 20,
  access: 20,
  compliance: 15,
};

/**
 * Default trust score for new employees
 */
const DEFAULT_TRUST_SCORE = 75;

/**
 * Trust level thresholds
 */
const TRUST_LEVEL_THRESHOLDS = {
  trusted: 80,
  monitored: 60,
  elevated: 40,
  critical: 0,
};

/**
 * Calculate trust level from score
 */
export function calculateTrustLevel(score: number): TrustLevel {
  if (score >= TRUST_LEVEL_THRESHOLDS.trusted) return 'trusted';
  if (score >= TRUST_LEVEL_THRESHOLDS.monitored) return 'monitored';
  if (score >= TRUST_LEVEL_THRESHOLDS.elevated) return 'elevated';
  return 'critical';
}

/**
 * Calculate trust score based on performance metrics
 */
export function calculateTrustScore(
  metrics: PerformanceMetrics,
  existingFactors: RiskFactor[],
  weights: RiskWeights = DEFAULT_RISK_WEIGHTS
): { score: number; factors: RiskFactor[] } {
  let score = DEFAULT_TRUST_SCORE;
  const newFactors: RiskFactor[] = [];

  // Factor 1: Performance (negative impact if low)
  if (metrics.performanceScore < 60) {
    const performancePenalty = (60 - metrics.performanceScore) * weights.behavioral / 100;
    newFactors.push(createRiskFactor(
      'behavioral',
      'Declining Performance',
      `Performance score dropped to ${metrics.performanceScore}%`,
      determineSeverity(metrics.performanceScore, 60, 40, 20)
    ));
    score -= performancePenalty;
  } else if (metrics.performanceScore >= 80) {
    score += 5; // Bonus for high performance
  }

  // Factor 2: Attendance
  if (metrics.attendanceRate < 85) {
    const attendancePenalty = (85 - metrics.attendanceRate) * 0.5;
    newFactors.push(createRiskFactor(
      'behavioral',
      'Attendance Issues',
      `Attendance rate at ${metrics.attendanceRate}%`,
      determineSeverity(metrics.attendanceRate, 85, 70, 60)
    ));
    score -= attendancePenalty;
  }

  // Factor 3: Policy Compliance
  if (metrics.policyComplianceScore < 90) {
    const compliancePenalty = (90 - metrics.policyComplianceScore) * 0.3;
    newFactors.push(createRiskFactor(
      'compliance',
      'Policy Compliance Issues',
      `Policy compliance at ${metrics.policyComplianceScore}%`,
      determineSeverity(metrics.policyComplianceScore, 90, 75, 60)
    ));
    score -= compliancePenalty;
  }

  // Factor 4: Project Outcomes
  const failedProjects = metrics.projectOutcomes.filter(p => p.status === 'failed' || p.status === 'delayed');
  if (failedProjects.length > 0) {
    const projectPenalty = Math.min(failedProjects.length * 5, 20);
    newFactors.push(createRiskFactor(
      'technical',
      'Project Performance Issues',
      `${failedProjects.length} projects delayed or failed`,
      failedProjects.length > 2 ? 'high' : 'medium'
    ));
    score -= projectPenalty;
  }

  // Factor 5: Manager Feedback Flags
  const flaggedFeedback = metrics.managerFeedback.filter(f => f.flags.length > 0);
  if (flaggedFeedback.length > 0) {
    newFactors.push(createRiskFactor(
      'behavioral',
      'Manager Concerns',
      `${flaggedFeedback.length} feedback entries with flags`,
      'medium'
    ));
    score -= flaggedFeedback.length * 3;
  }

  // Factor 6: Incidents
  const unresolvedIncidents = metrics.incidents.filter(i => !i.resolved);
  const recentIncidents = metrics.incidents.filter(i => {
    const incidentDate = new Date(i.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return incidentDate >= thirtyDaysAgo;
  });

  if (unresolvedIncidents.length > 0) {
    newFactors.push(createRiskFactor(
      'compliance',
      'Unresolved Incidents',
      `${unresolvedIncidents.length} unresolved incidents`,
      unresolvedIncidents.some(i => i.severity === 'critical') ? 'critical' : 'high'
    ));
    score -= unresolvedIncidents.length * 10;
  }

  // Factor 7: Recent High-Severity Incidents
  const criticalIncidents = recentIncidents.filter(i => i.severity === 'critical');
  if (criticalIncidents.length > 0) {
    newFactors.push(createRiskFactor(
      'compliance',
      'Critical Incidents',
      `${criticalIncidents.length} critical incidents in last 30 days`,
      'critical'
    ));
    score -= criticalIncidents.length * 15;
  }

  // Factor 8: Existing risk factors (carry over)
  const unresolvedExistingFactors = existingFactors.filter(f => !f.resolved);
  for (const factor of unresolvedExistingFactors) {
    score -= factor.weight * (weights[factor.category] / 100);
    // Mark as carried forward
    const carriedFactor = { ...factor, id: uuidv4() };
    newFactors.push(carriedFactor);
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return { score: Math.round(score), factors: newFactors };
}

/**
 * Create a risk factor
 */
function createRiskFactor(
  category: RiskCategory,
  name: string,
  description: string,
  severity: RiskSeverity
): RiskFactor {
  return {
    id: uuidv4(),
    category,
    name,
    description,
    severity,
    weight: getWeightForSeverity(severity),
    detectedAt: new Date().toISOString(),
    source: 'workforce-intelligence',
    evidence: [],
    resolved: false,
  };
}

/**
 * Get weight based on severity
 */
function getWeightForSeverity(severity: RiskSeverity): number {
  switch (severity) {
    case 'critical': return 25;
    case 'high': return 15;
    case 'medium': return 8;
    case 'low': return 3;
  }
}

/**
 * Determine severity based on value and thresholds
 */
function determineSeverity(value: number, low: number, medium: number, high: number): RiskSeverity {
  if (value <= high) return 'critical';
  if (value <= medium) return 'high';
  if (value <= low) return 'medium';
  return 'low';
}

/**
 * Generate complete employee trust profile
 */
export function generateTrustProfile(
  employeeId: string,
  employeeName: string,
  department: string,
  metrics: PerformanceMetrics,
  existingFactors: RiskFactor[] = [],
  existingProfile?: EmployeeTrustScore
): EmployeeTrustScore {
  const { score, factors } = calculateTrustScore(metrics, existingFactors, DEFAULT_RISK_WEIGHTS);
  const trustLevel = calculateTrustLevel(score);

  const assessmentRecord: AssessmentRecord = {
    id: uuidv4(),
    date: new Date().toISOString(),
    score,
    trustLevel,
    factors: factors.map(f => f.id),
    assessor: 'workforce-intelligence',
    notes: `Automated assessment based on ${factors.length} risk factors`,
  };

  const history = existingProfile?.assessmentHistory || [];
  history.push(assessmentRecord);

  // Keep only last 12 assessments
  const trimmedHistory = history.slice(-12);

  const now = new Date();
  const nextAssessment = new Date(now);
  nextAssessment.setDate(nextAssessment.getDate() + 30);

  return {
    employeeId,
    employeeName,
    department,
    trustLevel,
    trustScore: score,
    riskFactors: factors,
    lastAssessment: now.toISOString(),
    nextAssessment: nextAssessment.toISOString(),
    assessmentHistory: trimmedHistory,
    monitoringStatus: existingProfile?.monitoringStatus || 'inactive',
    hibSyncStatus: 'pending' as SyncStatus,
  };
}

/**
 * Check if employee requires immediate attention
 */
export function requiresAttention(profile: EmployeeTrustScore): boolean {
  return (
    profile.trustLevel === 'critical' ||
    profile.trustLevel === 'elevated' ||
    profile.riskFactors.some(f => f.severity === 'critical' && !f.resolved)
  );
}

/**
 * Get summary of risk categories
 */
export function getRiskCategorySummary(factors: RiskFactor[]): Record<RiskCategory, number> {
  const summary: Record<RiskCategory, number> = {
    behavioral: 0,
    technical: 0,
    organizational: 0,
    access: 0,
    compliance: 0,
  };

  for (const factor of factors) {
    if (!factor.resolved) {
      summary[factor.category]++;
    }
  }

  return summary;
}

/**
 * Export for testing
 */
export const __testExports = {
  calculateTrustLevel,
  calculateTrustScore,
  generateTrustProfile,
  requiresAttention,
  getRiskCategorySummary,
  DEFAULT_RISK_WEIGHTS,
  TRUST_LEVEL_THRESHOLDS,
};