import express, { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import helmet from 'helmet';
import cors from 'cors';
import * as crypto from 'crypto';
import { KeyManager } from './keys/key-management';
import { SecretStorage, InMemoryStorageAdapter, RedisStorageAdapter } from './secrets/secret-storage';
import { AutoRotation } from './rotation/auto-rotation';
import { SecretAudit, InMemoryAuditStorage, AuditAction } from './audit/secret-audit';
import { z } from 'zod';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const MASTER_PASSWORD = process.env.MASTER_PASSWORD || crypto.randomBytes(32).toString('hex');
const PORT = parseInt(process.env.PORT || '3000', 10);
const ENVIRONMENT = process.env.NODE_ENV || 'development';

const inMemoryStorage = new InMemoryStorageAdapter();

const keyManager = new KeyManager(MASTER_PASSWORD, {
  maxAgeDays: 90,
  maxUsageCount: 1000000,
  autoRotate: true,
});

const secretStorage = new SecretStorage({
  keyManager,
  storageBackend: inMemoryStorage,
  maxVersions: 10,
  enableCompression: true,
});

const auditStorage = new InMemoryAuditStorage();

const secretAudit = new SecretAudit({
  storageBackend: auditStorage,
  retentionDays: 365,
  enableRealTimeAlerts: true,
  alertThresholds: {
    failedAttemptsWindow: 300000,
    failedAttemptsThreshold: 5,
    unusualAccessVolumeThreshold: 100,
    afterHoursAccessThreshold: 20,
  },
  enableIntegrityCheck: true,
  compressOldLogs: true,
});

const autoRotation = new AutoRotation(
  {
    enabled: true,
    maxKeyAgeDays: 90,
    maxKeyUsage: 1000000,
    notifyOnRotation: true,
  },
  keyManager,
  secretStorage
);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const principal = req.headers['x-principal'] as string || 'anonymous';
  const userAgent = req.headers['user-agent'];
  const ip = req.ip || req.socket.remoteAddress;

  (req as unknown).auditContext = { principal, userAgent, ip };
  next();
});

const secretSchema = z.object({
  name: z.string().min(1).max(255).regex(/^[a-zA-Z0-9_-]+$/),
  value: z.string(),
  tags: z.record(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
  allowedPrincipals: z.array(z.string()).optional(),
  denyPrincipals: z.array(z.string()).optional(),
});

const keySchema = z.object({
  type: z.enum(['symmetric', 'asymmetric']),
  purpose: z.enum(['encryption', 'signing']).optional(),
});

app.post('/secrets', async (req: Request, res: Response) => {
  try {
    const data = secretSchema.parse(req.body);
    const { principal, ip, userAgent } = (req as unknown).auditContext;

    const secret = await secretStorage.createSecret(data.name, data.value, {
      tags: data.tags,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      accessControl: {
        allowedPrincipals: data.allowedPrincipals || [],
        denyPrincipals: data.denyPrincipals || [],
        requiredPermissions: ['read'],
      },
      createdBy: principal,
    });

    await secretAudit.log({
      action: 'secret.created',
      principal,
      resource: 'secret',
      resourceId: secret.id,
      success: true,
      ipAddress: ip,
      userAgent,
      metadata: { name: data.name },
    });

    res.status(201).json({
      id: secret.id,
      name: secret.name,
      metadata: secret.metadata,
    });
  } catch (error) {
    const { principal, ip, userAgent } = (req as unknown).auditContext;
    await secretAudit.log({
      action: 'secret.created',
      principal,
      resource: 'secret',
      resourceId: 'unknown',
      success: false,
      ipAddress: ip,
      userAgent,
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    });

    res.status(400).json({ error: error instanceof Error ? error.message : 'Bad request' });
  }
});

app.get('/secrets/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { principal, ip, userAgent } = (req as unknown).auditContext;
    const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

    const value = await secretStorage.getSecret(
      name,
      { principal, permissions: ['read'], ip },
      version
    );

    if (value === null) {
      await secretAudit.log({
        action: 'secret.access_attempted',
        principal,
        resource: 'secret',
        resourceId: name,
        success: false,
        ipAddress: ip,
        userAgent,
        metadata: { reason: 'not_found' },
      });
      return res.status(404).json({ error: 'Secret not found' });
    }

    await secretAudit.log({
      action: 'secret.read',
      principal,
      resource: 'secret',
      resourceId: name,
      success: true,
      ipAddress: ip,
      userAgent,
      metadata: { version },
    });

    res.json({ name, value, version });
  } catch (error) {
    const { principal, ip, userAgent } = (req as unknown).auditContext;

    await secretAudit.log({
      action: 'access.denied',
      principal,
      resource: 'secret',
      resourceId: req.params.name,
      success: false,
      ipAddress: ip,
      userAgent,
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    });

    res.status(403).json({ error: error instanceof Error ? error.message : 'Access denied' });
  }
});

