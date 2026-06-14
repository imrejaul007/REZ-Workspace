/**
 * REZ AI Agent Studio
 * Conversapp.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-ID', (req as any).requestId);
  next();
});

  ational AI for marketing, sales, and support
 */

import express from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 4046;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-agent-studio';

// Middleware
app.use(helmet());

// Rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests' }
});
app.use(rateLimiter);
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.info(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Import routes
import agentRoutes from './routes/agent';
import conversationRoutes from './routes/conversation';


// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'REZ AI Agent Studio',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/agents', agentRoutes);
app.use('/api/conversations', conversationRoutes);

// Root
app.get('/', (_req, res) => {
  res.json({
    service: 'REZ AI Agent Studio',
    version: '1.0.0',
    description: 'Conversational AI agents for marketing, sales, and support',
    endpoints: {
      agents: {
        'GET /api/agents': 'List agents',
        'POST /api/agents': 'Create agent',
        'GET /api/agents/:id': 'Get agent',
        'PUT /api/agents/:id': 'Update agent',
        'POST /api/agents/:id/message': 'Send message',
      },
      conversations: {
        'GET /api/conversations': 'List conversations',
        'GET /api/conversations/:id': 'Get conversation',
        'POST /api/conversations/:id/end': 'End conversation',
      },
    },
    agentTypes: ['customer_support', 'sales', 'marketing', 'operations', 'custom'],
    capabilities: [
      'answer_questions',
      'book_appointments',
      'process_orders',
      'handle_returns',
      'provide_recommendations',
      'collect_feedback',
      'generate_content',
    ],
  });
});


// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`🚀 AI Agent Studio running on port ${PORT}`);
      logger.info(`   Health: http://localhost:${PORT}/api/agents`);
    });
  } catch (error) {
    logger.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

start();
