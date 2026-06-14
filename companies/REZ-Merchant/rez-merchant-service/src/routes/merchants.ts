import { Router, Request, Response } from 'express';
import { Merchant } from '../models/Merchant';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { DeletionSchedule } from '../models/DeletionSchedule';
import { MerchantConsent, MERCHANT_CONSENT_CATEGORIES } from '../models/MerchantConsent';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

// Data residency regions
export const DATA_REGIONS = ['IN', 'US', 'EU', 'AP'] as const;
export type DataRegion = (typeof DATA_REGIONS)[number];

// Default region based on environment
const DEFAULT_REGION: DataRegion = (process.env.DEFAULT_DATA_REGION as DataRegion) || 'IN';

/**
 * Helper to extract client IP for audit logging
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '';
}

// PEN-TEST FIX: Explicit field projection to prevent sensitive data exposure
// Never return: passwordHash, refreshTokenHash, refreshTokenMeta, accountLockedUntil,
// failedLoginAttempts, bankDetails (encrypted), apiKeys, secretKeys
const MERCHANT_PROFILE_FIELDS = [
  '_id', 'businessName', 'ownerName', 'email', 'phone',
  'businessAddress', 'logoUrl', 'coverImageUrl', 'description', 'website',
  'socialLinks', 'gstNumber', 'panNumber', 'businessType', 'cuisine', 'tags',
  'verificationStatus', 'kycStatus', 'isActive', 'emailVerified',
  'rating', 'totalReviews', 'currentPlan', 'planExpiresAt',
  'onboarding', 'createdAt', 'updatedAt',
];

/**
 * @route GET /profile
 * @summary Get merchant profile
 * @tags Merchant
 * @security BearerAuth
 * @description Returns merchant's profile information.
 * @response {object} 200 - Profile retrieved
 * @response {object} 404 - Merchant not found
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const merchant = await Merchant.findById(req.merchantId)
      .select(MERCHANT_PROFILE_FIELDS.join(' '))
      .lean();
    if (!merchant) { res.status(404).json({ success: false, message: 'Merchant not found' }); return; }
    res.json({ success: true, data: merchant });
  } catch (e: unknown) {
    const requestId = (req as Request & { res?: { locals?: { requestId?: string } } }).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : (e instanceof Error ? e.message : 'Unknown error');
    res.status(500).json({ success: false, message });
  }
});

// BE-MER-002 / BE-MER-003: STRICT WHITELIST — only fields a merchant may safely edit.
// NEVER add: isVerified, subscription, accountLockedUntil, bankDetails, verificationStatus,
// kycStatus, rating, totalReviews, currentPlan, planExpiresAt, isActive, role, onboarding.
// bankDetails must ONLY be collected through the dedicated /onboarding/bank-details endpoint
// which applies field validation (BE-MER-010) and passes data through the Merchant model pre-save
// hook that encrypts accountNumber and ifscCode before storage (GDPR/RBI compliance).
const MERCHANT_PROFILE_EDITABLE_FIELDS = [
  'businessName', 'ownerName', 'phone', 'businessAddress',
  'logoUrl', 'coverImageUrl', 'description', 'website', 'socialLinks',
  'gstNumber', 'panNumber', 'businessType', 'cuisine', 'tags',
];

/**
 * @route PUT /profile
 * @summary Update merchant profile
 * @tags Merchant
 * @security BearerAuth
 * @description Updates merchant profile fields.
 * @response {object} 200 - Profile updated
 * @response {object} 400 - Validation failed
 */
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const update: Record<string, unknown> = {};
    for (const field of MERCHANT_PROFILE_EDITABLE_FIELDS) {
      if (field in req.body) update[field] = req.body[field];
    }

    // Trim whitespace on all string fields
    for (const key of Object.keys(update)) {
      if (typeof update[key] === 'string') {
        update[key] = (update[key] as string).trim();
      }
    }

    // Validate fields
    const errors: string[] = [];

    if ('businessName' in update) {
      const v = update.businessName;
      if (typeof v !== 'string' || v.length < 3 || v.length > 200) {
        errors.push('businessName must be a string between 3 and 200 characters');
      }
    }

    if ('ownerName' in update) {
      const v = update.ownerName;
      if (typeof v !== 'string' || v.length < 2 || v.length > 100) {
        errors.push('ownerName must be a string between 2 and 100 characters');
      }
    }

    if ('description' in update) {
      const v = update.description;
      if (typeof v !== 'string' || v.length > 2000) {
        errors.push('description must be a string of at most 2000 characters');
      }
    }

    if ('phone' in update) {
      const v = update.phone;
      if (typeof v !== 'string' || !/^[6-9]\d{9}$/.test(v)) {
        errors.push('phone must be a valid 10-digit Indian mobile number');
      }
    }

    if ('gstNumber' in update) {
      const v = update.gstNumber;
      if (typeof v === 'string' && v.length > 0) {
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v)) {
          errors.push('gstNumber must be a valid 15-character GST number');
        }
      }
    }

    if ('website' in update) {
      const v = update.website;
      if (typeof v === 'string' && v.length > 0) {
        if (!/^https?:\/\//.test(v)) {
          errors.push('website must start with http:// or https://');
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const merchant = await Merchant.findByIdAndUpdate(req.merchantId, { $set: update }, { new: true });
    if (!merchant) { res.status(404).json({ success: false, message: 'Merchant not found' }); return; }
    res.json({ success: true, message: 'Profile updated', data: merchant });
  } catch (e: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : (e instanceof Error ? e.message : 'Unknown error');
    res.status(500).json({ success: false, message });
  }
});

