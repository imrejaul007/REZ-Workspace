import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import winston from 'winston';
import { mkdirSync } from 'fs';
import patientRoutes from './routes/patient.routes';
import recordRoutes from './routes/record.routes';

dotenv.config();
try { mkdirSync('logs', { recursive: true }); } catch (e) {}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
  transports: [
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

const app: Application = express();
const PORT = process.env.PORT || 5001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip, query: req.query });
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'rez-healthcare-patient-service', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.use('/api', patientRoutes, recordRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', { message: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_healthcare_patient';
  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => { await mongoose.connection.close(); process.exit(0); });
process.on('SIGINT', async () => { await mongoose.connection.close(); process.exit(0); });

const startServer = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`REZ Healthcare Patient Service running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
  });
};

startServer().catch((error) => { logger.error('Failed to start server:', error); process.exit(1); });
export { app, logger };
