import { logger } from '../../shared/logger';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import mentalHealthRoutes from './routes/mentalHealthRoutes.js';

const app: Application = express();
const PORT = process.env.PORT || 4722;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_mental_health';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Routes
app.use('/api', mentalHealthRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'RisaCare Mental Health Service',
    version: '1.0.0',
    description: 'Mental health support service including therapy, counseling, and wellness tracking',
    endpoints: {
      mood: {
        'POST /api/mood': 'Log mood entry',
        'GET /api/mood/:userId': 'Get mood history',
        'GET /api/mood/:userId/trends': 'Get mood trends',
        'GET /api/mood/:userId/triggers': 'Get common triggers',
        'GET /api/mood/:userId/insights': 'Get personalized insights'
      },
      counselors: {
        'GET /api/counselors': 'List counselors',
        'GET /api/counselors/:id': 'Get counselor details'
      },
      sessions: {
        'POST /api/sessions': 'Book a session',
        'GET /api/sessions/:userId': 'Get user sessions',
        'GET /api/sessions/:userId/upcoming': 'Get upcoming sessions',
        'GET /api/sessions/:userId/homework': 'Get homework',
        'PUT /api/sessions/:sessionId/complete': 'Complete session',
        'PUT /api/sessions/:sessionId/cancel': 'Cancel session'
      },
      groups: {
        'GET /api/groups': 'List support groups',
        'GET /api/groups/:groupId': 'Get group details',
        'POST /api/groups/:groupId/join': 'Join group',
        'POST /api/groups/:groupId/leave': 'Leave group',
        'GET /api/groups/:groupId/sessions': 'Get group sessions',
        'GET /api/groups/:groupId/members': 'Get group members',
        'GET /api/groups/user/:userId': "Get user's groups"
      },
      crisis: {
        'POST /api/crisis-plan': 'Create crisis plan',
        'GET /api/crisis-plan/:userId': 'Get crisis plan',
        'PUT /api/crisis-plan/:userId': 'Update crisis plan',
        'POST /api/crisis/alert': 'Trigger crisis alert',
        'GET /api/crisis/resources': 'Get crisis resources',
        'GET /api/crisis/safety-tips': 'Get safety tips',
        'GET /api/crisis/breathing-exercises': 'Get breathing exercises',
        'GET /api/crisis/grounding-techniques': 'Get grounding techniques'
      },
      selfHarm: {
        'POST /api/self-harm/log': 'Log incident',
        'GET /api/self-harm/:userId': 'Get history',
        'GET /api/self-harm/:userId/safety-plan': 'Get safety plan',
        'POST /api/self-harm/:userId/mark-safe': 'Mark as safe',
        'GET /api/self-harm/:userId/statistics': 'Get statistics',
        'GET /api/self-harm/resources': 'Get crisis resources'
      },
      profile: {
        'GET /api/profile/:userId': 'Get mental health profile',
        'PUT /api/profile/:userId': 'Update mental health profile'
      },
      health: {
        'GET /api/health': 'Health check'
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'healthy',
    service: 'risa-care-mental-health',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: dbStates[mongoose.connection.readyState as keyof typeof dbStates] || 'unknown'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server with MongoDB
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected for Mental Health Service');

    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-mental-health-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(PORT, () => {
      logger.info(`RisaCare Mental Health Service v2.0 started on port ${PORT}`);
      logger.info(`Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
export default app;
