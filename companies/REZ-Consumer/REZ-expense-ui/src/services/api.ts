'use client';

/**
 * REZ Expense UI - API Service
 */

const API_URL = process.env.NEXT_PUBLIC_EXPENSE_API_URL || 'http://localhost:3004';

interface Expense {
  expense_id: string;
  merchant_name: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  receipt_url?: string;
}

interface AddExpenseRequest {
  userId: string;
  merchantName: string;
  category: string;
  amount: number;
  date?: string;
  receiptUrl?: string;
}

interface Stats {
  total: number;
  count: number;
  average: number;
  by_category: Record<string, number>;
}

class ExpenseApi {
  async addExpense(request: AddExpenseRequest): Promise<{ success: boolean; data?: { expense: Expense } }> {
    try {
      const response = await fetch(`${API_URL}/api/expense/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  async getHistory(userId: string, params?: { category?: string; limit?: number }): Promise<{ success: boolean; data?: { expenses: Expense[]; total: number; total_amount: number } }> {
    try {
      const searchParams = new URLSearchParams({ userId });
      if (params?.category) searchParams.set('category', params.category);
      if (params?.limit) searchParams.set('limit', params.limit.toString());

      const response = await fetch(`${API_URL}/api/expense/history?${searchParams}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  async getStats(userId: string): Promise<{ success: boolean; data?: Stats }> {
    try {
      const response = await fetch(`${API_URL}/api/expense/stats?userId=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  async deleteExpense(id: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_URL}/api/expense/${id}`, { method: 'DELETE' });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }
}

export const expenseApi = new ExpenseApi();
