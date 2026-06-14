import { Router, Response } from 'express';
import { authenticate, authorize, asyncHandler, AuthenticatedRequest } from '../../middleware/index.js';

const router = Router();

// GET /api/reports/analytics/financial - Financial report
router.get(
  '/financial',
  authenticate,
  authorize('admin', 'finance'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const startDate = req.query.startDate as string || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate as string || new Date().toISOString();

    // Mock data - in production, query finance service
    const data = {
      summary: {
        totalPayroll: 2450000,
        totalBenefits: 320000,
        totalExpenses: 890000,
        budgetUtilization: 78.5,
      },
      payrollByMonth: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        gross: [400000, 405000, 410000, 408000, 415000, 420000],
        deductions: [80000, 81000, 82000, 81600, 83000, 84000],
        net: [320000, 324000, 328000, 326400, 332000, 336000],
      },
      benefitsBreakdown: [
        { name: 'Health Insurance', amount: 150000, percentage: 47 },
        { name: 'Retirement', amount: 80000, percentage: 25 },
        { name: 'Life Insurance', amount: 40000, percentage: 12 },
        { name: 'Other', amount: 50000, percentage: 16 },
      ],
      expenseCategories: [
        { category: 'Salaries', amount: 1800000, budget: 2000000 },
        { category: 'Benefits', amount: 320000, budget: 350000 },
        { category: 'Training', amount: 45000, budget: 60000 },
        { category: 'Travel', amount: 35000, budget: 50000 },
        { category: 'Equipment', amount: 80000, budget: 100000 },
      ],
      headcountMetrics: {
        totalEmployees: 150,
        newHires: 12,
        departures: 5,
        avgTenure: 3.5,
        turnoverRate: 3.3,
      },
      costPerEmployee: {
        labels: ['Engineering', 'Sales', 'Marketing', 'HR', 'Operations'],
        avgCost: [185000, 165000, 145000, 125000, 135000],
      },
    };

    res.json({
      success: true,
      data,
      meta: {
        startDate,
        endDate,
        currency: 'INR',
      },
    });
  })
);

export default router;
