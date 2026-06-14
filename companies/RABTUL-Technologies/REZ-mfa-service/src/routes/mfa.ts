import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  TOTPManager,
  BackupCodeManager,
  RecoveryManager,
  AnomalyDetector,
  LoginContext,
} from '../services';
import { MFAUser } from '../models';
import {
  internalServiceAuth,
  adminAuth,
  verificationRateLimiter,
  backupCodeRateLimiter,
  recoveryRateLimiter,
  asyncHandler,
  AuthenticatedRequest,
} from '../middleware';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const setupMFASchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  email: z.string().email('Valid email is required'),
  method: z.enum(['totp']).default('totp'),
});

const verifyTOTPSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  token: z.string().regex(/^\d{6}$/, 'Token must be 6 digits'),
  trustDevice: z.boolean().optional(),
  deviceName: z.string().optional(),
  deviceId: z.string().optional(),
});

const disableMFASchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  token: z.string().regex(/^\d{6}$/, 'Token must be 6 digits'),
  reason: z.string().optional(),
});

const getBackupCodesSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

const useBackupCodeSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  code: z.string().min(1, 'Backup code is required'),
  trustDevice: z.boolean().optional(),
  deviceName: z.string().optional(),
  deviceId: z.string().optional(),
});

const recoverAccountSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  method: z.enum(['email', 'sms', 'admin_verified']),
  verificationCode: z.string().optional(),
  requestId: z.string().optional(),
});

const trustedDeviceSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

const removeDeviceSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
});

const regenerateBackupCodesSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  token: z.string().regex(/^\d{6}$/, 'Token must be 6 digits'),
});

// Helper to get request context
function getLoginContext(req: Request, userId: string, method: 'totp' | 'backup_code' | 'sms' | 'recovery'): LoginContext {
  return {
    userId,
    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    city: req.headers['x-city'] as string,
    country: req.headers['x-country'] as string,
    method,
  };
}

/**
 * POST /api/v1/mfa/setup
 * Start MFA setup - generates TOTP secret and QR code
 */
router.post(
  '/setup',
  internalServiceAuth,
  verificationRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = setupMFASchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'INVALID_REQUEST',
        message: 'Invalid request data',
        details: validation.error.errors,
      });
      return;
    }

    const { userId, email } = validation.data;

    // Check if user exists
    let user = await MFAUser.findOne({ userId });
    if (!user) {
      user = new MFAUser({
        userId,
        email: email.toLowerCase(),
        mfaEnabled: false,
      });
      await user.save();
    }

    // Generate new TOTP secret
    const setupResult = await TOTPManager.generateSecret(userId, email);

    logger.info('MFA setup initiated', {
      userId,
      email,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      data: {
        secret: setupResult.secret,
        qrCodeUrl: setupResult.qrCodeUrl,
        manualEntryKey: setupResult.manualEntryKey,
        issuer: 'REZ',
      },
    });
  })
);

/**
 * POST /api/v1/mfa/verify
 * Verify TOTP token and enable MFA
 */
router.post(
  '/verify',
  internalServiceAuth,
  verificationRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = verifyTOTPSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'INVALID_REQUEST',
        message: 'Invalid request data',
        details: validation.error.errors,
      });
      return;
    }

    const { userId, token, trustDevice, deviceName, deviceId } = validation.data;
    const user = await MFAUser.findOne({ userId });

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    if (!user.totpSecret) {
      res.status(400).json({
        error: 'Bad Request',
        code: 'MFA_NOT_SETUP',
        message: 'MFA has not been set up for this user',
      });
      return;
    }

    // Check if account is locked
    if (user.isLocked()) {
      res.status(423).json({
        error: 'Locked',
        code: 'ACCOUNT_LOCKED',
        message: 'Account is temporarily locked due to too many failed attempts',
        details: {
          lockedUntil: user.lockedUntil,
        },
      });
      return;
    }

    // Check for trusted device bypass
    if (trustDevice && deviceId) {
      const context = getLoginContext(req, userId, 'totp');
      const trustedCheck = await AnomalyDetector.isTrustedDevice(userId, deviceId, context.ipAddress);

      if (trustedCheck.trusted) {
        // Skip TOTP verification for trusted device
        logger.info('Trusted device bypass used', { userId, deviceId });

        const result = await TOTPManager.verifyAndEnable(
          userId,
          token,
          trustDevice,
          {
            deviceId,
            deviceName: deviceName || 'Unknown Device',
            userAgent: context.userAgent,
            ipAddress: context.ipAddress,
          }
        );

        res.status(200).json({
          success: true,
          data: result,
        });
        return;
      }
    }

    // Verify TOTP token
    try {
      const result = await TOTPManager.verifyAndEnable(
        userId,
        token,
        trustDevice,
        trustDevice && deviceId ? {
          deviceId,
          deviceName: deviceName || 'Unknown Device',
          userAgent: req.headers['user-agent'] || 'unknown',
          ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown',
        } : undefined
      );

      // Record successful attempt
      const context = getLoginContext(req, userId, 'totp');
      await AnomalyDetector.recordAttempt(context, true, []);

      logger.info('MFA verification successful', {
        userId,
        backupCodesGenerated: !!result.backupCodes,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Record failed attempt
      const context = getLoginContext(req, userId, 'totp');
      const anomalies = await AnomalyDetector.detectAnomalies(context);
      await AnomalyDetector.recordAttempt(
        context,
        false,
        anomalies.map(a => a.type)
      );

      // Refresh user to check lock status
      const refreshedUser = await MFAUser.findOne({ userId });
      if (refreshedUser?.isLocked()) {
        res.status(423).json({
          error: 'Locked',
          code: 'ACCOUNT_LOCKED',
          message: 'Account is temporarily locked due to too many failed attempts',
        });
        return;
      }

      throw error;
    }
  })
);

