import express from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import Redis from 'ioredis';

const app = express();
app.use(express.json());

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const TTL_SECONDS = parseInt(process.env.IDEMPOTENCY_TTL || '86400', 10); // 24 hours default

const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Connect to Redis
redis.connect().catch((err) => {
  console.error('[Idempotency] Redis connection failed:', err);
});

interface IdempotencyRecord {
  response: unknown;
  statusCode: number;
  createdAt: string;
}

// Check idempotency key
app.post('/check', async (req, res) => {
  const { idempotencyKey } = req.body;

  if (!idempotencyKey) {
    return res.status(400).json({ error: 'idempotencyKey required' });
  }

  try {
    const data = await redis.get(`idempotency:${idempotencyKey}`);

    if (data) {
      const record: IdempotencyRecord = JSON.parse(data);
      return res.status(record.statusCode).json({
        exists: true,
        response: record.response,
        createdAt: record.createdAt
      });
    }

    return res.status(404).json({ exists: false });
  } catch (error) {
    console.error('[Idempotency] Redis error:', error);
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

// Store idempotency record atomically using SET NX
app.post('/store', async (req, res) => {
  const { idempotencyKey, response, statusCode = 200 } = req.body;

  if (!idempotencyKey) {
    return res.status(400).json({ error: 'idempotencyKey required' });
  }

  const record: IdempotencyRecord = {
    response,
    statusCode,
    createdAt: new Date().toISOString()
  };

  try {
    // Use SET NX (only if not exists) for atomicity
    const result = await redis.set(
      `idempotency:${idempotencyKey}`,
      JSON.stringify(record),
      'EX',
      TTL_SECONDS,
      'NX'
    );

    if (result === 'OK') {
      return res.json({ stored: true, expiresIn: TTL_SECONDS });
    } else {
      // Key already exists
      return res.status(409).json({ stored: false, error: 'Key already exists' });
    }
  } catch (error) {
    console.error('[Idempotency] Store error:', error);
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

// Delete idempotency key
app.delete('/:key', async (req, res) => {
  const { key } = req.params;

  try {
    await redis.del(`idempotency:${key}`);
    return res.json({ deleted: true });
  } catch (error) {
    console.error('[Idempotency] Delete error:', error);
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

// Health check with Redis status
app.get('/health', async (req, res) => {
  try {
    const ping = await redis.ping();
    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:(\S+)/);
    const memoryUsed = memoryMatch ? memoryMatch[1] : 'unknown';

    res.json({
      status: 'ok',
      redis: ping === 'PONG' ? 'connected' : 'disconnected',
      memoryUsed,
      ttl: TTL_SECONDS
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      redis: 'disconnected',
      error: 'Redis unavailable'
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const keys = await redis.keys('idempotency:*');
    res.json({
      activeKeys: keys.length,
      ttl: TTL_SECONDS
    });
  } catch (error) {
    res.status(503).json({ error: 'Redis unavailable' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`[Idempotency] Service running on port ${PORT}`));
