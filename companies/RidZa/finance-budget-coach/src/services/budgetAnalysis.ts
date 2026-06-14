/**
 * Budget Analysis Service
 * Real budget analysis with spending patterns, comparisons, and recommendations
 */

import { Budget, IBudget, IBudgetItem, ISpendingRecord, BudgetCategory, CATEGORY_LABELS } from '../models/Budget';

// Recommendation types
export type RecommendationPriority = 'high' | 'medium' | 'low';
export type RecommendationType = 'reduce' | 'increase' | 'reallocate' | 'monitor' | 'action';

export interface IRecommendation {
  id: string;
  category: BudgetCategory;
  title: string;
  description: string;
  priority: RecommendationPriority;
  type: RecommendationType;
  potentialSavings?: number;
  potentialImpact?: number;
  actions: string[];
}

export interface ISpendingAnalysis {
  category: BudgetCategory;
  label: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'under_budget' | 'on_budget' | 'over_budget' | 'critical';
  trend: 'improving' | 'stable' | 'worsening';
}

export interface IBudgetAnalysisResult {
  tenantId: string;
  fiscalYear: number;
  fiscalQuarter?: number;
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  totalBudgeted: number;
  totalSpent: number;
  totalVariance: number;
  variancePercent: number;
  categoryAnalysis: ISpendingAnalysis[];
  recommendations: IRecommendation[];
  insights: string[];
  generatedAt: Date;
}

// Spending pattern detection
interface SpendingPattern {
  category: BudgetCategory;
  avgMonthlySpend: number;
  volatility: number; // Standard deviation
  trend: 'increasing' | 'stable' | 'decreasing';
  anomalies: number; // Number of outlier months
}

const PATTERN_WINDOW_MONTHS = 6;
const CRITICAL_OVER_SPENT_PERCENT = 20;
const WARNING_OVER_SPENT_PERCENT = 10;
const VOLATILITY_THRESHOLD = 0.3; // 30% standard deviation is high volatility

/**
 * Analyze spending patterns over time
 */
function analyzeSpendingPatterns(spending: ISpendingRecord[]): SpendingPattern[] {
  const patterns: Map<BudgetCategory, number[]> = new Map();
  
  // Group spending by category and month
  for (const record of spending) {
    if (!patterns.has(record.category)) {
      patterns.set(record.category, []);
    }
    patterns.get(record.category)?.push(record.amount);
  }
  
  const results: SpendingPattern[] = [];
  
  for (const [category, amounts] of patterns) {
    if (amounts.length < 2) continue;
    
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const volatility = avg > 0 ? stdDev / avg : 0;
    
    // Determine trend from first half vs second half
    const midPoint = Math.floor(amounts.length / 2);
    const firstHalf = amounts.slice(0, midPoint);
    const secondHalf = amounts.slice(midPoint);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
    
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (secondAvg > firstAvg * 1.1) trend = 'increasing';
    else if (secondAvg < firstAvg * 0.9) trend = 'decreasing';
    
    // Count anomalies (values > 2 std dev from mean)
    const anomalies = amounts.filter(val => Math.abs(val - avg) > 2 * stdDev).length;
    
    results.push({
      category,
      avgMonthlySpend: avg,
      volatility,
      trend,
      anomalies,
    });
  }
  
  return results;
}

/**
 * Calculate budget vs actual comparison for a category
 */
