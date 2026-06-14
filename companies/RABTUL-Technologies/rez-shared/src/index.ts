/**
 * @rez/shared - Shared utilities for REZ ecosystem
 *
 * Contains:
 * - Common types
 * - Validation schemas
 * - Utility functions
 * - Error classes
 * - Logging utilities
 */

export * from './types.js';
export * from './errors.js';
export * from './validation.js';
export * from './utils.js';
export * from './logger.js';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-shared',
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
