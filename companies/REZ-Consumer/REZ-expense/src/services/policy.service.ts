/**
 * REZ Expense - Policy Enforcement Service
 * Validates expenses against tenant policies and detects violations
 */

import axios, { AxiosInstance } from 'axios';
import {
  TenantPolicy,
  PolicyRule,
  PolicyViolation,
  PolicyValidationResult,
  PolicyWarning,
  BudgetLimit,
  ExpenseBase,
  PolicyViolationSeverity,
  ApprovalRoutingSuggestion,
} from '../types';

interface PolicyConfig {
  HOJAIFINANCE_AI_URL: string;
  HOJAIFINANCE_AI_API_KEY: string;
}

export class PolicyService {
  private hojaiFinanceAIUrl: string;
  private apiKey: string;
  private timeout: number;
  private httpClient: AxiosInstance;
  private tenantPolicies: Map<string, TenantPolicy>;

  constructor() {
    this.hojaiFinanceAIUrl = process.env.HOJAIFINANCE_AI_URL || 'http://localhost:4830';
    this.apiKey = process.env.HOJAIFINANCE_AI_API_KEY || '';
    this.timeout = parseInt(process.env.AI_TIMEOUT || '30000', 10);

    this.httpClient = axios.create({
      baseURL: this.hojaiFinanceAIUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
    });

    this.tenantPolicies = new Map();
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default policies
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicy: TenantPolicy = {
      tenant_id: 'default',
      policy_id: 'default-policy',
      name: 'Default Expense Policy',
      description: 'Standard expense policy for all users',
      rules: [
        {
          rule_id: 'rule-001',
          name: 'Maximum Single Expense',
          description: 'Flag expenses exceeding 10000 INR',
          condition: {
            type: 'amount_exceeds',
            params: { threshold: 10000 },
            operator: 'and',
          },
          action: {
            type: 'flag',
            notification_template: 'expense.exceeds_limit',
          },
          enabled: true,
          priority: 1,
        },
        {
          rule_id: 'rule-002',
          name: 'Blocked Categories',
          description: 'Block gambling and related expenses',
          condition: {
            type: 'category_not_allowed',
            params: { categories: ['gambling', 'adult'] },
            operator: 'and',
          },
          action: {
            type: 'reject',
            escalation_threshold: 2,
          },
          enabled: true,
          priority: 2,
        },
        {
          rule_id: 'rule-003',
          name: 'Blacklisted Merchants',
          description: 'Block transactions from blacklisted merchants',
          condition: {
            type: 'merchant_blacklist',
            params: { merchants: [] },
            operator: 'and',
          },
          action: {
            type: 'reject',
          },
          enabled: true,
          priority: 3,
        },
        {
          rule_id: 'rule-004',
          name: 'Daily Limit',
          description: 'Alert when daily spending exceeds 50000 INR',
          condition: {
            type: 'amount_exceeds',
            params: { threshold: 50000, period: 'daily' },
            operator: 'and',
          },
          action: {
            type: 'notify',
            notification_template: 'expense.daily_limit_exceeded',
          },
          enabled: true,
          priority: 4,
        },
        {
          rule_id: 'rule-005',
          name: 'New Merchant Alert',
          description: 'Flag transactions from merchants not seen before',
          condition: {
            type: 'frequency_exceeded',
            params: { min_transactions: 0, new_merchant: true },
            operator: 'and',
          },
          action: {
            type: 'flag',
            notification_template: 'expense.new_merchant',
          },
          enabled: true,
          priority: 5,
        },
      ],
      budget_limits: [
        { category: 'food', period: 'daily', limit: 2000, alert_threshold: 80 },
        { category: 'food', period: 'monthly', limit: 30000, alert_threshold: 80 },
        { category: 'entertainment', period: 'monthly', limit: 10000, alert_threshold: 80 },
        { category: 'travel', period: 'monthly', limit: 25000, alert_threshold: 80 },
        { category: 'shopping', period: 'monthly', limit: 50000, alert_threshold: 80 },
      ],
      approval_workflows: [],
      created_at: new Date(),
      updated_at: new Date(),
      enabled: true,
    };

    this.tenantPolicies.set('default', defaultPolicy);
  }

  /**
   * Get policy for a tenant
   */
  async getTenantPolicy(tenantId: string): Promise<TenantPolicy | null> {
    // First check cache
    const cachedPolicy = this.tenantPolicies.get(tenantId);
    if (cachedPolicy) {
      return cachedPolicy;
    }

    // In production, fetch from database
    // For now, return default policy for any tenant
    const defaultPolicy = this.tenantPolicies.get('default');
    if (defaultPolicy) {
      // Clone and update tenant ID
      const policy = { ...defaultPolicy, tenant_id: tenantId };
      this.tenantPolicies.set(tenantId, policy);
      return policy;
    }

    return null;
  }

