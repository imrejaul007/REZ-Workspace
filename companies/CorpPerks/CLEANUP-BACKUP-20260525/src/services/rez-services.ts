/**
 * REZ Service Connections
 * Connect PeopleOS UI to REZ ecosystem services
 */

// ─── Service URLs ──────────────────────────────────────────────────────────────

export const SERVICES = {
  // RABTUL Services
  AUTH: process.env.REZ_AUTH_URL || 'https://rez-auth-service.onrender.com',
  PROFILE: process.env.REZ_PROFILE_URL || 'https://rez-profile-service.onrender.com',
  WALLET: process.env.REZ_WALLET_URL || 'https://rez-wallet-service.onrender.com',
  PAYMENT: process.env.REZ_PAYMENT_URL || 'https://rez-payment-service.onrender.com',
  NOTIFICATIONS: process.env.REZ_NOTIFICATIONS_URL || 'https://rez-notifications-service.onrender.com',
  ANALYTICS: process.env.REZ_ANALYTICS_URL || 'https://rez-analytics-service.onrender.com',
  REFERRAL: process.env.REZ_REFERRAL_URL || 'https://rez-referral-service.onrender.com',
  REWARDS: process.env.REZ_REWARDS_URL || 'https://rez-rewards-service.onrender.com',
  GAMIFICATION: process.env.REZ_GAMIFICATION_URL || 'https://rez-gamification-service.onrender.com',

  // REZ-Media Services
  KARMA: process.env.REZ_KARMA_URL || 'https://karma.onrender.com',

  // REZ-Intelligence
  INTENT: process.env.REZ_INTENT_URL || 'https://rez-intent-predictor.rezapp.com',
  PREDICTIVE: process.env.REZ_PREDICTIVE_URL || 'https://rez-predictive-engine.rezapp.com',
  INSIGHTS: process.env.REZ_INSIGHTS_URL || 'https://rez-insights-service.rezapp.com',
  CAREER_GRAPH: process.env.REZ_CAREER_GRAPH_URL || 'https://rez-career-graph.rezapp.com',
};

// ─── API Fetch Wrapper ──────────────────────────────────────────────────────

export async function apiFetch<T>(
  baseUrl: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('rez_token') : '';

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type: 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'API Error' };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Auth Service ────────────────────────────────────────────────────────────

export const authService = {
  login: (phone: string) =>
    apiFetch(SERVICES.AUTH, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: (userId: string, otp: string) =>
    apiFetch<{ token: string; user: any }>(SERVICES.AUTH, '/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ userId, otp }),
    }),

  logout: () =>
    apiFetch(SERVICES.AUTH, '/api/auth/logout', { method: 'POST' }),
};

// ─── Profile Service ──────────────────────────────────────────────────────────