function analyzeCategory(
  category: BudgetCategory,
  budgetItems: IBudgetItem[],
  spending: ISpendingRecord[]
): ISpendingAnalysis {
  const label = CATEGORY_LABELS[category];
  
  // Get budgeted amount for category (convert to monthly)
  const budgetedItems = budgetItems.filter(item => item.category === category && item.type === 'expense');
  let budgeted = 0;
  for (const item of budgetedItems) {
    switch (item.frequency) {
      case 'yearly': budgeted += item.amount / 12; break;
      case 'quarterly': budgeted += item.amount / 3; break;
      case 'monthly': budgeted += item.amount; break;
    }
  }
  
  // Get actual spending for category
  const actual = spending
    .filter(s => s.category === category && s.type === 'expense')
    .reduce((sum, s) => sum + s.amount, 0);
  
  // Calculate variance
  const variance = budgeted - actual;
  const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;
  
  // Determine status
  let status: ISpendingAnalysis['status'] = 'on_budget';
  if (variancePercent > 5) status = 'under_budget';
  else if (variancePercent < -CRITICAL_OVER_SPENT_PERCENT) status = 'critical';
  else if (variancePercent < -WARNING_OVER_SPENT_PERCENT) status = 'over_budget';
  
  // Determine trend
  const patterns = analyzeSpendingPatterns(spending.filter(s => s.category === category));
  const trend: ISpendingAnalysis['trend'] = patterns.length > 0
    ? patterns[0].trend === 'increasing' ? 'worsening'
    : patterns[0].trend === 'decreasing' ? 'improving'
    : 'stable'
    : 'stable';
  
  return {
    category,
    label,
    budgeted,
    actual,
    variance,
    variancePercent,
    status,
    trend,
  };
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  categoryAnalysis: ISpendingAnalysis[],
  patterns: SpendingPattern[]
): IRecommendation[] {
  const recommendations: IRecommendation[] = [];
  let recId = 1;
  
  for (const analysis of categoryAnalysis) {
    // Over budget recommendations
    if (analysis.status === 'critical' || analysis.status === 'over_budget') {
      const overSpent = Math.abs(analysis.variance);
      recommendations.push({
        id: `rec_${recId++}`,
        category: analysis.category,
        title: `${analysis.label} Budget Alert`,
        description: `This category is ${Math.abs(analysis.variancePercent).toFixed(1)}% over budget with $${overSpent.toFixed(2)} overspent.`,
        priority: analysis.status === 'critical' ? 'high' : 'medium',
        type: 'reduce',
        potentialSavings: analysis.status === 'critical' ? overSpent * 0.1 : overSpent * 0.05,
        actions: [
          `Review recent ${analysis.label.toLowerCase()} expenses for non-essential items`,
          'Consider reallocating budget from under-spending categories',
          'Implement approval workflow for large purchases',
        ],
      });
    }
    
    // Under budget recommendations
    if (analysis.status === 'under_budget' && analysis.variancePercent > 15) {
      const underSpent = analysis.variance;
      recommendations.push({
        id: `rec_${recId++}`,
        category: analysis.category,
        title: `${analysis.label} Surplus Available`,
        description: `This category is ${analysis.variancePercent.toFixed(1)}% under budget with $${underSpent.toFixed(2)} available.`,
        priority: 'low',
        type: 'reallocate',
        potentialImpact: underSpent,
        actions: [
          'Consider reallocating to over-budget categories',
          'Invest in strategic initiatives for this area',
          'Build reserve for future expenses',
        ],
      });
    }
    
    // Volatile spending patterns
    const pattern = patterns.find(p => p.category === analysis.category);
    if (pattern && pattern.volatility > VOLATILITY_THRESHOLD) {
      recommendations.push({
        id: `rec_${recId++}`,
        category: analysis.category,
        title: `${analysis.label} Spending Volatility`,
        description: `Spending in this category varies by ${(pattern.volatility * 100).toFixed(0)}% month to month.`,
        priority: pattern.anomalies > 2 ? 'high' : 'medium',
        type: 'monitor',
        actions: [
          'Implement monthly spending caps',
          'Require pre-approval for large purchases',
          'Create category-specific policies',
        ],
      });
    }
    
    // Increasing trend
    if (pattern && pattern.trend === 'increasing') {
      recommendations.push({
        id: `rec_${recId++}`,
        category: analysis.category,
        title: `${analysis.label} Growing Expenses`,
        description: `Spending in this category is trending upward. Current monthly average: $${pattern.avgMonthlySpend.toFixed(2)}`,
        priority: 'medium',
        type: 'monitor',
        potentialImpact: pattern.avgMonthlySpend * 0.1,
        actions: [
          'Investigate root causes of increased spending',
          'Set up alerts for budget threshold breaches',
          'Review vendor contracts for better rates',
        ],
      });
    }
  }
  
  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations;
}

/**
 * Generate insights from analysis
 */
