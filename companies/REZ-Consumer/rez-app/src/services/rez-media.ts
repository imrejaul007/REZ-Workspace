/**
 * REZ Consumer App - Media Services
 * QR Campaigns, Karma, Gamification, Abandonment
 */

// =============================================================================
// Environment Configuration
// =============================================================================

const QR_SERVICE = process.env.EXPO_PUBLIC_QR_SERVICE || 'https://adsqr.rezapp.com';
const KARMA_SERVICE = process.env.EXPO_PUBLIC_KARMA_SERVICE || 'https://karma-service.rezapp.com';
const GAMIFICATION_SERVICE = process.env.EXPO_PUBLIC_GAMIFICATION_SERVICE || 'https://REZ-gamification-service.rezapp.com';
const ABANDONMENT_SERVICE = process.env.EXPO_PUBLIC_ABANDONMENT_SERVICE;

// =============================================================================
// HTTP Client
// =============================================================================

async function fetchMedia<T>(
  serviceUrl: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  if (!serviceUrl) {
    return { success: false, error: 'Service not configured' };
  }

  try {
    const response = await fetch(`${serviceUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// =============================================================================
// QR Campaign Service
// =============================================================================

export const QRCampaignService = {
  async getCampaigns() {
    return fetchMedia(QR_SERVICE, '/api/campaigns');
  },

  async getCampaign(campaignId: string) {
    return fetchMedia(QR_SERVICE, `/api/campaigns/${campaignId}`);
  },

  async generateQR(campaignId: string) {
    return fetchMedia<{ qrUrl: string; shortUrl: string }>(
      QR_SERVICE,
      `/api/campaigns/${campaignId}/qr`
    );
  },

  async recordScan(data: {
    campaignId: string;
    userId?: string;
    phone?: string;
    location?: { lat: number; lng: number };
  }) {
    return fetchMedia(QR_SERVICE, '/api/scan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getScanHistory(userId: string) {
    return fetchMedia(QR_SERVICE, `/api/scans/history/${userId}`);
  },
};

// =============================================================================
// Karma Service
// =============================================================================

export const KarmaService = {
  async getProfile(userId: string) {
    return fetchMedia<{
      userId: string;
      karmaPoints: number;
      level: number;
      streak: number;
    }>(KARMA_SERVICE, `/api/karma/user/${userId}`);
  },

  async earnPoints(
    userId: string,
    data: { points: number; reason: string; source: string }
  ) {
    return fetchMedia(KARMA_SERVICE, '/api/karma/earn', {
      method: 'POST',
      body: JSON.stringify({ userId, ...data }),
    });
  },

  async redeemPoints(
    userId: string,
    data: { points: number; rewardType: string }
  ) {
    return fetchMedia(KARMA_SERVICE, '/api/karma/redeem', {
      method: 'POST',
      body: JSON.stringify({ userId, ...data }),
    });
  },

  async getHistory(userId: string, limit = 20) {
    return fetchMedia(KARMA_SERVICE, `/api/karma/history/${userId}?limit=${limit}`);
  },

  async verifyCheckin(
    userId: string,
    data: { qrCode: string; location: { lat: number; lng: number } }
  ) {
    return fetchMedia(KARMA_SERVICE, '/api/karma/verify/checkin', {
      method: 'POST',
      body: JSON.stringify({ userId, ...data }),
    });
  },
};

// =============================================================================
// Gamification Service
// =============================================================================

export const GamificationService = {
  async getProfile(userId: string) {
    return fetchMedia(GAMIFICATION_SERVICE, `/api/gamification/profile/${userId}`);
  },

  async awardBadge(userId: string, badgeId: string) {
    return fetchMedia(GAMIFICATION_SERVICE, '/api/gamification/badge', {
      method: 'POST',
      body: JSON.stringify({ userId, badgeId }),
    });
  },

  async addStreak(userId: string, streakType: 'order' | 'checkin') {
    return fetchMedia(GAMIFICATION_SERVICE, '/api/gamification/streak', {
      method: 'POST',
      body: JSON.stringify({ userId, streakType }),
    });
  },

  async getBadges() {
    return fetchMedia<{ badges: Array<{ id: string; name: string; description: string; icon: string }> }>(
      GAMIFICATION_SERVICE,
      '/api/gamification/badges'
    );
  },

  async getLeaderboard(
    storeSlug?: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    limit = 10
  ) {
    let url = `/api/gamification/leaderboard?period=${period}&limit=${limit}`;
    if (storeSlug) url += `&store=${storeSlug}`;
    return fetchMedia(GAMIFICATION_SERVICE, url);
  },
};

// =============================================================================
// Abandonment Service
// =============================================================================

export const AbandonmentService = {
  async trackAbandonment(data: {
    userId: string;
    storeSlug: string;
    items: Array<{ itemId: string; name: string; price: number; quantity: number }>;
    total: number;
  }) {
    return fetchMedia(ABANDONMENT_SERVICE || '', '/api/track', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async sendNudge(
    userId: string,
    channel: 'push' | 'whatsapp' | 'sms',
    offer?: { discount?: number; freeDelivery?: boolean }
  ) {
    return fetchMedia(ABANDONMENT_SERVICE || '', '/api/nudge', {
      method: 'POST',
      body: JSON.stringify({ userId, channel, offer }),
    });
  },

  async getStats(storeSlug: string) {
    return fetchMedia<{
      totalAbandoned: number;
      recovered: number;
      recoveryRate: number;
      avgRecoveryTime: number;
    }>(ABANDONMENT_SERVICE || '', `/api/stats/${storeSlug}`);
  },
};

// =============================================================================
// Exports
// =============================================================================

export const ReZMedia = {
  qr: QRCampaignService,
  karma: KarmaService,
  gamification: GamificationService,
  abandonment: AbandonmentService,
};

export default ReZMedia;
