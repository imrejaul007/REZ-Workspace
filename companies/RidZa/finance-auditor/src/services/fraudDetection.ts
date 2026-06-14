/**
 * Fraud Detection Service
 * Implements real pattern analysis for fraud detection
 */
import crypto from 'crypto';
import { Transaction, FraudDetectionResult } from '../types/index.js';

// Fraud pattern thresholds
const THRESHOLDS = {
  // Amount thresholds
  highAmountThreshold: 10000,
  veryHighAmountThreshold: 50000,

  // Velocity thresholds
  maxTransactionsPerHour: 10,
  maxTransactionsPerDay: 50,

  // Risk score thresholds (0-100)
  lowRiskMax: 25,
  mediumRiskMax: 50,
  highRiskMax: 75,
  // Above 75 = critical

  // Time windows
  hourInMs: 60 * 60 * 1000,
  dayInMs: 24 * 60 * 60 * 1000,
};

/**
 * Calculate hash for transaction deduplication
 */
export function hashTransaction(transaction: Transaction): string {
  const data = `${transaction.tenantId}|${transaction.senderId}|${transaction.receiverId}|${transaction.amount}|${transaction.timestamp.toISOString()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Analyze transaction patterns for fraud indicators
 */
export function analyzePatterns(
  transaction: Transaction,
  recentTransactions: Transaction[]
): { score: number; factors: string[]; recommendations: string[] } {
  let score = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];

  // 1. Amount analysis
  if (transaction.amount > THRESHOLDS.veryHighAmountThreshold) {
    score += 40;
    factors.push(`Very high transaction amount: ${transaction.amount}`);
    recommendations.push('Require additional verification for large transactions');
  } else if (transaction.amount > THRESHOLDS.highAmountThreshold) {
    score += 20;
    factors.push(`High transaction amount: ${transaction.amount}`);
    recommendations.push('Consider dual authorization for amounts over threshold');
  }

  // 2. Velocity analysis - transactions in last hour
  const oneHourAgo = Date.now() - THRESHOLDS.hourInMs;
  const lastHourTx = recentTransactions.filter(t =>
    t.timestamp.getTime() > oneHourAgo
  );

  if (lastHourTx.length >= THRESHOLDS.maxTransactionsPerHour) {
    score += 30;
    factors.push(`High velocity: ${lastHourTx.length} transactions in last hour`);
    recommendations.push('Implement rate limiting for high-frequency transactions');
  } else if (lastHourTx.length > THRESHOLDS.maxTransactionsPerHour / 2) {
    score += 15;
    factors.push(`Elevated velocity: ${lastHourTx.length} transactions in last hour`);
  }

  // 3. Velocity analysis - transactions in last day
  const oneDayAgo = Date.now() - THRESHOLDS.dayInMs;
  const lastDayTx = recentTransactions.filter(t =>
    t.timestamp.getTime() > oneDayAgo
  );

  if (lastDayTx.length >= THRESHOLDS.maxTransactionsPerDay) {
    score += 25;
    factors.push(`Daily volume exceeded: ${lastDayTx.length} transactions today`);
    recommendations.push('Review account for unusual activity patterns');
  }

  // 4. Round number detection (potential structuring)
  const isRoundNumber = transaction.amount % 100 === 0 && transaction.amount >= 1000;
  if (isRoundNumber) {
    score += 10;
    factors.push('Round number transaction detected');
    recommendations.push('Flag for potential structuring detection');
  }

  // 5. New recipient detection
  const newRecipient = !recentTransactions.some(t =>
    t.receiverId === transaction.receiverId
  );
  if (newRecipient && transaction.amount > 5000) {
    score += 15;
    factors.push('First transaction to new recipient with high amount');
    recommendations.push('Verify recipient identity before processing');
  }

  // 6. Time-based anomaly (unusual hours)
  const hour = new Date(transaction.timestamp).getHours();
  const isUnusualHour = hour < 6 || hour > 22;
  if (isUnusualHour && transaction.amount > 2000) {
    score += 10;
    factors.push('Transaction during unusual hours');
    recommendations.push('Consider time-based transaction limits');
  }

  // 7. Unusual amount compared to recent average
  if (lastDayTx.length > 0) {
    const avgAmount = lastDayTx.reduce((sum, t) => sum + t.amount, 0) / lastDayTx.length;
    if (transaction.amount > avgAmount * 3) {
      score += 20;
      factors.push(`Amount significantly higher than average (${avgAmount.toFixed(2)})`);
      recommendations.push('Verify transaction legitimacy');
    }
  }

  // Cap score at 100
  score = Math.min(score, 100);

  return { score, factors, recommendations };
}

/**
 * Determine risk level from score
 */
export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= THRESHOLDS.lowRiskMax) return 'low';
  if (score <= THRESHOLDS.mediumRiskMax) return 'medium';
  if (score <= THRESHOLDS.highRiskMax) return 'high';
  return 'critical';
}

/**
 * Main fraud detection function
 */
export async function detectFraud(
  transaction: Transaction,
  recentTransactions: Transaction[] = []
): Promise<FraudDetectionResult> {
  const { score, factors, recommendations } = analyzePatterns(transaction, recentTransactions);
  const risk = getRiskLevel(score);

  return {
    alertId: `FRAUD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    risk,
    score,
    factors,
    recommendations,
    timestamp: new Date(),
  };
}

/**
 * Batch fraud detection for multiple transactions
 */
export async function batchDetectFraud(
  transactions: Transaction[]
): Promise<FraudDetectionResult[]> {
  return Promise.all(transactions.map(t => detectFraud(t, transactions)));
}