  /**
   * Validate expense against policy
   */
  async validateExpense(expense: ExpenseBase, tenantId?: string): Promise<PolicyValidationResult> {
    const policy = await this.getTenantPolicy(tenantId || 'default');

    if (!policy) {
      return {
        expense_id: expense.expense_id,
        is_valid: true,
        violations: [],
        warnings: [],
        requires_approval: false,
        suggested_approvers: [],
      };
    }

    const violations: PolicyViolation[] = [];
    const warnings: PolicyWarning[] = [];
    let requiresApproval = false;
    const suggestedApprovers: string[] = [];

    // Check each rule
    for (const rule of policy.rules) {
      if (!rule.enabled) continue;

      const violation = await this.checkRule(rule, expense, policy);
      if (violation) {
        if (violation.severity === 'critical' || violation.severity === 'high') {
          violations.push(violation);
          if (rule.action.type === 'require_approval' || rule.action.type === 'escalate') {
            requiresApproval = true;
            if (rule.action.approver_role) {
              suggestedApprovers.push(rule.action.approver_role);
            }
          }
        } else {
          warnings.push({
            code: `WARN-${rule.rule_id}`,
            message: violation.description,
            suggestion: `Review expense for ${rule.name}`,
          });
        }
      }
    }

    // Check budget limits
    const budgetViolations = await this.checkBudgetLimits(expense, policy);
    violations.push(...budgetViolations);

    // Generate approval routing
    let approvalRouting: ApprovalRoutingSuggestion | undefined;
    if (requiresApproval) {
      approvalRouting = this.generateApprovalRouting(violations, policy);
    }

    return {
      expense_id: expense.expense_id,
      is_valid: violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
      violations,
      warnings,
      requires_approval: requiresApproval,
      suggested_approvers: [...new Set(suggestedApprovers)],
      approval_routing: approvalRouting,
    };
  }

  /**
   * Check individual policy rule
   */
  private async checkRule(
    rule: PolicyRule,
    expense: ExpenseBase,
    policy: TenantPolicy
  ): Promise<PolicyViolation | null> {
    const condition = rule.condition;

    switch (condition.type) {
      case 'amount_exceeds': {
        const threshold = condition.params.threshold as number;
        if (expense.amount > threshold) {
          return this.createViolation(expense, policy, rule, expense.amount, threshold);
        }
        break;
      }

      case 'category_not_allowed': {
        const blockedCategories = condition.params.categories as string[];
        if (blockedCategories.includes(expense.category)) {
          return this.createViolation(expense, policy, rule, expense.category, blockedCategories);
        }
        break;
      }

      case 'merchant_blacklist': {
        const blacklisted = condition.params.merchants as string[];
        const normalizedMerchant = expense.merchant_name.toLowerCase();
        for (const blocked of blacklisted) {
          if (normalizedMerchant.includes(blocked.toLowerCase())) {
            return this.createViolation(expense, policy, rule, expense.merchant_name, blocked);
          }
        }
        break;
      }

      case 'new_merchant': {
        // In production, check if merchant exists in history
        const isNewMerchant = Math.random() > 0.7; // Simulated for demo
        if (isNewMerchant && condition.params.new_merchant) {
          return this.createViolation(expense, policy, rule, expense.merchant_name, 'known merchants');
        }
        break;
      }
    }

    return null;
  }

