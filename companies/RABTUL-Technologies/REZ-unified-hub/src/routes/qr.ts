/**
 * REZ Unified Hub - QR Routes
 * QR code experiences with intelligence
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { apiClient } from '../services/apiClient';
import { logger } from '../utils/logger';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const QRExperienceSchema = z.object({
  qr_type: z.enum(['verify', 'safe', 'creator', 'ads', 'room']),
  qr_id: z.string().min(1, 'qr_id is required'),
  user_id: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

const WarrantySchema = z.object({
  serial_number: z.string().min(1),
  user_id: z.string().min(1),
  purchase_date: z.string(),
  price_paid: z.number().positive(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

// ============================================
// QR TYPE TO SERVICE MAPPING
// ============================================

const QR_SERVICE_MAP: Record<string, string> = {
  verify: 'VERIFY_QR',
  safe: 'SAFE_QR',
  creator: 'CREATOR_QR',
  ads: 'ADS_QR',
  room: 'ROOM_QR',
};

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/v1/qr/experience
 * Get complete QR experience with intelligence
 */
router.post('/experience', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = QRExperienceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { qr_type, qr_id, user_id, location } = validation.data;

    // Get QR data based on type
    const qrData = await apiClient.getQRData(qr_type, qr_id);

    // Parallel fetch personalization data if user is logged in
    let personalization = null;
    let fraudScore = null;
    let recommendations: unknown[] = [];
    let userSegments: string[] = [];

    if (user_id) {
      const [personalResult, recommendationsResult, segmentsResult] = await Promise.allSettled([
        apiClient.call('PERSONAL', '/api/v1/content', 'POST', {
          user_id,
          slot: `${qr_type}_qr`,
          context: { qr_data: qrData },
        }),
        apiClient.call('RECOMMEND', '/api/v1/contextual', 'POST', {
          user_id,
          context: { qr_type, qr_data: qrData },
        }),
        apiClient.getCDPSegments(user_id),
      ]);

      personalization = personalResult.status === 'fulfilled' ? personalResult.value : null;
      const recData = recommendationsResult.status === 'fulfilled' ? recommendationsResult.value as { items?: unknown[] } : null;
      recommendations = recData?.items || [];
      const segData = segmentsResult.status === 'fulfilled' ? segmentsResult.value as { segments?: string[] } : null;
      userSegments = segData?.segments || [];

      // Get fraud score for verification QR
      if (qr_type === 'verify') {
        fraudScore = await apiClient.checkFraud(user_id, 'qr_verify', 0);
      }
    }

    // Track scan if user is logged in
    if (user_id) {
      await apiClient.collectSignal('qr', 'qr_scanned', user_id, {
        qr_type,
        qr_id,
        location,
      });
    }

    res.json({
      success: true,
      data: {
        qr_data: qrData,
        personalization: personalization ? (personalization as { content?: unknown }).content : null,
        fraud_score: fraudScore,
        recommendations,
        user_segments: userSegments,
      },
    });
  } catch (error) {
    logger.error('Error fetching QR experience:', error);
    next(error);
  }
});

/**
 * POST /api/v1/qr/warranty
 * Activate warranty with full intelligence
 */
router.post('/warranty', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = WarrantySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { serial_number, user_id, purchase_date, price_paid, location } = validation.data;

    // Fraud check
    const fraudCheck = await apiClient.checkFraud(user_id, 'warranty_activation', price_paid);
    const fraudData = fraudCheck as { risk_level?: string } | null;

    if (fraudData?.risk_level === 'high') {
      res.status(403).json({
        success: false,
        error: 'Verification blocked due to fraud risk',
        code: 'FRAUD_BLOCKED',
      });
      return;
    }

    // Get personalized warranty plan recommendations
    const planRecs = await apiClient.call('RECOMMEND', '/api/v1/warranty-plans', 'POST', {
      user_id,
      product_serial: serial_number,
      purchase_price: price_paid,
    }) as { plans?: unknown[] } | null;

    // Calculate cashback
    const cashback = Math.floor(price_paid * 0.01);

    // Track activation
    await apiClient.collectSignal('verify_qr', 'warranty_activated', user_id, {
      serial_number,
      price: price_paid,
    });

    // Award karma points
    await apiClient.awardKarma(user_id, cashback, 'REZ-Consumer', 'warranty_activation');

    res.json({
      success: true,
      data: {
        cashback,
        plan_recommendations: planRecs?.plans || [],
        fraud_status: fraudData?.risk_level || 'low',
      },
    });
  } catch (error) {
    logger.error('Error activating warranty:', error);
    next(error);
  }
});

/**
 * GET /api/v1/qr/stats/:qrId
 * Get QR scan statistics
 */
router.get('/stats/:qrId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrId } = req.params;

    // Aggregate stats from signals
    const stats = await apiClient.call('SIGNAL', '/api/v1/aggregate', 'POST', {
      event: 'qr_scanned',
      entity_id: qrId,
      period: '30d',
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching QR stats:', error);
    next(error);
  }
});

/**
 * POST /api/v1/qr/validate
 * Validate a QR code
 */
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      qr_code: z.string().min(1),
      expected_type: z.enum(['verify', 'safe', 'creator', 'ads', 'room']).optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { qr_code, expected_type } = validation.data;

    // Parse QR code to extract type and ID
    const [qrType, qrId] = qr_code.split(':');
    const parsedType = qrType || 'unknown';

    // Validate type if expected
    if (expected_type && parsedType !== expected_type) {
      res.json({
        success: true,
        valid: false,
        reason: `Expected ${expected_type} but found ${parsedType}`,
      });
      return;
    }

    res.json({
      success: true,
      valid: true,
      data: {
        type: parsedType,
        id: qrId,
      },
    });
  } catch (error) {
    logger.error('Error validating QR:', error);
    next(error);
  }
});

export default router;
