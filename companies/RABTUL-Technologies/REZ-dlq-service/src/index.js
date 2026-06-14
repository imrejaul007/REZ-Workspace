/**
 * @deprecated
 * ============================================================================
 * LEGACY SERVICE - DEPRECATED
 * ============================================================================
 * This service is DEPRECATED and will be removed on 2026-06-01.
 *
 * REPLACEMENT: Use the TypeScript implementation at:
 *   - REZ-dlq-service/src/services/dlq.service.ts
 *   - REZ-dlq-service/src/services/replay.service.ts
 *
 * ISSUES WITH THIS SERVICE:
 *   - In-memory storage (ALL EVENTS LOST on restart!)
 *   - No replay functionality (executeReplay is no-op)
 *   - No RabbitMQ/SQS integration
 *   - No MongoDB persistence
 *   - No event filtering/querying
 *   - No batch operations
 *
 * MIGRATION STEPS:
 *   1. Configure MongoDB connection for DLQEntry model
 *   2. Use dlqService.storeFailedEvent() for failed events
 *   3. Use replayService.replayEvent() for actual replays
 *   4. Migrate existing events to MongoDB
 *   5. Remove this file after migration
 * ============================================================================
 */

const express = require('express');
const app = express();
app.use(express.json());

const dlq = new Map();

app.post('/add', (req, res) => {
  const { event, error } = req.body;
  const id = 'dlq_' + Date.now();
  dlq.set(id, { id, event, error, retries: 0, status: 'failed', createdAt: new Date() });
  res.json({ queued: true, id, dlqSize: dlq.size });
});

app.get('/items', (req, res) => {
  res.json({ items: Array.from(dlq.values()).slice(-100), total: dlq.size });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', total: dlq.size });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('DLQ running on', PORT));
