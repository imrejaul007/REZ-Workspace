import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { winstonLogger } from './config/logger';
import quoteRoutes from './routes/quotes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4009;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Logger middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  winstonLogger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'bizora-quote-builder', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/quotes', quoteRoutes);

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  winstonLogger.error('Error:', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizora-quotes';
    await mongoose.connect(mongoUri);
    winstonLogger.info('Connected to MongoDB');
  } catch (error) {
    winstonLogger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    winstonLogger.info(`BIZORA Quote Builder running on port ${PORT}`);
  });
};

startServer();

export default app;
