/**
 * REZ Unified Hub - Employee Routes
 * Employee onboarding and benefits management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { apiClient } from '../services/apiClient';
import { logger } from '../utils/logger';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const OnboardEmployeeSchema = z.object({
  employee_id: z.string().min(1, 'employee_id is required'),
  company: z.string().min(1, 'company is required'),
  email: z.string().email('Valid email is required'),
  name: z.string().min(1, 'name is required'),
  department: z.string().min(1, 'department is required'),
  benefits_eligible: z.array(z.string()).optional().default([]),
});

const RedeemPerkSchema = z.object({
  employee_id: z.string().min(1),
  perk_id: z.string().min(1),
  company_source: z.string().optional(),
});

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/v1/employee/onboard
 * Onboard employee with cross-company benefits
 */
router.post('/onboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = OnboardEmployeeSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { employee_id, company, email, name, department, benefits_eligible } = validation.data;

    // Create user in Auth service
    const user = await apiClient.call('AUTH', '/api/v1/users', 'POST', {
      email,
      name,
      type: 'employee',
    });

    const userData = user as { id?: string } | null;

    // Create employee record in PeopleOS
    const employee = await apiClient.call('PEOPLE_OS', '/api/v1/employees', 'POST', {
      employee_id,
      company,
      user_id: userData?.id,
      department,
      benefits: benefits_eligible,
    });

    // Initialize wallet with welcome bonus
    if (userData?.id) {
      await apiClient.call('WALLET', '/api/v1/wallet/initialize', 'POST', {
        user_id: userData.id,
        type: 'employee',
        initial_balance: 100,
      });

      // Initialize karma
      await apiClient.awardKarma(userData.id, 100, company, 'welcome_bonus');
    }

    // Create profile in CDP
    if (userData?.id) {
      await apiClient.call('CDP', '/api/v1/profile/create', 'POST', {
        user_id: userData.id,
        type: 'employee',
        company,
        benefits: benefits_eligible,
      });
    }

    // Track event
    await apiClient.collectSignal('peopleos', 'employee_onboarded', userData?.id || '', {
      employee_id,
      company,
      department,
    });

    logger.info(`Employee onboarded: ${employee_id} at ${company}`);

    res.json({
      success: true,
      data: {
        user_id: userData?.id,
        employee_id,
        employee,
      },
    });
  } catch (error) {
    logger.error('Error onboarding employee:', error);
    next(error);
  }
});

/**
 * GET /api/v1/employee/:employeeId/benefits
 * Get employee benefits across ecosystem
 */
router.get('/:employeeId/benefits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;

    // Parallel fetch benefits data
    const [profile, karma, perks] = await Promise.allSettled([
      apiClient.getEmployeeBenefits(employeeId),
      apiClient.getKarmaBalance(employeeId),
      apiClient.call('CRM', '/api/v1/perks', 'POST', { employee_id: employeeId }),
    ]);

    const profileData = profile.status === 'fulfilled' ? profile.value as { benefits?: string[] } : null;
    const karmaData = karma.status === 'fulfilled' ? karma.value as { points?: number } : null;
    const perksData = perks.status === 'fulfilled' ? perks.value as { items?: unknown[] } : null;

    res.json({
      success: true,
      data: {
        benefits: profileData?.benefits || [],
        karma_points: karmaData?.points || 0,
        available_perks: perksData?.items || [],
      },
    });
  } catch (error) {
    logger.error('Error fetching employee benefits:', error);
    next(error);
  }
});

/**
 * POST /api/v1/employee/perk/redeem
 * Redeem employee perk
 */
router.post('/perk/redeem', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = RedeemPerkSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { employee_id, perk_id, company_source } = validation.data;

    // Redeem perk
    const result = await apiClient.call('KARMA', '/api/v1/redeem', 'POST', {
      user_id: employee_id,
      source: company_source || 'corpperks',
      item_id: perk_id,
    });

    // Track redemption
    await apiClient.collectSignal('peopleos', 'perk_redeemed', employee_id, {
      perk_id,
      company: company_source,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error redeeming perk:', error);
    next(error);
  }
});

/**
 * GET /api/v1/employee/:employeeId/attendance
 * Get employee attendance data
 */
router.get('/:employeeId/attendance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;
    const { start_date, end_date } = req.query;

    const result = await apiClient.call('PEOPLE_OS', '/api/v1/attendance', 'POST', {
      employee_id: employeeId,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error fetching attendance:', error);
    next(error);
  }
});

/**
 * GET /api/v1/employee/:employeeId/leave
 * Get employee leave balance
 */
router.get('/:employeeId/leave', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;

    const result = await apiClient.call('PEOPLE_OS', '/api/v1/leave/balance', 'POST', {
      employee_id: employeeId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error fetching leave balance:', error);
    next(error);
  }
});

/**
 * POST /api/v1/employee/:employeeId/leave/request
 * Request leave
 */
router.post('/:employeeId/leave/request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      leave_type: z.string().min(1),
      start_date: z.string().min(1),
      end_date: z.string().min(1),
      reason: z.string().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { employeeId } = req.params;
    const { leave_type, start_date, end_date, reason } = validation.data;

    const result = await apiClient.call('PEOPLE_OS', '/api/v1/leave/request', 'POST', {
      employee_id: employeeId,
      leave_type,
      start_date,
      end_date,
      reason,
    });

    // Track request
    await apiClient.collectSignal('peopleos', 'leave_requested', employeeId, {
      leave_type,
      start_date,
      end_date,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error requesting leave:', error);
    next(error);
  }
});

export default router;
