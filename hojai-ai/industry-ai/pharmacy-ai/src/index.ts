import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import { pharmacyRouter } from './routes/pharmacy';

// ExpertOS Integration - Clone your profession for online services
import { registerExpertOS } from '../../../hojai-expert-os/src/expertOS-integration';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 4810;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'pharmacy-ai',
    version: '1.0.0',
    aiEmployees: ['ExpertOS'],
    timestamp: new Date().toISOString()
  });
});

app.use('/api', pharmacyRouter);

// ============================================
// EXPERTOS - Professional AI Twin for Pharmacists
// ============================================

const expertOSRouter = registerExpertOS('pharmacy-ai');
app.use('/api/expert-os', expertOSRouter);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy-ai';

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((err) => {
    logger.warn('MongoDB connection failed, running without database', { error: err.message });
  });

app.listen(PORT, () => {
  logger.info(`Pharmacy AI running on port ${PORT}`);
});

export { app, logger };
