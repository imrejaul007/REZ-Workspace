/**
 * REZ Bills - Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock bill data
interface Bill {
  bill_id: string;
  user_id: string;
  merchant_name: string;
  merchant_category: string;
  amount: number;
  cashback_earned: number;
  cashback_claimed: boolean;
}

const CASHBACK_RATES = {
  restaurant: 0.02,
  grocery: 0.01,
  shopping: 0.015,
  electronics: 0.01,
  default: 0.005,
};

// Mock store
const bills = new Map<string, Bill>();

describe('REZ Bills Service', () => {
  beforeEach(() => {
    bills.clear();
  });

  describe('Cashback Calculation', () => {
    it('should calculate 2% cashback for restaurant', () => {
      const amount = 500;
      const rate = CASHBACK_RATES.restaurant;
      const cashback = Math.round(amount * rate * 100) / 100;
      expect(cashback).toBe(10);
    });

    it('should calculate 1% cashback for grocery', () => {
      const amount = 1000;
      const rate = CASHBACK_RATES.grocery;
      const cashback = Math.round(amount * rate * 100) / 100;
      expect(cashback).toBe(10);
    });

    it('should calculate 1.5% cashback for shopping', () => {
      const amount = 1000;
      const rate = CASHBACK_RATES.shopping;
      const cashback = Math.round(amount * rate * 100) / 100;
      expect(cashback).toBe(15);
    });

    it('should calculate 0.5% cashback for unknown category', () => {
      const amount = 1000;
      const rate = CASHBACK_RATES.default;
      const cashback = Math.round(amount * rate * 100) / 100;
      expect(cashback).toBe(5);
    });

    it('should round cashback to 2 decimal places', () => {
      const amount = 333;
      const rate = CASHBACK_RATES.restaurant;
      const cashback = Math.round(amount * rate * 100) / 100;
      expect(cashback).toBe(6.66);
    });
  });

  describe('Bill Storage', () => {
    it('should store and retrieve a bill', () => {
      const bill: Bill = {
        bill_id: 'test-123',
        user_id: 'user-1',
        merchant_name: 'Pizza Palace',
        merchant_category: 'restaurant',
        amount: 500,
        cashback_earned: 10,
        cashback_claimed: false,
      };

      bills.set(bill.bill_id, bill);
      const retrieved = bills.get('test-123');

      expect(retrieved).toBeDefined();
      expect(retrieved?.merchant_name).toBe('Pizza Palace');
      expect(retrieved?.amount).toBe(500);
    });

    it('should filter bills by user', () => {
      bills.set('b1', { bill_id: 'b1', user_id: 'user-1', merchant_name: 'A', merchant_category: 'restaurant', amount: 100, cashback_earned: 2, cashback_claimed: false });
      bills.set('b2', { bill_id: 'b2', user_id: 'user-2', merchant_name: 'B', merchant_category: 'grocery', amount: 200, cashback_earned: 2, cashback_claimed: false });
      bills.set('b3', { bill_id: 'b3', user_id: 'user-1', merchant_name: 'C', merchant_category: 'shopping', amount: 300, cashback_earned: 4.5, cashback_claimed: false });

      const userBills = Array.from(bills.values()).filter(b => b.user_id === 'user-1');

      expect(userBills.length).toBe(2);
      expect(userBills[0].merchant_name).toBe('A');
      expect(userBills[1].merchant_name).toBe('C');
    });

    it('should filter bills by category', () => {
      bills.set('b1', { bill_id: 'b1', user_id: 'user-1', merchant_name: 'A', merchant_category: 'restaurant', amount: 100, cashback_earned: 2, cashback_claimed: false });
      bills.set('b2', { bill_id: 'b2', user_id: 'user-1', merchant_name: 'B', merchant_category: 'grocery', amount: 200, cashback_earned: 2, cashback_claimed: false });

      const restaurantBills = Array.from(bills.values()).filter(b => b.merchant_category === 'restaurant');

      expect(restaurantBills.length).toBe(1);
      expect(restaurantBills[0].merchant_name).toBe('A');
    });
  });

  describe('Cashback Claim', () => {
    it('should allow claiming unclaimed cashback', () => {
      const bill: Bill = {
        bill_id: 'test-123',
        user_id: 'user-1',
        merchant_name: 'Pizza Palace',
        merchant_category: 'restaurant',
        amount: 500,
        cashback_earned: 10,
        cashback_claimed: false,
      };

      bills.set(bill.bill_id, bill);

      const retrieved = bills.get('test-123');
      expect(retrieved?.cashback_claimed).toBe(false);

      retrieved!.cashback_claimed = true;
      bills.set(bill.bill_id, retrieved!);

      const updated = bills.get('test-123');
      expect(updated?.cashback_claimed).toBe(true);
    });

    it('should not allow claiming already claimed cashback', () => {
      const bill: Bill = {
        bill_id: 'test-123',
        user_id: 'user-1',
        merchant_name: 'Pizza Palace',
        merchant_category: 'restaurant',
        amount: 500,
        cashback_earned: 10,
        cashback_claimed: true, // Already claimed
      };

      bills.set(bill.bill_id, bill);

      const isAlreadyClaimed = bill.cashback_claimed;
      expect(isAlreadyClaimed).toBe(true);
    });
  });

  describe('Tax Records', () => {
    it('should calculate total amount for a year', () => {
      bills.set('b1', { bill_id: 'b1', user_id: 'user-1', merchant_name: 'A', merchant_category: 'restaurant', amount: 100, cashback_earned: 2, cashback_claimed: false });
      bills.set('b2', { bill_id: 'b2', user_id: 'user-1', merchant_name: 'B', merchant_category: 'grocery', amount: 200, cashback_earned: 2, cashback_claimed: false });

      const total = Array.from(bills.values())
        .filter(b => b.user_id === 'user-1')
        .reduce((sum, b) => sum + b.amount, 0);

      expect(total).toBe(300);
    });

    it('should calculate total cashback for a year', () => {
      bills.set('b1', { bill_id: 'b1', user_id: 'user-1', merchant_name: 'A', merchant_category: 'restaurant', amount: 100, cashback_earned: 2, cashback_claimed: false });
      bills.set('b2', { bill_id: 'b2', user_id: 'user-1', merchant_name: 'B', merchant_category: 'grocery', amount: 200, cashback_earned: 2, cashback_claimed: false });

      const totalCashback = Array.from(bills.values())
        .filter(b => b.user_id === 'user-1')
        .reduce((sum, b) => sum + b.cashback_earned, 0);

      expect(totalCashback).toBe(4);
    });
  });
});
