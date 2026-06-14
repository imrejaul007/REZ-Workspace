/**
 * Risk Assessment Service
 * Evaluates overall risk for tenants
 */
import { RiskAssessment, RiskFactor, Transaction, AuditAlert } from '../types/index.js';

const RISK_WEIGHTS = {
  highValueTransactions: 0.15,
  velocityAnomalies: 0.20,
  fraudAlerts: 0.30,
  complianceIssues: 0.25,
  unusualPatterns: 0.10,
};

interface TenantMetrics {
  totalTransactions: number;
  totalAmount: number;
  avgTransactionAmount: number;
  maxTransactionAmount: number;
  fraudAlertCount: number;
  duplicateCount: number;
  uniqueRecipients: number;
  transactionsByHour: Record<number, number>;
}

/**
 * Calculate risk factors for a tenant
 */
export function calculateRiskFactors(
  metrics: TenantMetrics,
  alerts: AuditAlert[]
): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // High value transaction ratio
  const highValueRatio = metrics.maxTransactionAmount / (metrics.avgTransactionAmount || 1);
  if (highValueRatio > 10) {
    factors.push({
      category: 'High Value Transactions',
      score: 40,
      description: `Max transaction ${highValueRatio.toFixed(1)}x above average`,
      severity: 'high',
    });
  } else if (highValueRatio > 5) {
    factors.push({
      category: 'High Value Transactions',
      score: 20,
      description: `Max transaction ${highValueRatio.toFixed(1)}x above average`,
      severity: 'medium',
    });
  }

  // Fraud alerts
  const fraudAlerts = alerts.filter(a => a.type === 'fraud' && !a.acknowledged);
  if (fraudAlerts.length > 5) {
    factors.push({
      category: 'Fraud Alerts',
      score: 50,
      description: `${fraudAlerts.length} unacknowledged fraud alerts`,
      severity: 'critical',
    });
  } else if (fraudAlerts.length > 2) {
    factors.push({
      category: 'Fraud Alerts',
      score: 25,
      description: `${fraudAlerts.length} unacknowledged fraud alerts`,
      severity: 'high',
    });
  } else if (fraudAlerts.length > 0) {
    factors.push({
      category: 'Fraud Alerts',
      score: 10,
      description: `${fraudAlerts.length} fraud alert(s) requiring review`,
      severity: 'medium',
    });
  }

  // Duplicate transactions
  if (metrics.duplicateCount > 10) {
    factors.push({
      category: 'Duplicate Detection',
      score: 45,
      description: `${metrics.duplicateCount} potential duplicate transactions`,
      severity: 'high',
    });
  } else if (metrics.duplicateCount > 5) {
    factors.push({
      category: 'Duplicate Detection',
      score: 20,
      description: `${metrics.duplicateCount} potential duplicate transactions`,
      severity: 'medium',
    });
  }

  // Unusual hour transactions
  const unusualHourCount = Object.entries(metrics.transactionsByHour)
    .filter(([hour]) => {
      const h = parseInt(hour, 10);
      return h < 6 || h > 22;
    })
    .reduce((sum, [, count]) => sum + count, 0);

  const unusualHourRatio = unusualHourCount / (metrics.totalTransactions || 1);
  if (unusualHourRatio > 0.3) {
    factors.push({
      category: 'Unusual Timing',
      score: 25,
      description: `${(unusualHourRatio * 100).toFixed(0)}% of transactions during unusual hours`,
      severity: 'medium',
    });
  }

  // Recipient concentration
  const recipientConcentration = metrics.uniqueRecipients > 0
    ? metrics.totalTransactions / metrics.uniqueRecipients
    : 0;
  if (recipientConcentration > 20) {
    factors.push({
      category: 'Recipient Concentration',
      score: 15,
      description: `High transaction concentration to few recipients`,
      severity: 'low',
    });
  }

  return factors;
}

/**
 * Calculate overall risk score
 */
export function calculateRiskScore(factors: RiskFactor[]): number {
  if (factors.length === 0) return 0;

  // Weighted average based on severity
  const severityWeights: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const factor of factors) {
    const weight = severityWeights[factor.severity] || 1;
    weightedSum += factor.score * weight;
    totalWeight += weight;
  }

  return Math.min(Math.round(weightedSum / totalWeight), 100);
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

/**
 * Generate recommendations based on risk factors
 */
export function generateRecommendations(factors: RiskFactor[]): string[] {
  const recommendations: string[] = [];

  for (const factor of factors) {
    switch (factor.category) {
      case 'Fraud Alerts':
        recommendations.push('Review and acknowledge all fraud alerts immediately');
        recommendations.push('Implement additional verification for flagged transactions');
        break;
      case 'Duplicate Detection':
        recommendations.push('Audit recent transactions for potential fraud');
        recommendations.push('Review vendor relationships and payment processes');
        break;
      case 'High Value Transactions':
        recommendations.push('Implement dual authorization for large transactions');
        recommendations.push('Set up automated alerts for amounts exceeding threshold');
        break;
      case 'Unusual Timing':
        recommendations.push('Review transaction patterns during off-hours');
        recommendations.push('Consider implementing time-based transaction controls');
        break;
      case 'Recipient Concentration':
        recommendations.push('Verify business relationships with frequent recipients');
        recommendations.push('Review payment approval workflows');
        break;
    }
  }

  // Add general recommendations
  if (factors.some(f => f.severity === 'critical' || f.severity === 'high')) {
    recommendations.push('Schedule immediate audit review with compliance team');
    recommendations.push('Consider temporary transaction limits pending review');
  }

  return [...new Set(recommendations)]; // Deduplicate
}

/**
 * Perform comprehensive risk assessment
 */
export function assessRisk(
  tenantId: string,
  transactions: Transaction[],
  alerts: AuditAlert[]
): RiskAssessment {
  // Calculate metrics from transactions
  const metrics: TenantMetrics = {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    avgTransactionAmount: transactions.length > 0
      ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
      : 0,
    maxTransactionAmount: transactions.length > 0
      ? Math.max(...transactions.map(t => t.amount))
      : 0,
    fraudAlertCount: alerts.filter(a => a.type === 'fraud').length,
    duplicateCount: alerts.filter(a => a.type === 'duplicate').length,
    uniqueRecipients: new Set(transactions.map(t => t.receiverId)).size,
    transactionsByHour: transactions.reduce((acc, t) => {
      const hour = new Date(t.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>),
  };

  // Calculate risk factors
  const factors = calculateRiskFactors(metrics, alerts);

  // Calculate overall score
  const riskScore = calculateRiskScore(factors);
  const overallRisk = getRiskLevel(riskScore);

  // Generate recommendations
  const recommendations = generateRecommendations(factors);

  return {
    tenantId,
    overallRisk,
    riskScore,
    factors,
    recommendations,
    lastAssessment: new Date(),
  };
}