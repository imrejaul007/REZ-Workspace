// ReZ Schedule - Organization Routes
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createOrganizationSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  logo: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const updateOrganizationSchema = createOrganizationSchema.partial();

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'GUEST']),
});

/**
 * Get organization
 * GET /api/organizations/:slug
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const org = await prisma.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        settings: true,
        createdAt: true,
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    res.json({
      success: true,
      data: org,
    });
  } catch (error) {
    logger.error('[Organization] Get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get organization',
    });
  }
});

/**
 * Create organization
 * POST /api/organizations
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

    const data = createOrganizationSchema.parse(req.body);

    // Check if slug is taken
    const existing = await prisma.organization.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Organization slug already taken',
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Create organization
    const org = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        logo: data.logo,
        primaryColor: data.primaryColor || '#000000',
        members: {
          connect: { id: user.id },
        },
      },
    });

    // Update user role to OWNER
    await prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: org.id,
        role: 'OWNER',
      },
    });

    logger.info(`[Organization] Created ${org.slug} by ${user.username}`);

    res.status(201).json({
      success: true,
      data: org,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('[Organization] Create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create organization',
    });
  }
});

/**
 * Update organization
 * PATCH /api/organizations/:slug
 */
router.patch('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const data = updateOrganizationSchema.parse(req.body);

    const org = await prisma.organization.update({
      where: { slug },
      data,
    });

    logger.info(`[Organization] Updated ${slug}`);

    res.json({
      success: true,
      data: org,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('[Organization] Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update organization',
    });
  }
});

/**
 * Invite member to organization
 * POST /api/organizations/:slug/invite
 */
router.post('/:slug/invite', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const data = inviteMemberSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found. They must first create a ReZ Schedule account.',
      });
    }

    // Get organization
    const org = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    // Check if already a member
    const existingMember = org.members?.find((m: { id: string }) => m.id === user.id);
    if (existingMember) {
      return res.status(409).json({
        success: false,
        error: 'User is already a member',
      });
    }

    // Add member
    await prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: org.id,
        role: data.role,
      },
    });

    logger.info(`[Organization] Invited ${data.email} to ${slug} as ${data.role}`);

    res.json({
      success: true,
      message: `Invited ${data.email} as ${data.role}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('[Organization] Invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invite member',
    });
  }
});

/**
 * Remove member from organization
 * DELETE /api/organizations/:slug/members/:memberId
 */
router.delete('/:slug/members/:memberId', async (req: Request, res: Response) => {
  try {
    const { slug, memberId } = req.params;

    await prisma.user.update({
      where: { id: memberId },
      data: {
        organizationId: null,
        role: 'MEMBER',
      },
    });

    logger.info(`[Organization] Removed member ${memberId} from ${slug}`);

    res.json({
      success: true,
      message: 'Member removed',
    });
  } catch (error) {
    logger.error('[Organization] Remove member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove member',
    });
  }
});

/**
 * Update member role
 * PATCH /api/organizations/:slug/members/:memberId
 */
router.patch('/:slug/members/:memberId', async (req: Request, res: Response) => {
  try {
    const { slug, memberId } = req.params;
    const { role } = req.body;

    await prisma.user.update({
      where: { id: memberId },
      data: { role },
    });

    logger.info(`[Organization] Updated member ${memberId} role to ${role}`);

    res.json({
      success: true,
      message: 'Member role updated',
    });
  } catch (error) {
    logger.error('[Organization] Update role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update member role',
    });
  }
});

/**
 * Get organization event types
 * GET /api/organizations/:slug/event-types
 */
router.get('/:slug/event-types', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const org = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    const eventTypes = await prisma.eventType.findMany({
      where: { organizationId: org.id },
      include: {
        user: {
          select: {
            username: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: eventTypes,
    });
  } catch (error) {
    logger.error('[Organization] Event types error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event types',
    });
  }
});

export default router;
