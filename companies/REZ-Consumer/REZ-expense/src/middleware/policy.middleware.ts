/**
 * REZ Expense - Policy Validation Middleware
 * Validates expenses against tenant policies before processing
 */

import { Request, Response, NextFunction } from 'express';
import { policyService } from '../services/policy.service';
import { ExpenseBase, PolicyValidationResult, APIResponse } from '../types';

// Extend Express Request to include user and tenant info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      tenantId?: string;
      expense?: ExpenseBase;
      policyValidation?: PolicyValidationResult;
    }
  }
}

/**
 * Extract user and tenant info from request
 */
export const extractUserContext = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Extract from JWT token or headers
  req.userId = req.headers['x-user-id'] as string || req.body?.user_id;
  req.tenantId = req.headers['x-tenant-id'] as string || req.body?.tenant_id || 'default';
  next();
};

/**
 * Validate expense against policies
 */
export const validateExpensePolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const expense = req.expense;
    if (!expense) {
      const response: APIResponse = {
        success: false,
        error: 'Expense not found in request',
        timestamp: new Date(),
      };
      res.status(400).json(response);
      return;
    }

    // Validate against policy
    const validationResult = await policyService.validateExpense(expense, req.tenantId);
    req.policyValidation = validationResult;

    // Log validation result
    console.log(`Policy validation for ${expense.expense_id}:`, {
      is_valid: validationResult.is_valid,
      violations: validationResult.violations.length,
      requires_approval: validationResult.requires_approval,
    });

    // If critical violations, return error
    const criticalViolations = validationResult.violations.filter(
      v => v.severity === 'critical'
    );

    if (criticalViolations.length > 0) {
      const response: APIResponse = {
        success: false,
        data: validationResult,
        error: 'Expense violates critical policy rules',
        timestamp: new Date(),
      };
      res.status(400).json(response);
      return;
    }

    next();
  } catch (error) {
    console.error('Policy validation error:', error);
    const response: APIResponse = {
      success: false,
      error: 'Policy validation failed',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
};

/**
 * Check if approval is required
 */
export const checkApprovalRequired = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const validation = req.policyValidation;

  if (validation?.requires_approval) {
    // Add warning header
    res.setHeader('X-Approval-Required', 'true');
    res.setHeader('X-Suggested-Approvers', validation.suggested_approvers.join(','));

    // Log approval requirement
    console.log(`Approval required for expense ${req.expense?.expense_id}:`, {
      approvers: validation.suggested_approvers,
      violations: validation.violations.length,
    });
  }

  next();
};

/**
 * Log policy violations
 */
export const logViolations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const validation = req.policyValidation;

  if (validation && validation.violations.length > 0) {
    try {
      // Log each violation
      for (const violation of validation.violations) {
        await policyService.logViolation({
          expense_id: violation.expense_id,
          policy_id: violation.policy_id,
          tenant_id: violation.tenant_id,
          user_id: violation.user_id,
          rule_id: violation.rule_id,
          rule_name: violation.rule_name,
          severity: violation.severity,
          description: violation.description,
          actual_value: violation.actual_value,
          allowed_value: violation.allowed_value,
          resolution: violation.resolution,
          resolved_by: violation.resolved_by,
          resolved_at: violation.resolved_at,
          suggested_approver: violation.suggested_approver,
        });
      }

      console.log(`Logged ${validation.violations.length} policy violations`);
    } catch (error) {
      console.error('Failed to log violations:', error);
      // Don't block the request, just log the error
    }
  }

  next();
};

/**
 * Attach expense from request body
 */
export const attachExpense = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body.expense) {
    req.expense = req.body.expense;
  } else if (req.body.expense_id) {
    // In production, fetch from database
    // For now, construct from body
    req.expense = {
      expense_id: req.body.expense_id,
      user_id: req.body.user_id || req.userId || '',
      merchant_name: req.body.merchant_name || '',
      category: req.body.category || 'other',
      amount: req.body.amount || 0,
      currency: req.body.currency || 'INR',
      date: new Date(req.body.date || Date.now()),
      receipt_url: req.body.receipt_url,
      location: req.body.location,
      extracted_data: req.body.extracted_data,
      created_at: new Date(),
    };
  }
  next();
};

/**
 * Validate budget limits before expense creation
 */
export const validateBudgetLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const expense = req.expense;
    if (!expense) {
      next();
      return;
    }

    // Get tenant policy for budget limits
    const policy = await policyService.getTenantPolicy(req.tenantId || 'default');
    if (!policy) {
      next();
      return;
    }

    // Check category budget limits
    const categoryBudget = policy.budget_limits.find(b => b.category === expense.category);
    if (categoryBudget) {
      // In production, calculate current spending for the period
      // For demo, use a simulated check
      const currentSpending = expense.amount * 3; // Simulated
      const projectedTotal = currentSpending + expense.amount;
      const percentageUsed = (projectedTotal / categoryBudget.limit) * 100;

      if (percentageUsed > 100) {
        res.setHeader('X-Budget-Exceeded', 'true');
        res.setHeader('X-Budget-Category', expense.category);
        res.setHeader('X-Budget-Percentage', percentageUsed.toString());
      } else if (percentageUsed >= categoryBudget.alert_threshold) {
        res.setHeader('X-Budget-Warning', 'true');
        res.setHeader('X-Budget-Category', expense.category);
        res.setHeader('X-Budget-Percentage', percentageUsed.toString());
      }
    }

    next();
  } catch (error) {
    console.error('Budget validation error:', error);
    // Don't block on budget validation errors
    next();
  }
};

/**
 * Rate limiting for policy checks
 */
export const policyCheckRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // In production, implement rate limiting
  // For now, just pass through
  next();
};

/**
 * Require tenant context for policy operations
 */
export const requireTenantContext = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const tenantId = req.headers['x-tenant-id'] as string ||
                   req.query.tenant_id as string ||
                   req.body?.tenant_id;

  if (!tenantId) {
    const response: APIResponse = {
      success: false,
      error: 'Tenant ID is required for policy operations',
      timestamp: new Date(),
    };
    res.status(400).json(response);
    return;
  }

  req.tenantId = tenantId;
  next();
};

/**
 * Log policy operations for audit
 */
export const auditPolicyOperation = (
  operation: string
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Log on response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log('Policy operation audit:', {
        operation,
        user_id: req.userId,
        tenant_id: req.tenantId,
        expense_id: req.expense?.expense_id,
        status: res.statusCode,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      });
    });

    next();
  };
};
