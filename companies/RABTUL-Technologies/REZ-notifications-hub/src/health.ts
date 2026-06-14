import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

export function createHealthChecker(serviceName: string, version: string = '1.0.0') {
  const checks: Map<string, () => Promise<void>> = new Map();

  return {
    addCheck(name: string, fn: () => Promise<void>) { checks.set(name, fn); },
    async getHealth() {
      const results = [];
      for (const [name, fn] of checks) {
        try { await fn(); results.push({ name, status: 'pass' }); }
        catch (error) { const errorMessage = error instanceof Error ? error.message : 'Unknown error'; console.error(`[HealthCheck] ${name} check failed: ${errorMessage}`); results.push({ name, status: 'fail', error: errorMessage }); }
      }
      return results;
    }
  };
}

export function healthRouter(health: ReturnType<typeof createHealthChecker>) {
  const router = Router();
  router.get('/live', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  router.get('/ready', async (_req, res) => {
    const checks = await health.getHealth();
    const unhealthy = checks.some(c => c.status === 'fail');
    res.status(unhealthy ? 503 : 200).json({ status: unhealthy ? 'not_ready' : 'ready', checks, timestamp: new Date().toISOString() });
  });
  return router;
}

// MongoDB health check
export function addMongoHealthCheck(health: ReturnType<typeof createHealthChecker>) {
  health.addCheck('mongodb', async () => {
    if (mongoose.connection.readyState !== 1) throw new Error('MongoDB not connected');
    await mongoose.connection.db?.admin().ping();
  });
}