export const profileService = {
  get: (userId: string) =>
    apiFetch(SERVICES.PROFILE, `/api/profiles/${userId}`),

  update: (userId: string, data: any) =>
    apiFetch(SERVICES.PROFILE, `/api/profiles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getPersona: (userId: string, persona: 'employee' | 'candidate' | 'student') =>
    apiFetch(SERVICES.PROFILE, `/api/profiles/${userId}/persona/${persona}`),
};

// ─── Wallet Service ─────────────────────────────────────────────────────────

export const walletService = {
  getBalance: (userId: string) =>
    apiFetch<{ balance: number; wallets: Wallet[] }>(SERVICES.WALLET, `/api/wallets/${userId}`),

  getTransactions: (userId: string, walletType?: string) =>
    apiFetch(SERVICES.WALLET, `/api/wallets/${userId}/transactions${walletType ? `?type=${walletType}` : ''}`),

  transfer: (from: string, to: string, amount: number, type: string) =>
    apiFetch(SERVICES.WALLET, '/api/wallets/transfer', {
      method: 'POST',
      body: JSON.stringify({ from, to, amount, type }),
    }),
};

export interface Wallet {
  type: 'wellness' | 'learning' | 'travel' | 'food' | 'general';
  balance: number;
  budget: number;
  spent: number;
}

// ─── Gamification Service ─────────────────────────────────────────────────────

export const gamificationService = {
  getPoints: (userId: string) =>
    apiFetch<{ points: number; coins: number; level: string }>(SERVICES.GAMIFICATION, `/api/points/${userId}`),

  awardPoints: (userId: string, points: number, reason: string) =>
    apiFetch(SERVICES.GAMIFICATION, '/api/award', {
      method: 'POST',
      body: JSON.stringify({ userId, points, reason }),
    }),

  getBadges: (userId: string) =>
    apiFetch<{ badges: Badge[] }>(SERVICES.GAMIFICATION, `/api/badges/${userId}`),

  getLeaderboard: (type: 'points' | 'coins') =>
    apiFetch(SERVICES.GAMIFICATION, `/api/leaderboard?type=${type}`),
};

export interface Badge {
  id: string;
  name: string;
  icon: string;
  earnedAt: string;
}

// ─── Karma Service ──────────────────────────────────────────────────────────

export const karmaService = {
  getProfile: (userId: string) =>
    apiFetch<{
      lifetimeKarma: number;
      level: string;
      trustScore: number;
      badges: any[];
    }>(SERVICES.KARMA, `/api/karma/profile/${userId}`),

  getImpact: (userId: string) =>
    apiFetch<{ impactScore: number; eventsCompleted: number }>(SERVICES.KARMA, `/api/karma/impact/${userId}`),
};

// ─── Notifications Service ────────────────────────────────────────────────────

export const notificationsService = {
  list: (userId: string) =>
    apiFetch<{ notifications: Notification[] }>(SERVICES.NOTIFICATIONS, `/api/notifications/${userId}`),

  markRead: (notificationId: string) =>
    apiFetch(SERVICES.NOTIFICATIONS, `/api/notifications/${notificationId}/read`, { method: 'POST' }),

  subscribe: (userId: string, subscription: any) =>
    apiFetch(SERVICES.NOTIFICATIONS, '/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ userId, subscription }),
    }),
};

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

// ─── Rewards Service ────────────────────────────────────────────────────────

export const rewardsService = {
  getBalance: (userId: string) =>
    apiFetch<{ points: number; coins: number }>(SERVICES.REWARDS, `/api/balance/${userId}`),

  redeem: (userId: string, rewardId: string) =>
    apiFetch(SERVICES.REWARDS, '/api/redeem', {
      method: 'POST',
      body: JSON.stringify({ userId, rewardId }),
    }),

  getRewards: (category?: string) =>
    apiFetch(SERVICES.REWARDS, `/api/rewards${category ? `?category=${category}` : ''}`),
};

// ─── Predictive Engine (REZ-Intelligence) ───────────────────────────────────

export const predictiveService = {
  getAttritionRisk: (companyId: string) =>
    apiFetch<{ employees: AttritionRisk[] }>(SERVICES.PREDICTIVE, `/api/attrition?companyId=${companyId}`),

  getBurnoutRisk: (employeeId: string) =>
    apiFetch<{ score: number; level: string; factors: string[] }>(SERVICES.PREDICTIVE, `/api/burnout/${employeeId}`),

  getRetentionScore: (employeeId: string) =>
    apiFetch<{ score: number; recommendations: string[] }>(SERVICES.PREDICTIVE, `/api/retention/${employeeId}`),
};

export interface AttritionRisk {
  employeeId: string;
  riskScore: number;
  factors: string[];
}

// ─── Intent Service (REZ-Intelligence) ──────────────────────────────────────

export const intentService = {
  matchCandidateToJob: (candidateId: string, jobId: string) =>
    apiFetch<{ matchScore: number; skillGap: string[] }>(SERVICES.INTENT, '/api/match', {
      method: 'POST',
      body: JSON.stringify({ candidateId, jobId }),
    }),

  getRecommendedJobs: (candidateId: string, limit = 10) =>
    apiFetch(SERVICES.INTENT, `/api/recommend?candidateId=${candidateId}&limit=${limit}`),

  analyzeIntent: (userId: string) =>
    apiFetch<{ intent: string; confidence: number }>(SERVICES.INTENT, `/api/intent/${userId}`),
};

// ─── Career Graph (REZ-Intelligence) ─────────────────────────────────────────

export const careerGraphService = {
  getProfile: (userId: string) =>
    apiFetch<{
      skills: string[];
      education: Education[];
      experience: Experience[];
    }>(SERVICES.CAREER_GRAPH, `/api/career-graph/${userId}`),

  addSkill: (userId: string, skill: string) =>
    apiFetch(SERVICES.CAREER_GRAPH, '/api/skills', {
      method: 'POST',
      body: JSON.stringify({ userId, skill }),
    }),

  getCareerPath: (userId: string, targetRole: string) =>
    apiFetch(SERVICES.CAREER_GRAPH, '/api/career-path', {
      method: 'POST',
      body: JSON.stringify({ userId, targetRole }),
    }),
};

export interface Education {
  institution: string;
  degree: string;
  year: number;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
}
