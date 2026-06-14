import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { logger } from './utils/logger';
import { queueRoutes } from './routes/queue.routes';
import { scheduleRoutes } from './routes/schedule.routes';
import { PostQueue } from './services/queue.service';

config();

const app = express();
const PORT = process.env.PORT || 4690;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'] }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rez-post-queue', timestamp: new Date().toISOString() });
});

app.use('/api/v1/queue', queueRoutes);
app.use('/api/v1/schedules', scheduleRoutes);

const queue = new PostQueue();
queue.start();

app.listen(PORT, () => logger.info(`REZ Post Queue running on port ${PORT}`));

export default app;
