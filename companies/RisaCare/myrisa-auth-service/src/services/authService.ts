import { logger } from '../../shared/logger';
/**
 * MyRisa Auth Service
 * Integrates with RABTUL Auth (Port 4002)
 * Provides authentication for MyRisa app
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// RABTUL Auth Service URL
const RABTUL_AUTH_URL = process.env.RABTUL_AUTH_URL || 'http://localhost:4002';

// In-memory token store (replace with Redis in production)
const tokenStore = new Map<string, { userId: string; expiresAt: number }>();

// MyRisa user mapping
const myridaUserMap = new Map<string, string>(); // corpId -> MyRisa UserId

export class AuthService {
  // ============================================
  // RABTUL INTEGRATION
  // ============================================

  /**
   * Verify RABTUL token and get user
   */
  async verifyRabulToken(token: string): Promise<{
    valid: boolean;
    corpId?: string;
    userId?: string;
    error?: string;
  }> {
    try {
      // Try to verify with RABTUL
      const response = await axios.post(
        `${RABTUL_AUTH_URL}/api/auth/verify`,
        { token },
        { timeout: 5000 }
      );

      if (response.data.valid) {
        return {
          valid: true,
          corpId: response.data.corpId,
          userId: response.data.userId
        };
      }

      return { valid: false, error: 'Invalid token' };
    } catch (error) {
      // If RABTUL is unavailable, use local verification
      logger.info('RABTUL unavailable, using local verification');
      return this.localTokenVerify(token);
    }
  }

  /**
   * Local token verification (fallback)
   */
  private localTokenVerify(token: string): {
    valid: boolean;
    corpId?: string;
    userId?: string;
    error?: string;
  } {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'myrisa-secret');
      return {
        valid: true,
        corpId: (decoded as any).corpId,
        userId: (decoded as any).userId
      };
    } catch {
      return { valid: false, error: 'Token verification failed' };
    }
  }

  // ============================================
  // MYRISA SPECIFIC AUTH
  // ============================================

  /**
   * Get or create MyRisa user from CorpID
   */
  async getOrCreateMyRisaUser(corpId: string): Promise<{
    myridaUserId: string;
    token: string;
  }> {
    // Check if user already exists
    let myridaUserId = myridaUserMap.get(corpId);

    if (!myridaUserId) {
      // Create new MyRisa user
      myridaUserId = `myrisa_${uuidv4()}`;
      myridaUserMap.set(corpId, myridaUserId);
    }

    // Generate MyRisa-specific token
    const token = this.generateMyRisaToken(myridaUserId, corpId);

    return { myridaUserId, token };
  }

  /**
   * Generate MyRisa JWT token
   */
  private generateMyRisaToken(userId: string, corpId: string): string {
    const payload = {
      userId,
      corpId,
      type: 'myrisa',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'myrisa-secret', {
      expiresIn: '30d'
    });
  }

  /**
   * Verify MyRisa token
   */
  async verifyMyRisaToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    corpId?: string;
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'myrisa-secret') as any;

      // Check if it's a MyRisa token
      if (decoded.type !== 'myrisa') {
        // Try to verify as RABTUL token
        return this.verifyRabulToken(token);
      }

      return {
        valid: true,
        userId: decoded.userId,
        corpId: decoded.corpId
      };
    } catch (error) {
      // Try RABTUL verification as fallback
      return this.verifyRabulToken(token);
    }
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  /**
   * Create session
   */
  createSession(token: string, userId: string): void {
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
    tokenStore.set(token, { userId, expiresAt });
  }

  /**
   * Validate session
   */
  isSessionValid(token: string): boolean {
    const session = tokenStore.get(token);
    if (!session) return false;
    return session.expiresAt > Date.now();
  }

  /**
   * Invalidate session
   */
  invalidateSession(token: string): void {
    tokenStore.delete(token);
  }

  // ============================================
  // OAUTH HELPERS
  // ============================================

  /**
   * Generate OAuth URL for RABTUL auth
   */
  getOAuthUrl(redirectUri: string): string {
    const state = uuidv4();
    return `${RABTUL_AUTH_URL}/oauth/authorize?redirect_uri=${redirectUri}&state=${state}`;
  }

  /**
   * Exchange OAuth code for token
   */
  async exchangeOAuthCode(code: string, redirectUri: string): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    try {
      const response = await axios.post(
        `${RABTUL_AUTH_URL}/oauth/token`,
        { code, redirect_uri: redirectUri },
        { timeout: 10000 }
      );

      if (response.data.token) {
        return { success: true, token: response.data.token };
      }

      return { success: false, error: 'No token received' };
    } catch (error) {
      return { success: false, error: 'OAuth exchange failed' };
    }
  }
}

export const authService = new AuthService();