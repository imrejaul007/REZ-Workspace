/**
 * @deprecated
 * ============================================================================
 * LEGACY SERVICE - DEPRECATED
 * ============================================================================
 * This service is DEPRECATED and will be removed on 2026-06-01.
 *
 * REPLACEMENT: Use the TypeScript implementation at:
 *   - REZ-retry-service/src/index.ts
 *
 * ISSUES WITH THIS SERVICE:
 *   - No exponential backoff (fixed delay only)
 *   - In-memory storage (data lost on restart)
 *   - No circuit breaker integration
 *   - No idempotency key handling
 *   - No persistence to Redis/database
 *
 * MIGRATION STEPS:
 *   1. Update references to use port 3001 (TypeScript service)
 *   2. Configure Redis connection for BullMQ queue
 *   3. Migrate existing jobs to persistent storage
 *   4. Remove this file after migration
 * ============================================================================
 */

const express = require('express');
const app = express();
app.use(express.json());

const jobs = new Map();

app.post('/add', (req, res) => {
  const { id, payload, maxRetries = 3 } = req.body;
  jobs.set(id, { id, payload, retries: 0, maxRetries, backoff: 1000, status: 'pending', createdAt: new Date() });
  res.json({ queued: true, id });
});

app.get('/status/:id', (req, res) => {
  res.json(jobs.get(req.params.id) || { notFound: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', jobs: jobs.size });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log('Retry running on', PORT));
