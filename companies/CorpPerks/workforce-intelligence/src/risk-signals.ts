// =============================================================================
// CorpPerks Workforce Intelligence - Risk Signal Detection
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import {
  RiskSignal,
  RiskCategory,
  RiskSeverity,
  PerformanceMetrics,
  ManagerFeedback,
  Incident,
  RiskFactor,
} from './types';

/**
 * Signal detection thresholds
 */
const SIGNAL_THRESHOLDS = {
  performanceDecline: 15, // Percentage decline
  attendanceRate: 85, // Minimum percentage
  policyViolations: 2, // Count in period
  negativeFeedback: 2, // Count in period
  criticalIncidents: 1,
};

/**
 * Detect risk signals from performance metrics
 */
export function detectRiskSignals(
  employeeId: string,
  currentMetrics: PerformanceMetrics,
  previousMetrics?: PerformanceMetrics
): RiskSignal[] {
  const signals: RiskSignal[] = [];

  // Check for performance decline
  if (previousMetrics) {
    const performanceDecline = previousMetrics.performanceScore - currentMetrics.performanceScore;
    if (performanceDecline >= SIGNAL_THRESHOLDS.performanceDecline) {
      signals.push(createSignal(
        employeeId,
        'behavioral',
        'Performance Decline',
        `Performance dropped by ${performanceDecline.toFixed(1)}% from ${previousMetrics.performanceScore}% to ${currentMetrics.performanceScore}%`,
        determineSeverity(performanceDecline, SIGNAL_THRESHOLDS.performanceDecline, 25, 35),
        { current: currentMetrics.performanceScore, previous: previousMetrics.performanceScore }
      ));
    }
  }

  // Check attendance issues
  if (currentMetrics.attendanceRate < SIGNAL_THRESHOLDS.attendanceRate) {
    signals.push(createSignal(
      employeeId,
      'behavioral',
      'Attendance Issues',
      `Attendance rate at ${currentMetrics.attendanceRate}%, below threshold of ${SIGNAL_THRESHOLDS.attendanceRate}%`,
      determineSeverity(currentMetrics.attendanceRate, SIGNAL_THRESHOLDS.attendanceRate, 70, 60),
      { attendanceRate: currentMetrics.attendanceRate }
    ));
  }

  // Check policy compliance
  const policyViolations = currentMetrics.incidents.filter(
    i => i.type === 'policy_violation' && !i.resolved
  );
  if (policyViolations.length >= SIGNAL_THRESHOLDS.policyViolations) {
    signals.push(createSignal(
      employeeId,
      'compliance',
      'Policy Violations',
      `${policyViolations.length} unresolved policy violations`,
      policyViolations.length > 3 ? 'high' : 'medium',
      { violations: policyViolations.length }
    ));
  }

  // Check for critical incidents
  const criticalIncidents = currentMetrics.incidents.filter(
    i => i.severity === 'critical' && !i.resolved
  );
  if (criticalIncidents.length >= SIGNAL_THRESHOLDS.criticalIncidents) {
    signals.push(createSignal(
      employeeId,
      'compliance',
      'Critical Incidents',
      `${criticalIncidents.length} critical incidents require immediate attention`,
      'critical',
      { criticalIncidents: criticalIncidents.length }
    ));
  }

  // Check manager feedback flags
  const flaggedFeedback = currentMetrics.managerFeedback.filter(f => f.flags.length > 0);
  if (flaggedFeedback.length >= SIGNAL_THRESHOLDS.negativeFeedback) {
    const hasMajorFlags = flaggedFeedback.some(f =>
      f.flags.includes('integrity') ||
      f.flags.includes('compliance') ||
      f.flags.includes('performance')
    );
    signals.push(createSignal(
      employeeId,
      'behavioral',
      'Manager Concerns',
      `${flaggedFeedback.length} manager feedback entries with flags${hasMajorFlags ? ' (major flags detected)' : ''}`,
      hasMajorFlags ? 'high' : 'medium',
      { flaggedFeedback: flaggedFeedback.length, majorFlags: hasMajorFlags }
    ));
  }

  // Check for project delays/failures
  const problematicProjects = currentMetrics.projectOutcomes.filter(
    p => p.status === 'delayed' || p.status === 'failed'
  );
  if (problematicProjects.length > 0) {
    const hasHighImpact = problematicProjects.some(p => p.score < 40);
    signals.push(createSignal(
      employeeId,
      'technical',
      'Project Performance Issues',
      `${problematicProjects.length} projects with issues${hasHighImpact ? ' (high impact projects)' : ''}`,
      hasHighImpact ? 'high' : 'medium',
      { projects: problematicProjects.map(p => ({ name: p.name, status: p.status })) }
    ));
  }

  return signals;
}

