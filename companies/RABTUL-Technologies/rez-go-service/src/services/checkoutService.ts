import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { GoSession } from '../models/GoSession.js';
import { sessionService } from './sessionService.js';
import { fraudService } from './fraudService.js';
import { cashbackService } from './cashbackService.js';
import { paymentIntegration } from '../integrations/paymentIntegration.js';
import { walletIntegration } from '../integrations/walletIntegration.js';
import { config } from '../config/index.js';

export interface CheckoutParams {
  sessionId: string;
  userId: string;
  paymentMethod: 'upi' | 'wallet' | 'card' | 'split';
  coinsToRedeem?: number;
  exitLocation?: { lat: number; lng: number };
}

export interface CheckoutResult {
  success: boolean;
  session: any;
  payment?: {
    id: string;
    method: string;
    amount: number;
    status: string;
  };
  cashback?: {
    earned: number;
    credited: boolean;
  };
  receipt?: {
    receiptId: string;
    storeName: string;
    items: any[];
    subtotal: number;
    tax: number;
    total: number;
    cashbackEarned: number;
    paidAt: Date;
  };
  error?: string;
}

export class CheckoutService {
  /**
   * Process checkout
   */
  async checkout(params: CheckoutParams): Promise<CheckoutResult> {
    const { sessionId, userId, paymentMethod, coinsToRedeem = 0, exitLocation } = params;

    // Get session
    const session = await sessionService.getSessionForUser(sessionId, userId);
    if (!session) {
      return { success: false, session: null, error: 'Session not found' };
    }

    if (session.status !== 'active') {
      return { success: false, session: null, error: 'Session is not active' };
    }

    if (session.items.length === 0) {
      return { success: false, session: null, error: 'Cart is empty' };
    }

    try {
      // Step 1: Calculate final totals
      sessionService.recalculateTotals(session);

      // Step 2: Fraud check
      const fraudResult = await fraudService.calculateFraudScore(sessionId);

      if (fraudResult.risk === 'high' && !session.exitVerified) {
        return {
          success: false,
          session: null,
          error: 'High fraud risk detected. Exit verification required.',
        };
      }

      // Step 3: Process payment
      let paymentResult;
      let finalAmount = session.total;

      // If using wallet, check balance
      if (paymentMethod === 'wallet') {
        const balance = await walletIntegration.getBalance(userId);
        if (balance < finalAmount) {
          return {
            success: false,
            session: null,
            error: `Insufficient wallet balance. Required: ₹${finalAmount}, Available: ₹${balance}`,
          };
        }
      }

      // Process payment based on method
      switch (paymentMethod) {
        case 'upi':
          paymentResult = await paymentIntegration.initiateUPI(sessionId, finalAmount);
          break;
        case 'wallet':
          paymentResult = await paymentIntegration.processWalletPayment(
            sessionId,
            userId,
            finalAmount
          );
          break;
        case 'card':
          paymentResult = await paymentIntegration.initiateCardPayment(sessionId, finalAmount);
          break;
        case 'split':
          // Split payment: part wallet, part UPI
          const walletAmount = coinsToRedeem > 0 ? Math.min(coinsToRedeem, finalAmount) : 0;
          const upiAmount = finalAmount - walletAmount;
          paymentResult = await paymentIntegration.processSplitPayment(
            sessionId,
            userId,
            walletAmount,
            upiAmount
          );
          break;
      }

      if (!paymentResult.success) {
        return { success: false, session: null, error: paymentResult.error };
      }

      // Step 4: Complete session
      const completedSession = await sessionService.completeSession(sessionId, userId, {
        paymentMethod,
        paymentId: paymentResult.paymentId,
        exitLocation,
      });

      // Step 5: Credit cashback
      let cashbackCredited = false;
      if (completedSession.cashbackEarned > 0) {
        cashbackCredited = await cashbackService.creditCashback(
          userId,
          sessionId,
          completedSession.cashbackEarned
        );
      }

      // Step 6: Generate receipt
      const receipt = this.generateReceipt(completedSession);

      return {
        success: true,
        session: completedSession,
        payment: {
          id: paymentResult.paymentId!,
          method: paymentMethod,
          amount: finalAmount,
          status: 'completed',
        },
        cashback: {
          earned: completedSession.cashbackEarned,
          credited: cashbackCredited,
        },
        receipt,
      };
    } catch (error) {
      console.error('Checkout error:', error);
      return {
        success: false,
        session: null,
        error: error instanceof Error ? error.message : 'Checkout failed',
      };
    }
  }

  /**
   * Generate HMAC-signed exit token
   */
  generateExitToken(sessionId: string): {
    token: string;
    signature: string;
    expiresAt: Date;
  } {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minute window

    const payload = `${sessionId}:${expiresAt.getTime()}`;
    const signature = crypto
      .createHmac('sha256', config.JWT_SECRET)
      .update(payload)
      .digest('hex');

    const token = Buffer.from(`${payload}:${signature}`).toString('base64url');

    return { token, signature, expiresAt };
  }

