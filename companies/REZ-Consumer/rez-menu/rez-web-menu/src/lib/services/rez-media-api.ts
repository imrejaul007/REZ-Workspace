/**
 * ReZ Media API Client
 * QR Campaigns, Karma, Gamification, DOOH Integration
 */

const MEDIA = {
  qr: process.env.NEXT_PUBLIC_QR_SERVICE_URL || 'https://adsqr.rezapp.com',
  karma: process.env.NEXT_PUBLIC_KARMA_SERVICE_URL || 'https://karma-service.rezapp.com',
  gamification: process.env.NEXT_PUBLIC_GAMIFICATION_SERVICE_URL || 'https://REZ-gamification-service.rezapp.com',
  abandonment: process.env.NEXT_PUBLIC_ABANDONMENT_SERVICE_URL,
  dooh: process.env.NEXT_PUBLIC_DOOH_SERVICE_URL || 'https://REZ-dooh-service.rezapp.com',
} as const

async function fetchM<T>(service: 'qr' | 'karma' | 'gamification' | 'abandonment' | 'dooh', endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  const base = MEDIA[service]
  if (!base) return { success: false, error: 'Service not configured' }
  try {
    const res = await fetch(`${base}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
    return { success: true, data: await res.json() }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export const QRCampaignService = {
  async getCampaigns() { return fetchM('qr', '/api/campaigns') },
  async getCampaign(id: string) { return fetchM('qr', `/api/campaigns/${id}`) },
  async generateQR(id: string) { return fetchM('qr', `/api/campaigns/${id}/qr`) },
  async recordScan(data: { campaignId: string; userId?: string; phone?: string; location?: { lat: number; lng: number } }) {
    return fetchM('qr', '/api/scan', { method: 'POST', body: JSON.stringify(data) })
  },
  async getScanHistory(userId: string) { return fetchM('qr', `/api/scans/history/${userId}`) },
}

export const KarmaService = {
  async getProfile(userId: string) { return fetchM('karma', `/api/karma/user/${userId}`) },
  async earnPoints(userId: string, data: { points: number; reason: string; source: string }) {
    return fetchM('karma', '/api/karma/earn', { method: 'POST', body: JSON.stringify({ userId, ...data }) })
  },
  async redeemPoints(userId: string, data: { points: number; rewardType: string }) {
    return fetchM('karma', '/api/karma/redeem', { method: 'POST', body: JSON.stringify({ userId, ...data }) })
  },
  async getHistory(userId: string, limit = 20) { return fetchM('karma', `/api/karma/history/${userId}?limit=${limit}`) },
}

export const GamificationService = {
  async getProfile(userId: string) { return fetchM('gamification', `/api/gamification/profile/${userId}`) },
  async awardBadge(userId: string, badgeId: string) {
    return fetchM('gamification', '/api/gamification/badge', { method: 'POST', body: JSON.stringify({ userId, badgeId }) })
  },
  async addStreak(userId: string, streakType: 'order' | 'checkin') {
    return fetchM('gamification', '/api/gamification/streak', { method: 'POST', body: JSON.stringify({ userId, streakType }) })
  },
  async getLeaderboard(storeSlug?: string, period = 'weekly', limit = 10) {
    const params = new URLSearchParams({ period, limit: String(limit) })
    if (storeSlug) params.set('store', storeSlug)
    return fetchM('gamification', `/api/gamification/leaderboard?${params.toString()}`)
  },
}

export const AbandonmentService = {
  async trackAbandonment(data: { userId: string; storeSlug: string; items: Array<{ itemId: string; name: string; price: number; quantity: number }>; total: number }) {
    return fetchM('abandonment', '/api/track', { method: 'POST', body: JSON.stringify(data) })
  },
  async sendNudge(userId: string, channel: 'push' | 'whatsapp' | 'sms', offer?: { discount?: number; freeDelivery?: boolean }) {
    return fetchM('abandonment', '/api/nudge', { method: 'POST', body: JSON.stringify({ userId, channel, offer }) })
  },
  async getStats(storeSlug: string) { return fetchM('abandonment', `/api/stats/${storeSlug}`) },
}

export const DOOHService = {
  async registerScreen(data: { merchantId: string; location: { lat: number; lng: number }; type: string; name: string }) {
    return fetchM('dooh', '/api/screens/register', { method: 'POST', body: JSON.stringify(data) })
  },
  async heartbeat(screenId: string) { return fetchM('dooh', `/api/screens/${screenId}/heartbeat`, { method: 'POST' }) },
  async getAds(screenId: string, context: { time: string; weather?: string }) {
    return fetchM('dooh', '/api/ads/available', { method: 'POST', body: JSON.stringify({ screenId, context }) })
  },
  async recordImpression(adId: string, screenId: string) {
    return fetchM('dooh', '/api/analytics/impressions', { method: 'POST', body: JSON.stringify({ adId, screenId }) })
  },
}

export const ReZMedia = { qr: QRCampaignService, karma: KarmaService, gamification: GamificationService, abandonment: AbandonmentService, dooh: DOOHService }
export default ReZMedia
