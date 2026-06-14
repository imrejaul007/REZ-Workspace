import http from 'http';
import mongoose from 'mongoose';
import { logger } from './config/logger';
import { bullmqRedis } from './config/redis';

let isHealthy = true;

export function setHealthy(healthy: boolean): void {
  isHealthy = healthy;
}

// OBS-HC: /ready used to return 200 unconditionally, so Render never
// recycled a pod whose Mongo connection was severed. Now we actually
// probe Mongo + Redis and return 503 on any failure.
async function checkReady(): Promise<{ ok: boolean; checks: Record<string, string> }> {
  const checks: Record<string, string> = {};
  let ok = true;
  try {
    if (mongoose.connection.readyState !== 1) throw new Error('not connected');
    await mongoose.connection.db?.admin().ping();
    checks.mongodb = 'ok';
  } catch (err) {
    checks.mongodb = `error: ${err.message}`;
    ok = false;
  }
  try {
    await bullmqRedis.ping();
    checks.redis = 'ok';
  } catch (err) {
    checks.redis = `error: ${err.message}`;
    ok = false;
  }
  return { ok, checks };
}

// Comprehensive health check that verifies MongoDB and Redis connectivity
async function checkHealth(): Promise<{ ok: boolean; checks: Record<string, string> }> {
  const checks: Record<string, string> = {};
  let ok = true;
  try {
    if (mongoose.connection.readyState !== 1) throw new Error('not connected');
    await mongoose.connection.db?.admin().ping();
    checks.mongodb = 'connected';
  } catch (err: unknown) {
    checks.mongodb = `error: ${err instanceof Error ? err.message : String(err)}`;
    ok = false;
  }
  try {
    await bullmqRedis.ping();
    checks.redis = 'connected';
  } catch (err: unknown) {
    checks.redis = `error: ${err instanceof Error ? err.message : String(err)}`;
    ok = false;
  }
  return { ok, checks };
}

export function startHealthServer(port: number = 3001): http.Server {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health' || req.url === '/healthz') {
      const { ok, checks } = await checkHealth();
      const status = ok ? 'healthy' : 'unhealthy';
      res.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status,
        timestamp: new Date().toISOString(),
        service: 'rez-catalog-service',
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        checks,
      }));
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
