// RisaCare Records Service - Main Entry Point


declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}


import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { connectDatabase } from './services/recordService';
import { recordController } from './controllers/recordController';
import { errorHandler, requestId, requestLogger, securityHeaders, corsMiddleware } from '../../shared/middleware';
import { logger, generateRequestId } from '../../shared/utils';
import { RisaCareError, formatErrorResponse } from '../../shared/errors';

// ============================================
// APP SETUP
// ============================================

const app = express();
const PORT = parseInt(process.env.PORT || '4702', 10);

// Middleware
app.use(requestId);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: '25mb' }));
app.use(requestLogger);

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB
  }
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-records-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', (req: Request, res: Response) => {
  res.json({ status: 'ready' });
});

// Records routes
app.post('/records/upload', upload.single('file'), (req, res, next) => {
  recordController.uploadRecord(req, res, next);
});

app.get('/records', (req, res, next) => {
  recordController.listRecords(req, res, next);
});

app.get('/records/timeline', (req, res, next) => {
  recordController.getTimeline(req, res, next);
});

app.get('/records/biomarker/:biomarkerName', (req, res, next) => {
  recordController.getBiomarkerHistory(req, res, next);
});

app.get('/records/:id', (req, res, next) => {
  recordController.getRecord(req, res, next);
});

app.post('/records/:id/share', (req, res, next) => {
  recordController.shareRecord(req, res, next);
});

app.delete('/records/:id', (req, res, next) => {
  recordController.deleteRecord(req, res, next);
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.requestId || 'unknown';

  if (err instanceof RisaCareError) {
    logger.error(`RisaCare error: ${err.code}`, err, { requestId });
    res.status(err.statusCode).json(formatErrorResponse(err, requestId));
    return;
  }

  // Multer errors
  if (err.message.includes('File too large')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds 25MB limit',
        requestId
      }
    });
    return;
  }

  logger.error('Unexpected error', err, { requestId });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.requestId
    }
  });
});

// ============================================
// START
// ============================================

async function start(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Connected to MongoDB');

    // Start server
    app.listen(PORT, () => {
      logger.info(`RisaCare Records Service started on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start service', error as Error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down...');
  process.exit(0);
});

start();

export default app;
