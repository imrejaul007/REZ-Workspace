/**
 * REZ Data Aggregator Service
 * Unified data aggregation from multiple sources
 */

import express, { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = parseInt(process.env.PORT || '4058', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================
// DATA SOURCES
// ============================================

interface DataSource {
  id: string;
  name: string;
  type: 'mongodb' | 'mysql' | 'postgres' | 'elasticsearch' | 'redis' | 'api';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
}

interface AggregatedData {
  source: string;
  timestamp: Date;
  data: unknown;
  metadata?: Record<string, unknown>;
}

const dataSources: DataSource[] = [
  { id: 'users', name: 'User Profiles', type: 'mongodb', status: 'connected' },
  { id: 'orders', name: 'Order System', type: 'mongodb', status: 'connected' },
  { id: 'payments', name: 'Payment Service', type: 'mongodb', status: 'connected' },
  { id: 'analytics', name: 'Analytics Events', type: 'elasticsearch', status: 'connected' },
];

const cachedData: Map<string, { data: unknown; timestamp: Date; ttl: number }> = new Map();

// ============================================
// AGGREGATION ENDPOINTS
// ============================================

app.get('/api/sources', (_req: Request, res: Response) => {
  res.json({
    sources: dataSources.map(s => ({
      ...s,
      lastSync: s.lastSync?.toISOString(),
    })),
    total: dataSources.length,
  });
});

app.post('/api/sources/:id/sync', async (req: Request, res: Response) => {
  const source = dataSources.find(s => s.id === req.params.id);

  if (!source) {
    return res.status(404).json({ error: 'Data source not found' });
  }

  source.lastSync = new Date();
  source.status = 'connected';

  res.json({
    success: true,
    source: source.id,
    syncedAt: source.lastSync.toISOString(),
  });
});

app.post('/api/aggregate', async (req: Request, res: Response) => {
  const { sources, query, transform, merge } = req.body;

  if (!sources || !Array.isArray(sources)) {
    return res.status(400).json({ error: 'sources array is required' });
  }

  const results: AggregatedData[] = [];

  for (const sourceId of sources) {
    const source = dataSources.find(s => s.id === sourceId);
    if (!source) continue;

    const data = await fetchFromSource(sourceId, query);

    results.push({
      source: sourceId,
      timestamp: new Date(),
      data,
      metadata: {
        sourceType: source.type,
        recordCount: Array.isArray(data) ? data.length : 1,
      },
    });
  }

  let aggregatedData = results;

  if (transform && typeof transform === 'function') {
    aggregatedData = results.map(r => ({
      ...r,
      data: transform(r.data),
    }));
  }

  let finalData = aggregatedData;
  if (merge) {
    finalData = [mergeResults(aggregatedData)];
  }

  res.json({
    results: finalData.map(r => ({
      ...r,
      timestamp: r.timestamp.toISOString(),
    })),
    totalSources: results.length,
    aggregatedAt: new Date().toISOString(),
  });
});

app.get('/api/query/:source', async (req: Request, res: Response) => {
  const { source } = req.params;
  const { filter, limit = 100, offset = 0 } = req.query;

  const dataSource = dataSources.find(s => s.id === source);
  if (!dataSource) {
    return res.status(404).json({ error: 'Data source not found' });
  }

  const data = await fetchFromSource(source, { filter, limit, offset });

  res.json({
    source,
    data,
    meta: {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================
// CACHING ENDPOINTS
// ============================================

app.get('/api/cache/:key', (req: Request, res: Response) => {
  const entry = cachedData.get(req.params.key);

  if (!entry) {
    return res.status(404).json({ error: 'Cache key not found' });
  }

  const age = Date.now() - entry.timestamp.getTime();
  if (age > entry.ttl) {
    cachedData.delete(req.params.key);
    return res.status(404).json({ error: 'Cache entry expired' });
  }

  res.json({
    key: req.params.key,
    data: entry.data,
    age: Math.round(age / 1000),
    ttlRemaining: Math.round((entry.ttl - age) / 1000),
  });
});

app.post('/api/cache/:key', (req: Request, res: Response) => {
  const { data, ttl = 300 } = req.body;

  if (data === undefined) {
    return res.status(400).json({ error: 'data is required' });
  }

  cachedData.set(req.params.key, {
    data,
    timestamp: new Date(),
    ttl: parseInt(ttl as string, 10) * 1000,
  });

  res.json({
    success: true,
    key: req.params.key,
    ttl: parseInt(ttl as string, 10),
  });
});

app.delete('/api/cache/:key', (req: Request, res: Response) => {
  const deleted = cachedData.delete(req.params.key);
  res.json({ success: deleted, key: req.params.key });
});

app.get('/api/cache', (_req: Request, res: Response) => {
  const keys = Array.from(cachedData.entries()).map(([key, entry]) => ({
    key,
    age: Math.round((Date.now() - entry.timestamp.getTime()) / 1000),
    ttl: Math.round(entry.ttl / 1000),
    size: JSON.stringify(entry.data).length,
  }));

  res.json({
    keys,
    total: keys.length,
    totalSize: keys.reduce((sum, k) => sum + k.size, 0),
  });
});

// ============================================
// REPORTING ENDPOINTS
// ============================================

app.post('/api/reports', async (req: Request, res: Response) => {
  const { sources, metrics, period, groupBy } = req.body;

  const report = {
    id: `report_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    period: period || 'daily',
    sources: sources || dataSources.map(s => s.id),
    metrics: metrics || ['count', 'sum', 'avg'],
    groupBy: groupBy || 'date',
    data: generateMockReportData(),
  };

  res.json(report);
});

app.get('/api/reports/:id', (req: Request, res: Response) => {
  const report = {
    id: req.params.id,
    status: 'completed',
    generatedAt: new Date(Date.now() - 3600000).toISOString(),
    data: generateMockReportData(),
  };

  res.json(report);
});

// ============================================
// HEALTH & INFO
// ============================================

app.get('/health', (_req: Request, res: Response) => {
  const sourcesStatus = {
    connected: dataSources.filter(s => s.status === 'connected').length,
    disconnected: dataSources.filter(s => s.status === 'disconnected').length,
    error: dataSources.filter(s => s.status === 'error').length,
  };

  res.json({
    status: 'healthy',
    service: 'REZ Data Aggregator',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    sources: sourcesStatus,
    cache: { entries: cachedData.size },
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'REZ Data Aggregator',
    version: '1.0.0',
    description: 'Unified data aggregation from multiple sources',
    endpoints: {
      sources: {
        'GET /api/sources': 'List data sources',
        'POST /api/sources/:id/sync': 'Trigger sync',
      },
      aggregate: {
        'POST /api/aggregate': 'Aggregate from multiple sources',
        'GET /api/query/:source': 'Query specific source',
      },
      cache: {
        'GET /api/cache': 'List cache',
        'GET /api/cache/:key': 'Get cached data',
        'POST /api/cache/:key': 'Set cached data',
        'DELETE /api/cache/:key': 'Delete cached data',
      },
      reports: {
        'POST /api/reports': 'Generate report',
        'GET /api/reports/:id': 'Get report',
      },
    },
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function fetchFromSource(sourceId: string, query?): Promise<unknown> {
  await new Promise(resolve => setTimeout(resolve, 50));

  const mockData: Record<string, unknown[]> = {
    users: [
      { id: '1', name: 'User 1', email: 'user1@example.com' },
      { id: '2', name: 'User 2', email: 'user2@example.com' },
    ],
    orders: [
      { id: 'ord_1', userId: '1', amount: 1000, status: 'completed' },
      { id: 'ord_2', userId: '2', amount: 2500, status: 'pending' },
    ],
    payments: [
      { id: 'pay_1', orderId: 'ord_1', amount: 1000, method: 'upi' },
      { id: 'pay_2', orderId: 'ord_2', amount: 2500, method: 'card' },
    ],
    analytics: [
      { event: 'page_view', userId: '1', timestamp: new Date() },
      { event: 'purchase', userId: '2', timestamp: new Date() },
    ],
  };

  let data = mockData[sourceId] || [];

  if (query?.filter) {
    data = data.filter((item) => {
      for (const [key, value] of Object.entries(query.filter)) {
        if (item[key] !== value) return false;
      }
      return true;
    });
  }

  if (query?.limit) {
    data = data.slice(0, query.limit);
  }

  return data;
}

function mergeResults(results: AggregatedData[]): AggregatedData {
  return {
    source: 'merged',
    timestamp: new Date(),
    data: results.map(r => r.data),
    metadata: {
      sources: results.map(r => r.source),
      totalRecords: results.reduce((sum, r) => {
        return sum + (Array.isArray(r.data) ? r.data.length : 1);
      }, 0),
    },
  };
}

// STATISTICAL: mock report data generation for testing/demo purposes
function generateMockReportData(): unknown[] {
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    users: Math.floor(Math.random() * 1000),
    orders: Math.floor(Math.random() * 500),
    revenue: Math.floor(Math.random() * 100000),
  })).reverse();
}

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  logger.info(`REZ Data Aggregator running on port ${PORT}`);
  logger.info(`  Sources: http://localhost:${PORT}/api/sources`);
  logger.info(`  Aggregate: http://localhost:${PORT}/api/aggregate`);
  logger.info(`  Cache: http://localhost:${PORT}/api/cache`);
  logger.info(`  Reports: http://localhost:${PORT}/api/reports`);
});

export { app };
