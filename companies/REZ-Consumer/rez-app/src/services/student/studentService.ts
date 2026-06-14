import axios from 'axios';

const STUDENT_SERVICE_URL = process.env.REZ_STUDENT_SERVICE_URL || 'https://rez-student-service.onrender.com';

const studentApi = axios.create({
  baseURL: STUDENT_SERVICE_URL,
  timeout: 10000,
});

export interface StudentVerification {
  id: string;
  institutionId: string;
  institutionName: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  expiresAt: string;
  tier?: string;
}

export interface Institution {
  id: string;
  name: string;
  shortName: string;
  type: string;
  city: string;
}

export interface AffordableProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  merchantName: string;
  category?: string;
}

export interface StudentProfile {
  id: string;
  institution: {
    id: string;
    name: string;
    shortName: string;
  };
  tier: {
    name: string;
    badge: string;
    color: string;
    multiplier: number;
  };
  lifetimeCoins: number;
  currentCoins: number;
  totalOrders: number;
  totalSavings: number;
  referralCode: string;
  referralsCount: number;
  campusRank?: number;
  institutionRank?: number;
  nextTier?: {
    tier: string;
    coinsNeeded: number;
  };
}

export interface StudentWallet {
  id: string;
  balance: number;
  monthlyAllowance?: number;
  spentThisMonth: number;
  budgetAlertAt: number;
  parents: Array<{
    id: string;
    name: string;
    relationship: string;
  }>;
}

export interface StudentMission {
  id: string;
  missionId: string;
  title: string;
  description: string;
  coins: number;
  target: number;
  progress: number;
  percentComplete: number;
  status: 'available' | 'in_progress' | 'completed' | 'expired';
  expiresAt?: string;
  rewardClaimed: boolean;
}

export interface StudentOffer {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  rating?: number;
  address?: string;
  offer: {
    type: 'percentage' | 'fixed' | 'free_delivery' | 'bogo';
    value?: number;
    display: string;
    minOrder?: number;
  };
  popular?: boolean;
  verified?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  coins: number;
  tier: string;
}

export const studentService = {
  // Verification
  async verifyStudent(params: {
    userId: string;
    institutionId: string;
    studentIdNumber: string;
    documentType: string;
    document: File;
    email?: string;
  }): Promise<{ verificationId: string; status: string; message: string }> {
    const formData = new FormData();
    formData.append('userId', params.userId);
    formData.append('institutionId', params.institutionId);
    formData.append('studentIdNumber', params.studentIdNumber);
    formData.append('documentType', params.documentType);
    formData.append('document', params.document);
    if (params.email) {
      formData.append('email', params.email);
    }

    const response = await studentApi.post('/api/student/verify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getVerificationStatus(userId: string): Promise<StudentVerification | null> {
    const response = await studentApi.get('/api/student/verification-status', {
      params: { userId },
    });
    return response.data.isVerified ? response.data : null;
  },

  async searchInstitutions(query: string): Promise<Institution[]> {
    const response = await studentApi.get('/api/student/institutions', {
      params: { search: query, limit: 20 },
    });
    return response.data.institutions;
  },

  // Profile
  async getStudentProfile(userId: string): Promise<StudentProfile> {
    const response = await studentApi.get('/api/student/profile', {
      params: { userId },
    });
    return response.data;
  },

  // Wallet
  async getStudentWallet(userId: string): Promise<StudentWallet> {
    const response = await studentApi.get('/api/student/wallet', {
      params: { userId },
    });
    return response.data;
  },

  async requestFunding(params: {
    studentId: string;
    parentId: string;
    amount: number;
    reason?: string;
  }): Promise<{ requestId: string; status: string }> {
    const response = await studentApi.post('/api/student/wallet/request-funding', params);
    return response.data;
  },

  async getBudgetSummary(userId: string): Promise<{
    totalBudget: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    isOverBudget: boolean;
  }> {
    const response = await studentApi.get('/api/student/budget', {
      params: { userId },
    });
    return response.data;
  },

  async setBudget(params: {
    userId: string;
    institutionId: string;
    monthlyBudget: number;
    alertThreshold?: number;
  }): Promise<void> {
    await studentApi.post('/api/student/budget', params);
  },

  // Gamification
  async getMissions(userId: string): Promise<StudentMission[]> {
    const response = await studentApi.get('/api/student/missions', {
      params: { userId },
    });
    return response.data.missions;
  },

  async claimMissionReward(params: {
    userId: string;
    missionId: string;
  }): Promise<{ coins: number }> {
    const response = await studentApi.post(`/api/student/missions/${params.missionId}/claim`, {
      userId: params.userId,
    });
    return response.data;
  },

  async getCampusLeaderboard(institutionId: string, params?: {
    period?: 'weekly' | 'monthly' | 'all_time';
    page?: number;
  }): Promise<{
    rankings: LeaderboardEntry[];
    userRank?: number;
    total: number;
  }> {
    const response = await studentApi.get(`/api/student/leaderboard/${institutionId}`, {
      params: params || {},
    });
    return response.data;
  },

  // Offers
  async getStudentOffers(institutionId: string, params?: {
    category?: string;
    page?: number;
  }): Promise<{ offers: StudentOffer[]; total: number }> {
    const response = await studentApi.get(`/api/student/offers/${institutionId}`, {
      params: params || {},
    });
    return response.data;
  },

  async getPopularPartners(institutionId: string, limit?: number): Promise<StudentOffer[]> {
    const response = await studentApi.get(`/api/student/popular/${institutionId}`, {
      params: { limit: limit || 10 },
    });
    return response.data.partners;
  },

  async redeemOffer(params: {
    partnershipId: string;
    studentId: string;
    institutionId: string;
    orderId: string;
    orderAmount: number;
  }): Promise<{ discount: number; studentDiscount: number }> {
    const response = await studentApi.post('/api/student/redeem', params);
    return response.data;
  },

  // Pricing
  async calculateStudentPrice(params: {
    productId: string;
    userId: string;
    basePrice: number;
    quantity?: number;
  }): Promise<{
    originalPrice: number;
    studentPrice: number;
    discount: number;
    discountPercent: number;
    isEligible: boolean;
    reason?: string;
  }> {
    const response = await studentApi.post('/api/student/price', params);
    return response.data;
  },

  async getAffordableOptions(params: {
    maxPrice: number;
    institutionId: string;
    categoryId?: string;
  }): Promise<AffordableProduct[]> {
    const response = await studentApi.get('/api/student/affordable', {
      params: params,
    });
    return response.data.products || [];
  },

  // Referrals
  async applyReferralCode(userId: string, referralCode: string): Promise<{ success: boolean }> {
    const response = await studentApi.post('/api/student/referral/apply', {
      userId,
      referralCode,
    });
    return response.data;
  },
};
