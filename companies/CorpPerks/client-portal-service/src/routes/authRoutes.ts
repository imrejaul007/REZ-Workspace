import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { loginClient } from '../services/authService.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * Client login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { email, password } = validation.data;
    const result = await loginClient(email, password);

    if (!result) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify token
 */
router.get('/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'No token provided',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwt = require('jsonwebtoken');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'corpperks-client-portal-secret-key-2024');
    res.json({
      success: true,
      data: decoded,
    });
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
});

export default router;
