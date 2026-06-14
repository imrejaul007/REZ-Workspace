/**
 * REZ Assistant - AI Chat Service
 * Intent tracking, preference learning, and need prediction
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { chatRouter } from './routes/chat.js';
import { intentsRouter } from './routes/intents.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { assistantRouter } from './routes/assistant.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3011', 10);

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rez-assistant',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/intents', intentsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/assistant', assistantRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`REZ Assistant started on port ${PORT}`);
});

export default app;
