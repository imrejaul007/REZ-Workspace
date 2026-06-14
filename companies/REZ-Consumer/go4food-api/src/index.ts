/**
 * Go4Food API - Food Comparison Service
 * Aggregates menus from multiple food platforms
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { restaurantsRouter } from './routes/restaurants.js';
import { menuRouter } from './routes/menu.js';
import { compareRouter } from './routes/compare.js';
import { searchRouter } from './routes/search.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}));

app.use(compression());
app.use(express.json());
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'go4food-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/menu', menuRouter);
app.use('/api/compare', compareRouter);
app.use('/api/search', searchRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`Go4Food API started on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export default app;