// =============================================================================
// GDPR COMPLIANCE ROUTES
// =============================================================================

/**
 * @route DELETE /account
 * @summary GDPR-compliant account deletion (Right to Erasure - Article 17)
 * @tags GDPR
 * @security BearerAuth
 * @description
 *   1. Anonymizes PII immediately (email, phone, name)
 *   2. Anonymizes customer data in orders
 *   3. Schedules full data deletion after 30-day grace period
 * @response {object} 200 - Account scheduled for deletion
 * @response {object} 400 - Account already pending deletion
 * @response {object} 404 - Merchant not found
 */
router.delete('/account', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;

    // Check if deletion is already pending
    const existingDeletion = await DeletionSchedule.findOne({
      tenantId: merchantId,
      status: 'pending',
    });
    if (existingDeletion) {
      res.status(400).json({
        success: false,
        message: 'Account deletion already scheduled',
        scheduledAt: existingDeletion.scheduledAt,
      });
      return;
    }

    // 1. Anonymize PII in Merchant document
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      res.status(404).json({ success: false, message: 'Merchant not found' });
      return;
    }

    await Merchant.findByIdAndUpdate(merchantId, {
      email: `deleted_${merchantId}@redacted.local`,
      phone: '0000000000',
      ownerName: '[DELETED]',
      businessName: `[Deleted] ${merchantId}`,
      deletedAt: new Date(),
      isActive: false,
    });

    // 2. Anonymize customer data in orders (PII in deliveryAddress)
    const anonymizeCustomerData = async () => {
      const orders = await Order.find({ merchant: merchantId }).select('_id deliveryAddress').lean();
      for (const order of orders) {
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            deliveryAddress: {
              name: '[REDACTED]',
              phone: '0000000000',
              address: '[REDACTED]',
              city: '[REDACTED]',
              state: '[REDACTED]',
              zipCode: '000000',
              landmark: '[REDACTED]',
            },
          },
        });
      }
    };
    await anonymizeCustomerData();

    // 3. Schedule cascade deletion (30-day grace period)
    const scheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await DeletionSchedule.create({
      tenantId: merchantId,
      tenantType: 'merchant',
      scheduledAt,
      status: 'pending',
      deletionType: 'full',
      initiatedBy: merchantId,
      initiatedAt: new Date(),
      reason: 'GDPR Right to Erasure request',
      metadata: {
        emailAnonymized: true,
        ordersAnonymized: true,
        customerDataAnonymized: true,
        gracePeriodExpired: false,
      },
    });

    res.json({
      success: true,
      message: 'Account scheduled for permanent deletion after 30-day grace period',
      deletionScheduledAt: scheduledAt,
      canCancelUntil: scheduledAt,
    });
  } catch (e: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : (e instanceof Error ? e.message : 'Unknown error');
    res.status(500).json({ success: false, message });
  }
});

/**
 * @route GET /deletion-status
 * @summary Check account deletion status
 * @tags GDPR
 * @security BearerAuth
 * @response {object} 200 - Deletion status retrieved
 * @response {object} 404 - No deletion scheduled
 */
