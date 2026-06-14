import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Create a custom registry
export const register = new Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// HTTP request counter
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

// HTTP request duration histogram
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Active connections gauge
export const activeConnections = new Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

// Reddit API calls counter
export const redditApiCalls = new Counter({
  name: 'reddit_api_calls_total',
  help: 'Total number of Reddit API calls',
  labelNames: ['endpoint', 'method', 'status'],
  registers: [register],
});

// Reddit API latency histogram
export const redditApiLatency = new Histogram({
  name: 'reddit_api_latency_seconds',
  help: 'Reddit API call latency in seconds',
  labelNames: ['endpoint', 'method'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

// Posts created counter
export const postsCreated = new Counter({
  name: 'reddit_posts_created_total',
  help: 'Total number of posts created',
  registers: [register],
});

// Comments posted counter
export const commentsPosted = new Counter({
  name: 'reddit_comments_posted_total',
  help: 'Total number of comments posted',
  registers: [register],
});

// Scheduled posts gauge
export const scheduledPostsCount = new Gauge({
  name: 'reddit_scheduled_posts_count',
  help: 'Number of scheduled posts pending',
  registers: [register],
});

// MongoDB operation metrics
export const mongoOperations = new Counter({
  name: 'mongodb_operations_total',
  help: 'Total number of MongoDB operations',
  labelNames: ['collection', 'operation', 'status'],
  registers: [register],
});

// Metrics middleware
export const metricsMiddleware = async (
  req: any,
  res: any,
  next: any
): Promise<void> => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const path = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      path: path,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path: path,
        status: res.statusCode,
      },
      duration
    );
  });

  next();
};

// Export metrics
export const metrics = register;
export { client };