/**
 * Detect signals from manager feedback
 */
export function detectFeedbackSignals(
  employeeId: string,
  feedback: ManagerFeedback[]
): RiskSignal[] {
  const signals: RiskSignal[] = [];
  const recentFeedback = feedback.filter(f => {
    const feedbackDate = new Date(f.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return feedbackDate >= thirtyDaysAgo;
  });

  // Low ratings
  const lowRatings = recentFeedback.filter(f => f.rating <= 2);
  if (lowRatings.length >= 2) {
    signals.push(createSignal(
      employeeId,
      'behavioral',
      'Consistently Low Ratings',
      `${lowRatings.length} feedback entries with rating of 2 or lower in last 30 days`,
      'medium',
      { lowRatings: lowRatings.length, averageRating: calculateAverageRating(recentFeedback) }
    ));
  }

  // Specific flag types
  const integrityFlags = recentFeedback.filter(f => f.flags.includes('integrity'));
  if (integrityFlags.length > 0) {
    signals.push(createSignal(
      employeeId,
      'compliance',
      'Integrity Concerns',
      `${integrityFlags.length} feedback entries flagged for integrity issues`,
      'high',
      { integrityFlags: integrityFlags.length }
    ));
  }

  const complianceFlags = recentFeedback.filter(f => f.flags.includes('compliance'));
  if (complianceFlags.length > 0) {
    signals.push(createSignal(
      employeeId,
      'compliance',
      'Compliance Concerns',
      `${complianceFlags.length} feedback entries flagged for compliance issues`,
      'high',
      { complianceFlags: complianceFlags.length }
    ));
  }

  return signals;
}

/**
 * Detect signals from incidents
 */
export function detectIncidentSignals(
  employeeId: string,
  incidents: Incident[]
): RiskSignal[] {
  const signals: RiskSignal[] = [];

  // Security breaches
  const securityBreaches = incidents.filter(
    i => i.type === 'security_breach' && !i.resolved
  );
  if (securityBreaches.length > 0) {
    signals.push(createSignal(
      employeeId,
      'access',
      'Security Breaches',
      `${securityBreaches.length} unresolved security breaches`,
      'critical',
      { securityBreaches: securityBreaches.length }
    ));
  }

  // Attendance violations
  const attendanceViolations = incidents.filter(
    i => i.type === 'attendance_violation' && !i.resolved
  );
  if (attendanceViolations.length >= 3) {
    signals.push(createSignal(
      employeeId,
      'behavioral',
      'Repeated Attendance Violations',
      `${attendanceViolations.length} attendance violations in period`,
      'medium',
      { attendanceViolations: attendanceViolations.length }
    ));
  }

  return signals;
}

/**
 * Detect access anomalies
 */
export function detectAccessAnomalies(
  employeeId: string,
  accessLogs: { timestamp: string; action: string; resource: string; result: string }[]
): RiskSignal[] {
  const signals: RiskSignal[] = [];

  // Unusual access times
  const unusualTimes = accessLogs.filter(log => {
    const hour = new Date(log.timestamp).getHours();
    return hour < 6 || hour > 22; // Outside normal hours
  });
  if (unusualTimes.length > 10) {
    signals.push(createSignal(
      employeeId,
      'access',
      'Unusual Access Times',
      `${unusualTimes.length} access events outside normal working hours`,
      'medium',
      { unusualAccessCount: unusualTimes.length }
    ));
  }

  // Failed access attempts
  const failedAttempts = accessLogs.filter(log => log.result === 'denied');
  if (failedAttempts.length > 5) {
    signals.push(createSignal(
      employeeId,
      'access',
      'Multiple Access Denials',
      `${failedAttempts.length} access denials - potential unauthorized access attempts`,
      'high',
      { failedAttempts: failedAttempts.length }
    ));
  }

  // Large data downloads
  const largeDownloads = accessLogs.filter(log =>
    log.action === 'download' && log.resource.includes('large_dataset')
  );
  if (largeDownloads.length > 3) {
    signals.push(createSignal(
      employeeId,
      'access',
      'Large Data Downloads',
      `${largeDownloads.length} large dataset downloads - potential data exfiltration`,
      'high',
      { largeDownloads: largeDownloads.length }
    ));
  }

  return signals;
}

/**
 * Detect exit indicators
 */
export function detectExitIndicators(
  employeeId: string,
  signals: RiskSignal[],
  feedback: ManagerFeedback[]
): RiskSignal[] {
  const exitSignals: RiskSignal[] = [];

  // Count negative indicators
  const negativePatterns = signals.filter(s =>
    s.type === 'Performance Decline' ||
    s.type === 'Manager Concerns' ||
    s.type === 'Policy Violations'
  );

  if (negativePatterns.length >= 3) {
    exitSignals.push(createSignal(
      employeeId,
      'organizational',
      'Exit Risk Indicators',
      `${negativePatterns.length} negative patterns detected - elevated exit risk`,
      'medium',
      { negativePatterns: negativePatterns.length }
    ));
  }

  // Recent negative feedback with resignation language
  const recentFeedback = feedback.filter(f => {
    const feedbackDate = new Date(f.date);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    return feedbackDate >= sixtyDaysAgo;
  });

  const hasExitLanguage = recentFeedback.some(f =>
    f.comments.toLowerCase().includes('resign') ||
    f.comments.toLowerCase().includes('leaving') ||
    f.comments.toLowerCase().includes('new opportunity')
  );

  if (hasExitLanguage) {
    exitSignals.push(createSignal(
      employeeId,
      'organizational',
      'Exit Language Detected',
      'Manager feedback contains language suggesting potential resignation',
      'high',
      { exitLanguage: true }
    ));
  }

  return exitSignals;
}

/**
 * Create a risk signal
 */
function createSignal(
  employeeId: string,
  category: RiskCategory,
  type: string,
  description: string,
  severity: RiskSeverity,
  data: Record<string, unknown>
): RiskSignal {
  return {
    id: uuidv4(),
    employeeId,
    category,
    type,
    description,
    severity,
    detectedAt: new Date().toISOString(),
    source: 'workforce-intelligence',
    data,
    processed: false,
  };
}

/**
 * Determine severity based on value and thresholds
 */
function determineSeverity(value: number, low: number, medium: number, high: number): RiskSeverity {
  if (value >= high) return 'critical';
  if (value >= medium) return 'high';
  if (value >= low) return 'medium';
  return 'low';
}

/**
 * Calculate average rating
 */
function calculateAverageRating(feedback: ManagerFeedback[]): number {
  if (feedback.length === 0) return 0;
  const sum = feedback.reduce((acc, f) => acc + f.rating, 0);
  return sum / feedback.length;
}

/**
 * Aggregate signals into risk factors
 */
export function aggregateSignalsToFactors(signals: RiskSignal[]): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // Group by type
  const grouped = signals.reduce((acc, signal) => {
    if (!acc[signal.type]) {
      acc[signal.type] = [];
    }
    acc[signal.type].push(signal);
    return acc;
  }, {} as Record<string, RiskSignal[]>);

  // Create factors for each group
  for (const [type, typeSignals] of Object.entries(grouped)) {
    const highestSeverity = typeSignals.reduce((max, s) => {
      const severityOrder: RiskSeverity[] = ['low', 'medium', 'high', 'critical'];
      return severityOrder.indexOf(s.severity) > severityOrder.indexOf(max) ? s.severity : max;
    }, 'low' as RiskSeverity);

    factors.push({
      id: uuidv4(),
      category: typeSignals[0].category,
      name: type,
      description: `${typeSignals.length} instances of ${type}`,
      severity: highestSeverity,
      weight: getWeightForSeverity(highestSeverity),
      detectedAt: new Date().toISOString(),
      source: 'workforce-intelligence',
      evidence: typeSignals.map(s => ({
        id: s.id,
        type: 'behavioral' as const,
        description: s.description,
        timestamp: s.detectedAt,
        source: s.source,
        metadata: s.data,
      })),
      resolved: false,
    });
  }

  return factors;
}

function getWeightForSeverity(severity: RiskSeverity): number {
  switch (severity) {
    case 'critical': return 25;
    case 'high': return 15;
    case 'medium': return 8;
    case 'low': return 3;
  }
}

/**
 * Export for testing
 */
export const __testExports = {
  detectRiskSignals,
  detectFeedbackSignals,
  detectIncidentSignals,
  detectAccessAnomalies,
  detectExitIndicators,
  aggregateSignalsToFactors,
  SIGNAL_THRESHOLDS,
};