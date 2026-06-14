// RisaCare - RABTUL Services Integration Client

import { generateId, logger } from '../../shared/utils';

// ============================================
// CONFIG
// ============================================

export const RABTUL_SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  PAYMENT: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001',
  WALLET: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
  NOTIFY: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011',
  BOOKING: process.env.BOOKING_SERVICE_URL || 'http://localhost:4020',
  PROFILE: process.env.PROFILE_SERVICE_URL || 'http://localhost:4013'
} as const;

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';

// ============================================
// AUTH SERVICE (Port 4002)
// ============================================

export interface AuthUser {
  userId: string;
  email: string;
  phone?: string;
  name?: string;
  createdAt: string;
}

export async function verifyUserToken(token: string): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.AUTH}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) return null;
    const data = await response.json() as { user?: AuthUser };
    return data.user || null;
  } catch (error) {
    logger.error('Failed to verify user token', error as Error);
    return null;
  }
}

export async function sendOTP(phone: string): Promise<{ success: boolean; messageId?: string }> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.AUTH}/api/auth/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify({ phone })
    });

    const data = await response.json() as { success: boolean; messageId?: string };
    return data;
  } catch (error) {
    logger.error('Failed to send OTP', error as Error);
    return { success: false };
  }
}

export async function verifyOTP(phone: string, otp: string): Promise<{ success: boolean; token?: string; userId?: string }> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.AUTH}/api/auth/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify({ phone, otp })
    });

    const data = await response.json() as { success: boolean; token?: string; userId?: string };
    return data;
  } catch (error) {
    logger.error('Failed to verify OTP', error as Error);
    return { success: false };
  }
}

export async function registerUser(email: string, phone: string, name?: string): Promise<{ success: boolean; userId?: string }> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.AUTH}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify({ email, phone, name })
    });

    const data = await response.json() as { success: boolean; userId?: string };
    return data;
  } catch (error) {
    logger.error('Failed to register user', error as Error);
    return { success: false };
  }
}

// ============================================
// WALLET SERVICE (Port 4004)
// ============================================

export interface WalletBalance {
  userId: string;
  balance: number;
  coins: number;
  currency: string;
}

export async function getWalletBalance(userId: string): Promise<WalletBalance | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.WALLET}/api/wallet/balance/${userId}`, {
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN
      }
    });

    if (!response.ok) return null;
    const data = await response.json() as WalletBalance;
    return data;
  } catch (error) {
    logger.error('Failed to get wallet balance', error as Error);
    return null;
  }
}

export async function addCoins(userId: string, amount: number, reason: string): Promise<{ transactionId: string; newBalance: number } | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.WALLET}/api/wallet/coins/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify({ userId, amount, reason })
    });

    const data = await response.json() as { transactionId: string; newBalance: number };
    return data;
  } catch (error) {
    logger.error('Failed to add coins', error as Error);
    return null;
  }
}

export async function deductCoins(userId: string, amount: number, reason: string): Promise<{ transactionId: string; newBalance: number } | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.WALLET}/api/wallet/coins/deduct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify({ userId, amount, reason })
    });

    const data = await response.json() as { transactionId: string; newBalance: number };
    return data;
  } catch (error) {
    logger.error('Failed to deduct coins', error as Error);
    return null;
  }
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  createdAt: string;
}

export async function getTransactions(userId: string, limit = 50): Promise<{ transactions: Transaction[]; total: number } | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.WALLET}/api/wallet/transactions/${userId}?limit=${limit}`, {
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN
      }
    });

    const data = await response.json() as { transactions: Transaction[]; total: number };
    return data;
  } catch (error) {
    logger.error('Failed to get transactions', error as Error);
    return null;
  }
}

// ============================================
// PAYMENT SERVICE (Port 4001)
// ============================================

export interface PaymentResult {
  paymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  method: string;
}

export async function createPayment(userId: string, amount: number, orderId: string): Promise<PaymentResult | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.PAYMENT}/api/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify({ userId, amount, orderId })
    });

    const data = await response.json() as PaymentResult;
    return data;
  } catch (error) {
    logger.error('Failed to create payment', error as Error);
    return null;
  }
}

