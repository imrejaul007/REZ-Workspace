import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

// HTTP metrics
export const httpRequestsTotal = new Counter({
  name: 'campaign_copilot_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'campaign_copilot_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Business metrics
export const conversationsTotal = new Counter({
  name: 'campaign_copilot_conversations_total',
  help: 'Total number of conversations created',
  labelNames: ['advertiser_id'],
  registers: [register],
});

export const messagesTotal = new Counter({
  name: 'campaign_copilot_messages_total',
  help: 'Total number of messages processed',
  labelNames: ['role', 'type'],
  registers: [register],
});

export const actionsExecuted = new Counter({
  name: 'campaign_copilot_actions_executed_total',
  help: 'Total number of actions executed',
  labelNames: ['action_type', 'status'],
  registers: [register],
});

export const suggestionsGenerated = new Counter({
  name: 'campaign_copilot_suggestions_generated_total',
  help: 'Total number of suggestions generated',
  labelNames: ['type', 'priority'],
  registers: [register],
});

// Active conversations gauge
export const activeConversations = new Gauge({
  name: 'campaign_copilot_active_conversations',
  help: 'Number of active conversations',
  registers: [register],
});

// Response time for AI processing
export const aiResponseDuration = new Histogram({
  name: 'campaign_copilot_ai_response_duration_seconds',
  help: 'AI response generation duration in seconds',
  labelNames: ['intent'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

// Middleware to track HTTP requests
export const metricsMiddleware = () => {
  return (req: { path: string; method: string }, res: { on: (event: string, fn: () => void) => void; statusCode: number }, next: () => void) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      httpRequestsTotal.inc({
        method: req.method,
        path: req.path,
        status: res.statusCode.toString(),
      });
      httpRequestDuration.observe(
        {
          method: req.method,
          path: req.path,
          status: res.statusCode.toString(),
        },
        duration
      );
    });

    next();
  };
};