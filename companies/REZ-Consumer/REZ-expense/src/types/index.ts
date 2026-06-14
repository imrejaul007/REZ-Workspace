/**
 * REZ Expense - Type Definitions
 * Enhanced with AI Categorization, Policy Enforcement, and Insights
 */

// ============================================================================
// Base Expense Types
// ============================================================================

export interface Location {
  city: string;
  lat: number;
  lng: number;
}

export interface ExpenseBase {
  expense_id: string;
  user_id: string;
  merchant_name: string;
  category: string;
  amount: number;
  currency: string;
  date: Date;
  receipt_url?: string;
  location?: Location;
  extracted_data?: Record<string, unknown>;
  created_at: Date;
}

// ============================================================================
// AI Auto-Categorization Types
// ============================================================================

export type CategoryConfidence = 'high' | 'medium' | 'low';

export interface CategorySuggestion {
  category: string;
  confidence: number;
  confidence_level: CategoryConfidence;
  reasoning: string;
  alternatives?: CategorySuggestion[];
}

export interface AICategorizationResult {
  expense_id: string;
  suggested_category: string;
  confidence: number;
  confidence_level: CategoryConfidence;
  reasoning: string;
  alternatives: CategorySuggestion[];
  requires_review: boolean;
  timestamp: Date;
}

export interface CategoryHistoryEntry {
  expense_id: string;
  original_category: string;
  final_category: string;
  changed_by: 'ai' | 'user';
  timestamp: Date;
  merchant_pattern: string;
}

export interface CategoryPattern {
  merchant_pattern: string;
  category: string;
  frequency: number;
  last_used: Date;
  user_id: string;
}

// ============================================================================
// Policy Enforcement Types
// ============================================================================

export type PolicyViolationSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface PolicyRule {
  rule_id: string;
  name: string;
  description: string;
  condition: PolicyCondition;
  action: PolicyAction;
  enabled: boolean;
  priority: number;
}

export interface PolicyCondition {
  type: 'amount_exceeds' | 'category_not_allowed' | 'merchant_blacklist' | 'time_window' | 'frequency_exceeded' | 'custom';
  params: Record<string, unknown>;
  operator: 'and' | 'or';
  subconditions?: PolicyCondition[];
}

export interface PolicyAction {
  type: 'flag' | 'reject' | 'require_approval' | 'notify' | 'escalate';
  approver_role?: string;
  notification_template?: string;
  escalation_threshold?: number;
}

export interface TenantPolicy {
  tenant_id: string;
  policy_id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  budget_limits: BudgetLimit[];
  approval_workflows: ApprovalWorkflow[];
  created_at: Date;
  updated_at: Date;
  enabled: boolean;
}

export interface BudgetLimit {
  category: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  limit: number;
  alert_threshold: number; // Percentage (0-100)
}

export interface ApprovalWorkflow {
  workflow_id: string;
  name: string;
  trigger_conditions: PolicyCondition[];
  approvers: Approver[];
  escalation_path: string[];
}

export interface Approver {
  user_id: string;
  role: string;
  level: number;
  auto_approve_limit?: number;
}

export interface PolicyViolation {
  violation_id: string;
  expense_id: string;
  policy_id: string;
  tenant_id: string;
  user_id: string;
  rule_id: string;
  rule_name: string;
  severity: PolicyViolationSeverity;
  description: string;
  actual_value: unknown;
  allowed_value?: unknown;
  resolution?: 'pending' | 'approved' | 'rejected' | 'escalated' | 'waived';
  resolved_by?: string;
  resolved_at?: Date;
  suggested_approver?: string;
  created_at: Date;
}

export interface PolicyValidationResult {
  expense_id: string;
  is_valid: boolean;
  violations: PolicyViolation[];
  warnings: PolicyWarning[];
  requires_approval: boolean;
  suggested_approvers: string[];
  approval_routing?: ApprovalRoutingSuggestion;
}

export interface PolicyWarning {
  code: string;
  message: string;
  suggestion: string;
}

export interface ApprovalRoutingSuggestion {
  primary_approver: string;
  approver_role: string;
  escalation_path: string[];
  estimated_approval_time: string;
}

// ============================================================================
// Spend Pattern Insights Types
// ============================================================================

export interface SpendInsight {
  insight_id: string;
  user_id: string;
  tenant_id?: string;
  type: InsightType;
  title: string;
  description: string;
  data: InsightData;
  period_start: Date;
  period_end: Date;
  generated_at: Date;
  actionable: boolean;
  action_suggestion?: string;
}

export type InsightType =
  | 'spending_trend'
  | 'category_breakdown'
  | 'anomaly_detected'
  | 'budget_alert'
  | 'merchant_insight'
  | 'savings_opportunity'
  | 'pattern_change'
  | 'comparison';

export interface InsightData {
  metric?: number;
  previous_metric?: number;
  change_percentage?: number;
  category?: string;
  merchant?: string;
  threshold?: number;
  actual_value?: number;
  recommendations?: string[];
}

export interface WeeklyInsight {
  user_id: string;
  week_start: Date;
  week_end: Date;
  total_spent: number;
  category_breakdown: CategorySpending[];
  top_merchants: MerchantSpending[];
  comparison_to_previous_week: number;
  insights: SpendInsight[];
  anomalies: AnomalyAlert[];
}

export interface MonthlyInsight {
  user_id: string;
  month: string;
  year: number;
  total_spent: number;
  category_breakdown: CategorySpending[];
  top_merchants: MerchantSpending[];
  comparison_to_previous_month: number;
  comparison_to_same_month_last_year: number;
  insights: SpendInsight[];
  budget_status: BudgetStatus[];
  trends: SpendingTrend[];
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  average_transaction: number;
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
}

