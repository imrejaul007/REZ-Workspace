import { logger } from '../../shared/logger';
/**
 * risacare-health-graph
 *
 * Health Knowledge Graph - Relationships and intelligence layer
 * Following RTNM Doctrine: Memory → Knowledge Graph → Twin → Intelligence
 *
 * Port: 4802
 */

import express from 'express';
import cors from 'cors';
import healthGraphRoutes from './routes/healthGraphRoutes.js';

const app = express();
const PORT = process.env.PORT || 4802;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'risacare-health-graph',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'risacare-health-graph',
    description: 'Health Knowledge Graph - Relationships and intelligence layer for MyRisa',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      graph: '/api/graph',
      nodes: '/api/graph/nodes',
      relationships: '/api/graph/relationships',
      extract: '/api/graph/extract',
      analyze: '/api/graph/analyze',
      insights: '/api/graph/insights',
      correlations: '/api/graph/correlations'
    }
  });
});

// API Routes
app.use('/api/graph', healthGraphRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧠 risacare-health-graph                               ║
║                                                           ║
║   Health Knowledge Graph                                  ║
║   Relationships & Intelligence Layer                       ║
║                                                           ║
║   Port: ${PORT}                                             ║
║                                                           ║
║   Following RTNM Doctrine:                                ║
║   Memory → Knowledge Graph → Twin → Intelligence          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});