import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { MerchantUser } from '../models/MerchantUser';
import { AuditLog } from '../models/AuditLog';
import { merchantAuth } from '../middleware/auth';
import { redis } from '../config/redis';
import { createServiceLogger } from '../config/logger';
import { createRateLimiter } from '@rez/shared';

const logger = createServiceLogger('team');

const router = Router();

// HIGH FIX: Rate limit team invitations — 20 invites per hour per merchant.
// Prevents spam invitations and email enumeration attacks from compromised merchant accounts.
const teamInviteLimiter = createRateLimiter(
  redis.call.bind(redis),
  {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    keyPrefix: 'rl:team:invite',
    keyGenerator: (req: Request) => String(req.merchantId || req.ip),
    message: 'Too many invitations. Please try again later.',
  }
);

/**
 * Fine-grained role-to-permissions mapping.
 * Must stay in sync with the frontend's ROLE_PERMISSIONS in utils/permissions.ts.
 */
const ROLE_FINE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    'products:view', 'products:create', 'products:edit', 'products:delete', 'products:bulk_import', 'products:export',
    'orders:view', 'orders:view_all', 'orders:update_status', 'orders:cancel', 'orders:refund', 'orders:export',
    'team:view', 'team:invite', 'team:remove', 'team:change_role', 'team:change_status',
    'analytics:view', 'analytics:view_revenue', 'analytics:view_costs', 'analytics:export',
    'settings:view', 'settings:edit', 'settings:edit_basic',
    'billing:view', 'billing:manage', 'billing:view_invoices',
    'customers:view', 'customers:edit', 'customers:delete', 'customers:export',
    'promotions:view', 'promotions:create', 'promotions:edit', 'promotions:delete',
    'reviews:view', 'reviews:respond', 'reviews:delete',
    'notifications:view', 'notifications:send',
    'reports:view', 'reports:export', 'reports:view_detailed',
    'inventory:view', 'inventory:edit', 'inventory:bulk_update',
    'categories:view', 'categories:create', 'categories:edit', 'categories:delete',
    'profile:view', 'profile:edit',
    'logs:view', 'logs:export',
    'api:access', 'api:manage_keys',
  ],
  admin: [
    'products:view', 'products:create', 'products:edit', 'products:delete', 'products:bulk_import', 'products:export',
    'orders:view', 'orders:view_all', 'orders:update_status', 'orders:cancel', 'orders:refund', 'orders:export',
    'team:view', 'team:invite', 'team:remove', 'team:change_status',
    'analytics:view', 'analytics:view_revenue', 'analytics:export',
    'settings:view', 'settings:edit_basic',
    'customers:view', 'customers:edit', 'customers:delete', 'customers:export',
    'promotions:view', 'promotions:create', 'promotions:edit', 'promotions:delete',
    'reviews:view', 'reviews:respond', 'reviews:delete',
    'notifications:view', 'notifications:send',
    'reports:view', 'reports:export', 'reports:view_detailed',
    'inventory:view', 'inventory:edit', 'inventory:bulk_update',
    'categories:view', 'categories:create', 'categories:edit', 'categories:delete',
    'profile:view', 'profile:edit',
    'logs:view',
    'api:access',
  ],
  manager: [
    'products:view', 'products:create', 'products:edit', 'products:export',
    'orders:view', 'orders:view_all', 'orders:update_status', 'orders:cancel', 'orders:export',
    'analytics:view',
    'customers:view', 'customers:edit', 'customers:export',
    'promotions:view', 'promotions:create', 'promotions:edit',
    'reviews:view', 'reviews:respond',
    'notifications:view', 'notifications:send',
    'reports:view', 'reports:export',
    'inventory:view', 'inventory:edit',
    'categories:view', 'categories:create', 'categories:edit',
    'profile:view',
  ],
  staff: [
    'products:view',
    'orders:view', 'orders:update_status',
    'customers:view',
    'promotions:view',
    'reviews:view',
    'notifications:view',
    'reports:view',
    'inventory:view',
    'categories:view',
    'profile:view',
  ],
  cashier: [
    'pos:create_bill', 'pos:apply_discount', 'pos:void_bill',
    'orders:view', 'orders:update_status',
    'products:view',
    'customers:view',
    'profile:view',
  ],
  viewer: [
    'analytics:view',
    'products:view',
    'orders:view',
    'profile:view',
  ],
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: 'Full access to all features and settings',
  admin: 'Manage team, products, orders, and analytics',
  manager: 'Manage products, orders, and basic analytics',
  staff: 'View products and manage order status',
  cashier: 'POS operations and order management',
  viewer: 'Read-only access to analytics and data',
};

function getFinePermissions(role: string): string[] {
  return ROLE_FINE_PERMISSIONS[role] || [];
}

