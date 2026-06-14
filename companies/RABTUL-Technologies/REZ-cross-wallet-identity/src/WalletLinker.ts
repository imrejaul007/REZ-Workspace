/**
 * WalletLinker - Links and verifies wallets across different providers
 *
 * Handles wallet linking, verification, and unlinking operations
 */

import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'eventemitter3';
import {
  Wallet,
  WalletType,
  LinkWalletRequest,
  WalletEvent,
  WalletProvider
} from './types';
import {
  WalletLinkingError,
  ValidationError,
  WalletNotFoundError
} from './errors';
import { CrossWalletIdentity } from './CrossWalletIdentity';

/**
 * Linking status for tracking verification flow
 */
export interface LinkingSession {
  sessionId: string;
  userId: string;
  walletType: WalletType;
  provider: string;
  walletAddress: string;
  status: 'pending' | 'verifying' | 'verified' | 'failed' | 'expired';
  verificationMethod?: 'sms' | 'email' | 'wallet_signature';
  attempts: number;
  createdAt: string;
  expiresAt: string;
}

/**
 * WalletLinker manages wallet linking operations
 */
export class WalletLinker {
  private readonly identity: CrossWalletIdentity;
  private linkingSessions: Map<string, LinkingSession> = new Map();
  private eventEmitter: EventEmitter;
  private readonly SESSION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

  constructor(identity: CrossWalletIdentity) {
    this.identity = identity;
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Initiate a wallet linking request
   */
  async initiateLink(
    userId: string,
    walletType: WalletType,
    provider: string,
    walletAddress: string,
    options?: { verificationMethod?: 'sms' | 'email' | 'wallet_signature' }
  ): Promise<{ sessionId: string; verificationRequired: boolean }> {
    // Validate inputs
    this.validateLinkRequest(userId, walletType, provider, walletAddress);

    // Check if wallet is already linked
    const existingWallets = this.identity.getWallets();
    const alreadyLinked = existingWallets.some(
      w => w.address === walletAddress && w.provider === provider
    );
    if (alreadyLinked) {
      throw new WalletLinkingError(
        'Wallet is already linked to this identity',
        provider,
        { walletAddress, existingWallet: true }
      );
    }

    // Create linking session
    const sessionId = uuidv4();
    const now = new Date();
    const session: LinkingSession = {
      sessionId,
      userId,
      walletType,
      provider,
      walletAddress,
      status: 'pending',
      verificationMethod: options?.verificationMethod,
      attempts: 0,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + this.SESSION_EXPIRY_MS).toISOString()
    };

    this.linkingSessions.set(sessionId, session);

    // Determine if verification is required based on provider
    const requiresVerification = this.requiresVerification(provider, walletType);

    if (!requiresVerification) {
      // Auto-verify for trusted providers
      session.status = 'verified';
      await this.completeLinking(session);
    }

    return {
      sessionId,
      verificationRequired: requiresVerification
    };
  }

  /**
   * Verify a linking session
   */
  async verifyLink(
    sessionId: string,
    verificationCode: string
  ): Promise<Wallet> {
    const session = this.linkingSessions.get(sessionId);

    if (!session) {
      throw new WalletLinkingError('Invalid or expired linking session', sessionId);
    }

    if (session.status === 'expired') {
      throw new WalletLinkingError('Linking session has expired', sessionId);
    }

    if (session.status === 'failed') {
      throw new WalletLinkingError(
        'Linking session has failed. Please start a new linking request.',
        sessionId
      );
    }

    // Increment attempts
    session.attempts++;

    // Verify the code based on method
    const isValid = await this.verifyCode(session, verificationCode);

    if (!isValid) {
      if (session.attempts >= 3) {
        session.status = 'failed';
        throw new WalletLinkingError(
          'Maximum verification attempts exceeded',
          sessionId,
          { attempts: session.attempts }
        );
      }
      throw new WalletLinkingError(
        'Invalid verification code',
        sessionId,
        { attempts: session.attempts, remaining: 3 - session.attempts }
      );
    }

    session.status = 'verified';
    return this.completeLinking(session);
  }

  /**
   * Complete the wallet linking
   */
  private async completeLinking(session: LinkingSession): Promise<Wallet> {
    const wallet = await this.identity.addWallet({
      type: session.walletType,
      provider: session.provider,
      address: session.walletAddress,
      balance: 0,
      currency: this.getCurrencyForType(session.walletType),
      linked: true,
      metadata: {
        linkingSessionId: session.sessionId,
        linkedAt: new Date().toISOString()
      }
    });

    // Emit event
    const event: WalletEvent = {
      type: 'wallet_linked',
      wallet_id: wallet.wallet_id,
      user_id: session.userId,
      timestamp: new Date().toISOString(),
      data: { wallet, provider: session.provider }
    };
    this.eventEmitter.emit('wallet_linked', event);

    // Clean up session
    this.linkingSessions.delete(session.sessionId);

    return wallet;
  }

