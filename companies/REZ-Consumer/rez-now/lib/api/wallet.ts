import { authClient, makeIdempotencyKey } from './client';
import { WalletBalance, WalletTransaction } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// ── Wallet Types ────────────────────────────────────────────────────────────────

export interface WalletPaymentResult {
  success: boolean;
  transactionId?: string;
  newBalance?: WalletBalance;
  message?: string;
}

export interface RoomPaymentPayload {
  bookingId: string;
  roomId: string;
  amount: number;
  description: string;
  paymentType: 'checkout' | 'deposit' | 'advance' | 'incidentals';
}

// ── Balance & Transactions ───────────────────────────────────────────────────────

export async function getWalletBalance(): Promise<WalletBalance> {
  const { data } = await authClient.get('/api/wallet/balance');
  if (!data.success) throw new Error(data.message || 'Failed to fetch wallet balance');
  return data.data as WalletBalance;
}

export async function getWalletTransactions(page = 1, limit = 20): Promise<{
  transactions: WalletTransaction[];
  pagination: { total: number; page: number; hasMore: boolean };
}> {
  const { data } = await authClient.get('/api/wallet/transactions', {
    params: { page, limit },
  });
  if (!data.success) throw new Error(data.message || 'Failed to fetch transactions');
  return { transactions: data.data, pagination: data.pagination };
}

// ── Wallet Payment Functions ────────────────────────────────────────────────────

/**
 * Pay with REZ Wallet for room checkout or other charges
 * Uses idempotency key to prevent duplicate payments
 */
export async function payWithWallet(
  bookingId: string,
  roomId: string,
  amount: number,
  description: string,
  paymentType: RoomPaymentPayload['paymentType'] = 'checkout'
): Promise<WalletPaymentResult> {
  // Validate minimum amount
  const MIN_PAYMENT = 100; // 100 paise = Rs.1
  if (amount < MIN_PAYMENT) {
    return {
      success: false,
      message: `Minimum payment amount is Rs.${MIN_PAYMENT / 100}`,
    };
  }

  // Check balance first
  const balance = await getWalletBalance();
  const amountInPaise = Math.round(amount * 100); // Convert rupees to paise if needed

  if (balance.rupees * 100 < amountInPaise) {
    return {
      success: false,
      newBalance: balance,
      message: `Insufficient wallet balance. You have Rs.${balance.rupees.toFixed(2)} but need Rs.${(amountInPaise / 100).toFixed(2)}`,
    };
  }

  try {
    const idempotencyKey = makeIdempotencyKey('wallet-payment', `${bookingId}-${roomId}`);

    const { data } = await authClient.post(
      '/api/wallet/pay',
      {
        bookingId,
        roomId,
        amount: amountInPaise,
        description,
        paymentType,
      },
      {
        headers: { 'Idempotency-Key': idempotencyKey },
      }
    );

    if (!data.success) {
      return {
        success: false,
        newBalance: balance,
        message: data.message || 'Payment failed',
      };
    }

    logger.info('Wallet payment successful', {
      bookingId,
      roomId,
      amount: amountInPaise,
      paymentType,
    });

    // Fetch new balance after payment
    const newBalance = await getWalletBalance();

    return {
      success: true,
      transactionId: data.transactionId,
      newBalance,
      message: 'Payment successful',
    };
  } catch (error) {
    logger.error('Wallet payment failed', {
      bookingId,
      roomId,
      amount: amountInPaise,
      error,
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Payment failed. Please try again.',
    };
  }
}

/**
 * Pay room checkout with wallet (convenience wrapper)
 */
export async function payCheckoutWithWallet(
  bookingId: string,
  roomId: string,
  amount: number
): Promise<WalletPaymentResult> {
  return payWithWallet(bookingId, roomId, amount, 'Room checkout payment', 'checkout');
}

/**
 * Pay room deposit with wallet
 */
export async function payDepositWithWallet(
  bookingId: string,
  roomId: string,
  amount: number
): Promise<WalletPaymentResult> {
  return payWithWallet(bookingId, roomId, amount, 'Room deposit', 'deposit');
}

/**
 * Add funds to wallet
 */
export async function addFundsToWallet(amount: number, paymentMethodId?: string): Promise<{
  success: boolean;
  newBalance?: WalletBalance;
  message?: string;
}> {
  const amountPaise = Math.round(amount * 100);

  if (amountPaise < 100) {
    return {
      success: false,
      message: 'Minimum top-up amount is Rs.1',
    };
  }

  try {
    const { data } = await authClient.post('/api/wallet/topup', {
      amount: amountPaise,
      paymentMethodId,
    });

    if (!data.success) {
      return {
        success: false,
        message: data.message || 'Top-up failed',
      };
    }

    logger.info('Wallet top-up successful', { amount: amountPaise });

    const newBalance = await getWalletBalance();

    return {
      success: true,
      newBalance,
      message: 'Top-up successful',
    };
  } catch (error) {
    logger.error('Wallet top-up failed', { amount: amountPaise, error });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Top-up failed',
    };
  }
}

/**
 * Get wallet payment history for a booking
 */
export async function getBookingWalletPayments(
  bookingId: string
): Promise<WalletTransaction[]> {
  try {
    const { data } = await authClient.get(`/api/wallet/payments/booking/${bookingId}`);
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch booking payments');
    }
    return data.transactions as WalletTransaction[];
  } catch (error) {
    logger.error('Failed to fetch booking payments', { bookingId, error });
    return [];
  }
}
