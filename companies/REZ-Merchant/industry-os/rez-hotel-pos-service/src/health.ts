import http from 'http';
import { getMongoConnection } from './config/mongodb';
import { redis } from './config/redis';
import { logger } from './config/logger';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    mongodb: { status: string; message?: string };
    redis: { status: string; message?: string };
    uptime: number;
  };
  timestamp: string;
}

export function startHealthServer(port: number): http.Server {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      const mongoConnection = getMongoConnection();
      const redisStatus = redis.status;

      const checks = {
        mongodb: {
          status: mongoConnection.readyState === 1 ? 'healthy' : 'unhealthy',
          message: mongoConnection.readyState === 1 ? 'Connected' : 'Disconnected',
        },
        redis: {
          status: redisStatus === 'ready' ? 'healthy' : 'degraded',
          message: redisStatus,
        },
        uptime: process.uptime(),
      };

      const allHealthy = checks.mongodb.status === 'healthy' && checks.redis.status === 'healthy';
      const anyUnhealthy = checks.mongodb.status === 'unhealthy' || checks.redis.status === 'unhealthy';

      const healthStatus: HealthStatus = {
        status: allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded',
        checks,
        timestamp: new Date().toISOString(),
      };

      const statusCode = healthStatus.status === 'healthy' ? 200 : healthStatus.status === 'degraded' ? 200 : 503;

      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(healthStatus));
    } else if (req.url === '/ready' && req.method === 'GET') {
      const mongoConnection = getMongoConnection();
      const isReady = mongoConnection.readyState === 1 && redis.status === 'ready';

      res.writeHead(isReady ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ready: isReady }));
    } else if (req.url === '/live' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ alive: true }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  server.listen(port, () => {
    logger.info(`[Health] Health server listening on :${port}`);
  });

  server.on('error', (err) => {
    logger.error('[Health] Server error', { error: err.message });
  });

  return server;
}
