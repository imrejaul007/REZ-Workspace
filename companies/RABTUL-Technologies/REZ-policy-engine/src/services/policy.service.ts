import { v4 as uuidv4 } from 'uuid';
import {
  Policy,
  PolicyStatus,
  PolicyType,
  OverrideLevel,
  ComplianceStatus,
  ValidationRequest,
  ValidationResult,
  OverrideRequest,
  OverrideResult,
  ComplianceCheck,
  ComplianceReport,
  ComplianceFinding,
  PolicyCondition,
  PolicyEvaluationContext,
  ComplianceStatus as ComplianceStatusEnum
} from '../types/policy.types';
import { logger } from '../config/logger';

/**
 * Policy Service - Core business logic for policy validation, override, and compliance
 */
export class PolicyService {
  private policies: Map<string, Policy> = new Map();
  private overrides: Map<string, OverrideResult> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default policies for the system
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicies: Policy[] = [
      {
        id: uuidv4(),
        name: 'Default Allow Policy',
        description: 'Default policy that allows access when no other policy matches',
        type: PolicyType.ACCESS_CONTROL,
        status: PolicyStatus.ACTIVE,
        effect: { allow: true, priority: 0 },
        overrides: OverrideLevel.NONE,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: uuidv4(),
        name: 'Admin Full Access',
        description: 'Grants full access to admin users',
        type: PolicyType.ACCESS_CONTROL,
        status: PolicyStatus.ACTIVE,
        effect: {
          allow: true,
          priority: 100,
          conditions: [{ field: 'role', operator: 'equals', value: 'admin' }]
        },
        resource: '*',
        action: '*',
        overrides: OverrideLevel.SYSTEM,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: uuidv4(),
        name: 'Data Governance Policy',
        description: 'Enforces data governance rules',
        type: PolicyType.DATA_GOVERNANCE,
        status: PolicyStatus.ACTIVE,
        effect: {
          allow: false,
          priority: 50,
          conditions: [
            { field: 'dataClassification', operator: 'in', value: ['confidential', 'restricted'] }
          ]
        },
        overrides: OverrideLevel.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: uuidv4(),
        name: 'Compliance Policy - GDPR',
        description: 'Ensures GDPR compliance for EU data',
        type: PolicyType.COMPLIANCE,
        status: PolicyStatus.ACTIVE,
        effect: { allow: true, priority: 75 },
        resource: 'eu-data',
        overrides: OverrideLevel.SYSTEM,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: uuidv4(),
        name: 'Security Policy - Rate Limiting',
        description: 'Enforces rate limiting for API calls',
        type: PolicyType.SECURITY,
        status: PolicyStatus.ACTIVE,
        effect: {
          allow: true,
          priority: 80,
          conditions: [{ field: 'rateLimitExceeded', operator: 'equals', value: false }]
        },
        overrides: OverrideLevel.NONE,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    ];

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });

    logger.info(`Initialized ${defaultPolicies.length} default policies`);
  }

  /**
   * Evaluate a single condition against context
   */
  private evaluateCondition(condition: PolicyCondition, context: Record<string, unknown>): boolean {
    const contextValue = context[condition.field];

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;

      case 'not_equals':
        return contextValue !== condition.value;

      case 'contains':
        if (typeof contextValue === 'string') {
          return contextValue.includes(String(condition.value));
        }
        if (Array.isArray(contextValue)) {
          return contextValue.includes(condition.value as string | number | boolean);
        }
        return false;

      case 'greater_than':
        if (typeof contextValue === 'number' && typeof condition.value === 'number') {
          return contextValue > condition.value;
        }
        return false;

      case 'less_than':
        if (typeof contextValue === 'number' && typeof condition.value === 'number') {
          return contextValue < condition.value;
        }
        return false;

      case 'in':
        if (Array.isArray(condition.value) && condition.value.length > 0) {
          return Array.isArray(contextValue)
            ? contextValue.some(v => condition.value.includes(v))
            : condition.value.includes(contextValue as string | number);
        }
        return false;

      case 'not_in':
        if (Array.isArray(condition.value)) {
          return !condition.value.includes(contextValue as string | number);
        }
        return true;

      default:
        return false;
    }
  }

  /**
   * Evaluate all conditions for a policy
   */
  private evaluateConditions(policy: Policy, context: Record<string, unknown>): boolean {
    if (!policy.effect.conditions || policy.effect.conditions.length === 0) {
      return true;
    }

    return policy.effect.conditions.every(condition =>
      this.evaluateCondition(condition, context)
    );
  }

  /**
   * Check if an override exists and is valid for a policy
   */
  private getActiveOverride(policyId: string): OverrideResult | null {
    const override = this.overrides.get(policyId);

    if (!override) {
      return null;
    }

    if (override.expiresAt && new Date(override.expiresAt) < new Date()) {
      this.overrides.delete(policyId);
      return null;
    }

    return override;
  }

  /**
   * Get policies matching the request criteria
   */
  private getMatchingPolicies(request: ValidationRequest): Policy[] {
    const policies = Array.from(this.policies.values());

    let filtered = policies.filter(policy => policy.status === PolicyStatus.ACTIVE);

    if (request.policyIds && request.policyIds.length > 0) {
      filtered = filtered.filter(policy => request.policyIds!.includes(policy.id));
    } else {
      filtered = filtered.filter(policy => {
        const resourceMatch = !policy.resource || policy.resource === '*' || policy.resource === request.resource;
        const actionMatch = !policy.action || policy.action === '*' || policy.action === request.action;
        const subjectMatch = !policy.subject || policy.subject === '*' || policy.subject === request.subject;
        return resourceMatch && actionMatch && subjectMatch;
      });
    }

    return filtered.sort((a, b) => (b.effect.priority || 0) - (a.effect.priority || 0));
  }

  /**
   * Validate a policy request against all applicable policies
   *
   * @param request - The validation request containing resource, action, subject, and optional context
   * @returns ValidationResult with allowed status, policies evaluated, and reason
   */
  async validatePolicy(request: ValidationRequest): Promise<ValidationResult> {
    logger.info('Validating policy request', {
      resource: request.resource,
      action: request.action,
      subject: request.subject
    });

    const errors: string[] = [];
    const policiesEvaluated: string[] = [];

    if (!request.resource || !request.action || !request.subject) {
      errors.push('Missing required fields: resource, action, and subject are required');
      return {
        valid: false,
        allowed: false,
        policiesEvaluated: [],
        errors,
        timestamp: new Date()
      };
    }

    const context = request.context || {};
    const matchingPolicies = this.getMatchingPolicies(request);

    if (matchingPolicies.length === 0) {
      logger.warn('No matching policies found', { request });
      return {
        valid: true,
        allowed: true,
        policiesEvaluated: [],
        reason: 'No matching policies found - default allow',
        timestamp: new Date()
      };
    }

    let allowed = false;
    let reason = '';

    for (const policy of matchingPolicies) {
      policiesEvaluated.push(policy.id);

      const activeOverride = this.getActiveOverride(policy.id);
      if (activeOverride) {
        logger.info(`Override active for policy ${policy.id}`, {
          level: activeOverride.overrideId,
          reason: activeOverride.reason
        });
        reason = `Override applied: ${activeOverride.reason}`;
        allowed = true;
        break;
      }

      const conditionsMet = this.evaluateConditions(policy, context);

      if (conditionsMet) {
        allowed = policy.effect.allow;
        reason = allowed
          ? `Policy "${policy.name}" allows the action`
          : `Policy "${policy.name}" denies the action`;

        if (!allowed) {
          break;
        }
      }
    }

    const result: ValidationResult = {
      valid: true,
      allowed,
      policiesEvaluated,
      reason,
      timestamp: new Date()
    };

    logger.info('Policy validation completed', { result });
    return result;
  }

  /**
   * Override a policy's enforcement
   *
   * @param request - The override request containing policyId, level, reason, and userId
   * @returns OverrideResult with override details and expiration
   */
  async override(request: OverrideRequest): Promise<OverrideResult> {
    logger.info('Processing policy override request', {
      policyId: request.policyId,
      level: request.level,
      userId: request.userId
    });

    const policy = this.policies.get(request.policyId);

    if (!policy) {
      const error = new Error(`Policy with ID ${request.policyId} not found`);
      logger.error('Override failed - policy not found', { policyId: request.policyId });
      throw error;
    }

    if (request.level === OverrideLevel.NONE) {
      const error = new Error('Cannot create override with NONE level');
      logger.error('Override failed - invalid level', { level: request.level });
      throw error;
    }

    if (policy.overrides === OverrideLevel.SYSTEM && request.level !== OverrideLevel.SYSTEM) {
      const error = new Error('Cannot override system-level policies');
      logger.error('Override failed - system policy protection', { policyId: request.policyId });
      throw error;
    }

    if (!request.reason || request.reason.trim().length === 0) {
      const error = new Error('Override reason is required');
      logger.error('Override failed - missing reason');
      throw error;
    }

    const overrideId = uuidv4();
    const overrideResult: OverrideResult = {
      success: true,
      overrideId,
      policyId: request.policyId,
      appliedAt: new Date(),
      expiresAt: request.expiresAt,
      reason: request.reason
    };

    this.overrides.set(request.policyId, overrideResult);

    policy.updatedAt = new Date();
    this.policies.set(policy.id, policy);

    logger.info('Policy override created successfully', {
      overrideId,
      policyId: request.policyId,
      expiresAt: request.expiresAt
    });

    return overrideResult;
  }

  /**
   * Check compliance status for policies
   *
   * @param policyIds - Optional array of policy IDs to check. If empty, checks all active policies
   * @returns ComplianceReport with overall compliance status and detailed checks
   */
  async compliance(policyIds?: string[]): Promise<ComplianceReport> {
    logger.info('Running compliance check', { policyIds });

    const checks: ComplianceCheck[] = [];
    let compliantCount = 0;
    let nonCompliantCount = 0;

    let policiesToCheck: Policy[];

    if (policyIds && policyIds.length > 0) {
      policiesToCheck = policyIds
        .map(id => this.policies.get(id))
        .filter((p): p is Policy => p !== undefined);
    } else {
      policiesToCheck = Array.from(this.policies.values())
        .filter(p => p.status === PolicyStatus.ACTIVE);
    }

    for (const policy of policiesToCheck) {
      const check = await this.performComplianceCheck(policy);
      checks.push(check);

      if (check.status === ComplianceStatus.COMPLIANT || check.status === ComplianceStatus.EXEMPT) {
        compliantCount++;
      } else if (check.status === ComplianceStatus.NON_COMPLIANT) {
        nonCompliantCount++;
      }
    }

    const overallStatus = this.determineOverallComplianceStatus(
      compliantCount,
      nonCompliantCount,
      checks.length
    );

    const report: ComplianceReport = {
      overallStatus,
      checkedPolicies: checks.length,
      compliantPolicies: compliantCount,
      nonCompliantPolicies: nonCompliantCount,
      checks,
      generatedAt: new Date(),
      summary: this.generateComplianceSummary(overallStatus, checks.length, compliantCount, nonCompliantCount)
    };

    logger.info('Compliance check completed', {
      overallStatus,
      policiesChecked: checks.length,
      compliant: compliantCount,
      nonCompliant: nonCompliantCount
    });

    return report;
  }

  /**
   * Perform a compliance check on a single policy
   */
  private async performComplianceCheck(policy: Policy): Promise<ComplianceCheck> {
    const findings: ComplianceFinding[] = [];

    if (policy.status !== PolicyStatus.ACTIVE) {
      findings.push({
        severity: 'MEDIUM',
        description: `Policy "${policy.name}" is not in ACTIVE status`,
        remediation: 'Activate the policy or archive it if no longer needed'
      });
    }

    if (policy.type === PolicyType.COMPLIANCE && !policy.effect.allow) {
      findings.push({
        severity: 'HIGH',
        description: `Compliance policy "${policy.name}" has deny effect`,
        regulation: 'Compliance policies should typically allow compliant actions',
        remediation: 'Review the policy configuration'
      });
    }

    if (!policy.description || policy.description.length < 10) {
      findings.push({
        severity: 'LOW',
        description: `Policy "${policy.name}" has insufficient description`,
        remediation: 'Add a detailed description to the policy'
      });
    }

    if (policy.overrides === OverrideLevel.NONE && policy.effect.conditions) {
      findings.push({
        severity: 'LOW',
        description: `Policy "${policy.name}" has conditions but no override capability`,
        remediation: 'Consider adding override capability for emergency scenarios'
      });
    }

    const activeOverride = this.getActiveOverride(policy.id);
    if (activeOverride) {
      findings.push({
        severity: 'MEDIUM',
        description: `Policy "${policy.name}" has an active override`,
        remediation: 'Review override necessity and expiration'
      });
    }

    const status = findings.length === 0
      ? ComplianceStatus.COMPLIANT
      : findings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH')
        ? ComplianceStatus.NON_COMPLIANT
        : ComplianceStatus.PARTIALLY_COMPLIANT;

    return {
      policyId: policy.id,
      status,
      checkedAt: new Date(),
      findings: findings.length > 0 ? findings : undefined,
      recommendations: this.generateRecommendations(policy, findings)
    };
  }

  /**
   * Determine overall compliance status based on check results
   */
  private determineOverallComplianceStatus(
    compliant: number,
    nonCompliant: number,
    total: number
  ): ComplianceStatusEnum {
    if (nonCompliant > 0) {
      return ComplianceStatus.NON_COMPLIANT;
    }
    if (compliant === total) {
      return ComplianceStatus.COMPLIANT;
    }
    return ComplianceStatus.PARTIALLY_COMPLIANT;
  }

  /**
   * Generate a compliance summary string
   */
  private generateComplianceSummary(
    status: ComplianceStatusEnum,
    total: number,
    compliant: number,
    nonCompliant: number
  ): string {
    const percentage = total > 0 ? ((compliant / total) * 100).toFixed(1) : '0';

    switch (status) {
      case ComplianceStatus.COMPLIANT:
        return `All ${total} policies are compliant (100%).`;
      case ComplianceStatus.NON_COMPLIANT:
        return `${nonCompliant} of ${total} policies (${percentage}%) have compliance issues requiring attention.`;
      case ComplianceStatus.PARTIALLY_COMPLIANT:
        return `${compliant} of ${total} policies are compliant (${percentage}%). Review findings for details.`;
      case ComplianceStatus.PENDING_AUDIT:
        return `${total} policies are pending audit review.`;
      case ComplianceStatus.EXEMPT:
        return `${total} policies have exemption status.`;
      default:
        return `Compliance status unknown for ${total} policies.`;
    }
  }

  /**
   * Generate recommendations based on policy and findings
   */
  private generateRecommendations(policy: Policy, findings: ComplianceFinding[]): string[] {
    const recommendations: string[] = [];

    if (findings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH')) {
      recommendations.push('Address high/critical findings immediately');
    }

    if (policy.type === PolicyType.COMPLIANCE) {
      recommendations.push('Ensure compliance policy aligns with current regulatory requirements');
    }

    if (policy.overrides === OverrideLevel.ADMIN) {
      recommendations.push('Review admin override capabilities for security implications');
    }

    if (!policy.metadata || Object.keys(policy.metadata).length === 0) {
      recommendations.push('Consider adding metadata for better policy management');
    }

    return recommendations;
  }

  /**
   * Add a new policy to the system
   */
  async createPolicy(policyData: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Policy> {
    const policy: Policy = {
      ...policyData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.policies.set(policy.id, policy);
    logger.info('Policy created', { policyId: policy.id, name: policy.name });

    return policy;
  }

  /**
   * Get a policy by ID
   */
  async getPolicy(policyId: string): Promise<Policy | null> {
    return this.policies.get(policyId) || null;
  }

  /**
   * Get all policies
   */
  async getAllPolicies(): Promise<Policy[]> {
    return Array.from(this.policies.values());
  }

  /**
   * Update an existing policy
   */
  async updatePolicy(policyId: string, updates: Partial<Policy>): Promise<Policy | null> {
    const policy = this.policies.get(policyId);

    if (!policy) {
      return null;
    }

    const updatedPolicy: Policy = {
      ...policy,
      ...updates,
      id: policy.id,
      createdAt: policy.createdAt,
      updatedAt: new Date()
    };

    this.policies.set(policyId, updatedPolicy);
    logger.info('Policy updated', { policyId });

    return updatedPolicy;
  }

  /**
   * Delete a policy
   */
  async deletePolicy(policyId: string): Promise<boolean> {
    const deleted = this.policies.delete(policyId);

    if (deleted) {
      this.overrides.delete(policyId);
      logger.info('Policy deleted', { policyId });
    }

    return deleted;
  }

  /**
   * Remove an override from a policy
   */
  async removeOverride(policyId: string): Promise<boolean> {
    const removed = this.overrides.delete(policyId);

    if (removed) {
      logger.info('Override removed', { policyId });
    }

    return removed;
  }
}

// Export singleton instance
export const policyService = new PolicyService();