  /**
   * Link wallet directly (for providers with built-in verification)
   */
  async linkWallet(
    userId: string,
    walletType: WalletType,
    provider: string,
    walletAddress: string,
    options?: { linkingCode?: string; verificationMethod?: 'sms' | 'email' | 'wallet_signature' }
  ): Promise<Wallet> {
    // If linking code provided, complete existing session
    if (options?.linkingCode) {
      const session = Array.from(this.linkingSessions.values()).find(
        s => s.userId === userId && s.walletAddress === walletAddress && s.status === 'pending'
      );
      if (session) {
        return this.verifyLink(session.sessionId, options.linkingCode);
      }
    }

    // Initiate new link
    const { sessionId, verificationRequired } = await this.initiateLink(
      userId,
      walletType,
      provider,
      walletAddress,
      options
    );

    if (!verificationRequired) {
      const session = this.linkingSessions.get(sessionId);
      if (session && session.status === 'verified') {
        return this.completeLinking(session);
      }
    }

    // Return existing wallet if already linked
    const existing = this.identity.getWallets().find(
      w => w.address === walletAddress && w.provider === provider
    );
    if (existing) {
      return existing;
    }

    throw new WalletLinkingError(
      'Verification required. Please complete the verification flow.',
      provider,
      { sessionId }
    );
  }

  /**
   * Unlink a wallet
   */
  async unlinkWallet(walletId: string): Promise<void> {
    const wallet = this.identity.getWallet(walletId);
    if (!wallet) {
      throw new WalletNotFoundError(walletId);
    }

    // Verify wallet can be unlinked (e.g., balance must be zero)
    if (wallet.balance > 0) {
      throw new WalletLinkingError(
        'Cannot unlink wallet with remaining balance',
        wallet.provider,
        { walletId, balance: wallet.balance }
      );
    }

    await this.identity.removeWallet(walletId);

    const event: WalletEvent = {
      type: 'wallet_unlinked',
      wallet_id: walletId,
      user_id: this.identity.getUserId(),
      timestamp: new Date().toISOString(),
      data: { wallet }
    };
    this.eventEmitter.emit('wallet_unlinked', event);
  }

  /**
   * Get linking session status
   */
  getSessionStatus(sessionId: string): LinkingSession | undefined {
    return this.linkingSessions.get(sessionId);
  }

  /**
   * Cancel a linking session
   */
  cancelSession(sessionId: string): void {
    this.linkingSessions.delete(sessionId);
  }

  /**
   * Event subscription
   */
  on(event: string, handler: (event: WalletEvent) => void): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Remove event subscription
   */
  off(event: string, handler: (event: WalletEvent) => void): void {
    this.eventEmitter.off(event, handler);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private validateLinkRequest(
    userId: string,
    walletType: WalletType,
    provider: string,
    walletAddress: string
  ): void {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    if (!Object.values(WalletType).includes(walletType)) {
      throw new ValidationError('Invalid wallet type', { walletType });
    }
    if (!provider || provider.trim() === '') {
      throw new ValidationError('Provider is required');
    }
    if (!walletAddress || walletAddress.trim() === '') {
      throw new ValidationError('Wallet address is required');
    }
  }

  private requiresVerification(provider: string, walletType: WalletType): boolean {
    // Crypto wallets always require signature verification
    if (walletType === WalletType.CRYPTO) {
      return true;
    }

    // Third-party providers require verification
    const thirdPartyProviders = [
      WalletProvider.RAZORPAY,
      WalletProvider.STRIPE,
      WalletProvider.BITCOIN
    ];
    return thirdPartyProviders.includes(provider as WalletProvider);
  }

  private getCurrencyForType(type: WalletType): string {
    switch (type) {
      case WalletType.POINTS:
        return 'PTS';
      case WalletType.CASH:
        return 'USD';
      case WalletType.CRYPTO:
        return 'ETH';
      case WalletType.GIFTCARD:
        return 'USD';
      default:
        return 'USD';
    }
  }

  private async verifyCode(
    session: LinkingSession,
    code: string
  ): Promise<boolean> {
    // In production, this would verify against actual SMS/email/wallet
    switch (session.verificationMethod) {
      case 'sms':
        return this.verifySMSCode(session.userId, code);
      case 'email':
        return this.verifyEmailCode(session.userId, code);
      case 'wallet_signature':
        return this.verifyWalletSignature(session.walletAddress, code);
      default:
        // Default verification (for testing)
        return code === '123456' || code === 'VERIFIED';
    }
  }

  private async verifySMSCode(_userId: string, _code: string): Promise<boolean> {
    // In production, integrate with SMS provider
    return true;
  }

  private async verifyEmailCode(_userId: string, _code: string): Promise<boolean> {
    // In production, verify against stored code
    return true;
  }

  private async verifyWalletSignature(_address: string, _signature: string): Promise<boolean> {
    // In production, verify cryptographic signature
    return true;
  }
}

export default WalletLinker;
