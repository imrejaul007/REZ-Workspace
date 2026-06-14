import { Router } from 'express';
import mongoose from 'mongoose';
import { redis } from './config/redis';

const router = Router();

// Liveness — is the process alive?
router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Readiness — can the service handle requests?
router.get('/health/ready', async (req, res) => {
  const checks: Record<string, string> = {};
  let ready = true;

  // Check MongoDB
  try {
    if (mongoose.connection.readyState !== 1) throw new Error('not connected');
    await mongoose.connection.db?.admin().ping();
    checks.mongodb = 'ok';
  } catch (err: unknown) {
    checks.mongodb = `error: ${err instanceof Error ? err.message : String(err)}`;
    ready = false;
  }

  // Check Redis
  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch (err: unknown) {
    checks.redis = `degraded: ${err instanceof Error ? err.message : String(err)}`;
    // Redis degraded is warning not fatal for wallet (locking will fail-closed)
  }

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});

export default router;
