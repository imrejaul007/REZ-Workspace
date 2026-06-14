import { logger } from '../../shared/logger';
import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const router = Router();
const authService = new AuthService({
  get: (key: string, defaultValue?: string) => process.env[key] || defaultValue,
} as any);

/**
 * @route POST /api/auth/request-otp
 * @desc Request OTP for login/registration
 */
router.post('/request-otp', async (req: Request, res: Response) => {
  try {
    const { phone, type = 'login' } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    // Validate phone format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const result = await authService.requestOTP(phone, type);

    res.json(result);
  } catch (error) {
    logger.error('Request OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * @route POST /api/auth/verify-otp
 * @desc Verify OTP and get JWT token
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp, type = 'login' } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    const result = await authService.verifyOTP(phone, otp, type);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * @route POST /api/auth/driver/request-otp
 * @desc Request OTP for driver login
 */
router.post('/driver/request-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    const result = await authService.requestDriverOTP(phone);
    res.json(result);
  } catch (error) {
    logger.error('Driver OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * @route POST /api/auth/driver/verify-otp
 * @desc Verify driver OTP and get JWT token
 */
router.post('/driver/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    const result = await authService.authenticateDriver(phone, otp);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json({
      success: true,
      token: result.token,
      driver: result.user,
    });
  } catch (error) {
    logger.error('Driver verify error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh JWT token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const result = await authService.refreshToken(refreshToken);

    if (!result.success) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    res.json({
      success: true,
      token: result.token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (userId) {
      await authService.logout(userId);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