function generateInsights(
  categoryAnalysis: ISpendingAnalysis[],
  recommendations: IRecommendation[]
): string[] {
  const insights: string[] = [];
  
  // Overall health insight
  const criticalCount = categoryAnalysis.filter(c => c.status === 'critical').length;
  const overBudgetCount = categoryAnalysis.filter(c => c.status === 'over_budget').length;
  const underBudgetCount = categoryAnalysis.filter(c => c.status === 'under_budget').length;
  
  if (criticalCount > 0) {
    insights.push(`${criticalCount} category(s) in critical budget status - requires immediate attention`);
  }
  
  if (overBudgetCount > 0 && criticalCount === 0) {
    insights.push(`${overBudgetCount} category(s) over budget - consider cost optimization measures`);
  }
  
  if (underBudgetCount > categoryAnalysis.length / 2) {
    insights.push('Majority of categories are under budget - opportunity to build reserves or invest');
  }
  
  // Variance insights
  const avgVariance = categoryAnalysis.reduce((sum, c) => sum + Math.abs(c.variancePercent), 0) / categoryAnalysis.length;
  if (avgVariance > 15) {
    insights.push('High overall budget variance suggests need for more accurate forecasting');
  }
  
  // Trend insights
  const worseningTrends = categoryAnalysis.filter(c => c.trend === 'worsening').length;
  if (worseningTrends > 0) {
    insights.push(`${worseningTrends} category(s) showing worsening spending trends`);
  }
  
  // Action item insight
  const urgentRecs = recommendations.filter(r => r.priority === 'high').length;
  if (urgentRecs > 0) {
    insights.push(`${urgentRecs} high-priority action item(s) require immediate review`);
  }
  
  return insights;
}

/**
 * Determine overall budget health score
 */
function calculateOverallHealth(
  categoryAnalysis: ISpendingAnalysis[],
  patterns: SpendingPattern[]
): IBudgetAnalysisResult['overallHealth'] {
  if (categoryAnalysis.length === 0) return 'good';
  
  const criticalCount = categoryAnalysis.filter(c => c.status === 'critical').length;
  const overBudgetCount = categoryAnalysis.filter(c => c.status === 'over_budget').length;
  const worseningTrends = patterns.filter(p => p.trend === 'increasing').length;
  const highVolatility = patterns.filter(p => p.volatility > VOLATILITY_THRESHOLD).length;
  
  const totalIssues = criticalCount * 3 + overBudgetCount * 2 + worseningTrends + highVolatility;
  
  if (totalIssues >= 5) return 'critical';
  if (totalIssues >= 3) return 'warning';
  if (totalIssues <= 1) return 'excellent';
  return 'good';
}

/**
 * Main analysis function
 */
export async function analyzeBudget(tenantId: string, fiscalYear?: number): Promise<IBudgetAnalysisResult> {
  // Build query
  const query: Record<string, unknown> = { tenantId };
  if (fiscalYear) {
    query.fiscalYear = fiscalYear;
  }
  
  // Fetch budget data from MongoDB
  const budget = await Budget.findOne(query).sort({ fiscalYear: -1 });
  
  if (!budget) {
    // Return empty analysis structure
    return {
      tenantId,
      fiscalYear: fiscalYear || new Date().getFullYear(),
      overallHealth: 'good',
      totalBudgeted: 0,
      totalSpent: 0,
      totalVariance: 0,
      variancePercent: 0,
      categoryAnalysis: [],
      recommendations: [],
      insights: ['No budget data found. Create a budget to get started.'],
      generatedAt: new Date(),
    };
  }
  
  // Get unique categories from budget items and spending
  const allCategories = new Set<BudgetCategory>();
  for (const item of budget.items) {
    allCategories.add(item.category);
  }
  for (const record of budget.spending) {
    allCategories.add(record.category);
  }
  
  // Analyze each category
  const categoryAnalysis: ISpendingAnalysis[] = [];
  for (const category of allCategories) {
    categoryAnalysis.push(analyzeCategory(category, budget.items, budget.spending));
  }
  
  // Analyze spending patterns
  const patterns = analyzeSpendingPatterns(budget.spending);
  
  // Generate recommendations
  const recommendations = generateRecommendations(categoryAnalysis, patterns);
  
  // Generate insights
  const insights = generateInsights(categoryAnalysis, recommendations);
  
  // Calculate overall health
  const overallHealth = calculateOverallHealth(categoryAnalysis, patterns);
  
  // Calculate totals
  const totalBudgeted = categoryAnalysis.reduce((sum, c) => sum + c.budgeted, 0);
  const totalSpent = categoryAnalysis.reduce((sum, c) => sum + c.actual, 0);
  const totalVariance = totalBudgeted - totalSpent;
  const variancePercent = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;
  
  return {
    tenantId,
    fiscalYear: budget.fiscalYear,
    fiscalQuarter: budget.fiscalQuarter,
    overallHealth,
    totalBudgeted,
    totalSpent,
    totalVariance,
    variancePercent,
    categoryAnalysis,
    recommendations,
    insights,
    generatedAt: new Date(),
  };
}

