import { Transaction } from '../models/index.js';

/**
 * Analyze a transaction for anomalies and risk
 */
export async function analyzeTransaction(data: {
  tenantId: string;
  amount: number;
  type: string;
  category: string;
  description?: string;
}): Promise<{
  riskScore: number;
  anomalyDetected: boolean;
  insights: string[];
}> {
  const insights: string[] = [];

  // Get recent transactions for comparison
  const recentTransactions = await Transaction.find({
    tenantId: data.tenantId,
    date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  }).limit(100);

  // Calculate baseline statistics
  const amounts = recentTransactions.map(t => t.amount);
  const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
  const stdDev = amounts.length > 1
    ? Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - avgAmount, 2), 0) / amounts.length)
    : 0;

  // Calculate risk score
  let riskScore = 0;

  // Amount anomaly detection
  const zScore = stdDev > 0 ? Math.abs(data.amount - avgAmount) / stdDev : 0;
  if (zScore > 3) {
    riskScore += 40;
    insights.push(`Transaction amount is ${zScore.toFixed(1)} standard deviations from average`);
  } else if (zScore > 2) {
    riskScore += 20;
    insights.push('Transaction amount is unusual compared to recent history');
  }

  // Category-specific analysis
  if (data.type === 'expense') {
    const expenseCount = recentTransactions.filter(t => t.type === 'expense').length;
    if (expenseCount > 50) {
      insights.push('High expense frequency detected - consider cost optimization');
    }
  }

  // Large transaction check
  if (data.amount > avgAmount * 5) {
    riskScore += 30;
    insights.push('Large transaction relative to average - verify legitimacy');
  }

  // Description analysis
  if (data.description) {
    const keywords = ['urgent', 'immediate', 'wire', 'offshore', 'cash'];
    const hasSuspiciousKeyword = keywords.some(k =>
      data.description?.toLowerCase().includes(k)
    );
    if (hasSuspiciousKeyword) {
      riskScore += 15;
      insights.push('Transaction description contains flagged keywords');
    }
  }

  // Ensure risk score is within bounds
  riskScore = Math.min(100, Math.max(0, riskScore));

  return {
    riskScore,
    anomalyDetected: riskScore > 50,
    insights
  };
}

/**
 * Predict cashflow based on historical data
 */
export async function predictCashflow(tenantId: string, daysAhead: number = 30): Promise<{
  predicted: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
}> {
  const transactions = await Transaction.find({
    tenantId,
    date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
  }).sort({ date: 1 });

  const factors: string[] = [];

  if (transactions.length < 10) {
    return {
      predicted: 0,
      confidence: 0,
      trend: 'stable',
      factors: ['Insufficient data for prediction']
    };
  }

  // Calculate income vs expenses
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netFlow = income - expenses;

  // Calculate daily average
  const daySpan = (Date.now() - transactions[0]?.date?.getTime() || 0) / (24 * 60 * 60 * 1000);
  const dailyNet = daySpan > 0 ? netFlow / daySpan : 0;

  // Predict future cashflow
  const predicted = dailyNet * daysAhead;

  // Calculate confidence based on data consistency
  const recentNetFlows = transactions.slice(-30).reduce((sum, t) =>
    sum + (t.type === 'income' ? t.amount : -t.amount), 0
  );
  const variance = Math.abs(predicted - recentNetFlows) / (Math.abs(recentNetFlows) || 1);
  const confidence = Math.max(0, Math.min(100, 100 - variance * 10));

  // Determine trend
  const recentTrend = transactions.slice(-30);
  const earlierTrend = transactions.slice(0, 30);
  const recentAvg = recentTrend.reduce((sum, t) =>
    sum + (t.type === 'income' ? t.amount : -t.amount), 0
  ) / (recentTrend.length || 1);
  const earlierAvg = earlierTrend.reduce((sum, t) =>
    sum + (t.type === 'income' ? t.amount : -t.amount), 0
  ) / (earlierTrend.length || 1);

  const trend = recentAvg > earlierAvg * 1.1 ? 'up' :
                recentAvg < earlierAvg * 0.9 ? 'down' : 'stable';

  if (trend === 'up') factors.push('Revenue growth trend detected');
  if (trend === 'down') factors.push('Declining cashflow trend - attention needed');

  return {
    predicted: Math.round(predicted * 100) / 100,
    confidence: Math.round(confidence),
    trend,
    factors
  };
}

/**
 * Get spending insights and recommendations
 */
export async function getSpendingInsights(tenantId: string): Promise<{
  totalExpenses: number;
  categoryBreakdown: Record<string, number>;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  recommendations: string[];
}> {
  const transactions = await Transaction.find({
    tenantId,
    type: 'expense',
    date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });

  const categoryBreakdown: Record<string, number> = {};
  let totalExpenses = 0;

  for (const t of transactions) {
    totalExpenses += t.amount;
    categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
  }

  const topCategories = Object.entries(categoryBreakdown)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const recommendations: string[] = [];

  // Generate recommendations based on spending patterns
  if (topCategories[0]?.percentage > 40) {
    recommendations.push(`${topCategories[0].category} accounts for ${topCategories[0].percentage}% of expenses - consider cost reduction strategies`);
  }

  for (const cat of topCategories.slice(0, 3)) {
    if (cat.percentage > 20) {
      recommendations.push(`Review ${cat.category} spending for optimization opportunities`);
    }
  }

  return {
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    categoryBreakdown,
    topCategories,
    recommendations
  };
}
