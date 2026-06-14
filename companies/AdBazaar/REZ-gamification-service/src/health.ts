import http from 'http';
import mongoose from 'mongoose';
import { logger } from './config/logger';
import { bullmqRedis } from './config/redis';

let isHealthy = true;

export function setHealthy(healthy: boolean): void {
  isHealthy = healthy;
}

// OBS-HC: /ready must verify we can actually serve requests — not just
// return a hardcoded 200. Render uses this for pod recycling decisions.
async function checkReady(): Promise<{ ok: boolean; checks: Record<string, string> }> {
  const checks: Record<string, string> = {};
  let ok = true;
  try {
    if (mongoose.connection.readyState !== 1) throw new Error('not connected');
    await mongoose.connection.db?.admin().ping();
    checks.mongodb = 'ok';
  } catch (err) {
    checks.mongodb = `error: ${err instanceof Error ? err.message : String(err)}`;
    ok = false;
  }
  try {
    await bullmqRedis.ping();
    checks.redis = 'ok';
  } catch (err) {
    checks.redis = `error: ${err instanceof Error ? err.message : String(err)}`;
    ok = false;
  }
  return { ok, checks };
}

export function startHealthServer(port: number = 3001): http.Server {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health' || req.url === '/healthz') {
      if (isHealthy) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
      } else {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'unhealthy' }));
      }
    } else if (req.url === '/ready') {
      const { ok, checks } = await checkReady();
      res.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: ok ? 'ready' : 'degraded', checks, timestamp: new Date().toISOString() }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    logger.info(`[Health] Server listening on port ${port}`);
  });

  return server;
}
