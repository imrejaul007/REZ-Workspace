/**
 * REZ Gym Class Service
 * Class and session management for fitness centers
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

const classSchema = new mongoose.Schema({
  merchantId: String, name: String, instructor: String, type: String,
  duration: Number, capacity: Number, enrolled: Number,
  schedule: { dayOfWeek: [Number], startTime: String, endTime: String },
  status: { type: String, enum: ['active', 'cancelled', 'completed'] },
  createdAt: Date
});
const GymClass = mongoose.models.GymClass || mongoose.model('GymClass', classSchema);

const bookingSchema = new mongoose.Schema({
  classId: mongoose.Schema.Types.ObjectId, memberId: String,
  merchantId: String, status: String, bookedAt: Date
});
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-gym-class-service', timestamp: new Date().toISOString() });
});

app.post('/api/classes', async (req: Request, res: Response) => {
  try {
    const gymClass = new GymClass({ ...req.body, createdAt: new Date() });
    await gymClass.save();
    res.json({ success: true, data: gymClass });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/classes/:merchantId', async (req: Request, res: Response) => {
  try {
    const classes = await GymClass.find({ merchantId: req.params.merchantId });
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/bookings', async (req: Request, res: Response) => {
  try {
    const booking = new Booking({ ...req.body, bookedAt: new Date() });
    await booking.save();
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/bookings/:classId', async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({ classId: req.params.classId });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

const PORT = process.env.PORT || 4106;
app.listen(PORT, () => logger.info(`rez-gym-class-service on port ${PORT}`));
export default app;
