// Connect to customer360 service
// Unified customer data and profile management

import axios from 'axios';

const CUSTOMER_360_URL = process.env.EXPO_PUBLIC_CUSTOMER_360_URL || 'http://localhost:4010/api';

export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints: number;
  totalSpend: number;
  visitCount: number;
  preferences: {
    notifications: boolean;
    marketing: boolean;
    language: string;
  };
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'refund' | 'bonus';
  amount: number;
  merchantName: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface LoyaltyStatus {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  pointsToNextTier: number;
  availableRewards: number;
}

export interface Recommendation {
  id: string;
  type: 'product' | 'offer' | 'merchant';
  title: string;
  description: string;
  score: number;
  metadata: Record<string, unknown>;
}

export const customer360 = {
  url: CUSTOMER_360_URL,

  // Get customer profile
  async getProfile(customerId: string): Promise<CustomerProfile | null> {
    try {
      const res = await axios.get(`${this.url}/customers/${customerId}/profile`);
      return res.data;
    } catch {
      return null;
    }
  },

  // Get customer transactions
  async getTransactions(customerId: string, limit = 20): Promise<Transaction[]> {
    try {
      const res = await axios.get(`${this.url}/customers/${customerId}/transactions?limit=${limit}`);
      return res.data.transactions || [];
    } catch {
      return [];
    }
  },

  // Get loyalty status
  async getLoyalty(customerId: string): Promise<LoyaltyStatus | null> {
    try {
      const res = await axios.get(`${this.url}/customers/${customerId}/loyalty`);
      return res.data;
    } catch {
      return null;
    }
  },

  // Get personalized recommendations
  async getRecommendations(customerId: string, limit = 10): Promise<Recommendation[]> {
    try {
      const res = await axios.get(`${this.url}/customers/${customerId}/recommendations?limit=${limit}`);
      return res.data.recommendations || [];
    } catch {
      return [];
    }
  },

  // Get visit history
  async getVisits(customerId: string, limit = 20) {
    try {
      const res = await axios.get(`${this.url}/customers/${customerId}/visits?limit=${limit}`);
      return res.data.visits || [];
    } catch {
      return [];
    }
  },

  // Update customer preferences
  async updatePreferences(customerId: string, preferences: Partial<CustomerProfile['preferences']>) {
    const res = await axios.patch(`${this.url}/customers/${customerId}/preferences`, preferences);
    return res.data;
  },
};

export default customer360;
