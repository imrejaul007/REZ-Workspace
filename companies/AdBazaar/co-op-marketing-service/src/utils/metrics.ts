import { Request, Response, NextFunction } from 'express';
import client, { Counter, Histogram, Gauge, Registry } from 'prom-client';

const register = new Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new Counter({
  name: 'coop_marketing_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'coop_marketing_http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const coopFundsTotal = new Gauge({
  name: 'coop_marketing_funds_total',
  help: 'Total co-op funds',
  labelNames: ['status'],
  registers: [register],
});

const coopBudgetTotal = new Gauge({
  name: 'coop_marketing_budget_total',
  help: 'Total co-op budget',
  labelNames: ['currency'],
  registers: [register],
});

const claimsTotal = new Counter({
  name: 'coop_marketing_claims_total',
  help: 'Total claims',
  labelNames: ['status'],
  registers: [register],
});

function normalizePath(path: string): string {
  return path
    .replace(/\/api\/coop-funds\/[^/]+/, '/api/coop-funds/:id')
    .replace(/\/api\/claims\/[^/]+/, '/api/claims/:id')
    .replace(/\/api\/budgets\/[^/]+/, '/api/budgets/:id');
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

export function recordFund(status: string): void {
  coopFundsTotal.inc({ status });
}

export function setTotalBudget(amount: number, currency: string = 'INR'): void {
  coopBudgetTotal.set({ currency }, amount);
}

export function recordClaim(status: string): void {
  claimsTotal.inc({ status });
}

export { register };