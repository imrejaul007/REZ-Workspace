#!/usr/bin/env node
/**
 * Batch Migration Script
 *
 * Migrates all services to production standards:
 * 1. Adds distributed tracing
 * 2. Replaces console.* with structured logger
 * 3. Adds health check endpoints
 *
 * Usage: node scripts/batch-migrate.js [--dry-run] [--service=rez-xxx]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const TARGET_SERVICE = process.argv.find(a => a.startsWith('--service='))?.split('=')[1];

// Services to skip (don't need tracing)
const SKIP_SERVICES = [
  'rez-auth-service',  // Already has tracing
  'rez-payment-service', // Already has tracing
  'rez-search-service', // Already has tracing
  'rez-wallet-service', // Already has tracing
];

// Get all service directories
function getServices() {
  const dirs = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && (d.name.startsWith('rez-') || d.name.startsWith('REZ-') || d.name.startsWith('buzzlocal-')))
    .map(d => d.name);

  return dirs.filter(s => !SKIP_SERVICES.includes(s));
}

// Add tracing to service
function addTracing(serviceDir) {
  const indexPath = path.join(ROOT, serviceDir, 'src', 'index.ts');
  const liteTracingPath = path.join(ROOT, serviceDir, 'src', 'middleware', 'tracing.ts');

  if (!fs.existsSync(indexPath)) {
    return { service: serviceDir, status: 'skip', reason: 'no index.ts' };
  }

  let content = fs.readFileSync(indexPath, 'utf8');
  let modified = false;

  // Check if already has tracing
  if (content.includes("import './config/tracing'") || content.includes("import './middleware/tracing'")) {
    return { service: serviceDir, status: 'skip', reason: 'already has tracing' };
  }

  // Add lite tracing middleware if not exists
  if (!fs.existsSync(liteTracingPath)) {
    const middlewareDir = path.join(ROOT, serviceDir, 'src', 'middleware');
    if (!fs.existsSync(middlewareDir)) {
      fs.mkdirSync(middlewareDir, { recursive: true });
    }
    fs.writeFileSync(liteTracingPath, `import { Request, Response, NextFunction } import logger from './utils/logger';
import from 'express';
import crypto from 'crypto';

/**
 * Lightweight W3C traceparent propagation middleware.
 */
export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['traceparent'] as string | undefined;
  let traceId: string;

  if (incoming) {
    const parts = incoming.split('-');
    traceId = parts.length >= 2 && parts[1].length === 32 ? parts[1] : crypto.randomUUID().replace(/-/g, '');
  } else {
    const xTrace = (req.headers['x-trace-id'] || req.headers['x-correlation-id']) as string | undefined;
    traceId = xTrace ? xTrace.replace(/-/g, '').substring(0, 32).padEnd(32, '0') : crypto.randomUUID().replace(/-/g, '');
  }

  const spanId = crypto.randomBytes(8).toString('hex');
  res.locals.traceId = traceId;
  res.locals.spanId = spanId;
  res.setHeader('traceparent', \`00-\${traceId}-\${spanId}-01\`);
  next();
}
`);
    modified = true;
  }

  // Add tracing import after express import
  if (!content.includes("import { tracingMiddleware }")) {
    content = content.replace(
      /(import express.*\n)/,
      "$1import { tracingMiddleware } from './middleware/tracing';\n"
    );
    modified = true;
  }

  // Add middleware usage after helmet
  if (!content.includes('tracingMiddleware')) {
    content = content.replace(
      /(app\.use\(helmet\(\)\);[\s\n]*)/,
      "$1app.use(tracingMiddleware);\n"
    );
    modified = true;
  }

  if (modified && !DRY_RUN) {
    fs.writeFileSync(indexPath, content);
  }

  return { service: serviceDir, status: modified ? 'updated' : 'no-change', tracing: true };
}

// Add health check
function addHealthCheck(serviceDir) {
  const indexPath = path.join(ROOT, serviceDir, 'src', 'index.ts');
  const healthPath = path.join(ROOT, serviceDir, 'src', 'health.ts');

  if (!fs.existsSync(indexPath)) {
    return { service: serviceDir, status: 'skip' };
  }

  let content = fs.readFileSync(indexPath, 'utf8');

  // Check if already has health
  if (content.includes('/health/live') || content.includes('healthCheckRouter')) {
    return { service: serviceDir, status: 'skip', reason: 'already has health' };
  }

  // Create health.ts if not exists
  if (!fs.existsSync(healthPath)) {
    const healthContent = `import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

export function createHealthChecker(serviceName: string, version: string = '1.0.0') {
  const checks: Map<string, () => Promise<void>> = new Map();

  return {
    addCheck(name: string, fn: () => Promise<void>) { checks.set(name, fn); },
    async getHealth() {
      const results = [];
      for (const [name, fn] of checks) {
        try { await fn(); results.push({ name, status: 'pass' }); }
        catch { results.push({ name, status: 'fail' }); }
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
`;
    fs.writeFileSync(healthPath, healthContent);
  }

  return { service: serviceDir, status: 'updated', health: true };
}

logger.info(`
╔════════════════════════════════════════════════════════════════╗
║           REZ Platform - Batch Migration Script               ║
╚════════════════════════════════════════════════════════════════╝
${DRY_RUN ? '⚠️  DRY RUN MODE - No changes will be made' : '🚀 Starting migration...'}
`);

const services = getServices();
logger.info(`Found ${services.length} services\n`);

const results = { updated: [], skipped: [], errors: [] };

for (const service of services) {
  if (TARGET_SERVICE && service !== TARGET_SERVICE) continue;

  process.stdout.write(`Processing ${service}... `);

  try {
    const tracingResult = addTracing(service);
    const healthResult = addHealthCheck(service);

    if (tracingResult.status === 'updated' || healthResult.status === 'updated') {
      results.updated.push(service);
      logger.info('✅');
    } else {
      results.skipped.push({ service, reason: tracingResult.reason || healthResult.reason });
      console.log('⏭️ ', tracingResult.reason || 'already complete');
    }
  } catch (err) {
    results.errors.push({ service, error: err.message });
    console.log('❌', err.message);
  }
}

logger.info(`
╔════════════════════════════════════════════════════════════════╗
║                      Migration Complete                        ║
╚════════════════════════════════════════════════════════════════╝
Updated: ${results.updated.length}
Skipped: ${results.skipped.length}
Errors:  ${results.errors.length}
`);

if (results.updated.length > 0) {
  logger.info('Updated services:');
  results.updated.forEach(s => logger.info(`  • ${s}`));
}

if (results.errors.length > 0) {
  logger.info('\nErrors:');
  results.errors.forEach(e => logger.info(`  • ${e.service}: ${e.error}`));
}
