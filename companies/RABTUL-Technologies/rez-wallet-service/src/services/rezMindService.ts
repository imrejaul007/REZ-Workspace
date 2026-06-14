/**
 * REZ Mind Integration Service - Wallet Service
 * Sends wallet events to Event Platform
 */

import axios from 'axios';
import { logger } from '../config/logger';

const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4008';

interface WalletTopupEvent {
  user_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  balance_after?: number;
}

interface WalletWithdrawEvent {
  user_id: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  transaction_id: string;
}

export async function sendWalletTopupToRezMind(event: WalletTopupEvent): Promise<void> {
  try {
    await axios.post(`${REZ_MIND_URL}/webhook/wallet/topup`, {
      user_id: event.user_id,
      amount: event.amount,
      payment_method: event.payment_method,
      transaction_id: event.transaction_id,
      balance_after: event.balance_after,
      source: 'wallet_service',
    });
    logger.info('[REZ Mind] Wallet topup event sent', { user_id: event.user_id, amount: event.amount });
  } catch (error) {
    const err = error as { message?: string };
    logger.warn('[REZ Mind] Failed to send wallet topup', {
      user_id: event.user_id,
      error: err.message,
    });
  }
}

export async function sendWalletWithdrawToRezMind(event: WalletWithdrawEvent): Promise<void> {
  try {
    await axios.post(`${REZ_MIND_URL}/webhook/wallet/withdraw`, {
      user_id: event.user_id,
      amount: event.amount,
      status: event.status,
      transaction_id: event.transaction_id,
      source: 'wallet_service',
    });
    logger.info('[REZ Mind] Wallet withdraw event sent', { user_id: event.user_id, amount: event.amount });
  } catch (error) {
    const err = error as { message?: string };
    logger.warn('[REZ Mind] Failed to send wallet withdraw', {
      user_id: event.user_id,
      error: err.message,
    });
  }
}
