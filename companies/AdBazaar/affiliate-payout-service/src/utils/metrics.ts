import { Request, Response, NextFunction } from 'express';
import client, { Counter, Histogram, Gauge, Registry } from 'prom-client';

const register = new Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new Counter({
  name: 'affiliate_payout_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'affiliate_payout_http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const payoutsTotal = new Counter({
  name: 'affiliate_payout_total',
  help: 'Total payout amount',
  labelNames: ['currency', 'status'],
  registers: [register],
});

const payoutCount = new Gauge({
  name: 'affiliate_payout_count',
  help: 'Number of payouts',
  labelNames: ['status'],
  registers: [register],
});

const pendingPayoutAmount = new Gauge({
  name: 'affiliate_payout_pending_amount',
  help: 'Pending payout amount',
  labelNames: ['currency'],
  registers: [register],
});

const transactionTotal = new Counter({
  name: 'affiliate_transaction_total',
  help: 'Total transaction amount',
  labelNames: ['type', 'status'],
  registers: [register],
});

function normalizePath(path: string): string {
  return path
    .replace(/\/api\/payouts\/[^/]+/, '/api/payouts/:id')
    .replace(/\/api\/invoices\/[^/]+/, '/api/invoices/:id')
    .replace(/\/api\/transactions\/[^/]+/, '/api/transactions/:id');
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

export function recordPayout(amount: number, currency: string, status: string): void {
  payoutsTotal.inc({ currency, status }, amount);
  payoutCount.inc({ status });
}

export function setPendingPayoutAmount(amount: number, currency: string = 'INR'): void {
  pendingPayoutAmount.set({ currency }, amount);
}

export function recordTransaction(amount: number, type: string, status: string): void {
  transactionTotal.inc({ type, status }, Math.abs(amount));
}

export { register };