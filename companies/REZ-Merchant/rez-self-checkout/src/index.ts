import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import routes
import sessionRoutes from './routes/session';
import barcodeRoutes from './routes/barcode';
import paymentRoutes from './routes/payment';
import exitRoutes from './routes/exit';

// Import services
import { sessionService } from './services/sessionService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4092;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-self-checkout',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// API Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/exit', exitRoutes);

// Session expiry job (runs every 5 minutes)
const SESSION_EXPIRY_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(async () => {
  try {
    const expiredCount = await sessionService.expireSessions();
    if (expiredCount > 0) {
      console.log(`[${new Date().toISOString()}] Expired ${expiredCount} sessions`);
    }
  } catch (error) {
    console.error('Error expiring sessions:', error);
  }
}, SESSION_EXPIRY_INTERVAL);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);

  // Handle specific error types
  if (err.message.includes('not found')) {
    res.status(404).json({
      success: false,
      error: err.message,
    });
  } else if (err.message.includes('expired') || err.message.includes('Invalid')) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// Database connection and server startup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_self_checkout';

const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    app.listen(PORT, () => {
      console.log(`Self Checkout Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nShutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();

export default app;
