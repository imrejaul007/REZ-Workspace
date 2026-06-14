import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Models
const reservationSchema = new mongoose.Schema({
  merchantId: String,
  customerId: String,
  customerName: String,
  customerPhone: String,
  date: Date,
  time: String,
  partySize: Number,
  tableId: String,
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  specialRequests: String,
  createdAt: { type: Date, default: Date.now }
});

const Reservation = mongoose.model('Reservation', reservationSchema);

// Health
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'rez-table-booking-service' }));

// Create reservation
app.post('/api/reservations', async (req, res) => {
  try {
    const reservation = new Reservation(req.body);
    await reservation.save();
    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get reservations
app.get('/api/reservations', async (req, res) => {
  try {
    const { merchantId, date, status } = req.query;
    const query: any = {};
    if (merchantId) query.merchantId = merchantId;
    if (date) query.date = new Date(date as string);
    if (status) query.status = status;
    const reservations = await Reservation.find(query).sort({ date: 1, time: 1 });
    res.json({ success: true, data: reservations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reservations/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reservation) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    await Reservation.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    res.json({ success: true, message: 'Reservation cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Table availability
app.get('/api/availability', async (req, res) => {
  try {
    const { merchantId, date, time, partySize } = req.query;
    res.json({ success: true, data: { available: true, tables: [] } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Waitlist
app.post('/api/waitlist', async (req, res) => {
  try {
    const entry = { ...req.body, addedAt: new Date(), position: 1 };
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/waitlist/:merchantId', async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 4070;
app.listen(PORT, () => logger.info(`rez-table-booking-service running on port ${PORT}`));
export default app;
