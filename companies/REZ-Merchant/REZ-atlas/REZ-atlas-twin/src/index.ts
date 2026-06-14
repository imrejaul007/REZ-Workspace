/**
 * REZ Atlas Twin - Merchant Digital Twin Engine
 * The Merchant Intelligence Network for the Physical World
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { twinRoutes } from './routes/twin.js';
import { dashboardRoutes } from './routes/dashboard.js';

const PORT = process.env.PORT || 5153;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-atlas-twin';

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${Date.now() - startTime}ms)`);
  });

  next();
});

// Health checks
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ-atlas-twin',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(mongoStatus === 'connected' ? 200 : 503).json({
    status: mongoStatus === 'connected' ? 'ready' : 'not_ready',
    checks: { mongodb: mongoStatus },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', twinRoutes);
app.use('/api', dashboardRoutes);

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message },
    timestamp: new Date().toISOString()
  });
});

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

// Start server
async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   👤 REZ ATLAS TWIN                                          ║
║   Merchant Digital Twin Engine                                ║
║                                                               ║
║   Port: ${PORT}                                                 ║
║   Health: http://localhost:${PORT}/health                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Server start failed:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await mongoose.disconnect();
  process.exit(0);
});

startServer();

export default app;