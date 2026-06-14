/**
 * REZ Gym Analytics Service
 * Analytics and insights for fitness centers
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const memberSchema = new mongoose.Schema({
  memberId: String, merchantId: String, name: String, email: String, phone: String,
  membershipType: String, joinDate: Date, expiryDate: Date, status: String,
  totalVisits: Number, lastVisit: Date
});
const Member = mongoose.models.Member || mongoose.model('Member', memberSchema);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-gym-analytics-service', timestamp: new Date().toISOString() });
});

app.get('/api/analytics/:merchantId/dashboard', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const totalMembers = await Member.countDocuments({ merchantId });
    const activeMembers = await Member.countDocuments({ merchantId, status: 'active' });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const visitsToday = await Member.countDocuments({ merchantId, lastVisit: { $gte: today } });
    res.json({ success: true, data: { totalMembers, activeMembers, visitsToday } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/analytics/:merchantId/revenue', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    res.json({ success: true, data: { total: 0, monthly: [], byMembership: [] } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/analytics/:merchantId/classes', async (req: Request, res: Response) => {
  res.json({ success: true, data: { popular: [], attendance: [] } });
});

app.get('/api/analytics/:merchantId/members', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const members = await Member.find({ merchantId }).sort({ joinDate: -1 }).limit(100);
    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/analytics/:merchantId/trends', async (req: Request, res: Response) => {
  res.json({ success: true, data: { visits: [], revenue: [], churn: [] } });
});

const PORT = process.env.PORT || 4105;
app.listen(PORT, () => logger.info(`rez-gym-analytics-service on port ${PORT}`));
export default app;
