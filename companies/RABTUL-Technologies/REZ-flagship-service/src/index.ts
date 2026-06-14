import express from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import cors from 'cors'
import routes from './routes.js'

const app = express()
const PORT = process.env.PORT || 4030 // Use port 4030 for FlagShip Service

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-flagship-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// API routes
app.use('/api', routes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'RABTUL FlagShip Service',
    description: 'Feature flags, gradual rollouts, and A/B testing',
    version: '1.0.0',
    documentation: {
      flags: {
        create: 'POST /api/flags',
        list: 'GET /api/flags',
        get: 'GET /api/flags/:key',
        update: 'PATCH /api/flags/:key',
        archive: 'DELETE /api/flags/:key',
        history: 'GET /api/flags/:key/history',
      },
      variations: {
        add: 'POST /api/flags/:key/variations',
        remove: 'DELETE /api/flags/:key/variations/:variationKey',
      },
      rules: {
        add: 'POST /api/flags/:key/rules',
        update: 'PATCH /api/flags/:key/rules/:ruleId',
        remove: 'DELETE /api/flags/:key/rules/:ruleId',
        reorder: 'POST /api/flags/:key/rules/reorder',
      },
      evaluation: {
        single: 'POST /api/evaluate/:key',
        batch: 'POST /api/evaluate/batch',
        all: 'POST /api/evaluate/all',
      },
      sdk: {
        allFlags: 'GET /api/sdk/flags',
        singleFlag: 'GET /api/sdk/flags/:key',
      },
      segments: {
        list: 'GET /api/segments',
        create: 'POST /api/segments',
        get: 'GET /api/segments/:id',
        delete: 'DELETE /api/segments/:id',
      },
    },
    example: {
      createFlag: {
        key: 'new_feature',
        name: 'New Feature',
        status: 'inactive',
        variations: [
          { key: 'control', value: false },
          { key: 'treatment', value: true },
        ],
        defaultVariation: 'control',
      },
      evaluate: {
        userId: 'user_123',
        attributes: {
          plan: 'premium',
          country: 'IN',
        },
      },
    },
  })
})

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  })
})

// Start server
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║              RABTUL FlagShip Service v1.0.0              ║
╠═══════════════════════════════════════════════════════════════╣
║  Status:  RUNNING                                        ║
║  Port:    ${PORT}                                              ║
║  Purpose: Feature flags, A/B testing, gradual rollouts  ║
╚═══════════════════════════════════════════════════════════════╝
  `)
})

export default app
