import { logger } from '../../shared/logger';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import workflowRoutes from './routes/workflowRoutes';
import instanceRoutes from './routes/instanceRoutes';
import approvalRoutes from './routes/approvalRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 4731;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-service';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'workflow-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/workflows/instances', instanceRoutes);
app.use('/api/workflows', approvalRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`Workflow Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

startServer();

export default app;