/**
 * POST /api/v1/mfa/disable
 * Disable MFA for a user
 */
router.post(
  '/disable',
  internalServiceAuth,
  verificationRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = disableMFASchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'INVALID_REQUEST',
        message: 'Invalid request data',
        details: validation.error.errors,
      });
      return;
    }

    const { userId, token, reason } = validation.data;

    await TOTPManager.disableMFA(userId, token, reason);

    logger.info('MFA disabled by user', {
      userId,
      reason,
    });

    res.status(200).json({
      success: true,
      message: 'MFA has been disabled',
    });
  })
);

/**
 * POST /api/v1/mfa/admin/disable
 * Admin disable MFA (bypasses token verification)
 */
router.post(
  '/admin/disable',
  internalServiceAuth,
  adminAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId, reason } = req.body;

    if (!userId) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'INVALID_REQUEST',
        message: 'User ID is required',
      });
      return;
    }

    await TOTPManager.adminDisableMFA(userId, 'admin', reason);

    logger.info('MFA disabled by admin', {
      userId,
      adminUserId: 'admin',
      reason,
    });

    res.status(200).json({
      success: true,
      message: 'MFA has been disabled by administrator',
    });
  })
);

/**
 * GET /api/v1/mfa/backup-codes
 * Get backup codes for a user
 */
router.get(
  '/backup-codes',
  internalServiceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = getBackupCodesSchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'INVALID_REQUEST',
        message: 'Invalid request data',
        details: validation.error.errors,
      });
      return;
    }

    const { userId } = validation.data;
    const user = await MFAUser.findOne({ userId });

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    const remainingCodes = user.backupCodes.filter(c => !c.usedAt).length;

    res.status(200).json({
      success: true,
      data: {
        remainingCodes,
        generatedAt: user.backupCodesGeneratedAt,
      },
    });
  })
);

/**
 * POST /api/v1/mfa/backup-codes/regenerate
 * Regenerate backup codes
 */
router.post(
  '/backup-codes/regenerate',
  internalServiceAuth,
  verificationRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = regenerateBackupCodesSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'INVALID_REQUEST',
        message: 'Invalid request data',
        details: validation.error.errors,
      });
      return;
    }

    const { userId, token } = validation.data;

    // Verify TOTP before regenerating
    const result = await TOTPManager.verifyToken(userId, token);
    if (!result.valid) {
      res.status(400).json({
        error: 'Invalid Token',
        code: 'INVALID_TOKEN',
        message: 'Invalid verification code',
      });
      return;
    }

    // Generate new backup codes
    const codes = await BackupCodeManager.regenerateCodes(userId);

    logger.info('Backup codes regenerated', { userId });

    res.status(200).json({
      success: true,
      data: {
        codes,
        remainingCodes: codes.length,
        generatedAt: new Date(),
      },
    });
  })
);

/**
 * POST /api/v1/mfa/backup-codes/use
 * Use a backup code
 */
router.post(
  '/backup-codes/use',
  internalServiceAuth,
  backupCodeRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = useBackupCodeSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'INVALID_REQUEST',
        message: 'Invalid request data',
        details: validation.error.errors,
      });
      return;
    }

    const { userId, code, trustDevice, deviceName, deviceId } = validation.data;
    const user = await MFAUser.findOne({ userId });

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    // Check if account is locked
    if (user.isLocked()) {
      res.status(423).json({
        error: 'Locked',
        code: 'ACCOUNT_LOCKED',
        message: 'Account is temporarily locked',
      });
      return;
    }

    try {
      const result = await BackupCodeManager.verifyAndAddTrustedDevice(
        userId,
        code,
        trustDevice && deviceId ? {
          deviceId,
          deviceName: deviceName || 'Unknown Device',
          userAgent: req.headers['user-agent'] || 'unknown',
          ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown',
        } : undefined
      );

      // Record successful backup code usage
      const context = getLoginContext(req, userId, 'backup_code');
      await AnomalyDetector.recordAttempt(context, true, []);

      logger.info('Backup code used successfully', { userId });

      res.status(200).json({
        success: true,
        data: {
          trustedDeviceToken: result.trustedDeviceToken,
          remainingCodes: result.remainingCodes,
        },
      });
    } catch (error) {
      // Record failed attempt
      const context = getLoginContext(req, userId, 'backup_code');
      await AnomalyDetector.recordAttempt(context, false, []);

      throw error;
    }
  })
);