export async function verifyPayment(paymentId: string): Promise<{ valid: boolean; amount?: number; status?: string } | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.PAYMENT}/api/payments/verify/${paymentId}`, {
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN
      }
    });

    const data = await response.json() as { valid: boolean; amount?: number; status?: string };
    return data;
  } catch (error) {
    logger.error('Failed to verify payment', error as Error);
    return null;
  }
}

export async function refundPayment(paymentId: string, amount?: number): Promise<{ success: boolean; refundId?: string } | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.PAYMENT}/api/payments/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify({ paymentId, amount })
    });

    const data = await response.json() as { success: boolean; refundId?: string };
    return data;
  } catch (error) {
    logger.error('Failed to refund payment', error as Error);
    return null;
  }
}

// ============================================
// NOTIFICATION SERVICE (Port 4011)
// ============================================

export type NotificationChannel = 'push' | 'sms' | 'email' | 'whatsapp';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  data?: Record<string, unknown>;
}

export async function sendNotification(payload: NotificationPayload): Promise<{ messageId: string; channel: NotificationChannel }[] | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.NOTIFY}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json() as { messageId: string; channel: NotificationChannel }[];
    return data;
  } catch (error) {
    logger.error('Failed to send notification', error as Error);
    return null;
  }
}

export async function sendBulkNotifications(payloads: NotificationPayload[]): Promise<{ success: number; failed: number } | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.NOTIFY}/api/notifications/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify({ notifications: payloads })
    });

    const data = await response.json() as { success: number; failed: number };
    return data;
  } catch (error) {
    logger.error('Failed to send bulk notifications', error as Error);
    return null;
  }
}

// ============================================
// BOOKING SERVICE (Port 4020)
// ============================================

export interface BookingResponse {
  bookingId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  providerType: 'doctor' | 'lab' | 'pharmacy';
  scheduledAt?: string;
}

export async function createBooking(
  userId: string,
  providerId: string,
  providerType: 'doctor' | 'lab' | 'pharmacy',
  scheduledAt?: string
): Promise<BookingResponse | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.BOOKING}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify({
        bookingId: generateId('bk'),
        userId,
        providerId,
        providerType,
        scheduledAt
      })
    });

    const data = await response.json() as BookingResponse;
    return data;
  } catch (error) {
    logger.error('Failed to create booking', error as Error);
    return null;
  }
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<{ success: boolean; refundId?: string } | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.BOOKING}/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify({ reason })
    });

    const data = await response.json() as { success: boolean; refundId?: string };
    return data;
  } catch (error) {
    logger.error('Failed to cancel booking', error as Error);
    return null;
  }
}

// ============================================
// PROFILE SERVICE (Port 4013)
// ============================================

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.PROFILE}/api/profiles/${userId}`, {
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN
      }
    });

    if (!response.ok) return null;
    const data = await response.json() as UserProfile;
    return data;
  } catch (error) {
    logger.error('Failed to get user profile', error as Error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${RABTUL_SERVICES.PROFILE}/api/profiles/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json() as UserProfile;
    return data;
  } catch (error) {
    logger.error('Failed to update user profile', error as Error);
    return null;
  }
}

// ============================================
// EXPORTS
// ============================================

export const rabtulClient = {
  auth: {
    verifyToken: verifyUserToken,
    sendOTP,
    verifyOTP,
    register: registerUser
  },
  wallet: {
    getBalance: getWalletBalance,
    addCoins,
    deductCoins,
    getTransactions
  },
  payment: {
    create: createPayment,
    verify: verifyPayment,
    refund: refundPayment
  },
  notification: {
    send: sendNotification,
    sendBulk: sendBulkNotifications
  },
  booking: {
    create: createBooking,
    cancel: cancelBooking
  },
  profile: {
    get: getUserProfile,
    update: updateUserProfile
  }
};

export default rabtulClient;
