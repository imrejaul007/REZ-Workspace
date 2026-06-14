// @ts-nocheck
import { api } from './api';
import { logger } from '@/utils/logger';

export interface SplitItem {
  userId: string;
  amount: number;
  method: 'upi' | 'card' | 'wallet' | 'cash';
  status: 'pending' | 'paid';
}

export interface SplitBillRequest {
  orderId: string;
  splits: {
    amount: number;
    method: 'upi' | 'card' | 'wallet' | 'cash';
  }[];
}

export interface SplitBillResponse {
  success: boolean;
  parentOrderId: string;
  childOrders: {
    id: string;
    amount: number;
    method: string;
  }[];
}

class SplitService {
  // Split bill among multiple people
  async splitBill(request: SplitBillRequest): Promise<SplitBillResponse | null> {
    try {
      const response = await api.post(`/orders/${request.orderId}/split`, {
        splits: request.splits.map(s => ({
          amount: s.amount,
          paymentMethod: s.method
        }))
      });

      return response.data;
    } catch (error) {
      logger.error('Split bill error', { error });
      return null;
    }
  }

  // Get split status
  async getSplitStatus(orderId: string): Promise<SplitBillResponse | null> {
    try {
      const response = await api.get(`/orders/${orderId}/splits`);
      return response.data;
    } catch (error) {
      logger.error('Get split status error', { error });
      return null;
    }
  }

  // Pay your share
  async payYourShare(splitOrderId: string, paymentMethod: string): Promise<boolean> {
    try {
      await api.post(`/orders/${splitOrderId}/pay`, {
        paymentMethod
      });
      return true;
    } catch (error) {
      logger.error('Pay share error', { error });
      return false;
    }
  }

  // Calculate fair split
  calculateFairSplit(
    totalAmount: number,
    numberOfPeople: number
  ): { perPerson: number; remainder: number } {
    const perPerson = Math.floor(totalAmount / numberOfPeople);
    const remainder = totalAmount - perPerson * numberOfPeople;
    return { perPerson, remainder };
  }

  // Validate split amounts
  validateSplit(
    totalAmount: number,
    splits: { amount: number }[]
  ): { valid: boolean; error?: string } {
    const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);

    if (Math.abs(splitTotal - totalAmount) > 0.01) {
      return {
        valid: false,
        error: `Split amounts (₹${splitTotal}) must equal total (₹${totalAmount})`
      };
    }

    for (const split of splits) {
      if (split.amount <= 0) {
        return {
          valid: false,
          error: 'Each split must be greater than 0'
        };
      }
    }

    return { valid: true };
  }
}

export const splitService = new SplitService();
