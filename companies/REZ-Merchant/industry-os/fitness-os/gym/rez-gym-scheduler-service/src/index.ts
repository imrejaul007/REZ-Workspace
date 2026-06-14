/**
 * REZ Gym Scheduler Service
 * Staff scheduling and shift management for fitness centers
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

const shiftSchema = new mongoose.Schema({
  merchantId: String, staffId: String, staffName: String,
  date: Date, startTime: String, endTime: String,
  role: String, status: { type: String, enum: ['scheduled', 'confirmed', 'cancelled', 'completed'] },
  notes: String, createdAt: Date
});
const Shift = mongoose.models.Shift || mongoose.model('Shift', shiftSchema);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-gym-scheduler-service', timestamp: new Date().toISOString() });
});

app.post('/api/shifts', async (req: Request, res: Response) => {
  try {
    const shift = new Shift({ ...req.body, createdAt: new Date() });
    await shift.save();
    res.json({ success: true, data: shift });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/shifts/:merchantId', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const query: any = { merchantId: req.params.merchantId };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    const shifts = await Shift.find(query).sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: shifts });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.put('/api/shifts/:id', async (req: Request, res: Response) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: shift });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/staff/:merchantId/availability', async (req: Request, res: Response) => {
  try {
    const shifts = await Shift.aggregate([
      { $match: { merchantId: req.params.merchantId } },
      { $group: { _id: '$staffId', totalHours: { $sum: { $toInt: '$duration' } } } }
    ]);
    res.json({ success: true, data: shifts });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

const PORT = process.env.PORT || 4107;
app.listen(PORT, () => logger.info(`rez-gym-scheduler-service on port ${PORT}`));
export default app;