// Rate limiter for token validation (10 requests per 5 minutes per IP)
async function checkInvitationRateLimit(ip: string): Promise<boolean> {
  const { redis } = await import('../config/redis');
  try {
    const now = Date.now();
    const key = `rl:invitation:${ip}`;
    const pipe = redis.pipeline();
    pipe.zremrangebyscore(key, '-inf', now - 5 * 60 * 1000);
    pipe.zcard(key);
    pipe.zadd(key, now, `${now}-${crypto.randomUUID()}`);
    pipe.pexpire(key, 5 * 60 * 1000);
    const results = await pipe.exec();
    const count = (results?.[1]?.[1] as number) ?? 0;
    return count < 10;
  } catch {
    // H12 FIX: fail-closed for security — reject if Redis unavailable
    logger.warn('[checkInvitationRateLimit] Redis unavailable, rejecting request', { ip });
    return false;
  }
}

// Public route — validate invitation token (no auth)
router.get('/team-public/validate-invitation/:token', async (req: Request, res: Response) => {
  // Apply rate limiting
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const allowed = await checkInvitationRateLimit(ip);
  if (!allowed) {
    res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
    return;
  }

  try {
    const user = await MerchantUser.findOne({
      inviteToken: req.params.token,
      inviteExpiry: { $gt: new Date() },
    }).populate('merchantId', 'businessName').lean();
    if (!user) { res.status(404).json({ success: false, message: 'Invalid or expired invitation' }); return; }
    res.json({ success: true, data: { email: user.email, role: user.role, merchantName: (user.merchantId as unknown)?.businessName } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `Internal server error. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message });
  }
});

// Public route — accept invitation
router.post('/team-public/accept-invitation/:token', async (req: Request, res: Response) => {
  try {
    const { password, name } = req.body;
    if (!password) { res.status(400).json({ success: false, message: 'Password required' }); return; }
    const user = await MerchantUser.findOne({
      inviteToken: req.params.token,
      inviteExpiry: { $gt: new Date() },
    });
    if (!user) { res.status(404).json({ success: false, message: 'Invalid or expired invitation' }); return; }
    user.password = await bcrypt.hash(password, 12);
    if (name) user.name = name;
    user.status = 'active';
    user.inviteToken = undefined;
    user.inviteExpiry = undefined;
    await user.save();
    res.json({ success: true, message: 'Invitation accepted. You can now log in.' });
  } catch (err: unknown) {
    const message = process.env.NODE_ENV === 'production' ? 'Invitation acceptance failed' : err.message;
    res.status(500).json({ success: false, message });
  }
});

// Authenticated team routes
router.use('/team', merchantAuth);

// GET /team — list team members
router.get('/team', async (req: Request, res: Response) => {
  try {
    // BE-MER-014 FIX: Validate pagination bounds with Number.isFinite()
    const pageParsed = parseInt(req.query.page as string, 10);
    const limitParsed = parseInt(req.query.limit as string, 10);

    if (Number.isFinite(pageParsed) && pageParsed < 1) {
      res.status(400).json({ success: false, message: 'Page must be a positive integer' });
      return;
    }
    if (Number.isFinite(limitParsed) && limitParsed < 1) {
      res.status(400).json({ success: false, message: 'Limit must be a positive integer' });
      return;
    }

    const page = Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : 1;
    const limit = Number.isFinite(limitParsed) && limitParsed > 0 ? Math.min(50, limitParsed) : 20;

    const [members, total] = await Promise.all([
      MerchantUser.find({ merchantId: req.merchantId })
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .select('-password').lean(),
      MerchantUser.countDocuments({ merchantId: req.merchantId }),
    ]);
    res.json({ success: true, data: members, pagination: { total, page, limit } });
  } catch (err: unknown) {
    const message = process.env.NODE_ENV === 'production' ? 'Failed to retrieve team members' : err.message;
    res.status(500).json({ success: false, message });
  }
});

// GET /team/me/permissions
router.get('/team/me/permissions', async (req: Request, res: Response) => {
  try {
    const role = req.merchantRole || 'staff';
    const permissions = getFinePermissions(role);
    res.json({
      success: true,
      data: {
        role,
        roleDescription: ROLE_DESCRIPTIONS[role] || '',
        permissions,
        permissionCount: permissions.length,
        merchantId: req.merchantId,
        merchantUserId: req.merchantUserId,
      },
    });
  } catch (err: unknown) {
    const message = process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message;
    res.status(500).json({ success: false, message });
  }
});

// GET /team/:id
router.get('/team/:id', async (req: Request, res: Response) => {
  try {
    const member = await MerchantUser.findOne({ _id: req.params.id, merchantId: req.merchantId }).select('-password').lean();
    if (!member) { res.status(404).json({ success: false, message: 'Team member not found' }); return; }
    res.json({ success: true, data: member });
  } catch (err: unknown) {
    const message = process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message;
    res.status(500).json({ success: false, message });
  }
});

// POST /team/invite
router.post('/team/invite', teamInviteLimiter, async (req: Request, res: Response) => {
  try {
    const { email, name, role } = req.body;
    if (!email || !name || !role) { res.status(400).json({ success: false, message: 'email, name, role required' }); return; }

    const existing = await MerchantUser.findOne({ merchantId: req.merchantId, email: email.toLowerCase() });
    if (existing) { res.status(400).json({ success: false, message: 'User already exists in your team' }); return; }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const user = new MerchantUser({
      merchantId: req.merchantId,
      name, email: email.toLowerCase(), role,
      password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12), // placeholder
      status: 'inactive',
      inviteToken,
      inviteExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      invitedBy: req.merchantId,
    });
    await user.save();
    res.status(201).json({ success: true, message: 'Invitation sent', data: { inviteToken, email } });
  } catch (err: unknown) {
    const message = process.env.NODE_ENV === 'production' ? 'Operation failed' : err.message;
    res.status(400).json({ success: false, message });
  }
});

// Admin-only guard — role changes and deletions are admin actions
function requireAdminRole(req: Request, res: Response, next: () => void) {
  if (req.merchantRole !== 'admin' && req.merchantRole !== 'owner') {
    res.status(403).json({ success: false, message: 'Admin role required' });
    return;
  }
  next();
}

const VALID_MEMBER_ROLES = ['admin', 'manager', 'staff', 'viewer'] as const;
const VALID_MEMBER_STATUSES = ['active', 'inactive', 'suspended'] as const;

// PUT /team/:id/role
router.put('/team/:id/role', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!role || !VALID_MEMBER_ROLES.includes(role)) {
      res.status(400).json({ success: false, message: `role must be one of: ${VALID_MEMBER_ROLES.join(', ')}` });
      return;
    }

    // PEN-TEST FIX: Get old member data before update for audit and session invalidation
    const oldMember = await MerchantUser.findOne(
      { _id: req.params.id, merchantId: req.merchantId }
    ).select('-password');
    if (!oldMember) { res.status(404).json({ success: false, message: 'Team member not found' }); return; }

    const oldRole = oldMember.role;

    const member = await MerchantUser.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: { role } },
      { new: true },
    ).select('-password');
    if (!member) { res.status(404).json({ success: false, message: 'Team member not found' }); return; }

    // PEN-TEST FIX: Invalidate all existing tokens for this user on role change
    // This prevents the user from continuing to operate with old permissions
    const tokenBlacklistKey = `token:blacklist:user:${req.params.id}`;
    await redis.set(tokenBlacklistKey, JSON.stringify({
      invalidatedAt: new Date().toISOString(),
      reason: 'role_changed',
      oldRole,
      newRole: role,
    }), 'EX', 3600); // Expire after 1 hour

    // Audit log
    await AuditLog.create({
      action: 'role_changed',
      resource: 'team_member',
      resourceId: req.params.id,
      merchantId: req.merchantId,
      performedBy: (req as unknown).merchantUserId || 'owner',
      metadata: { oldRole, newRole: role },
    }).catch((err) => logger.error('Failed to create audit log', { error: err.message }));

    res.json({ success: true, data: member });
  } catch (err: unknown) {
    const message = process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message;
    res.status(500).json({ success: false, message });
  }
});

// PUT /team/:id/status
router.put('/team/:id/status', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status || !VALID_MEMBER_STATUSES.includes(status)) {
      res.status(400).json({ success: false, message: `status must be one of: ${VALID_MEMBER_STATUSES.join(', ')}` });
      return;
    }

    // PEN-TEST FIX: Get old member data before update for audit and session invalidation
    const oldMember = await MerchantUser.findOne(
      { _id: req.params.id, merchantId: req.merchantId }
    ).select('-password');
    if (!oldMember) { res.status(404).json({ success: false, message: 'Team member not found' }); return; }

    const oldStatus = oldMember.status;

    const member = await MerchantUser.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: { status } },
      { new: true },
    ).select('-password');
    if (!member) { res.status(404).json({ success: false, message: 'Team member not found' }); return; }

    // PEN-TEST FIX: Invalidate tokens if user is suspended/deactivated
    if (status === 'suspended' || status === 'inactive') {
      const tokenBlacklistKey = `token:blacklist:user:${req.params.id}`;
      await redis.set(tokenBlacklistKey, JSON.stringify({
        invalidatedAt: new Date().toISOString(),
        reason: `status_changed_to_${status}`,
        oldStatus,
        newStatus: status,
      }), 'EX', 86400); // Expire after 24 hours

      await AuditLog.create({
        action: 'status_changed_tokens_invalidated',
        resource: 'team_member',
        resourceId: req.params.id,
        merchantId: req.merchantId,
        performedBy: (req as unknown).merchantUserId || 'owner',
        metadata: { oldStatus, newStatus: status, tokensInvalidated: true },
      }).catch((err) => logger.error('Failed to create audit log', { error: err.message }));
    }

    res.json({ success: true, data: member });
  } catch (err: unknown) {
    const message = process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message;
    res.status(500).json({ success: false, message });
  }
});

// DELETE /team/:id
router.delete('/team/:id', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const member = await MerchantUser.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!member) { res.status(404).json({ success: false, message: 'Team member not found' }); return; }
    res.json({ success: true, message: 'Team member removed' });
  } catch (err: unknown) {
    const message = process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message;
    res.status(500).json({ success: false, message });
  }
});

export default router;
