import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

export const httpRequestsTotal = new Counter({
  name: 'social_scheduler_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

export const httpRequestDuration = new Histogram({
  name: 'social_scheduler_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const postsCreatedTotal = new Counter({
  name: 'social_scheduler_posts_created_total',
  help: 'Total number of posts created',
  labelNames: ['platform'],
  registers: [register]
});

export const scheduledPostsTotal = new Counter({
  name: 'social_scheduler_scheduled_posts_total',
  help: 'Total number of scheduled posts',
  labelNames: ['platform'],
  registers: [register]
});

export const activeSchedulesGauge = new Gauge({
  name: 'social_scheduler_active_schedules',
  help: 'Number of active post schedules',
  registers: [register]
});

export const calendarEventsGauge = new Gauge({
  name: 'social_scheduler_calendar_events',
  help: 'Number of events in calendar',
  labelNames: ['platform'],
  registers: [register]
});