app.put('/secrets/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { value } = secretSchema.omit({ name: true, tags: true, expiresAt: true, allowedPrincipals: true, denyPrincipals: true }).parse(req.body);
    const { principal, ip, userAgent } = (req as unknown).auditContext;

    const metadata = await secretStorage.updateSecret(name, value, {
      principal,
      permissions: ['write'],
      ip,
    });

    await secretAudit.log({
      action: 'secret.updated',
      principal,
      resource: 'secret',
      resourceId: name,
      success: true,
      ipAddress: ip,
      userAgent,
      metadata: { version: metadata.version },
    });

    res.json({ name, metadata });
  } catch (error) {
    const { principal, ip, userAgent } = (req as unknown).auditContext;
    await secretAudit.log({
      action: 'secret.updated',
      principal,
      resource: 'secret',
      resourceId: req.params.name,
      success: false,
      ipAddress: ip,
      userAgent,
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    });

    res.status(400).json({ error: error instanceof Error ? error.message : 'Bad request' });
  }
});

app.delete('/secrets/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { principal, ip, userAgent } = (req as unknown).auditContext;

    const result = await secretStorage.deleteSecret(name, {
      principal,
      permissions: ['delete'],
    });

    await secretAudit.log({
      action: result ? 'secret.deleted' : 'secret.access_attempted',
      principal,
      resource: 'secret',
      resourceId: name,
      success: result,
      ipAddress: ip,
      userAgent,
    });

    res.status(result ? 204 : 404).send();
  } catch (error) {
    const { principal, ip, userAgent } = (req as unknown).auditContext;
    await secretAudit.log({
      action: 'access.denied',
      principal,
      resource: 'secret',
      resourceId: req.params.name,
      success: false,
      ipAddress: ip,
      userAgent,
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    });

    res.status(403).json({ error: error instanceof Error ? error.message : 'Access denied' });
  }
});

app.get('/secrets', async (req: Request, res: Response) => {
  try {
    const { prefix, tags } = req.query;
    const filter: unknown = {};

    if (prefix) filter.prefix = prefix as string;
    if (tags) filter.tags = JSON.parse(tags as string);

    const secrets = await secretStorage.listSecrets(filter);
    res.json({ secrets });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Bad request' });
  }
});

app.get('/secrets/:name/versions', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const versions = await secretStorage.getVersions(name);
    res.json({ versions });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Bad request' });
  }
});

app.post('/keys', async (req: Request, res: Response) => {
  try {
    const data = keySchema.parse(req.body);
    const key = await keyManager.generateKey(data);
    const { principal, ip, userAgent } = (req as unknown).auditContext;

    await secretAudit.log({
      action: 'key.generated',
      principal,
      resource: 'key',
      resourceId: key.id,
      success: true,
      ipAddress: ip,
      userAgent,
      metadata: { algorithm: key.algorithm, version: key.version },
    });

    res.status(201).json({
      id: key.id,
      version: key.version,
      algorithm: key.algorithm,
      createdAt: key.createdAt,
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Bad request' });
  }
});

app.get('/keys', async (req: Request, res: Response) => {
  try {
    const { status, algorithm } = req.query;
    const keys = keyManager.listKeys({
      status: status as unknown,
      algorithm: algorithm as string,
    });
    res.json({ keys });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Bad request' });
  }
});

app.post('/keys/:id/rotate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await autoRotation.rotateKey(id);
    const { principal, ip, userAgent } = (req as unknown).auditContext;

    await secretAudit.log({
      action: 'key.rotated',
      principal,
      resource: 'key',
      resourceId: id,
      success: event.status === 'completed',
      ipAddress: ip,
      userAgent,
      metadata: {
        previousVersion: event.previousKeyVersion,
        newVersion: event.newKeyVersion,
        status: event.status,
      },
    });

    res.json({ event });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Bad request' });
  }
});

app.get('/rotation/status', async (req: Request, res: Response) => {
  try {
    const status = autoRotation.getRotationStatus();
    const policies = autoRotation.getPolicies();
    res.json({ status, policies });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Bad request' });
  }
});

