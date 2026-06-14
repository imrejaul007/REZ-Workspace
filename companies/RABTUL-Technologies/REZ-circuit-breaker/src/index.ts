import express from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import Redis from 'ioredis';

const app = express();
app.use(express.json());

// Redis configuration for distributed state
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.connect().catch((err) => {
  console.error('[CircuitBreaker] Redis connection failed:', err);
});

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerRecord {
  name: string;
  state: CircuitState;
  failures: number;
  lastFailure: string | null;
  threshold: number;
  timeout: number;
  halfOpenAttempts: number;
}

const CIRCUIT_KEY_PREFIX = 'circuit:';
const CIRCUIT_TTL = 3600; // 1 hour TTL for circuit state

// Default circuit breaker configuration
const DEFAULT_THRESHOLD = 5;
const DEFAULT_TIMEOUT = 60000; // 60 seconds
const HALF_OPEN_MAX_ATTEMPTS = 3;

/**
 * Get circuit state from Redis
 */
async function getCircuitState(name: string): Promise<CircuitBreakerRecord | null> {
  const data = await redis.get(`${CIRCUIT_KEY_PREFIX}${name}`);
  if (!data) return null;

  const record = JSON.parse(data);

  // Check if circuit should transition from OPEN to HALF_OPEN
  if (record.state === 'OPEN') {
    const lastFailureTime = record.lastFailure ? new Date(record.lastFailure).getTime() : 0;
    const elapsed = Date.now() - lastFailureTime;

    if (elapsed >= record.timeout) {
      record.state = 'HALF_OPEN';
      record.halfOpenAttempts = 0;
      await saveCircuitState(name, record);
    }
  }

  return record;
}

/**
 * Save circuit state to Redis
 */
async function saveCircuitState(name: string, record: CircuitBreakerRecord): Promise<void> {
  await redis.setex(
    `${CIRCUIT_KEY_PREFIX}${name}`,
    CIRCUIT_TTL,
    JSON.stringify(record)
  );
}

/**
 * Get or create a circuit breaker
 */
async function getBreaker(name: string): Promise<CircuitBreakerRecord> {
  let breaker = await getCircuitState(name);

  if (!breaker) {
    breaker = {
      name,
      state: 'CLOSED',
      failures: 0,
      lastFailure: null,
      threshold: DEFAULT_THRESHOLD,
      timeout: DEFAULT_TIMEOUT,
      halfOpenAttempts: 0,
    };
    await saveCircuitState(name, breaker);
  }

  return breaker;
}

/**
 * Record a successful request
 */
async function recordSuccess(name: string): Promise<CircuitBreakerRecord> {
  const cb = await getBreaker(name);
  cb.failures = 0;
  cb.state = 'CLOSED';
  cb.halfOpenAttempts = 0;
  await saveCircuitState(name, cb);
  return cb;
}

/**
 * Record a failed request
 */
async function recordFailure(name: string): Promise<CircuitBreakerRecord> {
  const cb = await getBreaker(name);
  cb.failures++;
  cb.lastFailure = new Date().toISOString();

  if (cb.state === 'HALF_OPEN') {
    // Failure during half-open goes back to OPEN
    cb.state = 'OPEN';
  } else if (cb.failures >= cb.threshold) {
    cb.state = 'OPEN';
  }

  await saveCircuitState(name, cb);
  return cb;
}

/**
 * Check if request can be executed
 */
async function canExecute(name: string): Promise<{ allowed: boolean; state: CircuitState }> {
  const cb = await getBreaker(name);

  if (cb.state === 'CLOSED') {
    return { allowed: true, state: 'CLOSED' };
  }

  if (cb.state === 'OPEN') {
    const lastFailureTime = cb.lastFailure ? new Date(cb.lastFailure).getTime() : 0;
    const elapsed = Date.now() - lastFailureTime;

    if (elapsed >= cb.timeout) {
      // Transition to HALF_OPEN
      cb.state = 'HALF_OPEN';
      cb.halfOpenAttempts = 0;
      await saveCircuitState(name, cb);
      return { allowed: true, state: 'HALF_OPEN' };
    }
    return { allowed: false, state: 'OPEN' };
  }

  if (cb.state === 'HALF_OPEN') {
    // Allow limited requests in half-open state
    if (cb.halfOpenAttempts < HALF_OPEN_MAX_ATTEMPTS) {
      cb.halfOpenAttempts++;
      await saveCircuitState(name, cb);
      return { allowed: true, state: 'HALF_OPEN' };
    }
    return { allowed: false, state: 'HALF_OPEN' };
  }

  return { allowed: true, state: 'CLOSED' };
}

/**
 * Reset a circuit breaker
 */
async function resetCircuit(name: string): Promise<CircuitBreakerRecord> {
  const cb = await getBreaker(name);
  cb.state = 'CLOSED';
  cb.failures = 0;
  cb.lastFailure = null;
  cb.halfOpenAttempts = 0;
  await saveCircuitState(name, cb);
  return cb;
}

// ─── API Endpoints ─────────────────────────────────────────────────────────────

// Check if circuit allows execution
app.get('/can-execute/:name', async (req, res) => {
  try {
    const { allowed, state } = await canExecute(req.params.name);
    res.json({
      allowed,
      state,
      name: req.params.name
    });
  } catch (error) {
    console.error('[CircuitBreaker] Error:', error);
    res.status(503).json({ error: 'Service unavailable' });
  }
});

// Record success
app.post('/success/:name', async (req, res) => {
  try {
    const circuit = await recordSuccess(req.params.name);
    res.json({ success: true, circuit });
  } catch (error) {
    console.error('[CircuitBreaker] Error:', error);
    res.status(503).json({ error: 'Service unavailable' });
  }
});

// Record failure
app.post('/failure/:name', async (req, res) => {
  try {
    const circuit = await recordFailure(req.params.name);
    const { allowed } = await canExecute(req.params.name);
    res.json({
      failure: true,
      circuit,
      canExecute: allowed
    });
  } catch (error) {
    console.error('[CircuitBreaker] Error:', error);
    res.status(503).json({ error: 'Service unavailable' });
  }
});

// Get circuit state
app.get('/state/:name', async (req, res) => {
  try {
    const circuit = await getBreaker(req.params.name);
    res.json({ circuit });
  } catch (error) {
    console.error('[CircuitBreaker] Error:', error);
    res.status(503).json({ error: 'Service unavailable' });
  }
});

// Reset circuit
app.post('/reset/:name', async (req, res) => {
  try {
    const circuit = await resetCircuit(req.params.name);
    res.json({ success: true, circuit });
  } catch (error) {
    console.error('[CircuitBreaker] Error:', error);
    res.status(503).json({ error: 'Service unavailable' });
  }
});

// List all circuits
app.get('/circuits', async (req, res) => {
  try {
    const keys = await redis.keys(`${CIRCUIT_KEY_PREFIX}*`);
    const circuits: CircuitBreakerRecord[] = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        circuits.push(JSON.parse(data));
      }
    }

    res.json({ circuits, count: circuits.length });
  } catch (error) {
    console.error('[CircuitBreaker] Error:', error);
    res.status(503).json({ error: 'Service unavailable' });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const ping = await redis.ping();
    res.json({
      status: ping === 'PONG' ? 'ok' : 'degraded',
      redis: ping === 'PONG' ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(503).json({ status: 'degraded', redis: 'disconnected' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`[CircuitBreaker] Service running on port ${PORT}`);
  logger.info(`[CircuitBreaker] Redis: ${REDIS_URL}`);
});
