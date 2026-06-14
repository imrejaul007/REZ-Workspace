/**
 * REZ Workflow Builder Service
 * Visual workflow/journey designer with execution engine
 * Integrated with REZ Flow Runtime (port 4200)
 */

import express from 'express';
import { tracingMiddleware } from './middleware/tracing';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger';
import { flowRuntimeClient } from './services/flowRuntimeClient';

const app = express();
const PORT = process.env.PORT || 4045;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-builder';
const USE_FLOW_RUNTIME = process.env.USE_FLOW_RUNTIME !== 'false';

// Log configuration on startup
logger.info('REZ Workflow Builder starting...');
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`MongoDB: ${MONGODB_URI}`);
logger.info(`REZ Flow Runtime: ${process.env.REZ_FLOW_RUNTIME_URL || 'http://localhost:4200'}`);
logger.info(`Use Flow Runtime: ${USE_FLOW_RUNTIME}`);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.info(${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Import routes
import workflowRoutes from './routes/workflow';
app.use('/api', workflowRoutes);

// Root
app.get('/', (_req, res) => {
  res.json({
    service: 'REZ Workflow Builder',
    version: '1.0.0',
    description: 'Visual workflow/journey designer with execution engine',
    endpoints: {
      workflows: {
        'GET /api/workflows': 'List workflows',
        'POST /api/workflows': 'Create workflow',
        'GET /api/workflows/:id': 'Get workflow',
        'PUT /api/workflows/:id': 'Update workflow',
        'POST /api/workflows/:id/publish': 'Publish workflow',
        'POST /api/workflows/:id/execute': 'Execute workflow',
      },
      templates: {
        'GET /api/templates': 'List templates',
        'POST /api/templates': 'Create template',
        'POST /api/templates/:id/use': 'Use template',
      },
      executions: {
        'GET /api/executions': 'List executions',
        'GET /api/executions/:id': 'Get execution',
      },
      webhook: {
        'POST /api/webhook/:workflowId': 'Webhook trigger',
      },
    },
    nodeTypes: {
      trigger: ['event', 'schedule', 'manual', 'api', 'webhook'],
      action: ['send_email', 'send_sms', 'send_whatsapp', 'send_push', 'update_user', 'create_order', 'add_tag', 'http_request', 'set_variable'],
      condition: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'not_contains', 'in', 'exists'],
      delay: ['wait_seconds', 'wait_minutes', 'wait_hours', 'wait_days'],
      filter: ['segment', 'user_property', 'behavior'],
      webhook: ['GET', 'POST', 'PUT', 'DELETE'],
      ai_agent: ['classify', 'generate', 'summarize', 'decision'],
    },
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Health check with Flow Runtime status
app.get('/api/health', async (_req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    let flowRuntimeStatus = 'unavailable';
    if (USE_FLOW_RUNTIME) {
      try {
        const health = await flowRuntimeClient.healthCheck();
        flowRuntimeStatus = health.status;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error([WorkflowBuilder] Flow Runtime health check failed: ${errorMessage}`);
        flowRuntimeStatus = 'unreachable';
      }
    }

    res.json({
      status: 'ok',
      service: 'workflow-builder',
      version: '1.1.0',
      mongodb: mongoStatus,
      flowRuntime: {
        status: flowRuntimeStatus,
        enabled: USE_FLOW_RUNTIME,
        url: process.env.REZ_FLOW_RUNTIME_URL || 'http://localhost:4200',
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Check Flow Runtime connectivity if enabled
    if (USE_FLOW_RUNTIME) {
      const health = await flowRuntimeClient.healthCheck();
      if (health.status === 'ok') {
        logger.info(`Connected to REZ Flow Runtime (uptime: ${Math.round(health.uptime)}s)`);
      } else {
        logger.warn(`REZ Flow Runtime is unreachable - will use local execution`);
      }
    }

    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-workflow-builder',
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
      logger.info(`Workflow Builder running on port ${PORT}`);
      logger.info(`   Health: http://localhost:${PORT}/api/health`);
      logger.info(`   API: http://localhost:${PORT}/api/workflows`);
      logger.info(`   Templates: http://localhost:${PORT}/api/templates`);
      logger.info(`   Executions: http://localhost:${PORT}/api/executions`);
      logger.info(`   Flow Runtime Health: http://localhost:${PORT}/api/flow-runtime/health`);
    });
  } catch (error: any) {
    logger.error('Failed to start', { error: error.message });
    process.exit(1);
  }
}

start();
