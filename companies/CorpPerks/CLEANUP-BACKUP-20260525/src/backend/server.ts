import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './config/logger';
import integrationRoutes from './index';
import corpPerksRoutes from './corpPerksRoutes';
import hotelRoutes from './hotelRoutes';
import corpGSTRoutes from './corpGSTRoutes';
import makcorpsRoutes from './makcorpsRoutes';
import nextabizzRoutes from './nextabizzRoutes';
import rtmnFinanceRoutes from './rtmnFinanceRoutes';

const app = express();
const PORT = process.env.PORT || 4013;

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || 'https://rez.money').split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'corpperks-api', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/integrations', integrationRoutes);
app.use('/api/corpperks', corpPerksRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/gst', corpGSTRoutes);
app.use('/api/makcorps', makcorpsRoutes);
app.use('/api/nextabizz', nextabizzRoutes);
app.use('/api/finance', rtmnFinanceRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`CorpPerks API running on port ${PORT}`);
});

export default app;
