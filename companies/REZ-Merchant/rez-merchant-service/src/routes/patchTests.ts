import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import { env } from '../config/env';

const INTERNAL_SERVICE_TIMEOUT_MS = 10000;

const router = Router();
router.use(merchantAuth);

/**
 * P1-DATA-1 FIX: Call rez-auth-service via internal HTTP instead of direct DB write.
 * Patch test records are owned by the auth-service (User document in users collection).
 * This route previously wrote directly to the users collection from merchant-service,
 * violating service boundaries. Now it calls the internal API endpoint on auth-service.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customerPhone, serviceCategory, result, conductedBy } = req.body;
    if (!customerPhone || !serviceCategory || !result) {
      res.status(400).json({ success: false, message: 'customerPhone, serviceCategory, result required' });
      return;
    }
    if (!['pass', 'reaction'].includes(result)) {
      res.status(400).json({ success: false, message: 'result must be pass or reaction' });
      return;
    }

    // Use INTERNAL_SERVICE_TOKEN as the shared internal auth token.
    // The auth service validates it via timingSafeEqual comparison.
    const authServiceUrl = env.REZ_AUTH_SERVICE_URL;
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), INTERNAL_SERVICE_TIMEOUT_MS);
    let response: globalThis.Response;
    try {
      response = await fetch(`${authServiceUrl}/internal/users/patch-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': internalToken || '',
          'x-internal-service': 'rez-merchant-service',
        },
        body: JSON.stringify({ customerPhone, serviceCategory, result, conductedBy }),
        signal: controller.signal,
      });
      clearTimeout(timer);
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        res.status(504).json({ success: false, message: 'Auth service timeout' });
        return;
      }
      throw err;
    }

    const data = await response.json() as unknown as { success: boolean; message?: string; data?: Record<string, unknown> };

    if (!response.ok || !data.success) {
      res.status(response.status).json({
        success: false,
        message: data.message || `Auth service error: ${response.status}`,
      });
      return;
    }

    res.json({ success: true, data: data.data });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
