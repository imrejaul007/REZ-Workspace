import { Router, Response } from 'express';
import { authenticate, authorize, asyncHandler, AuthenticatedRequest } from '../../middleware/index.js';

const router = Router();

// GET /api/reports/analytics/performance - Performance report
router.get(
  '/performance',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const startDate = req.query.startDate as string || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate as string || new Date().toISOString();

    // Mock data - in production, query performance service
    const data = {
      overview: {
        averageRating: 3.8,
        totalReviews: 450,
        completedGoals: 75,
        pendingGoals: 25,
        averageScore: 78,
      },
      ratingDistribution: [
        { rating: 5, count: 50, percentage: 11 },
        { rating: 4, count: 150, percentage: 33 },
        { rating: 3, count: 180, percentage: 40 },
        { rating: 2, count: 50, percentage: 11 },
        { rating: 1, count: 20, percentage: 5 },
      ],
      topPerformers: [
        { employeeId: 'EMP001', name: 'John Doe', department: 'Engineering', rating: 4.8 },
        { employeeId: 'EMP002', name: 'Jane Smith', department: 'Sales', rating: 4.7 },
        { employeeId: 'EMP003', name: 'Bob Wilson', department: 'Marketing', rating: 4.6 },
      ],
      goalCompletion: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        completed: [12, 15, 18, 14, 20, 22],
        pending: [8, 5, 2, 6, 2, 0],
        overdue: [3, 2, 4, 3, 1, 0],
      },
      byDepartment: [
        { name: 'Engineering', avgRating: 4.0, goalsCompleted: 45 },
        { name: 'Sales', avgRating: 3.9, goalsCompleted: 38 },
        { name: 'Marketing', avgRating: 3.7, goalsCompleted: 25 },
        { name: 'HR', avgRating: 4.2, goalsCompleted: 15 },
      ],
      skillsGap: [
        { skill: 'Leadership', currentLevel: 3.2, requiredLevel: 4.0 },
        { skill: 'Communication', currentLevel: 3.8, requiredLevel: 4.0 },
        { skill: 'Technical', currentLevel: 4.2, requiredLevel: 4.0 },
        { skill: 'Project Management', currentLevel: 3.5, requiredLevel: 4.0 },
      ],
    };

    res.json({
      success: true,
      data,
      meta: {
        startDate,
        endDate,
      },
    });
  })
);

export default router;