/**
 * POST /api/v1/mfa/recover
 * Account recovery
 */
router.post(
  '/recover',
  recoveryRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = recoverAccountSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'INVALID_REQUEST',
        message: 'Invalid request data',
        details: validation.error.errors,
      });
      return;
    }

    const { userId, method, verificationCode, requestId } = validation.data;

    // If completing recovery
    if (requestId && verificationCode) {
      try {
        await RecoveryManager.verifyRecoveryRequest(userId, requestId, verificationCode);
        const result = await RecoveryManager.completeRecovery(userId, requestId);

        logger.info('Account recovery completed', { userId });

        res.status(200).json({
          success: true,
          data: {
            message: 'Account recovered successfully',
            backupCodes: result.backupCodes,
          },
        });
        return;
      } catch (error) {
        throw error;
      }
    }

    // Start recovery request
    const methodType = method === 'admin_verified' ? 'admin' : method as 'email' | 'sms';
    const result = await RecoveryManager.createRecoveryRequest(userId, methodType);

    logger.info('Recovery request created', {
      userId,
      method: methodType,
      requestId: result.requestId,
    });

    res.status(200).json({
      success: true,
      data: {
        requestId: result.requestId,
        expiresAt: result.expiresAt,
        // Only include code for non-admin methods
        ...(result.verificationCode && { verificationCode: result.verificationCode }),
      },
    });
  })
);

/**
 * GET /api/v1/mfa/trusted-devices
 * List trusted devices
 */
router.get(
  '/trusted-devices',
  internalServiceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = trustedDeviceSchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'INVALID_REQUEST',
        message: 'Invalid request data',
        details: validation.error.errors,
      });
      return;
    }

    const { userId } = validation.data;
    const user = await MFAUser.findOne({ userId });

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        devices: user.trustedDevices.map(d => ({
          deviceId: d.deviceId,
          deviceName: d.deviceName,
          deviceType: d.deviceType,
          lastUsedAt: d.lastUsedAt,
          createdAt: d.createdAt,
        })),
        total: user.trustedDevices.length,
      },
    });
  })
);

/**
 * DELETE /api/v1/mfa/trusted-devices
 * Remove a trusted device
 */
router.delete(
  '/trusted-devices',
  internalServiceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = removeDeviceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'INVALID_REQUEST',
        message: 'Invalid request data',
        details: validation.error.errors,
      });
      return;
    }

    const { userId, deviceId } = validation.data;
    const user = await MFAUser.findOne({ userId });

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    const removed = await user.removeTrustedDevice(deviceId);

    if (!removed) {
      res.status(404).json({
        error: 'Not Found',
        code: 'DEVICE_NOT_FOUND',
        message: 'Trusted device not found',
      });
      return;
    }

    logger.info('Trusted device removed', { userId, deviceId });

    res.status(200).json({
      success: true,
      message: 'Trusted device removed',
    });
  })
);

/**
 * GET /api/v1/mfa/status
 * Get MFA status for a user
 */
router.get(
  '/status',
  internalServiceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'INVALID_REQUEST',
        message: 'User ID is required',
      });
      return;
    }

    const status = await TOTPManager.getMFAStatus(userId);

    res.status(200).json({
      success: true,
      data: status,
    });
  })
);

/**
 * GET /api/v1/mfa/anomaly-report
 * Get anomaly report for a user
 */
router.get(
  '/anomaly-report',
  internalServiceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'INVALID_REQUEST',
        message: 'User ID is required',
      });
      return;
    }

    const report = await AnomalyDetector.generateRiskReport(userId);

    res.status(200).json({
      success: true,
      data: report,
    });
  })
);

/**
 * GET /api/v1/mfa/login-history
 * Get login history for a user
 */
router.get(
  '/login-history',
  internalServiceAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (!userId) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'INVALID_REQUEST',
        message: 'User ID is required',
      });
      return;
    }

    const history = await AnomalyDetector.getLoginHistory(userId, { page, limit });

    res.status(200).json({
      success: true,
      data: {
        attempts: history.attempts,
        total: history.total,
        page,
        limit,
        totalPages: Math.ceil(history.total / limit),
      },
    });
  })
);

/**
 * GET /api/v1/mfa/health
 * Health check endpoint (no auth required)
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'rez-mfa-service',
    timestamp: new Date().toISOString(),
  });
});

export default router;
