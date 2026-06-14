import http from 'http';
import mongoose from 'mongoose';
import { redis } from './config/redis';
import { logger } from './config/logger';
export function startHealthServer(port: number): http.Server {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/health/live') { res.writeHead(200); res.end(JSON.stringify({ status: 'alive' })); return; }
    if (req.url === '/health/ready') {
      const mongoOk = mongoose.connection.readyState === 1;
      const redisOk = redis.status === 'ready';
      res.writeHead(mongoOk ? 200 : 503);
      res.end(JSON.stringify({ status: mongoOk ? 'ready' : 'degraded', mongo: mongoOk, redis: redisOk }));
      return;
    }
    res.writeHead(404); res.end();
  });
  server.listen(port, () => logger.info(`[Health] Listening on :${port}`));
  return server;
}
