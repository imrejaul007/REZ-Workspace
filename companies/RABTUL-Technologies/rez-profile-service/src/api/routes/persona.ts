/**
 * Persona Routes
 * API endpoints for multi-persona operations
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { personaService } from '../../services/personaService';
import { requireAuth } from '../../middleware/auth';

// ─── Structured Logger ─────────────────────────────────────────────────────────
const SERVICE_NAME = 'rez-profile-service';

function logError(route: string, message: string, error: unknown, userId?: string): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    service: SERVICE_NAME,
    level: 'ERROR',
    route,
    message,
    userId: userId || 'unknown',
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  };
  console.log(JSON.stringify(logEntry));
}

const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const activatePersonaSchema = z.object({
  persona: z.enum(['student', 'employee', 'creator', 'business', 'freelancer', 'premium', 'normal']),
  verificationData: z
    .object({
      eduEmail: z.string().email().optional(),
      collegeId: z.string().optional(),
      college: z.string().optional(),
      companyEmail: z.string().email().optional(),
      companyName: z.string().optional(),
      companyId: z.string().optional(),
      gstNumber: z.string().optional(),
      businessName: z.string().optional(),
    })
    .optional(),
});

const switchPersonaSchema = z.object({
  persona: z.enum(['student', 'employee', 'creator', 'business', 'freelancer', 'premium', 'normal']),
});

const updateExtensionSchema = z.object({
  persona: z.enum(['student', 'employee', 'creator', 'business', 'freelancer', 'premium']),
  data: z.record(z.unknown()),
});

const verifyPersonaSchema = z.object({
  persona: z.enum(['student', 'employee', 'creator', 'business', 'freelancer', 'premium']),
  verified: z.boolean(),
});

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /api/personas
 * Get all personas for current user
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown).user?.userId || req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const personas = await personaService.getPersonas(userId);

    if (!personas) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({
      success: true,
      data: personas,
    });
  } catch (error) {
    logError('GET /api/personas', 'Error getting personas', error, userId);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/personas/profile
 * Get full profile with persona extensions
 */
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown).user?.userId || req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const profile = await personaService.getProfileWithPersona(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logError('GET /api/personas/profile', 'Error getting profile', error, userId);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/personas/activate
 * Activate a persona
 */
router.post('/activate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validation = activatePersonaSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const result = await personaService.activatePersona(userId, validation.data);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      persona: result.persona,
      verificationRequired: result.verificationRequired,
      message: result.verificationRequired
        ? 'Persona activated. Verification pending for: ' + result.verificationRequired.join(', ')
        : 'Persona activated successfully',
    });
  } catch (error) {
    logError('POST /api/personas/activate', 'Error activating persona', error, userId);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/personas/deactivate
 * Deactivate a persona
 */
router.post('/deactivate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { persona } = req.body;

    if (!persona) {
      return res.status(400).json({ error: 'Persona type required' });
    }

    const result = await personaService.deactivatePersona(userId, persona);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Persona deactivated successfully',
    });
  } catch (error) {
    logError('POST /api/personas/deactivate', 'Error deactivating persona', error, userId);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/personas/switch
 * Switch active persona
 */
router.post('/switch', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validation = switchPersonaSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const result = await personaService.switchPersona(userId, validation.data.persona);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      activePersona: result.activePersona,
    });
  } catch (error) {
    logError('POST /api/personas/switch', 'Error switching persona', error, userId);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/personas/extension
 * Update persona extension data
 */
router.patch('/extension', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validation = updateExtensionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const result = await personaService.updatePersonaExtension(
      userId,
      validation.data.persona,
      validation.data.data
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Extension updated successfully',
    });
  } catch (error) {
    logError('PATCH /api/personas/extension', 'Error updating extension', error, userId);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/personas/verify
 * Verify a persona (admin only)
 */
router.post('/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;
    const { persona, verified } = req.body;

    if (!userId || !persona) {
      return res.status(400).json({ error: 'User ID and persona required' });
    }

    const result = await personaService.verifyPersona(userId, persona, verified);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: `Persona ${persona} ${verified ? 'verified' : 'unverified'}`,
    });
  } catch (error) {
    logError('POST /api/personas/verify', 'Error verifying persona', error, userId);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/personas/by-type/:persona
 * Get users by persona type (admin only)
 */
router.get('/by-type/:persona', requireAuth, async (req: Request, res: Response) => {
  try {
    const persona = req.params.persona as unknown;
    const { verifiedOnly, limit, skip } = req.query;

    const result = await personaService.getUsersByPersona(persona, {
      verifiedOnly: verifiedOnly === 'true',
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logError('GET /api/personas/by-type/:persona', 'Error getting users by persona', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
