/**
 * REZ Expense - API Routes
 * Enhanced with AI Categorization, Policy Enforcement, and Insights
 */

import { Router, Request, Response } from 'express';
import {
  aiCategorizationService,
} from '../services/ai-categorization.service';
import { policyService } from '../services/policy.service';
import { insightsService } from '../services/insights.service';
import { receiptMatchingService } from '../services/receipt-matching.service';
import {
  attachExpense,
  extractUserContext,
  validateExpensePolicy,
  checkApprovalRequired,
  logViolations,
  validateBudgetLimits,
  requireTenantContext,
  auditPolicyOperation,
} from '../middleware/policy.middleware';
import {
  APIResponse,
  CategorizeExpenseRequest,
  ConfirmCategoryRequest,
  ValidatePolicyRequest,
  LogViolationRequest,
  MatchReceiptsRequest,
  Receipt,
  ExpenseBase,
} from '../types';

const router = Router();

// Apply user context extraction to all routes
router.use(extractUserContext);

// ============================================================================
// AI Categorization Routes
// ============================================================================

/**
 * POST /api/expense/:id/categorize
 * Auto-categorize an expense using AI
 */
router.post(
  '/expense/:id/categorize',
  auditPolicyOperation('categorize'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { force_recategorize } = req.body as CategorizeExpenseRequest;

      // In production, fetch expense from database
      // For demo, use request body data
      const merchantName = req.body.merchant_name || 'Unknown';
      const amount = req.body.amount || 0;
      const date = new Date(req.body.date || Date.now());
      const userId = req.userId || req.body.user_id || '';

      const result = await aiCategorizationService.categorizeExpense(
        merchantName,
        amount,
        date,
        userId,
        req.body.extracted_data
      );

      result.expense_id = id;

      const response: APIResponse = {
        success: true,
        data: result,
        message: force_recategorize
          ? 'Expense recategorized successfully'
          : 'Expense categorized successfully',
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Categorize error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to categorize expense',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/expense/:id/confirm-category
 * Confirm or change the category of an expense
 */
router.post(
  '/expense/:id/confirm-category',
  auditPolicyOperation('confirm_category'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { category, accept_suggestion, user_feedback } = req.body as ConfirmCategoryRequest;

      if (!category) {
        const response: APIResponse = {
          success: false,
          error: 'Category is required',
          timestamp: new Date(),
        };
        res.status(400).json(response);
        return;
      }

      // Record the category selection for learning
      await aiCategorizationService.recordCategorySelection(
        id,
        req.body.original_category || 'unknown',
        category,
        req.userId || req.body.user_id || '',
        accept_suggestion ? 'ai' : 'user'
      );

      // If user provided feedback, learn from it
      if (user_feedback && !accept_suggestion) {
        await aiCategorizationService.learnFromCorrection(
          req.userId || req.body.user_id || '',
          req.body.merchant_name || '',
          category
        );
      }

      const response: APIResponse = {
        success: true,
        data: {
          expense_id: id,
          confirmed_category: category,
          accepted_suggestion: accept_suggestion,
          feedback_recorded: true,
        },
        message: 'Category confirmed successfully',
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Confirm category error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to confirm category',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/expense/category-suggestions
 * Get category suggestions for a user
 */
router.get(
  '/expense/category-suggestions',
  auditPolicyOperation('get_category_suggestions'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId || req.query.user_id as string;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        const response: APIResponse = {
          success: false,
          error: 'User ID is required',
          timestamp: new Date(),
        };
        res.status(400).json(response);
        return;
      }

      const suggestions = await aiCategorizationService.getCategorySuggestions(userId, limit);

      const response: APIResponse = {
        success: true,
        data: suggestions,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Get category suggestions error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to get category suggestions',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

// ============================================================================
// Policy Enforcement Routes
// ============================================================================

/**
 * POST /api/policies/validate/:expenseId
 * Validate an expense against tenant policies
 */
router.post(
  '/policies/validate/:expenseId',
  requireTenantContext,
  auditPolicyOperation('validate_policy'),
  attachExpense,
  validateExpensePolicy,
  checkApprovalRequired,
  logViolations,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = req.policyValidation;

      if (!validationResult) {
        const response: APIResponse = {
          success: false,
          error: 'Validation result not found',
          timestamp: new Date(),
        };
        res.status(500).json(response);
        return;
      }

      const response: APIResponse = {
        success: true,
        data: validationResult,
        message: validationResult.is_valid
          ? 'Expense is valid'
          : 'Expense has policy violations',
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Policy validation error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to validate policy',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/policies/:tenantId
 * Get tenant policies
 */
router.get(
  '/policies/:tenantId',
  auditPolicyOperation('get_policies'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.params;

      const policy = await policyService.getTenantPolicy(tenantId);

      if (!policy) {
        const response: APIResponse = {
          success: false,
          error: 'Policy not found',
          timestamp: new Date(),
        };
        res.status(404).json(response);
        return;
      }

      const response: APIResponse = {
        success: true,
        data: policy,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Get policies error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to get policies',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/policies/violations
 * Log a policy violation
 */
router.post(
  '/policies/violations',
  requireTenantContext,
  auditPolicyOperation('log_violation'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const violationData = req.body as LogViolationRequest;

      if (!violationData.expense_id || !violationData.policy_id || !violationData.violation) {
        const response: APIResponse = {
          success: false,
          error: 'Missing required fields: expense_id, policy_id, violation',
          timestamp: new Date(),
        };
        res.status(400).json(response);
        return;
      }

      const violation = await policyService.logViolation({
        ...violationData.violation,
        expense_id: violationData.expense_id,
        policy_id: violationData.policy_id,
        tenant_id: req.tenantId || violationData.violation.tenant_id,
      });

      const response: APIResponse = {
        success: true,
        data: violation,
        message: 'Violation logged successfully',
        timestamp: new Date(),
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Log violation error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to log violation',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/policies/violations/patterns/:tenantId
 * Get violation patterns for a tenant
 */
router.get(
  '/policies/violations/patterns/:tenantId',
  auditPolicyOperation('get_violation_patterns'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.params;
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const patterns = await policyService.getViolationPatterns(tenantId, startDate, endDate);

      const response: APIResponse = {
        success: true,
        data: patterns,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Get violation patterns error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to get violation patterns',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/policies/violations/:violationId/resolve
 * Resolve a policy violation
 */
router.post(
  '/policies/violations/:violationId/resolve',
  auditPolicyOperation('resolve_violation'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { violationId } = req.params;
      const { resolution, resolved_by } = req.body;

      if (!resolution || !resolved_by) {
        const response: APIResponse = {
          success: false,
          error: 'Resolution and resolved_by are required',
          timestamp: new Date(),
        };
        res.status(400).json(response);
        return;
      }

      const violation = await policyService.resolveViolation(violationId, resolution, resolved_by);

      const response: APIResponse = {
        success: true,
        data: violation,
        message: `Violation ${violationId} resolved as ${resolution}`,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Resolve violation error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to resolve violation',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

// ============================================================================
// Insights Routes
// ============================================================================

/**
 * GET /api/insights/:userId/weekly
 * Get weekly spending insights
 */
router.get(
  '/insights/:userId/weekly',
  auditPolicyOperation('get_weekly_insights'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const weekStart = req.query.week_start
        ? new Date(req.query.week_start as string)
        : undefined;

      const insights = await insightsService.getWeeklyInsights(userId, weekStart);

      const response: APIResponse = {
        success: true,
        data: insights,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Get weekly insights error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to get weekly insights',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/insights/:userId/monthly
 * Get monthly spending insights
 */
router.get(
  '/insights/:userId/monthly',
  auditPolicyOperation('get_monthly_insights'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;

      const insights = await insightsService.getMonthlyInsights(userId, month, year);

      const response: APIResponse = {
        success: true,
        data: insights,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Get monthly insights error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to get monthly insights',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/insights/:userId/anomalies
 * Get spending anomalies
 */
router.get(
  '/insights/:userId/anomalies',
  auditPolicyOperation('get_anomalies'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const anomalies = await insightsService.getAnomalies(userId, startDate, endDate);

      const response: APIResponse = {
        success: true,
        data: anomalies,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Get anomalies error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to get anomalies',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/insights/:userId/budget
 * Get budget tracking data
 */
router.get(
  '/insights/:userId/budget',
  auditPolicyOperation('get_budget'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const tenantId = req.query.tenant_id as string || req.tenantId;

      const budget = await insightsService.getBudgetTracking(userId, tenantId);

      const response: APIResponse = {
        success: true,
        data: budget,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Get budget error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to get budget',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/insights/:userId/trends
 * Get spending trends
 */
router.get(
  '/insights/:userId/trends',
  auditPolicyOperation('get_trends'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : new Date();
      const granularity = (req.query.granularity as 'day' | 'week' | 'month') || 'day';

      const trends = await insightsService.getSpendingByTimePeriod(
        userId,
        startDate,
        endDate,
        granularity
      );

      const response: APIResponse = {
        success: true,
        data: trends,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Get trends error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to get trends',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

// ============================================================================
// Receipt Matching Routes
// ============================================================================

/**
 * POST /api/receipts/match
 * Auto-match receipts to transactions
 */
router.post(
  '/receipts/match',
  auditPolicyOperation('match_receipts'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { receipt_ids, user_id, auto_match_threshold } = req.body as MatchReceiptsRequest;

      // In production, fetch receipts and expenses from database
      // For demo, use empty arrays
      const receipts: Receipt[] = [];
      const expenses: ExpenseBase[] = [];

      if (auto_match_threshold) {
        // Update service config if provided
      }

      const results = await receiptMatchingService.matchReceipts(receipts, expenses);

      const response: APIResponse = {
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            matched: results.filter(r => r.status === 'matched').length,
            pending: results.filter(r => r.status === 'pending').length,
            unmatched: results.filter(r => r.status === 'unmatched').length,
            flagged: results.filter(r => r.status === 'flagged').length,
          },
        },
        message: `Processed ${results.length} receipts`,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Match receipts error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to match receipts',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/receipts/unmatched
 * Get unmatched receipts
 */
router.get(
  '/receipts/unmatched',
  auditPolicyOperation('get_unmatched_receipts'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.query.user_id as string;

      // In production, fetch from database
      const receipts: Receipt[] = [];
      const expenses: ExpenseBase[] = [];

      const unmatched = await receiptMatchingService.getUnmatchedReceipts(receipts, expenses);

      const response: APIResponse = {
        success: true,
        data: unmatched,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Get unmatched receipts error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to get unmatched receipts',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/receipts/suggest-merchant
 * Suggest merchant matches for a new expense
 */
router.post(
  '/receipts/suggest-merchant',
  auditPolicyOperation('suggest_merchant'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { merchant_name, recent_expenses } = req.body;

      if (!merchant_name) {
        const response: APIResponse = {
          success: false,
          error: 'Merchant name is required',
          timestamp: new Date(),
        };
        res.status(400).json(response);
        return;
      }

      const suggestions = await receiptMatchingService.suggestMerchantMatches(
        merchant_name,
        recent_expenses || []
      );

      const response: APIResponse = {
        success: true,
        data: suggestions,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Suggest merchant error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to suggest merchant',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/receipts/auto-match
 * Auto-match receipts with high confidence
 */
router.post(
  '/receipts/auto-match',
  auditPolicyOperation('auto_match'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { receipts, expenses } = req.body;

      const result = await receiptMatchingService.autoMatchHighConfidence(
        receipts || [],
        expenses || []
      );

      const response: APIResponse = {
        success: true,
        data: {
          matched: result.matched,
          unmatched: result.unmatched,
          summary: {
            matched_count: result.matched.length,
            unmatched_count: result.unmatched.length,
          },
        },
        message: `Auto-matched ${result.matched.length} receipts`,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Auto match error:', error);
      const response: APIResponse = {
        success: false,
        error: 'Failed to auto-match receipts',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
);

export default router;
