import { Router, Request, Response } from 'express';
import { ReportsService } from '../services/reports.service';

const router = Router();
const reports = new ReportsService();

router.get('/daily', async (req: Request, res: Response) => {
  const date = req.query.date ? new Date(req.query.date as string) : new Date();
  const data = await reports.getDailyReport(date);
  res.json({ success: true, ...data });
});

router.get('/weekly', async (req: Request, res: Response) => {
  const start = new Date(req.query.start as string);
  const end = new Date(req.query.end as string);
  const data = await reports.getWeeklyReport(start, end);
  res.json({ success: true, ...data });
});

export default router;
