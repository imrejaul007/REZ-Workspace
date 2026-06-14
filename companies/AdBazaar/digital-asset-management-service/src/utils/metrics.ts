import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Initialize Prometheus metrics
const register = new client.Registry();

client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const assetOperationsTotal = new client.Counter({
  name: 'asset_operations_total',
  help: 'Total number of asset operations',
  labelNames: ['operation', 'status']
});

export const assetStorageBytes = new client.Gauge({
  name: 'asset_storage_bytes_total',
  help: 'Total storage used by assets in bytes'
});

export const activeAssetsGauge = new client.Gauge({
  name: 'active_assets_total',
  help: 'Number of active assets'
});

export const folderCountGauge = new client.Gauge({
  name: 'folders_total',
  help: 'Number of folders'
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(assetOperationsTotal);
register.registerMetric(assetStorageBytes);
register.registerMetric(activeAssetsGauge);
register.registerMetric(folderCountGauge);

// Middleware to track request metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);
    httpRequestsTotal.labels(req.method, route, res.statusCode.toString()).inc();
  });

  next();
};

// Route to expose metrics
export const metricsRoute = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
};

// Helper function to record asset operations
export const recordAssetOperation = (operation: string, status: string) => {
  assetOperationsTotal.labels(operation, status).inc();
};

// Helper function to update storage metrics
export const updateStorageMetrics = async (totalBytes: number, assetCount: number) => {
  assetStorageBytes.set(totalBytes);
  activeAssetsGauge.set(assetCount);
};

export { register };