import { Router, Request, Response } from 'express';

const router = Router();

router.get('/:gymId/daily', async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;
    const { date } = req.query;
    // Simulated daily attendance
    res.json({
      success: true,
      data: {
        date: date || new Date().toISOString().split('T')[0],
        totalCheckIns: 52,
        uniqueMembers: 48,
        averageDuration: 65,
        peakHour: 18,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch attendance analytics' });
  }
});

router.get('/:gymId/weekly', async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;
    res.json({
      success: true,
      data: {
        totalCheckIns: 312,
        averagePerDay: 44.5,
        busiestDay: 'Saturday',
        data: Array.from({ length: 7 }, (_, i) => ({
          day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
          count: Math.floor(Math.random() * 50) + 30,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch weekly analytics' });
  }
});

export { router as attendanceRoutes };
