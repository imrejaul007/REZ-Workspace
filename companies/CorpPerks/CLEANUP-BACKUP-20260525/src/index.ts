import { logger } from '../../shared/logger';
// CLEANUP-BACKUP-20260525 - Service entry point
const PORT = process.env.PORT || 4000;
logger.info('CLEANUP-BACKUP-20260525 service starting on port', PORT);
export {};


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cleanup-backup-20260525',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