router.get('/deletion-status', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;

    const deletion = await DeletionSchedule.findOne({
      tenantId: merchantId,
      status: { $in: ['pending', 'processing'] },
    }).lean();

    if (!deletion) {
      res.json({
        success: true,
        data: {
          hasPendingDeletion: false,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        hasPendingDeletion: true,
        status: deletion.status,
        scheduledAt: deletion.scheduledAt,
        daysRemaining: Math.ceil((deletion.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        canCancel: deletion.status === 'pending',
      },
    });
  } catch (e: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : (e instanceof Error ? e.message : 'Unknown error');
    res.status(500).json({ success: false, message });
  }
});

/**
 * @route POST /cancel-deletion
 * @summary Cancel pending account deletion (during grace period)
 * @tags GDPR
 * @security BearerAuth
 * @response {object} 200 - Deletion cancelled
 * @response {object} 400 - Cannot cancel (already processing or not pending)
 */
router.post('/cancel-deletion', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;

    // Restore merchant data
    const deletion = await DeletionSchedule.findOne({
      tenantId: merchantId,
      status: 'pending',
    });

    if (!deletion) {
      res.status(400).json({
        success: false,
        message: 'No pending deletion to cancel',
      });
      return;
    }

    // Restore merchant to active status
    await Merchant.findByIdAndUpdate(merchantId, {
      $unset: { deletedAt: 1 },
      isActive: true,
    });

    // Update deletion schedule
    deletion.status = 'cancelled';
    deletion.cancelledAt = new Date();
    deletion.cancelledBy = merchantId;
    await deletion.save();

    res.json({
      success: true,
      message: 'Account deletion cancelled. Your account is now active.',
    });
  } catch (e: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : (e instanceof Error ? e.message : 'Unknown error');
    res.status(500).json({ success: false, message });
  }
});

/**
 * @route GET /export-data
 * @summary Data portability - Export all merchant data (Article 20)
 * @tags GDPR
 * @security BearerAuth
 * @description Exports all merchant data in JSON format for GDPR data portability
 * @response {object} 200 - Data export ready (JSON download)
 */
