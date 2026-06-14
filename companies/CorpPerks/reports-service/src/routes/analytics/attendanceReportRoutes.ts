import { Router, Response } from 'express';
import { authenticate, authorize, asyncHandler, AuthenticatedRequest } from '../../middleware/index.js';

const router = Router();

// GET /api/reports/analytics/attendance - Attendance report
router.get(
  '/attendance',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const startDate = req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate as string || new Date().toISOString();
    const department = req.query.department as string;

    // Mock data - in production, query attendance service
    const data = {
      summary: {
        totalPresent: 2450,
        totalAbsent: 150,
        totalLate: 200,
        totalOnLeave: 50,
        averageAttendance: 87.5,
      },
      trend: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          { label: 'Present', data: [85, 88, 90, 87] },
          { label: 'Absent', data: [10, 8, 7, 9] },
          { label: 'Late', data: [5, 4, 3, 4] },
        ],
      },
      byDepartment: [
        { name: 'Engineering', present: 120, absent: 5, late: 10 },
        { name: 'Sales', present: 80, absent: 8, late: 5 },
        { name: 'Marketing', present: 45, absent: 2, late: 3 },
        { name: 'HR', present: 25, absent: 1, late: 1 },
      ],
      byDay: [
        { day: 'Monday', present: 95, absent: 5 },
        { day: 'Tuesday', present: 92, absent: 8 },
        { day: 'Wednesday', present: 90, absent: 10 },
        { day: 'Thursday', present: 88, absent: 12 },
        { day: 'Friday', present: 85, absent: 15 },
      ],
      topLateArrivals: [
        { employeeId: 'EMP001', name: 'John Doe', lateCount: 8 },
        { employeeId: 'EMP002', name: 'Jane Smith', lateCount: 6 },
        { employeeId: 'EMP003', name: 'Bob Wilson', lateCount: 5 },
      ],
    };

    res.json({
      success: true,
      data,
      meta: {
        startDate,
        endDate,
        department,
      },
    });
  })
);

export default router;
