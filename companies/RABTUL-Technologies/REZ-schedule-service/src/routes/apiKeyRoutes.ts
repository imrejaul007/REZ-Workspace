// @ts-ignore
// REZ Schedule - API Key Management Routes
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Validation schema
const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.enum([
    'event_types:read',
    'event_types:write',
    'bookings:read',
    'bookings:write',
    'users:read',
    'users:write',
    'webhooks:manage',
    'payments:manage',
  ])).default(['event_types:read', 'bookings:read', 'bookings:write']),
  expiresAt: z.string().datetime().optional(),
  domains: z.array(z.string()).optional(), // Allowed domains for CORS
});

// Hash API key for storage
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Create API Key
 * POST /api/api-keys
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required',
      });
    }

    const data = createApiKeySchema.parse(req.body);

    // Generate API key
    const apiKey = `rez_${randomBytes(24).toString('hex')}`;
    const keyHash = hashApiKey(apiKey);
    const keyPrefix = apiKey.substring(0, 12); // Store first 12 chars for display

    // Create API key in database
    const result = await prisma.$queryRaw`
      INSERT INTO "ApiKey" (
        id, "userId", name, "keyHash", "keyPrefix",
        permissions, "expiresAt", domains,
        "lastUsedAt", created, updated
      ) VALUES (
        gen_random_uuid()::uuid, ${userId}::uuid, ${data.name},
        ${keyHash}, ${keyPrefix}, ${JSON.stringify(data.permissions)},
        ${data.expiresAt ? new Date(data.expiresAt) : null},
        ${JSON.stringify(data.domains || [])},
        NULL, NOW(), NOW()
      )
      RETURNING id, name, "keyPrefix", permissions, "expiresAt", domains, "createdAt"
    `;

    logger.info(`[API Key] Created for user ${userId}: ${data.name}`);

    res.status(201).json({
      success: true,
      data: {
        id: (result as { id: string }[])[0]?.id,
        name: data.name,
        apiKey, // Only returned ONCE, never again
        prefix: keyPrefix,
        permissions: data.permissions,
        expiresAt: data.expiresAt,
        domains: data.domains,
        message: 'Save this API key - it will not be shown again',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('[API Key] Create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create API key',
    });
  }
});

/**
 * List API Keys
 * GET /api/api-keys
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required',
      });
    }

    // Get API keys (without the actual key)
    const result = await prisma.$queryRaw<{
      id: string;
      name: string;
      keyPrefix: string;
      permissions: string[];
      expiresAt: Date | null;
      domains: string[];
      lastUsedAt: Date | null;
      createdAt: Date;
    }[]>`
      SELECT id, name, "keyPrefix", permissions, "expiresAt", domains, "lastUsedAt", "createdAt"
      FROM "ApiKey"
      WHERE "userId" = ${userId}::uuid
      ORDER BY "createdAt" DESC
    `;

    res.json({
      success: true,
      data: result.map(k => ({
        id: k.id,
        name: k.name,
        prefix: k.keyPrefix,
        permissions: typeof k.permissions === 'string' ? JSON.parse(k.permissions) : k.permissions,
        expiresAt: k.expiresAt,
        domains: typeof k.domains === 'string' ? JSON.parse(k.domains) : k.domains,
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[API Key] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list API keys',
    });
  }
});

/**
 * Delete API Key
 * DELETE /api/api-keys/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required',
      });
    }

    await prisma.$executeRaw`
      DELETE FROM "ApiKey"
      WHERE id = ${id}::uuid AND "userId" = ${userId}::uuid
    `;

    logger.info(`[API Key] Deleted ${id}`);

    res.json({
      success: true,
      message: 'API key deleted',
    });
  } catch (error) {
    logger.error('[API Key] Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete API key',
    });
  }
});

/**
 * Validate API Key (internal middleware helper)
 */
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  userId?: string;
  permissions?: string[];
  error?: string;
}> {
  if (!apiKey) {
    return { valid: false, error: 'API key required' };
  }

  const keyHash = hashApiKey(apiKey);

  const result = await prisma.$queryRaw<{
    id: string;
    userId: string;
    permissions: string[];
    expiresAt: Date | null;
    domains: string[];
  }[]>`
    SELECT id, "userId", permissions, "expiresAt", domains
    FROM "ApiKey"
    WHERE "keyHash" = ${keyHash}
    LIMIT 1
  `;

  if (!result.length) {
    return { valid: false, error: 'Invalid API key' };
  }

  const key = result[0];

  // Check expiration
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
    return { valid: false, error: 'API key expired' };
  }

  // Update last used
  await prisma.$executeRaw`
    UPDATE "ApiKey"
    SET "lastUsedAt" = NOW()
    WHERE id = ${key.id}::uuid
  `;

  return {
    valid: true,
    userId: key.userId,
    permissions: typeof key.permissions === 'string' ? JSON.parse(key.permissions) : key.permissions,
  };
}

export default router;
