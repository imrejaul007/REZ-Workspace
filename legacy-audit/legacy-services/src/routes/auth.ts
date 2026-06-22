import { logger } from '../../shared/logger';
/**
 * REZ Workspace Authentication Routes
 * JWT-based authentication with RABTUL integration
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { rezWorkspaceHub } from '../hub-client';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'rez-workspace-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

// In-memory token store (use Redis in production)
const refreshTokens = new Map<string, { userId: string; expiresAt: Date }>();

// Demo users for testing (in production, use database)
const demoUsers = [
  { id: 'user-1', name: 'Alice Chen', email: 'alice@rtnm.digital', password: 'demo123', status: 'online', avatar: '' },
  { id: 'user-2', name: 'Bob Smith', email: 'bob@rtnm.digital', password: 'demo123', status: 'away', avatar: '' },
  { id: 'user-3', name: 'Carol Davis', email: 'carol@rtnm.digital', password: 'demo123', status: 'busy', avatar: '' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  const refreshToken = uuidv4();

  refreshTokens.set(refreshToken, {
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return { accessToken, refreshToken };
}

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// ============================================
// AUTH ROUTES
// ============================================

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
      });
    }

    // Check if user exists
    const existingUser = demoUsers.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
      });
    }

    // Create new user
    const newUser = {
      id: `user-${uuidv4().slice(0, 8)}`,
      name,
      email,
      password,
      status: 'online',
      avatar: '',
    };

    demoUsers.push(newUser);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser.id);

    // Track event
    await rezWorkspaceHub.trackEvent(newUser.id, 'user.registered');

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        status: newUser.status,
        avatar: newUser.avatar,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find user
    const user = demoUsers.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Update status
    user.status = 'online';

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Verify with RABTUL Auth
    const authResult = await rezWorkspaceHub.verifyUser(accessToken);

    // Track event
    await rezWorkspaceHub.trackEvent(user.id, 'user.login');

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = verifyToken(token);

      if (decoded) {
        const user = demoUsers.find(u => u.id === decoded.userId);
        if (user) {
          user.status = 'offline';
          await rezWorkspaceHub.trackEvent(user.id, 'user.logout');
        }
      }
    }

    // Remove refresh token if provided
    const { refreshToken } = req.body;
    if (refreshToken) {
      refreshTokens.delete(refreshToken);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Refresh token
router.post('/refresh', (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    const tokenData = refreshTokens.get(refreshToken);
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    if (tokenData.expiresAt < new Date()) {
      refreshTokens.delete(refreshToken);
      return res.status(401).json({
        success: false,
        error: 'Refresh token expired',
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenData.userId);

    // Remove old refresh token
    refreshTokens.delete(refreshToken);

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    const user = demoUsers.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get profile from RABTUL
    const profile = await rezWorkspaceHub.getUserProfile(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        avatar: user.avatar,
      },
      profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update profile
router.put('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    const user = demoUsers.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { name, avatar } = req.body;

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update status
router.patch('/me/status', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    const user = demoUsers.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { status } = req.body;
    const validStatuses = ['online', 'away', 'busy', 'offline'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }

    user.status = status;

    res.json({
      success: true,
      status: user.status,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Change password
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    const user = demoUsers.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (currentPassword !== user.password) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters',
      });
    }

    user.password = newPassword;

    // Track event
    await rezWorkspaceHub.trackEvent(user.id, 'user.password_changed');

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Forgot password (send reset email)
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const user = demoUsers.find(u => u.email === email);
    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent',
      });
    }

    // In production, send actual email
    // For demo, just log and return success
    logger.info(`Password reset requested for: ${email}`);

    res.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Reset password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required',
      });
    }

    // In production, verify reset token
    // For demo, just return success
    logger.info(`Password reset with token: ${token}`);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;