export interface MerchantSpending {
  merchant: string;
  amount: number;
  count: number;
  category: string;
  last_transaction: Date;
}

export interface SpendingTrend {
  period: string;
  category: string;
  amount: number;
  trend: 'up' | 'down' | 'stable';
}

export interface BudgetStatus {
  category: string;
  budget_amount: number;
  spent_amount: number;
  remaining: number;
  percentage_used: number;
  alert_level: 'green' | 'yellow' | 'red';
  projected_overage?: number;
}

export interface AnomalyAlert {
  anomaly_id: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  detected_value: number;
  expected_value: number;
  deviation_percentage: number;
  detected_at: Date;
  category?: string;
  merchant?: string;
}

export type AnomalyType =
  | 'unusual_amount'
  | 'unusual_time'
  | 'new_merchant'
  | 'category_spike'
  | 'pattern_break'
  | 'frequency_anomaly';

// ============================================================================
// Smart Receipt Matching Types
// ============================================================================

export interface Receipt {
  receipt_id: string;
  user_id: string;
  merchant_name?: string;
  amount?: number;
  date?: Date;
  image_url: string;
  ocr_data?: OCRExtractedData;
  matched_expense_id?: string;
  match_confidence?: number;
  match_status: ReceiptMatchStatus;
  uploaded_at: Date;
  processed_at?: Date;
}

export type ReceiptMatchStatus = 'unmatched' | 'pending' | 'matched' | 'flagged' | 'rejected';

export interface OCRExtractedData {
  merchant_name?: string;
  amount?: number;
  date?: Date;
  items?: ReceiptItem[];
  tax?: number;
  tip?: number;
  payment_method?: string;
  invoice_number?: string;
  confidence: number;
  raw_text?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptMatchCandidate {
  expense_id: string;
  merchant_name: string;
  amount: number;
  date: Date;
  match_score: number;
  match_factors: MatchFactor[];
  reasons: string[];
}

export interface MatchFactor {
  factor: 'merchant' | 'amount' | 'date' | 'location' | 'pattern';
  weight: number;
  score: number;
  contribution: number;
}

export interface ReceiptMatchResult {
  receipt_id: string;
  status: ReceiptMatchStatus;
  matched_expense?: ExpenseMatch;
  candidates: ReceiptMatchCandidate[];
  suggestions: MatchSuggestion[];
  auto_match_confidence: number;
}

export interface ExpenseMatch {
  expense_id: string;
  merchant_name: string;
  amount: number;
  date: Date;
  match_score: number;
}

export interface MatchSuggestion {
  type: 'create_expense' | 'merge_receipts' | 'review';
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CategorizeExpenseRequest {
  expense_id: string;
  force_recategorize?: boolean;
}

export interface ConfirmCategoryRequest {
  expense_id: string;
  category: string;
  accept_suggestion?: boolean;
  user_feedback?: string;
}

export interface ValidatePolicyRequest {
  expense_id: string;
  tenant_id?: string;
}

export interface LogViolationRequest {
  expense_id: string;
  policy_id: string;
  violation: Omit<PolicyViolation, 'violation_id' | 'created_at'>;
}

export interface MatchReceiptsRequest {
  receipt_ids?: string[];
  user_id?: string;
  auto_match_threshold?: number;
}

export interface GetInsightsRequest {
  user_id: string;
  tenant_id?: string;
  period?: 'week' | 'month' | 'quarter' | 'year';
  start_date?: Date;
  end_date?: Date;
}

// ============================================================================
// Response Types
// ============================================================================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ============================================================================
// Event Types
// ============================================================================

export interface ExpenseEvent {
  type: ExpenseEventType;
  user_id: string;
  expense_id: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export type ExpenseEventType =
  | 'expense.added'
  | 'expense.categorized'
  | 'expense.recategorized'
  | 'expense.policy_violation'
  | 'expense.approved'
  | 'expense.rejected'
  | 'receipt.matched'
  | 'receipt.unmatched'
  | 'insight.generated'
  | 'budget.alert';

// ============================================================================
// Integration Types
// ============================================================================

export interface HOJAIFinanceAIConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

export interface ClaudeCategorizationInput {
  merchant_name: string;
  amount: number;
  date: Date;
  extracted_data?: Record<string, unknown>;
  user_category_history?: CategoryHistoryEntry[];
  available_categories?: string[];
}

export interface ClaudeCategorizationOutput {
  category: string;
  confidence: number;
  reasoning: string;
  alternatives: Array<{
    category: string;
    confidence: number;
    reasoning: string;
  }>;
}

// ============================================================================
// Constants
// ============================================================================

export const EXPENSE_CATEGORIES = [
  'food',
  'travel',
  'shopping',
  'entertainment',
  'utilities',
  'healthcare',
  'education',
  'other',
] as const;

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  food: 'Food and dining including restaurants, delivery, groceries',
  travel: 'Transportation including Uber, flights, bus, train',
  shopping: 'Retail purchases including Amazon, clothing, electronics',
  entertainment: 'Leisure activities including movies, concerts, subscriptions',
  utilities: 'Bills and utilities including electricity, water, internet',
  healthcare: 'Medical expenses including pharmacy, doctor visits',
  education: 'Learning expenses including books, courses, tuition',
  other: 'Miscellaneous expenses not fitting other categories',
};

export const VIOLATION_SEVERITY_ORDER: PolicyViolationSeverity[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
];

export const MATCH_CONFIDENCE_THRESHOLDS = {
  AUTO_MATCH: 0.9,
  SUGGEST_MATCH: 0.6,
  REVIEW_REQUIRED: 0.4,
} as const;
