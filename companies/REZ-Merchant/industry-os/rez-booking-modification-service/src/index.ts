/**
 * REZ Booking Modification Service
 * Handle booking changes, cancellations, rescheduling
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());

const modificationSchema = new mongoose.Schema({
  bookingId: String, merchantId: String, customerId: String,
  type: { type: String, enum: ['reschedule', 'cancel', 'modify', 'partial_cancel'] },
  oldValue: mongoose.Schema.Types.Mixed, newValue: mongoose.Schema.Types.Mixed,
  reason: String, status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'] },
  charges: Number, refundAmount: Number, processedAt: Date, createdAt: Date
});
const Modification = mongoose.models.Modification || mongoose.model('Modification', modificationSchema);

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', service: 'rez-booking-modification-service' }));

app.post('/api/modifications', async (req: Request, res: Response) => {
  const mod = new Modification({ ...req.body, status: 'pending', createdAt: new Date() });
  await mod.save();
  res.json({ success: true, data: mod });
});

app.get('/api/modifications/:bookingId', async (req: Request, res: Response) => {
  const mods = await Modification.find({ bookingId: req.params.bookingId }).sort({ createdAt: -1 });
  res.json({ success: true, data: mods });
});

app.put('/api/modifications/:id/approve', async (req: Request, res: Response) => {
  const mod = await Modification.findByIdAndUpdate(req.params.id, { status: 'approved', processedAt: new Date() }, { new: true });
  res.json({ success: true, data: mod });
});

app.put('/api/modifications/:id/reject', async (req: Request, res: Response) => {
  const { reason } = req.body;
  const mod = await Modification.findByIdAndUpdate(req.params.id, { status: 'rejected', reason }, { new: true });
  res.json({ success: true, data: mod });
});

app.post('/api/reschedule', async (req: Request, res: Response) => {
  const { bookingId, newDate, newTime, reason } = req.body;
  const mod = new Modification({ bookingId, type: 'reschedule', newValue: { date: newDate, time: newTime }, reason, createdAt: new Date() });
  await mod.save();
  res.json({ success: true, data: mod });
});

app.post('/api/cancel', async (req: Request, res: Response) => {
  const { bookingId, reason } = req.body;
  const mod = new Modification({ bookingId, type: 'cancel', reason, createdAt: new Date() });
  await mod.save();
  res.json({ success: true, data: mod });
});

const PORT = process.env.PORT || 4026;
app.listen(PORT, () => logger.info(`rez-booking-modification-service on port ${PORT}`));
export default app;
