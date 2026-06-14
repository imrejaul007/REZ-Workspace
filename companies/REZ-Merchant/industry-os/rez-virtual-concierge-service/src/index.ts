/**
 * REZ Virtual Concierge Service
 * Port: 4026
 *
 * AI-powered guest assistance
 * Features:
 * - Intelligent chatbot
 * - Concierge requests
 * - Service recommendations
 * - Context-aware responses
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

// Import routes
import requestRoutes from './routes/request.routes';
import { ConciergeRequestModel } from './models/ConciergeRequest';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

const app = express();
const PORT = parseInt(process.env.PORT || '4026', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/rez_virtual_concierge';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.path}`);
  next();
});

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const requestCount = await ConciergeRequestModel.countDocuments().catch(() => 0);

  res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    service: 'rez-virtual-concierge-service',
    port: PORT,
    database: dbStatus,
    requestCount,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ status: 'not_ready', reason: 'Database not connected' });
  }
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/requests', requestRoutes);

// Conversation routes (inline for simplicity)
import { conciergeService } from './services/concierge.service';

// POST /api/chat - Chat with AI concierge
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { guestId, bookingId, merchantId, message, conversationId } = req.body;

    if (!guestId || !message) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'guestId and message are required' },
      });
    }

    const result = await conciergeService.sendMessage({
      guestId,
      bookingId,
      merchantId: merchantId || 'default',
      message,
      conversationId,
    });

    res.json({
      success: true,
      data: {
        response: result.response,
        conversationId: result.conversation.id,
        messages: result.conversation.messages,
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to process message' },
    });
  }
});

// GET /api/conversation/:guestId - Get conversation
app.get('/api/conversation/:guestId', async (req: Request, res: Response) => {
  try {
    const conversation = await conciergeService.getConversationByGuest(req.params.guestId);
    res.json({
      success: true,
      data: {
        conversation: conversation || { messages: [] },
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get conversation' },
    });
  }
});

// GET /api/recommendations/:merchantId - Get recommendations
app.get('/api/recommendations/:merchantId', async (req: Request, res: Response) => {
  try {
    // Return mock recommendations
    res.json({
      success: true,
      data: {
        services: [
          { id: '1', name: 'Spa Treatment', category: 'spa', price: 2500 },
          { id: '2', name: 'Airport Transfer', category: 'transport', price: 1500 },
        ],
        dining: [
          { id: '1', name: 'Rooftop Restaurant', cuisine: 'Multi-cuisine', rating: 4.5 },
          { id: '2', name: 'Coffee Shop', cuisine: 'Cafe', rating: 4.2 },
        ],
        experiences: [
          { id: '1', name: 'City Tour', duration: '4 hours', price: 2000 },
          { id: '2', name: 'Temple Visit', duration: '2 hours', price: 500 },
        ],
      },
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get recommendations' },
    });
  }
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'ERROR', message: 'Internal server error' },
  });
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down...');
  await mongoose.disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start() {
  try {
    await mongoose.connect(MONGO_URL);
    logger.info('Connected to MongoDB');

    await ConciergeRequestModel.createIndexes();

    app.listen(PORT, () => {
      logger.info(
╔══════════════════════════════════════════════════════════╗
║       REZ Virtual Concierge Service              ║
╠══════════════════════════════════════════════════════════╣
║  Port:        ${PORT}                                 ║
║  MongoDB:     Connected                           ║
║  AI Chat:     Enabled                            ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