  /**
   * Check budget limits
   */
  private async checkBudgetLimits(
    expense: ExpenseBase,
    policy: TenantPolicy
  ): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    for (const budget of policy.budget_limits) {
      if (budget.category !== expense.category) continue;

      // In production, calculate actual spending for the period
      // For demo, simulate based on amount
      const currentSpending = expense.amount * (Math.random() * 5 + 1); // Simulated
      const percentageUsed = (currentSpending / budget.limit) * 100;

      if (percentageUsed >= 100) {
        violations.push({
          violation_id: `VIO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          expense_id: expense.expense_id,
          policy_id: policy.policy_id,
          tenant_id: policy.tenant_id,
          user_id: expense.user_id,
          rule_id: `budget-${budget.category}-${budget.period}`,
          rule_name: `Budget ${budget.category} ${budget.period}`,
          severity: 'high',
          description: `Budget limit exceeded for ${budget.category} (${budget.period})`,
          actual_value: currentSpending,
          allowed_value: budget.limit,
          resolution: 'pending',
          created_at: new Date(),
        });
      } else if (percentageUsed >= budget.alert_threshold) {
        // This would be a warning, not a violation
        console.log(`Budget alert: ${budget.category} at ${percentageUsed.toFixed(0)}% of ${budget.period} limit`);
      }
    }

    return violations;
  }

  /**
   * Create violation record
   */
  private createViolation(
    expense: ExpenseBase,
    policy: TenantPolicy,
    rule: PolicyRule,
    actualValue: unknown,
    allowedValue: unknown
  ): PolicyViolation {
    return {
      violation_id: `VIO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      expense_id: expense.expense_id,
      policy_id: policy.policy_id,
      tenant_id: policy.tenant_id,
      user_id: expense.user_id,
      rule_id: rule.rule_id,
      rule_name: rule.name,
      severity: this.getViolationSeverity(rule.action.type),
      description: `${rule.name}: ${expense.merchant_name} (${expense.amount} INR)`,
      actual_value: actualValue,
      allowed_value: allowedValue,
      resolution: 'pending',
      suggested_approver: rule.action.approver_role,
      created_at: new Date(),
    };
  }

  /**
   * Get violation severity based on action type
   */
  private getViolationSeverity(actionType: string): PolicyViolationSeverity {
    switch (actionType) {
      case 'reject':
        return 'critical';
      case 'escalate':
        return 'high';
      case 'require_approval':
        return 'medium';
      case 'flag':
        return 'low';
      default:
        return 'info';
    }
  }

  /**
   * Generate approval routing suggestion
   */
  private generateApprovalRouting(
    violations: PolicyViolation[],
    policy: TenantPolicy
  ): ApprovalRoutingSuggestion {
    const highestSeverity = violations.reduce((max, v) => {
      const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
      return severityOrder.indexOf(v.severity) < severityOrder.indexOf(max) ? v.severity : max;
    }, 'info') as PolicyViolationSeverity;

    const escalationPath = this.getEscalationPath(highestSeverity);

    return {
      primary_approver: escalationPath[0] || 'manager',
      approver_role: highestSeverity === 'critical' ? 'finance_director' : 'manager',
      escalation_path: escalationPath,
      estimated_approval_time: this.getEstimatedTime(highestSeverity),
    };
  }

  /**
   * Get escalation path based on severity
   */
  private getEscalationPath(severity: PolicyViolationSeverity): string[] {
    switch (severity) {
      case 'critical':
        return ['finance_director', 'cfo', 'ceo'];
      case 'high':
        return ['finance_manager', 'finance_director'];
      case 'medium':
        return ['team_lead', 'manager'];
      default:
        return ['manager'];
    }
  }

  /**
   * Get estimated approval time
   */
  private getEstimatedTime(severity: PolicyViolationSeverity): string {
    switch (severity) {
      case 'critical':
        return '24 hours';
      case 'high':
        return '12 hours';
      case 'medium':
        return '4 hours';
      default:
        return '2 hours';
    }
  }

  /**
   * Log violation
   */
  async logViolation(violation: Omit<PolicyViolation, 'violation_id' | 'created_at'>): Promise<PolicyViolation> {
    const loggedViolation: PolicyViolation = {
      ...violation,
      violation_id: `VIO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(),
    };

    // In production, save to database
    console.log('Policy violation logged:', JSON.stringify(loggedViolation, null, 2));

    // Notify relevant parties
    await this.notifyViolation(loggedViolation);

    return loggedViolation;
  }

  /**
   * Notify about violation
   */
  private async notifyViolation(violation: PolicyViolation): Promise<void> {
    // In production, integrate with notification service
    console.log(`Notifying about violation ${violation.violation_id}:`, {
      user_id: violation.user_id,
      severity: violation.severity,
      description: violation.description,
    });
  }

  /**
   * Create or update tenant policy
   */
  async createOrUpdatePolicy(policy: TenantPolicy): Promise<TenantPolicy> {
    const updatedPolicy = {
      ...policy,
      updated_at: new Date(),
    };
    this.tenantPolicies.set(policy.tenant_id, updatedPolicy);
    return updatedPolicy;
  }

  /**
   * Get violation patterns for a tenant
   */
  async getViolationPatterns(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, number>> {
    // In production, aggregate from database
    // Return sample patterns for demo
    return {
      'amount_exceeds': 45,
      'category_not_allowed': 12,
      'budget_exceeded': 23,
      'new_merchant': 8,
      'frequency_exceeded': 5,
    };
  }

  /**
   * Resolve violation
   */
  async resolveViolation(
    violationId: string,
    resolution: 'approved' | 'rejected' | 'escalated' | 'waived',
    resolvedBy: string
  ): Promise<PolicyViolation | null> {
    // In production, update in database
    console.log(`Violation ${violationId} resolved as ${resolution} by ${resolvedBy}`);
    return null;
  }

  /**
   * Get pending violations for a user
   */
  async getPendingViolations(userId: string): Promise<PolicyViolation[]> {
    // In production, query database
    return [];
  }
}

// Export singleton instance
export const policyService = new PolicyService();
