import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  deviceService,
  linkingService,
  householdService,
  resolutionService,
  graphService
} from '../services';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { internalServiceAuth, requirePermission } from '../middleware/auth';
import { checkDependencies } from '../config';

const router = Router();

// Validation schemas
const RegisterDeviceSchema = z.object({
  deviceId: z.string().min(1),
  type: z.enum(['mobile', 'tablet', 'desktop', 'smart_tv', 'smart_watch', 'iot', 'other']),
  platform: z.enum(['ios', 'android', 'windows', 'macos', 'linux', 'web', 'tvos', 'other']),
  userId: z.string().optional(),
  identifiers: z.object({
    idfa: z.string().optional(),
    gaid: z.string().optional(),
    androidId: z.string().optional(),
    cookieId: z.string().optional(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
  }).optional(),
  attributes: z.object({
    screenWidth: z.number().optional(),
    screenHeight: z.number().optional(),
    browser: z.string().optional(),
    osVersion: z.string().optional(),
    appVersion: z.string().optional(),
    manufacturer: z.string().optional(),
    model: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
});

const LinkDevicesSchema = z.object({
  deviceIds: z.tuple([z.string(), z.string()]),
  confidence: z.number().min(0).max(1),
  method: z.enum(['ip', 'wifi', 'cookie', 'login', 'fingerprint', 'behavioral', 'household', 'inferred']),
  evidence: z.object({
    sharedIp: z.boolean().optional(),
    sharedWifi: z.boolean().optional(),
    sharedCookie: z.boolean().optional(),
    loginTimestamp: z.date().optional(),
    fingerprintScore: z.number().optional(),
    behavioralScore: z.number().optional(),
  }).optional(),
  userId: z.string().optional(),
  householdId: z.string().optional(),
  expiresAt: z.date().optional(),
});

const ResolveUserSchema = z.object({
  deviceId: z.string().min(1),
  identifiers: z.object({
    idfa: z.string().optional(),
    gaid: z.string().optional(),
    androidId: z.string().optional(),
    cookieId: z.string().optional(),
    ipAddress: z.string().optional(),
  }).optional(),
});

const BatchDeviceSchema = z.object({
  devices: z.array(RegisterDeviceSchema),
  linkPairs: z.array(z.object({
    deviceIds: z.tuple([z.string(), z.string()]),
    confidence: z.number().min(0).max(1),
    method: z.string(),
  })).optional(),
});

/**
 * POST /api/devices - Register a new device
 */
router.post('/', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const validation = RegisterDeviceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors,
      });
      return;
    }

    const startTime = Date.now();
    const device = await deviceService.registerDevice(validation.data);

    metrics.httpRequestDuration.observe(
      { method: 'POST', route: '/api/devices', status_code: '201' },
      (Date.now() - startTime) / 1000
    );

    res.status(201).json({
      success: true,
      data: device,
    });
  } catch (error: any) {
    logger.error('Error registering device:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/devices/:id - Get device by ID
 */
router.get('/:id', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const device = await deviceService.getDevice(id);

    if (!device) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Device not found: ${id}`,
      });
      return;
    }

    res.json({
      success: true,
      data: device,
    });
  } catch (error: any) {
    logger.error('Error getting device:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/devices/link - Link two devices
 */
router.post('/link', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const validation = LinkDevicesSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors,
      });
      return;
    }

    const link = await linkingService.linkDevices({
      deviceIds: validation.data.deviceIds,
      confidence: validation.data.confidence,
      method: validation.data.method,
      evidence: validation.data.evidence,
      userId: validation.data.userId,
      householdId: validation.data.householdId,
      expiresAt: validation.data.expiresAt,
    });

    res.status(201).json({
      success: true,
      data: link,
    });
  } catch (error: any) {
    logger.error('Error linking devices:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/devices/:id/household - Get household for a device
 */
router.get('/:id/household', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await householdService.getHouseholdWithDevices(id);

    if (!result.household) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `No household found for device: ${id}`,
      });
      return;
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting device household:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/devices/user/:userId - Get all devices for a user
 */
router.get('/user/:userId', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const devices = await deviceService.getUserDevices(userId);

    res.json({
      success: true,
      data: {
        userId,
        devices,
        count: devices.length,
      },
    });
  } catch (error: any) {
    logger.error('Error getting user devices:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/devices/resolve - Resolve user from device
 */
router.post('/resolve', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const validation = ResolveUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors,
      });
      return;
    }

    const result = await resolutionService.resolveUser(validation.data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error resolving user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/devices/:id/graph - Get device graph
 */
router.get('/:id/graph', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const graph = await graphService.getDeviceGraph(id);

    res.json({
      success: true,
      data: graph,
    });
  } catch (error: any) {
    logger.error('Error getting device graph:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/devices/batch - Batch device processing
 */
router.post('/batch', internalServiceAuth, requirePermission('write'), async (req: Request, res: Response) => {
  try {
    const validation = BatchDeviceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors,
      });
      return;
    }

    const { devices, linkPairs } = validation.data;

    // Register devices
    const deviceResult = await deviceService.batchRegisterDevices(devices);

    // Link devices if provided
    let linkResult = { success: 0, failed: 0 };
    if (linkPairs && linkPairs.length > 0) {
      linkResult = await linkingService.batchLinkDevices(
        linkPairs.map(lp => ({
          deviceIds: lp.deviceIds,
          confidence: lp.confidence,
          method: lp.method as any,
        }))
      );
    }

    res.json({
      success: true,
      data: {
        devices: deviceResult,
        links: linkResult,
      },
    });
  } catch (error: any) {
    logger.error('Error processing batch:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/devices/stats - Get device statistics
 */
router.get('/stats', internalServiceAuth, async (req: Request, res: Response) => {
  try {
    const deviceStats = await deviceService.getDeviceStats();
    const graphStats = await graphService.getGraphStats();

    res.json({
      success: true,
      data: {
        devices: deviceStats,
        graphs: graphStats,
      },
    });
  } catch (error: any) {
    logger.error('Error getting device stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;