  /**
   * Verify HMAC-signed exit token
   */
  verifyExitToken(sessionId: string, token: string): {
    valid: boolean;
    error?: string;
  } {
    try {
      // Decode base64url token
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split(':');

      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid token format' };
      }

      const [tokenSessionId, expiresAtStr, providedSignature] = parts;

      // Verify session ID matches
      if (tokenSessionId !== sessionId) {
        return { valid: false, error: 'Session ID mismatch' };
      }

      // Verify expiration
      const expiresAt = new Date(parseInt(expiresAtStr, 10));
      if (Date.now() > expiresAt.getTime()) {
        return { valid: false, error: 'Exit token expired' };
      }

      // Verify HMAC signature
      const payload = `${tokenSessionId}:${expiresAtStr}`;
      const expectedSignature = crypto
        .createHmac('sha256', config.JWT_SECRET)
        .update(payload)
        .digest('hex');

      // Timing-safe comparison
      if (!crypto.timingSafeEqual(
        Buffer.from(providedSignature),
        Buffer.from(expectedSignature)
      )) {
        return { valid: false, error: 'Invalid token signature' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Token verification failed' };
    }
  }

  /**
   * Verify exit
   */
  async verifyExit(sessionId: string, userId: string, exitToken?: string): Promise<{
    success: boolean;
    verified: boolean;
    error?: string;
  }> {
    const session = await sessionService.getSessionForUser(sessionId, userId);
    if (!session) {
      return { success: false, verified: false, error: 'Session not found' };
    }

    // Check if already verified
    if (session.exitVerified) {
      return { success: true, verified: true };
    }

    // Generate new exit token if none provided
    if (!exitToken) {
      const { token, expiresAt } = this.generateExitToken(sessionId);
      // Store token in session for later verification
      await this.storeExitToken(sessionId, token, expiresAt);
      return {
        success: true,
        verified: false,
        exitToken: token,
        expiresAt,
      };
    }

    // Verify HMAC-signed token
    const verification = this.verifyExitToken(sessionId, exitToken);
    if (!verification.valid) {
      return { success: false, verified: false, error: verification.error };
    }

    // Check if token was already used
    const tokenUsed = await this.isExitTokenUsed(sessionId, exitToken);
    if (tokenUsed) {
      return { success: false, verified: false, error: 'Exit token already used' };
    }

    // Mark token as used
    await this.markExitTokenUsed(sessionId, exitToken);

    // Update session
    session.exitVerified = true;
    session.exitVerifiedAt = new Date();
    await session.save();

    // Re-check fraud score after verification
    if (session.fraudScore >= 50) {
      // If still high risk, flag for audit
      session.auditRequired = true;
      await session.save();
    }

    return { success: true, verified: true };
  }

  /**
   * Generate HMAC-signed exit QR code for verification
   */
  async generateExitQR(sessionId: string, userId: string): Promise<{
    qrData: string;
    expiresAt: Date;
  }> {
    const session = await sessionService.getSessionForUser(sessionId, userId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Generate HMAC-signed token
    const { token, expiresAt } = this.generateExitToken(sessionId);

    // Format: REZG:{base64url-encoded-token}
    const qrData = `REZG:${token}`;

    return { qrData, expiresAt };
  }

  /**
   * Verify HMAC-signed exit QR
   */
  async verifyExitQR(exitQR: string): Promise<{
    valid: boolean;
    sessionId?: string;
    error?: string;
  }> {
    // Parse QR: REZG:{token}
    if (!exitQR.startsWith('REZG:')) {
      return { valid: false, error: 'Invalid QR format' };
    }

    const token = exitQR.slice(5); // Remove 'REZG:' prefix
    if (!token) {
      return { valid: false, error: 'Missing token' };
    }

    // Decode base64url to get sessionId
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const sessionId = decoded.split(':')[0];
      const expiresAt = parseInt(decoded.split(':')[1], 10);

      // Check expiration
      if (Date.now() > expiresAt) {
        return { valid: false, error: 'Exit QR expired' };
      }

      // Verify HMAC signature
      const verification = this.verifyExitToken(sessionId, token);
      if (!verification.valid) {
        return { valid: false, error: verification.error };
      }

      return { valid: true, sessionId };
    } catch {
      return { valid: false, error: 'Invalid QR token' };
    }
  }

  /**
   * Store exit token for later verification
   */
  private async storeExitToken(sessionId: string, token: string, expiresAt: Date): Promise<void> {
    // In production, store in Redis with TTL
    // For now, store in session metadata
    await GoSession.updateOne(
      { sessionId },
      {
        $set: {
          'metadata.exitToken': token,
          'metadata.exitTokenExpiresAt': expiresAt,
        },
      }
    );
  }

  /**
   * Check if exit token was already used
   */
  private async isExitTokenUsed(sessionId: string, token: string): Promise<boolean> {
    // In production, use Redis SET to track used tokens
    // For now, check session metadata
    const session = await GoSession.findOne({ sessionId, 'metadata.usedExitTokens': token });
    return !!session;
  }

  /**
   * Mark exit token as used
   */
  private async markExitTokenUsed(sessionId: string, token: string): Promise<void> {
    await GoSession.updateOne(
      { sessionId },
      {
        $addToSet: { 'metadata.usedExitTokens': token },
      }
    );
  }

  /**
   * Generate receipt
   */
  private generateReceipt(session: any): any {
    return {
      receiptId: `GORE-${uuidv4().substring(0, 8).toUpperCase()}`,
      storeName: session.storeName,
      storeId: session.storeId,
      sessionId: session.sessionId,
      items: session.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      subtotal: session.subtotal,
      tax: session.tax,
      total: session.total,
      cashbackEarned: session.cashbackEarned,
      savings: session.savings,
      paidAt: new Date(),
      paymentMethod: session.paymentMethod,
      paymentId: session.paymentId,
    };
  }

  /**
   * Get receipt
   */
  async getReceipt(sessionId: string, userId: string): Promise<any> {
    const session = await sessionService.getSessionForUser(sessionId, userId);
    if (!session || session.status !== 'completed') {
      throw new Error('Receipt not found');
    }

    return this.generateReceipt(session);
  }
}

export const checkoutService = new CheckoutService();
