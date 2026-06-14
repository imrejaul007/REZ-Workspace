import { logger } from '../logger';
/**
 * RisnaEstate Gateway - Auth Routes
 * Integrates with RABTUL Auth Service
 */
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const router = Router();
const REZ_AUTH_URL = process.env.REZ_AUTH_URL || 'http://localhost:4002';
const JWT_SECRET = process.env.JWT_SECRET || 'risna-jwt-secret-change-me';

// ===== Register =====
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role = 'buyer' } = req.body;

    // Register with RABTUL Auth
    const razAuthRes = await axios.post(`${REZ_AUTH_URL}/api/auth/register`, {
      email,
      phone,
      password,
      name
    }, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
    });

    const { token: authToken, user } = razAuthRes.data.data || {};

    // Generate RisnaEstate JWT
    const jwtToken = jwt.sign({
      userId: user?.id || email,
      name,
      email,
      phone,
      role
    }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      data: {
        token: jwtToken,
        user: { id: user?.id || email, name, email, phone, role }
      }
    });
  } catch (err: any) {
    logger.error('Register error:', err.message);
    res.status(400).json({
      success: false,
      error: { code: 'REGISTRATION_FAILED', message: err.response?.data?.message || 'Registration failed' }
    });
  }
});

// ===== Login =====
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Try RABTUL Auth first
    let userData: any = null;

    try {
      const razAuthRes = await axios.post(`${REZ_AUTH_URL}/api/auth/login`, {
        email,
        password
      }, {
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
      });
      userData = razAuthRes.data.data;
    } catch {
      // RABTUL not available, check local mock user
      if (email === 'admin@risnaestate.com' && password === 'admin123') {
        userData = {
          id: 'admin_001',
          email: 'admin@risnaestate.com',
          name: 'Admin User',
          role: 'admin'
        };
      } else if (email === 'broker@risnaestate.com' && password === 'broker123') {
        userData = {
          id: 'broker_001',
          email: 'broker@risnaestate.com',
          name: 'Test Broker',
          role: 'broker'
        };
      } else if (email === 'user@risnaestate.com' && password === 'user123') {
        userData = {
          id: 'user_001',
          email: 'user@risnaestate.com',
          name: 'Test User',
          role: 'buyer'
        };
      } else {
        throw new Error('Invalid credentials');
      }
    }

    if (!userData) {
      throw new Error('Authentication failed');
    }

    // Generate JWT
    const token = jwt.sign({
      userId: userData.id || userData.userId,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role || 'buyer'
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userData.id || userData.userId,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role || 'buyer'
        }
      }
    });
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: { code: 'LOGIN_FAILED', message: 'Invalid email or password' }
    });
  }
});

// ===== Verify Token =====
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.body.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_TOKEN', message: 'Token required' }
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      success: true,
      data: {
        valid: true,
        user: decoded
      }
    });
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    });
  }
});

// ===== Forgot Password =====
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Call RABTUL Auth
    await axios.post(`${REZ_AUTH_URL}/api/auth/forgot-password`, { email }, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
    });

    res.json({
      success: true,
      data: { message: 'Password reset link sent to email' }
    });
  } catch {
    // Don't reveal if email exists
    res.json({
      success: true,
      data: { message: 'If email exists, reset link has been sent' }
    });
  }
});

// ===== Refresh Token =====
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;

    const newToken = jwt.sign({
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: { token: newToken }
    });
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' }
    });
  }
});

export default router;
