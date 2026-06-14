/**
 * REZ Gym Attendance Service
 */

import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { attendanceRoutes } from './routes/attendance.routes';
import { qrRoutes } from './routes/qr.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4301;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
});

app.use(limiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-gym-attendance-service',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/attendance', attendanceRoutes);
app.use('/api/qr', qrRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-gym-attendance';

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Gym attendance service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
