/**
 * @deprecated
 * ============================================================================
 * LEGACY SERVICE - DEPRECATED
 * ============================================================================
 * This service is DEPRECATED and will be removed on 2026-06-01.
 *
 * REPLACEMENT: Use @nestjs/throttler with circuit breaker pattern or
 *   opossum library with Redis-backed state.
 *
 * ISSUES WITH THIS SERVICE:
 *   - NO RECOVERY LOGIC: Circuit never recovers once OPEN
 *   - In-memory state (data lost on restart, no cluster awareness)
 *   - No half-open state for testing recovery
 *   - No persistence to Redis/database
 *   - No metrics export
 *
 * MIGRATION STEPS:
 *   1. Replace with 'opossum' library or custom implementation
 *   2. Use Redis for state persistence
 *   3. Implement half-open state (allow test requests)
 *   4. Add proper recovery timeout configuration
 *   5. Remove this file after migration
 * ============================================================================
 */

const express = require('express');
const app = express();
app.use(express.json());

const circuits = new Map();

function getBreaker(name) {
  if (!circuits.has(name)) {
    circuits.set(name, { name, state: 'CLOSED', failures: 0, lastFailure: null, threshold: 5, timeout: 60000 });
  }
  return circuits.get(name);
}

app.post('/failure/:name', (req, res) => {
  const cb = getBreaker(req.params.name);
  cb.failures++;
  cb.lastFailure = new Date();
  if (cb.failures >= cb.threshold) cb.state = 'OPEN';
  res.json({ failure: true, circuit: cb });
});

app.get('/state/:name', (req, res) => {
  res.json(getBreaker(req.params.name));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', circuits: Array.from(circuits.values()) });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log('Circuit Breaker running on', PORT));
