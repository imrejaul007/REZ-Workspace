/**
 * REZ Restaurant Reviews Service
 * Port: 4057
 *
 * Complete restaurant reviews and ratings management including:
 * - Review submission and management
 * - Sentiment analysis
 * - Review moderation workflow
 * - Response management
 * - Analytics and reporting
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import reviewRoutes from './routes/review.routes.js';
import { DEFAULT_CONFIG, REVIEW_SETTINGS } from './config/index.js';

const app = express();
const PORT = DEFAULT_CONFIG.port;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-restaurant-reviews-service',
    port: PORT,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api', reviewRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ReviewsService Error]', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'ERROR',
      message: 'Internal server error',
    },
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        REZ Restaurant Reviews Service - Port ${PORT}           ║
╠═══════════════════════════════════════════════════════════════╣
║  Settings:                                                  ║
║    Rating Range: ${REVIEW_SETTINGS.minRating} - ${REVIEW_SETTINGS.maxRating}                                     ║
║    Auto-Approve Threshold: ${REVIEW_SETTINGS.autoApproveThreshold}+                               ║
║    Max Photos per Review: ${REVIEW_SETTINGS.maxPhotosPerReview}                                   ║
║    Max Comment Length: ${REVIEW_SETTINGS.maxCommentLength} chars                          ║
╠═══════════════════════════════════════════════════════════════╣
║  Features:                                                   ║
║    • Review submission & management                           ║
║    • Sentiment analysis                                     ║
║    • Moderation workflow                                    ║
║    • Manager responses                                      ║
║    • Sub-ratings (food, service, ambience, value)            ║
║    • Analytics & reporting                                   ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export { app, server };
