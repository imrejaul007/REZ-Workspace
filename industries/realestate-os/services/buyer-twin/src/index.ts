import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import 'express-async-errors';

// Routes
import buyerRoutes from './routes/buyer.routes.js';
import matchingRoutes from './routes/index.js';

// Services
import { buyerService } from './services/index.js';

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[FATAL] Unhandled Promise Rejection:', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

process.on('uncaughtException', (error: Error) => {
  console.error('[FATAL] Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  if (process.env['NODE_ENV'] === 'production') {
    process.exit(1);
  }
});

// ============================================================================
// APP SETUP
// ============================================================================

const app = express();
const PORT = process.env['PORT'] || 8844;
const MONGODB_URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/buyer-twin';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000', 'http://localhost:8844'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'buyer-twin',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'RTMN Buyer Twin',
    description: 'Real estate buyer profiles and matching for TwinOS',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/health',
      buyers: '/api/v1/buyers',
      matching: '/api/v1/match',
      stats: '/api/v1/buyers/stats/by-stage'
    }
  });
});

// ============================================================================
// API DOCUMENTATION (OpenAPI)
// ============================================================================

app.get('/api/docs', (req: Request, res: Response) => {
  const docsPath = path.join(process.cwd(), 'docs', 'openapi.json');
  if (fs.existsSync(docsPath)) {
    res.json(JSON.parse(fs.readFileSync(docsPath, 'utf-8')));
  } else {
    res.status(404).json({ error: 'API documentation not found' });
  }
});

// Serve Swagger UI
app.use('/api/docs/ui', express.static(path.join(process.cwd(), 'node_modules', 'swagger-ui-dist')));

app.get('/api/docs/ui', (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Buyer Twin API Documentation</title>
  <link rel="stylesheet" href="/api/docs/ui/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/api/docs/ui/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout'
    });
  </script>
</body>
</html>
  `);
});

// ============================================================================
// API ROUTES (v1)
// ============================================================================

app.use('/api/v1/buyers', buyerRoutes);
app.use('/api/v1/match', matchingRoutes);

// ============================================================================
// TWINOS INTEGRATION WEBHOOKS
// ============================================================================

/**
 * Webhook for TwinOS to create buyer twin
 */
app.post('/webhook/twinos/buyer', async (req: Request, res: Response) => {
  try {
    const { buyer, tenantId } = req.body;

    if (!buyer || !tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Buyer data and tenantId required'
      });
    }

    const result = await buyerService.createBuyer({
      ...buyer,
      tenantId
    });

    if (!result.success) {
      return res.status(409).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error: unknown) {
    console.error('[Webhook] Error creating buyer from TwinOS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create buyer twin'
    });
  }
});

/**
 * Webhook for TwinOS to update buyer twin
 */
app.patch('/webhook/twinos/buyer/:buyerId', async (req: Request, res: Response) => {
  try {
    const { buyerId } = req.params;
    const { updates, tenantId } = req.body;

    if (!updates) {
      return res.status(400).json({
        success: false,
        error: 'Updates required'
      });
    }

    const result = await buyerService.updateBuyer(buyerId!, updates, tenantId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error: unknown) {
    console.error('[Webhook] Error updating buyer from TwinOS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update buyer twin'
    });
  }
});

/**
 * Webhook for Property Marketplace to record buyer interaction
 */
app.post('/webhook/marketplace/interaction', async (req: Request, res: Response) => {
  try {
    const { buyerId, propertyId, action, tenantId } = req.body;

    if (!buyerId || !propertyId || !action) {
      return res.status(400).json({
        success: false,
        error: 'buyerId, propertyId, and action required'
      });
    }

    const result = await buyerService.recordPropertyInteraction(
      buyerId,
      { propertyId, action },
      tenantId
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error: unknown) {
    console.error('[Webhook] Error recording property interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record property interaction'
    });
  }
});

/**
 * Webhook for Lead Management to assign agent
 */
app.post('/webhook/lead/assign-agent', async (req: Request, res: Response) => {
  try {
    const { buyerId, agentId, tenantId } = req.body;

    if (!buyerId || !agentId) {
      return res.status(400).json({
        success: false,
        error: 'buyerId and agentId required'
      });
    }

    const result = await buyerService.assignAgent(buyerId, agentId, tenantId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error: unknown) {
    console.error('[Webhook] Error assigning agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign agent'
    });
  }
});

/**
 * Webhook for Agent Twin to update buyer status
 */
app.patch('/webhook/agent/buyer-status/:buyerId', async (req: Request, res: Response) => {
  try {
    const { buyerId } = req.params;
    const { status, stage, tenantId } = req.body;

    if (!status && !stage) {
      return res.status(400).json({
        success: false,
        error: 'status or stage required'
      });
    }

    const result = await buyerService.updateBuyerStatus(
      buyerId!,
      { current: status, stage },
      tenantId
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error: unknown) {
    console.error('[Webhook] Error updating buyer status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update buyer status'
    });
  }
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    error: process.env['NODE_ENV'] === 'production' ? 'Internal error' : err.message
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// ============================================================================
// START SERVER
// ============================================================================

const httpServer = createServer(app);

async function start() {
  console.log('[BuyerTwin] Starting...');

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[MongoDB] Connected to', MONGODB_URI);
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    // Continue anyway for development
  }

  // Start HTTP server
  httpServer.listen(PORT, () => {
    console.log(`[BuyerTwin] Running on port ${PORT}`);
    console.log(`[BuyerTwin] Health: http://localhost:${PORT}/health`);
    console.log(`[BuyerTwin] API: http://localhost:${PORT}/api/v1`);
    console.log(`[BuyerTwin] API Docs: http://localhost:${PORT}/api/docs/ui`);
    console.log(`[BuyerTwin] Webhooks: http://localhost:${PORT}/webhook/*`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[BuyerTwin] Shutting down...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[BuyerTwin] Shutting down...');
  await mongoose.disconnect();
  process.exit(0);
});

start().catch((error) => {
  console.error('[BuyerTwin] Failed to start:', error);
  process.exit(1);
});

export default app;