app.get('/audit/summary', async (req: Request, res: Response) => {
  try {
    const { since } = req.query;
    const summary = await secretAudit.getSummary(
      since ? new Date(since as string) : undefined
    );
    res.json(summary);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Bad request' });
  }
});

app.get('/audit/events', async (req: Request, res: Response) => {
  try {
    const filter: unknown = {};
    if (req.query.actions) filter.actions = (req.query.actions as string).split(',');
    if (req.query.principal) filter.principal = req.query.principal as string;
    if (req.query.resource) filter.resource = req.query.resource as string;
    if (req.query.since) filter.since = new Date(req.query.since as string);
    if (req.query.until) filter.until = new Date(req.query.until as string);
    if (req.query.limit) filter.limit = parseInt(req.query.limit as string, 10);
    if (req.query.offset) filter.offset = parseInt(req.query.offset as string, 10);

    const events = await secretAudit.query(filter);
    res.json({ events });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Bad request' });
  }
});

app.get('/audit/alerts', async (req: Request, res: Response) => {
  try {
    const { severity, type, since } = req.query;
    const alerts = secretAudit.getAlerts({
      severity: severity as unknown,
      type: type as unknown,
      since: since ? new Date(since as string) : undefined,
    });
    res.json({ alerts });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Bad request' });
  }
});

app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT,
    components: {
      keyManager: 'healthy',
      secretStorage: 'healthy',
      autoRotation: 'healthy',
      audit: 'healthy',
    },
  };

  try {
    const secretsHealth = await secretStorage.checkSecretHealth();
    health.components.secretStorage = secretsHealth.expiredSecrets > 0 ? 'degraded' : 'healthy';
  } catch (error) {
    health.components.secretStorage = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get('/metrics', async (req: Request, res: Response) => {
  try {
    const rotationStatus = autoRotation.getRotationStatus();
    const auditSummary = await secretAudit.getSummary();
    const secretsHealth = await secretStorage.checkSecretHealth();
    const keys = keyManager.listKeys({ status: 'active' });

    const metrics = {
      secrets: {
        total: secretsHealth.totalSecrets,
        healthy: secretsHealth.healthySecrets,
        expired: secretsHealth.expiredSecrets,
      },
      keys: {
        total: keys.length,
        active: keys.filter(k => k.status === 'active').length,
        rotated: keys.filter(k => k.status === 'rotated').length,
      },
      rotation: rotationStatus,
      audit: {
        totalEvents: auditSummary.totalEvents,
        successRate: auditSummary.totalEvents > 0
          ? (auditSummary.successCount / auditSummary.totalEvents * 100).toFixed(2) + '%'
          : '100%',
      },
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: ENVIRONMENT === 'development' ? err.message : undefined,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

async function startServer(): Promise<void> {
  logger.info('Starting REZ Secrets Manager...');
  logger.info(`Environment: ${ENVIRONMENT}`);
  logger.info(`Master key hash: ${crypto.createHash('sha256').update(MASTER_PASSWORD).digest('hex').substring(0, 16)}...`);

  await secretAudit.log({
    action: 'system.started',
    principal: 'system',
    resource: 'system',
    resourceId: 'instance',
    success: true,
    metadata: { environment: ENVIRONMENT, port: PORT },
  });

  await autoRotation.startScheduler();

  app.listen(PORT, () => {
    logger.info(`REZ Secrets Manager listening on port ${PORT}`);
    logger.info('Endpoints:');
    logger.info('  POST   /secrets              - Create secret');
    logger.info('  GET    /secrets/:name        - Get secret');
    logger.info('  PUT    /secrets/:name        - Update secret');
    logger.info('  DELETE /secrets/:name        - Delete secret');
    logger.info('  GET    /secrets              - List secrets');
    logger.info('  GET    /secrets/:name/versions - Get secret versions');
    logger.info('  POST   /keys                 - Generate key');
    logger.info('  GET    /keys                 - List keys');
    logger.info('  POST   /keys/:id/rotate      - Rotate key');
    logger.info('  GET    /rotation/status      - Get rotation status');
    logger.info('  GET    /audit/summary        - Get audit summary');
    logger.info('  GET    /audit/events         - Query audit events');
    logger.info('  GET    /audit/alerts         - Get security alerts');
    logger.info('  GET    /health               - Health check');
    logger.info('  GET    /metrics              - Get metrics');
  });
}

startServer().catch(logger.error);

export { app, keyManager, secretStorage, autoRotation, secretAudit };
