export interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
  bonusBalance: number;
  lastUpdated: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  category: 'topup' | 'payment' | 'refund' | 'bonus' | 'cashback' | 'commission';
  description: string;
  referenceId?: string;
  status: 'pending' | 'completed' | 'failed';
  balanceAfter: number;
  createdAt: Date;
}

export interface LoyaltyPoints {
  userId: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  lifetimePoints: number;
  pointsToNextTier: number;
  expiresAt?: Date;
}

export interface TopupRequest {
  amount: number;
  paymentMethod: 'card' | 'upi' | 'netbanking';
  paymentId?: string;
}

export interface PaymentRequest {
  amount: number;
  merchantId: string;
  reference: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { requestId: string; timestamp: number };
}