// Scenario simulation types
export interface IScenarioInput {
  category: BudgetCategory;
  changeType: 'increase' | 'decrease' | 'set';
  amount: number;
  changeAmount?: number; // For increase/decrease
}

export interface IScenarioResult {
  originalTotal: number;
  newTotal: number;
  impact: number;
  impactPercent: number;
  categoryImpacts: {
    category: BudgetCategory;
    label: string;
    original: number;
    new: number;
    change: number;
  }[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Simulate budget scenarios
 */
export async function simulateScenario(
  tenantId: string,
  scenarios: IScenarioInput[]
): Promise<IScenarioResult> {
  // Get current budget
  const query: Record<string, unknown> = { tenantId };
  const budget = await Budget.findOne(query).sort({ fiscalYear: -1 });
  
  if (!budget) {
    return {
      originalTotal: 0,
      newTotal: 0,
      impact: 0,
      impactPercent: 0,
      categoryImpacts: [],
      warnings: ['No budget data found'],
      recommendations: ['Create a budget first to run simulations'],
    };
  }
  
  // Calculate current totals by category
  const categoryTotals: Map<BudgetCategory, number> = new Map();
  for (const item of budget.items.filter(i => i.type === 'expense')) {
    const current = categoryTotals.get(item.category) || 0;
    let amount = item.amount;
    if (item.frequency === 'yearly') amount /= 12;
    else if (item.frequency === 'quarterly') amount /= 3;
    categoryTotals.set(item.category, current + amount);
  }
  
  // Apply scenarios
  const newTotals = new Map(categoryTotals);
  const warnings: string[] = [];
  
  for (const scenario of scenarios) {
    const current = newTotals.get(scenario.category) || 0;
    let newAmount: number;
    
    switch (scenario.changeType) {
      case 'set':
        newAmount = scenario.amount;
        break;
      case 'increase':
        newAmount = current + (scenario.changeAmount || scenario.amount);
        break;
      case 'decrease':
        newAmount = Math.max(0, current - (scenario.changeAmount || scenario.amount));
        break;
    }
    
    newTotals.set(scenario.category, newAmount);
    
    // Check for warnings
    const budgeted = categoryTotals.get(scenario.category) || 0;
    if (newAmount > budgeted * 1.5) {
      warnings.push(`${CATEGORY_LABELS[scenario.category]} increase exceeds 50% of current budget`);
    }
    if (newAmount < budgeted * 0.5 && scenario.changeType === 'decrease') {
      warnings.push(`${CATEGORY_LABELS[scenario.category]} reduction exceeds 50% - may impact operations`);
    }
  }
  
  // Calculate totals
  const originalTotal = Array.from(categoryTotals.values()).reduce((a, b) => a + b, 0);
  const newTotal = Array.from(newTotals.values()).reduce((a, b) => a + b, 0);
  const impact = newTotal - originalTotal;
  const impactPercent = originalTotal > 0 ? (impact / originalTotal) * 100 : 0;
  
  // Build category impacts
  const categoryImpacts = [];
  for (const category of new Set([...categoryTotals.keys(), ...newTotals.keys()])) {
    const original = categoryTotals.get(category) || 0;
    const newVal = newTotals.get(category) || 0;
    if (original !== newVal) {
      categoryImpacts.push({
        category,
        label: CATEGORY_LABELS[category],
        original,
        new: newVal,
        change: newVal - original,
      });
    }
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (impact > originalTotal * 0.1) {
    recommendations.push('Significant budget increase - ensure revenue can support this');
  }
  if (impact < -originalTotal * 0.1) {
    recommendations.push('Significant cost reduction - review impact on operations');
  }
  
  return {
    originalTotal,
    newTotal,
    impact,
    impactPercent,
    categoryImpacts,
    warnings,
    recommendations,
  };
}

export default {
  analyzeBudget,
  simulateScenario,
};
