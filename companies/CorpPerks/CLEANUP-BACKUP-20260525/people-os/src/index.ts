/**
 * PeopleOS Self-Service Portal - Main Entry Point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import leaveRoutes from './routes/leave.routes';
import expenseRoutes from './routes/expense.routes';
import employeeRoutes from './routes/employee.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4040;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'people-os-self-service',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/leave', leaveRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/employees', employeeRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/people-os';

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`PeopleOS Self-Service Portal running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
