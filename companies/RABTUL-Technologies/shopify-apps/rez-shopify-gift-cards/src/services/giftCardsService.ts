import crypto from 'crypto';
import { GiftCard, GiftCardCreate, GiftCardTransaction, GiftCardStats } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class GiftCardsService {
  private giftCards: Map<string, GiftCard> = new Map();
  private giftCardCodes: Map<string, string> = new Map();
  private transactions: Map<string, GiftCardTransaction[]> = new Map();

  generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars[crypto.randomInt(chars.length)];
    }
    return code;
  }

  createGiftCard(data: GiftCardCreate): GiftCard {
    const id = crypto.randomUUID();
    let code = this.generateCode();
    while (this.giftCardCodes.has(code)) {
      code = this.generateCode();
    }

    const giftCard: GiftCard = {
      id,
      code,
      initialValue: data.initialValue,
      currentBalance: data.initialValue,
      currency: data.currency,
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail,
      senderName: data.senderName,
      message: data.message,
      theme: data.theme,
      status: 'active',
      expiresAt: data.expiresAt,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.giftCards.set(id, giftCard);
    this.giftCardCodes.set(code, id);
    this.transactions.set(id, []);

    this.addTransaction(id, {
      type: 'issue',
      amount: data.initialValue,
      balanceBefore: 0,
      balanceAfter: data.initialValue
    });

    logger.info(`Gift card created: ${code} with value ${data.initialValue} ${data.currency}`);
    return giftCard;
  }

  getGiftCard(id: string): GiftCard | undefined;
  getGiftCard(code: string, byCode: true): GiftCard | undefined;
  getGiftCard(identifier: string, byCode?: boolean): GiftCard | undefined {
    if (byCode) {
      const id = this.giftCardCodes.get(identifier.toUpperCase());
      return id ? this.giftCards.get(id) : undefined;
    }
    return this.giftCards.get(identifier);
  }

  private addTransaction(giftCardId: string, tx: Omit<GiftCardTransaction, 'id' | 'giftCardId' | 'createdAt'>): void {
    const giftCard = this.giftCards.get(giftCardId);
    if (!giftCard) return;

    const transaction: GiftCardTransaction = {
      id: crypto.randomUUID(),
      giftCardId,
      ...tx,
      createdAt: new Date().toISOString()
    };

    const txs = this.transactions.get(giftCardId) || [];
    txs.push(transaction);
    this.transactions.set(giftCardId, txs);
  }

  redeemGiftCard(code: string, amount: number, orderId?: string): { success: boolean; balance: number; error?: string } {
    const giftCard = this.getGiftCard(code, true);
    if (!giftCard) return { success: false, balance: 0, error: 'Gift card not found' };
    if (giftCard.status !== 'active') return { success: false, balance: giftCard.currentBalance, error: `Gift card is ${giftCard.status}` };
    if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
      giftCard.status = 'expired';
      this.giftCards.set(giftCard.id!, giftCard);
      return { success: false, balance: 0, error: 'Gift card has expired' };
    }
    if (giftCard.currentBalance < amount) {
      return { success: false, balance: giftCard.currentBalance, error: `Insufficient balance. Available: ${giftCard.currentBalance}` };
    }

    const balanceBefore = giftCard.currentBalance;
    giftCard.currentBalance = Math.round((giftCard.currentBalance - amount) * 100) / 100;
    if (giftCard.currentBalance === 0) giftCard.status = 'redeemed';
    giftCard.redeemedAt = new Date().toISOString();
    giftCard.updatedAt = new Date().toISOString();
    this.giftCards.set(giftCard.id!, giftCard);

    this.addTransaction(giftCard.id!, {
      type: 'redeem',
      amount,
      balanceBefore,
      balanceAfter: giftCard.currentBalance,
      orderId
    });

    logger.info(`Gift card ${code} redeemed: ${amount}. New balance: ${giftCard.currentBalance}`);
    return { success: true, balance: giftCard.currentBalance };
  }

  topupGiftCard(code: string, amount: number): GiftCard | undefined {
    const giftCard = this.getGiftCard(code, true);
    if (!giftCard) return undefined;
    if (giftCard.status === 'cancelled') return undefined;

    const balanceBefore = giftCard.currentBalance;
    giftCard.currentBalance = Math.round((giftCard.currentBalance + amount) * 100) / 100;
    giftCard.updatedAt = new Date().toISOString();
    this.giftCards.set(giftCard.id!, giftCard);

    this.addTransaction(giftCard.id!, {
      type: 'topup',
      amount,
      balanceBefore,
      balanceAfter: giftCard.currentBalance
    });

    return giftCard;
  }

  refundGiftCard(code: string, amount: number, orderId?: string): { success: boolean; balance: number; error?: string } {
    const giftCard = this.getGiftCard(code, true);
    if (!giftCard) return { success: false, balance: 0, error: 'Gift card not found' };
    if (giftCard.status === 'cancelled') return { success: false, balance: giftCard.currentBalance, error: 'Gift card is cancelled' };

    const balanceBefore = giftCard.currentBalance;
    giftCard.currentBalance = Math.round((giftCard.currentBalance + amount) * 100) / 100;
    if (giftCard.status === 'redeemed') giftCard.status = 'active';
    giftCard.updatedAt = new Date().toISOString();
    this.giftCards.set(giftCard.id!, giftCard);

    this.addTransaction(giftCard.id!, {
      type: 'refund',
      amount,
      balanceBefore,
      balanceAfter: giftCard.currentBalance,
      orderId
    });

    return { success: true, balance: giftCard.currentBalance };
  }

  cancelGiftCard(code: string): GiftCard | undefined {
    const giftCard = this.getGiftCard(code, true);
    if (!giftCard) return undefined;

    giftCard.status = 'cancelled';
    giftCard.updatedAt = new Date().toISOString();
    this.giftCards.set(giftCard.id!, giftCard);

    this.addTransaction(giftCard.id!, {
      type: 'expire',
      amount: giftCard.currentBalance,
      balanceBefore: giftCard.currentBalance,
      balanceAfter: 0
    });

    return giftCard;
  }

  getTransactions(giftCardId: string): GiftCardTransaction[] {
    return this.transactions.get(giftCardId) || [];
  }

  getStats(): GiftCardStats {
    const cards = Array.from(this.giftCards.values());
    const totalIssued = cards.reduce((sum, c) => sum + c.initialValue, 0);
    const totalRedeemed = cards.reduce((sum, c) => sum + (c.initialValue - c.currentBalance), 0);
    const totalBalance = cards.reduce((sum, c) => sum + c.currentBalance, 0);
    const activeCards = cards.filter(c => c.status === 'active').length;
    const expiredCards = cards.filter(c => c.status === 'expired' || (c.expiresAt && new Date(c.expiresAt) < new Date())).length;

    return {
      totalIssued: Math.round(totalIssued * 100) / 100,
      totalRedeemed: Math.round(totalRedeemed * 100) / 100,
      totalBalance: Math.round(totalBalance * 100) / 100,
      activeCards,
      expiredCards,
      avgValue: cards.length > 0 ? Math.round((totalIssued / cards.length) * 100) / 100 : 0
    };
  }
}

export const giftCardsService = new GiftCardsService();
