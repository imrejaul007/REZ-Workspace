import { logger } from '../../shared/logger';
/**
 * MyRisa Auth Routes
 */

import { Router, Request, Response } from 'express';
import { authService } from '../services/authService.js';

const router = Router();

/**
 * POST /auth/login
 * Login with RABTUL token
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token required'
      });
    }

    // Verify RABTUL token
    const verification = await authService.verifyRabulToken(token);

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: verification.error || 'Invalid token'
      });
    }

    // Get or create MyRisa user
    const myrida = await authService.getOrCreateMyRisaUser(verification.corpId!);

    // Create session
    authService.createSession(myrisa.token, myrida.myrisaUserId);

    res.json({
      success: true,
      data: {
        myridaUserId: myrida.myrisaUserId,
        token: myrida.token,
        expiresIn: '30d'
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * POST /auth/verify
 * Verify token
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header required'
      });
    }

    const token = authHeader.substring(7);
    const verification = await authService.verifyMyRisaToken(token);

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: verification.error || 'Invalid token'
      });
    }

    res.json({
      success: true,
      data: {
        userId: verification.userId,
        corpId: verification.corpId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      authService.invalidateSession(token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * GET /auth/oauth-url
 * Get OAuth URL for RABTUL auth
 */
router.get('/oauth-url', (req: Request, res: Response) => {
  const redirectUri = req.query.redirect_uri as string;

  if (!redirectUri) {
    return res.status(400).json({
      success: false,
      error: 'redirect_uri required'
    });
  }

  const url = authService.getOAuthUrl(redirectUri);

  res.json({
    success: true,
    data: { url }
  });
});

/**
 * POST /auth/oauth/callback
 * Handle OAuth callback
 */
router.post('/oauth/callback', async (req: Request, res: Response) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code || !redirect_uri) {
      return res.status(400).json({
        success: false,
        error: 'Code and redirect_uri required'
      });
    }

    const result = await authService.exchangeOAuthCode(code, redirect_uri);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Verify the token we got
    const verification = await authService.verifyRabulToken(result.token!);

    if (verification.valid) {
      const myrida = await authService.getOrCreateMyRisaUser(verification.corpId!);
      authService.createSession(myrisa.token, myrida.myrisaUserId);

      res.json({
        success: true,
        data: {
          myridaUserId: myrida.myrisaUserId,
          token: myrida.token
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'OAuth authentication failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'OAuth callback failed'
    });
  }
});

export default router;