router.get('/export-data', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;

    // Export metadata
    const exportMeta = {
      exportedAt: new Date().toISOString(),
      merchantId,
      version: '1.0',
      region: (req as unknown).merchantRegion || DEFAULT_REGION,
    };

    // Gather all merchant data
    const profile = await Merchant.findById(merchantId)
      .select([...MERCHANT_PROFILE_FIELDS, 'dataRegion', 'createdAt', 'updatedAt'])
      .lean();

    const orders = await Order.find({ merchant: merchantId })
      .select('-__v -id')
      .lean();

    const products = await Product.find({ merchant: merchantId })
      .select('-__v -id')
      .lean();

    // Get consent records
    const consents = await MerchantConsent.getAllConsents(merchantId);

    const data = {
      metadata: exportMeta,
      profile,
      orders,
      products,
      consents: consents.map((c) => ({
        category: c.category,
        status: c.status,
        source: c.source,
        legalBasis: c.legalBasis,
        createdAt: c.createdAt,
      })),
    };

    // Set headers for JSON download
    const filename = `merchant-data-${merchantId}-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    res.json(data);
  } catch (e: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : (e instanceof Error ? e.message : 'Unknown error');
    res.status(500).json({ success: false, message });
  }
});

// =============================================================================
// CONSENT MANAGEMENT ROUTES
// =============================================================================

/**
 * @route GET /consent
 * @summary Get all consent statuses for merchant
 * @tags GDPR
 * @security BearerAuth
 * @response {object} 200 - Consent statuses retrieved
 */
router.get('/consent', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;

    const consents = await MerchantConsent.getAllConsents(merchantId);

    // Build response with all categories
    const consentStatus = MERCHANT_CONSENT_CATEGORIES.map((category) => {
      const existing = consents.find((c) => c.category === category);
      return {
        category,
        status: existing?.status || 'withdrawn',
        source: existing?.source || null,
        legalBasis: existing?.legalBasis || null,
        decidedAt: existing?.createdAt || null,
      };
    });

    res.json({
      success: true,
      data: {
        merchantId,
        consents: consentStatus,
      },
    });
  } catch (e: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : (e instanceof Error ? e.message : 'Unknown error');
    res.status(500).json({ success: false, message });
  }
});

/**
 * @route POST /consent
 * @summary Record consent decision (Article 7)
 * @tags GDPR
 * @security BearerAuth
 * @description Records a consent decision in the append-only ledger
 * @body {string} category - Consent category (marketing_email, analytics_usage, etc.)
 * @body {string} status - 'granted' or 'withdrawn'
 * @body {string} [note] - Optional note
 * @response {object} 201 - Consent recorded
 * @response {object} 400 - Invalid category or status
 */
router.post('/consent', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { category, status, note } = req.body;

    // Validate category
    if (!category || !MERCHANT_CONSENT_CATEGORIES.includes(category)) {
      res.status(400).json({
        success: false,
        message: 'Invalid consent category',
        validCategories: MERCHANT_CONSENT_CATEGORIES,
      });
      return;
    }

    // Validate status
    if (!status || !['granted', 'withdrawn'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "granted" or "withdrawn"',
      });
      return;
    }

    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'];

    const consent = await MerchantConsent.recordConsent({
      merchantId,
      category,
      status,
      source: 'settings',
      ipAddress,
      userAgent: typeof userAgent === 'string' ? userAgent : undefined,
      note,
    });

    res.status(201).json({
      success: true,
      data: {
        consentId: consent._id,
        category: consent.category,
        status: consent.status,
        decidedAt: consent.createdAt,
      },
    });
  } catch (e: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : (e instanceof Error ? e.message : 'Unknown error');
    res.status(500).json({ success: false, message });
  }
});

/**
 * @route GET /consent/:category
 * @summary Get consent status for specific category
 * @tags GDPR
 * @security BearerAuth
 * @param {string} category - Consent category
 * @response {object} 200 - Consent status retrieved
 */
router.get('/consent/:category', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { category } = req.params;

    if (!MERCHANT_CONSENT_CATEGORIES.includes(category as unknown)) {
      res.status(400).json({
        success: false,
        message: 'Invalid consent category',
        validCategories: MERCHANT_CONSENT_CATEGORIES,
      });
      return;
    }

    const consent = await MerchantConsent.getCurrentConsent(merchantId, category as unknown);

    res.json({
      success: true,
      data: {
        category,
        status: consent?.status || 'withdrawn',
        source: consent?.source || null,
        legalBasis: consent?.legalBasis || null,
        decidedAt: consent?.createdAt || null,
        canWithdraw: consent?.status === 'granted',
      },
    });
  } catch (e: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : (e instanceof Error ? e.message : 'Unknown error');
    res.status(500).json({ success: false, message });
  }
});

// =============================================================================
// DATA RESIDENCY ROUTES
// =============================================================================

/**
 * @route GET /data-region
 * @summary Get current data residency region
 * @tags GDPR
 * @security BearerAuth
 * @response {object} 200 - Data region retrieved
 */
router.get('/data-region', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;

    const merchant = await Merchant.findById(merchantId).select('dataRegion').lean();

    res.json({
      success: true,
      data: {
        currentRegion: merchant?.dataRegion || DEFAULT_REGION,
        availableRegions: DATA_REGIONS,
        defaultRegion: DEFAULT_REGION,
      },
    });
  } catch (e: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : (e instanceof Error ? e.message : 'Unknown error');
    res.status(500).json({ success: false, message });
  }
});

/**
 * @route PUT /data-region
 * @summary Update data residency region (GDPR Article 44-49)
 * @tags GDPR
 * @security BearerAuth
 * @description Requests data residency region change. May require admin approval.
 * @body {string} region - Target region (IN, US, EU, AP)
 * @response {object} 200 - Region change initiated
 * @response {object} 400 - Invalid region
 */
router.put('/data-region', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { region } = req.body;

    if (!region || !DATA_REGIONS.includes(region as DataRegion)) {
      res.status(400).json({
        success: false,
        message: 'Invalid region',
        validRegions: DATA_REGIONS,
      });
      return;
    }

    // Note: Actual region migration requires admin approval and data transfer
    // For now, we update the preference and log the request
    await Merchant.findByIdAndUpdate(merchantId, {
      $set: {
        dataRegion: region,
        regionChangeRequestedAt: new Date(),
        regionChangeStatus: 'pending',
      },
    });

    res.json({
      success: true,
      message: `Data residency region change to ${region} initiated. Pending admin approval.`,
      data: {
        requestedRegion: region,
        status: 'pending',
      },
    });
  } catch (e: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : (e instanceof Error ? e.message : 'Unknown error');
    res.status(500).json({ success: false, message });
  }
});

export default router;
