import http from 'http';
import mongoose from 'mongoose';
import { redis } from './config/redis';
import { logger } from './config/logger';

export function startHealthServer(port: number): http.Server {
  const server = http.createServer(async (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    const redisOk = redis.status === 'ready';
    const healthy = mongoOk && redisOk;
    res.writeHead(healthy ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: healthy ? 'ok' : 'degraded', mongo: mongoOk, redis: redisOk }));
  });
  server.listen(port, () => logger.info(`Health check server started on port ${port}`));
  return server;
}
