import { Router, Request, Response } from 'express';

const router = Router();

router.get('/:gymId/overview', async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;
    // Simulated analytics data
    res.json({
      success: true,
      data: {
        totalMembers: 245,
        activeMembers: 198,
        newMembersThisMonth: 12,
        churnedMembers: 5,
        averageVisitsPerDay: 45,
        peakHours: [
          { hour: 7, count: 28 },
          { hour: 8, count: 35 },
          { hour: 18, count: 42 },
          { hour: 19, count: 38 },
        ],
        revenueThisMonth: 125000,
        topClasses: [
          { classType: 'yoga', bookings: 156 },
          { classType: 'hiit', bookings: 132 },
          { classType: 'spinning', bookings: 98 },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

export { router as membershipRoutes };
