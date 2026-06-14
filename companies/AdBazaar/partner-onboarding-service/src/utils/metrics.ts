import { Request, Response, NextFunction } from 'express';
import client, { Counter, Histogram, Gauge, Registry } from 'prom-client';

const register = new Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new Counter({
  name: 'partner_onboarding_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'partner_onboarding_http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const partnersTotal = new Gauge({
  name: 'partner_onboarding_partners_total',
  help: 'Total partners',
  labelNames: ['status', 'type'],
  registers: [register],
});

const verificationsTotal = new Counter({
  name: 'partner_onboarding_verifications_total',
  help: 'Total verifications',
  labelNames: ['type', 'status'],
  registers: [register],
});

const documentsTotal = new Counter({
  name: 'partner_onboarding_documents_total',
  help: 'Total documents',
  labelNames: ['type', 'status'],
  registers: [register],
});

function normalizePath(path: string): string {
  return path
    .replace(/\/api\/partners\/[^/]+/, '/api/partners/:id')
    .replace(/\/api\/verifications\/[^/]+/, '/api/verifications/:id')
    .replace(/\/api\/documents\/[^/]+/, '/api/documents/:id');
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  if (req.path === '/metrics') { next(); return; }

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const normalizedPath = normalizePath(req.path);
    httpRequestsTotal.inc({ method: req.method, path: normalizedPath, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, path: normalizedPath, status: res.statusCode }, duration);
  });
  next();
}

export async function metricsHandler(req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end('Error generating metrics');
  }
}

export function recordPartner(status: string, type: string): void {
  partnersTotal.inc({ status, type });
}

export function recordVerification(type: string, status: string): void {
  verificationsTotal.inc({ type, status });
}

export function recordDocument(type: string, status: string): void {
  documentsTotal.inc({ type, status });
}

export { register };