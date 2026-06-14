import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_REFERRAL_API_URL || 'http://localhost:4019';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('merchant_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface MerchantCampaign {
  id: string;
  name: string;
  description?: string;
  type: string;
  budget: number;
  spent: number;
  referrerReward: { type: string; value: number };
  refereeReward?: { type: string; value: number };
  maxRewards?: number;
  maxRewardsPerUser?: number;
  minPurchaseAmount?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface MerchantStats {
  totalReferrals: number;
  qualifiedReferrals: number;
  pendingReferrals: number;
  rewardedReferrals: number;
  conversionRate: number;
  lifetimeEarnings: number;
}

export interface MerchantReferral {
  id: string;
  referrerId: string;
  refereeId: string;
  status: string;
  rewardAmount: number;
  createdAt: string;
}

// Stats API
export async function getMerchantStats(): Promise<MerchantStats> {
  const res = await api.get('/api/merchant/stats');
  return res.data;
}

// Campaigns API
export async function getMerchantCampaigns(): Promise<{ campaigns: MerchantCampaign[] }> {
  const res = await api.get('/api/campaigns?sponsorId=me');
  return res.data;
}

export async function createCampaign(data: {
  name: string;
  description?: string;
  budget?: number;
  referrerReward: { type: string; value: number };
  refereeReward?: { type: string; value: number };
  maxRewards?: number;
  minPurchaseAmount?: number;
  startDate: string;
  endDate?: string;
}): Promise<MerchantCampaign> {
  const res = await api.post('/api/campaigns', {
    ...data,
    type: 'merchant',
  });
  return res.data;
}

export async function updateCampaign(id: string, data: Partial<MerchantCampaign>): Promise<MerchantCampaign> {
  const res = await api.patch(`/api/campaigns/${id}`, data);
  return res.data;
}

export async function deleteCampaign(id: string): Promise<void> {
  await api.delete(`/api/campaigns/${id}`);
}

// Referrals API
export async function getMerchantReferrals(limit = 50): Promise<{ referrals: MerchantReferral[] }> {
  const res = await api.get(`/api/merchant/referrals?limit=${limit}`);
  return res.data;
}

// Leaderboard
export async function getMerchantLeaderboard(limit = 10): Promise<{ leaderboard: MerchantReferral[] }> {
  const res = await api.get(`/api/merchant/leaderboard?limit=${limit}`);
  return res.data;
}

export default api;
