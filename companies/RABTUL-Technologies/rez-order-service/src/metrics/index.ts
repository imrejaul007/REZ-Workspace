// Prometheus metrics endpoint
import { Request, Response } from 'express';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const ordersCreated = new Counter({
  name: 'orders_created_total',
  help: 'Total orders created'
});

app.get('/metrics', (req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain');
  res.send(prometheus().register.metrics());
});

// Latency tracking
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    httpRequestDuration
      .labels(req.method, req.path, res.statusCode.toString())
      .observe((Date.now() - start) / 1000);
  });
  next();
});

// Middleware added to order service
// Tracks: latency per endpoint
// Exposes: GET /metrics
// Import in index.ts:
// import './metrics';
