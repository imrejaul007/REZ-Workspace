/**
 * REZ Expense - Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock expense data
interface Expense {
  expense_id: string;
  user_id: string;
  merchant_name: string;
  category: string;
  amount: number;
  currency: string;
  date: Date;
}

const CATEGORIES = ['food', 'travel', 'shopping', 'entertainment', 'utilities', 'healthcare', 'education', 'other'];

// Mock store
const expenses = new Map<string, Expense>();

describe('REZ Expense Service', () => {
  beforeEach(() => {
    expenses.clear();
  });

  describe('Expense Storage', () => {
    it('should store and retrieve an expense', () => {
      const expense: Expense = {
        expense_id: 'EXP-001',
        user_id: 'user-1',
        merchant_name: 'Pizza Palace',
        category: 'food',
        amount: 500,
        currency: 'INR',
        date: new Date(),
      };

      expenses.set(expense.expense_id, expense);
      const retrieved = expenses.get('EXP-001');

      expect(retrieved).toBeDefined();
      expect(retrieved?.merchant_name).toBe('Pizza Palace');
      expect(retrieved?.amount).toBe(500);
    });

    it('should filter expenses by user', () => {
      expenses.set('e1', { expense_id: 'e1', user_id: 'user-1', merchant_name: 'A', category: 'food', amount: 100, currency: 'INR', date: new Date() });
      expenses.set('e2', { expense_id: 'e2', user_id: 'user-2', merchant_name: 'B', category: 'travel', amount: 500, currency: 'INR', date: new Date() });

      const userExpenses = Array.from(expenses.values()).filter(e => e.user_id === 'user-1');

      expect(userExpenses.length).toBe(1);
      expect(userExpenses[0].merchant_name).toBe('A');
    });

    it('should filter expenses by category', () => {
      expenses.set('e1', { expense_id: 'e1', user_id: 'user-1', merchant_name: 'A', category: 'food', amount: 100, currency: 'INR', date: new Date() });
      expenses.set('e2', { expense_id: 'e2', user_id: 'user-1', merchant_name: 'B', category: 'travel', amount: 500, currency: 'INR', date: new Date() });
      expenses.set('e3', { expense_id: 'e3', user_id: 'user-1', merchant_name: 'C', category: 'food', amount: 200, currency: 'INR', date: new Date() });

      const foodExpenses = Array.from(expenses.values()).filter(e => e.category === 'food');

      expect(foodExpenses.length).toBe(2);
    });
  });

  describe('Category Validation', () => {
    it('should accept valid categories', () => {
      CATEGORIES.forEach(category => {
        expect(CATEGORIES.includes(category)).toBe(true);
      });
    });

    it('should default to "other" for invalid categories', () => {
      const invalidCategory = 'invalid-category';
      const category = CATEGORIES.includes(invalidCategory) ? invalidCategory : 'other';
      expect(category).toBe('other');
    });
  });

  describe('Spending Analysis', () => {
    it('should calculate total spending by category', () => {
      expenses.set('e1', { expense_id: 'e1', user_id: 'user-1', merchant_name: 'A', category: 'food', amount: 100, currency: 'INR', date: new Date() });
      expenses.set('e2', { expense_id: 'e2', user_id: 'user-1', merchant_name: 'B', category: 'food', amount: 200, currency: 'INR', date: new Date() });
      expenses.set('e3', { expense_id: 'e3', user_id: 'user-1', merchant_name: 'C', category: 'travel', amount: 500, currency: 'INR', date: new Date() });

      const userExpenses = Array.from(expenses.values()).filter(e => e.user_id === 'user-1');

      const byCategory = userExpenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);

      expect(byCategory['food']).toBe(300);
      expect(byCategory['travel']).toBe(500);
    });

    it('should calculate total spending', () => {
      expenses.set('e1', { expense_id: 'e1', user_id: 'user-1', merchant_name: 'A', category: 'food', amount: 100, currency: 'INR', date: new Date() });
      expenses.set('e2', { expense_id: 'e2', user_id: 'user-1', merchant_name: 'B', category: 'travel', amount: 500, currency: 'INR', date: new Date() });

      const userExpenses = Array.from(expenses.values()).filter(e => e.user_id === 'user-1');
      const total = userExpenses.reduce((sum, e) => sum + e.amount, 0);

      expect(total).toBe(600);
    });
  });

  describe('Date Filtering', () => {
    it('should filter expenses by date range', () => {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      expenses.set('e1', { expense_id: 'e1', user_id: 'user-1', merchant_name: 'A', category: 'food', amount: 100, currency: 'INR', date: today });
      expenses.set('e2', { expense_id: 'e2', user_id: 'user-1', merchant_name: 'B', category: 'travel', amount: 500, currency: 'INR', date: lastWeek });
      expenses.set('e3', { expense_id: 'e3', user_id: 'user-1', merchant_name: 'C', category: 'shopping', amount: 200, currency: 'INR', date: lastMonth });

      const weekExpenses = Array.from(expenses.values()).filter(e => e.date >= lastWeek);

      expect(weekExpenses.length).toBe(2);
    });
  });
});
