// Ecosystem Integration Service
// Connects CorpPerks Intelligence to RABTUL, REZ Intelligence, REZ Media, RTNM Group

import config from '../config/index.js';

interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

// ─── Utility: Fetch with Timeout ─────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms for ${url}`);
    }
    throw error;
  }
}

interface RABTULConfig {
  authService: string;
  profileService: string;
  walletService: string;
  notificationService: string;
  analyticsService: string;
}

interface REZIntelligenceConfig {
  signalAggregator: string;
  predictiveEngine: string;
  intentGraph: string;
  featureStore: string;
  decisionEngine: string;
}

interface REZMediaConfig {
  karmaService: string;
  rewardsService: string;
  gamificationService: string;
}

interface RTNMGroupConfig {
  platformAdmin: string;
  supportDashboard: string;
  opsDashboard: string;
}

class EcosystemIntegrationService {
  private tenantId: string = 'default';

  // Service URLs from environment
  private readonly RABTUL: RABTULConfig = {
    authService: process.env.RABTUL_AUTH_URL || 'https://rez-auth-service.onrender.com',
    profileService: process.env.RABTUL_PROFILE_URL || 'https://rez-profile-service.onrender.com',
    walletService: process.env.RABTUL_WALLET_URL || 'https://rez-wallet-service.onrender.com',
    notificationService: process.env.RABTUL_NOTIFY_URL || 'https://rez-notifications-service.onrender.com',
    analyticsService: process.env.RABTUL_ANALYTICS_URL || 'https://rez-analytics-service.onrender.com',
  };

  private readonly REZ_INTELLIGENCE: REZIntelligenceConfig = {
    signalAggregator: process.env.REZ_SIGNAL_AGGREGATOR_URL || 'http://localhost:4121',
    predictiveEngine: process.env.REZ_PREDICTIVE_ENGINE_URL || 'http://localhost:4123',
    intentGraph: process.env.REZ_INTENT_GRAPH_URL || 'http://localhost:4018',
    featureStore: process.env.REZ_FEATURE_STORE_URL || 'http://localhost:4127',
    decisionEngine: process.env.REZ_DECISION_ENGINE_URL || 'http://localhost:4128',
  };

  private readonly REZ_MEDIA: REZMediaConfig = {
    karmaService: process.env.REZ_KARMA_URL || 'https://karma-service.onrender.com',
    rewardsService: process.env.REZ_REWARDS_URL || 'https://rewards-service.onrender.com',
    gamificationService: process.env.REZ_GAMIFICATION_URL || 'https://gamification-service.onrender.com',
  };

  private readonly RTNM_GROUP: RTNMGroupConfig = {
    platformAdmin: process.env.RTNM_ADMIN_URL || 'https://rez-admin-service.onrender.com',
    supportDashboard: process.env.RTNM_SUPPORT_URL || 'https://rez-support-dashboard.onrender.com',
    opsDashboard: process.env.RTNM_OPS_URL || 'https://rez-ops-dashboard.onrender.com',
  };

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Tenant-ID': this.tenantId,
      'X-Service-Name': 'corpperks-intelligence',
    };
  }

  // ==========================================
  // RABTUL SERVICES INTEGRATION
  // ==========================================

  /**
   * RABTUL Auth Service - User authentication and authorization
   */
  async verifyToken(token: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.RABTUL.authService}/api/auth/verify`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
        },
        body: JSON.stringify({ token }),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] verifyToken failed:', message);
      return { success: false, error: message || 'RABTUL Auth service unavailable' };
    }
  }

  /**
   * RABTUL Profile Service - Employee profiles and data
   */
  async getEmployeeProfile(employeeId: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.RABTUL.profileService}/api/profiles/${employeeId}`, {
        headers: this.getHeaders(),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getEmployeeProfile failed:', message);
      return { success: false, error: message || 'RABTUL Profile service unavailable' };
    }
  }

  async getWorkforceMetrics(): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.RABTUL.profileService}/api/profiles/workforce-metrics`, {
        headers: this.getHeaders(),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getWorkforceMetrics failed:', message);
      return { success: false, error: message || 'RABTUL Profile service unavailable' };
    }
  }

  /**
   * RABTUL Wallet Service - Coins, balance, loyalty
   */
  async getEmployeeBalance(employeeId: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.RABTUL.walletService}/api/wallet/balance/${employeeId}`, {
        headers: this.getHeaders(),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getEmployeeBalance failed:', message);
      return { success: false, error: message || 'RABTUL Wallet service unavailable' };
    }
  }

  async awardPoints(employeeId: string, points: number, reason: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.RABTUL.walletService}/api/wallet/award`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ employeeId, points, reason, source: 'corpperks-intelligence' }),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] awardPoints failed:', message);
      return { success: false, error: message || 'RABTUL Wallet service unavailable' };
    }
  }

  /**
   * RABTUL Notifications Service - Push, SMS, Email, WhatsApp
   */
  async sendNotification(notification: {
    userId: string;
    type: 'push' | 'sms' | 'email' | 'whatsapp';
    title: string;
    message: string;
    data?: Record<string, any>;
  }): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.RABTUL.notificationService}/api/notifications/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(notification),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] sendNotification failed:', message);
      return { success: false, error: message || 'RABTUL Notifications service unavailable' };
    }
  }

  /**
   * RABTUL Analytics Service - Dashboards and reporting
   */
  async getWorkforceAnalytics(dateRange: { start: Date; end: Date }): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(
        `${this.RABTUL.analyticsService}/api/analytics/workforce?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`,
        { headers: this.getHeaders() }
      );
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getWorkforceAnalytics failed:', message);
      return { success: false, error: message || 'RABTUL Analytics service unavailable' };
    }
  }

  // ==========================================
  // REZ INTELLIGENCE INTEGRATION
  // ==========================================

  /**
   * Signal Aggregator - Behavioral signals and events
   */
  async getEmployeeSignals(employeeId: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.REZ_INTELLIGENCE.signalAggregator}/api/signals/employee/${employeeId}`, {
        headers: this.getHeaders(),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getEmployeeSignals failed:', message);
      return { success: false, error: message || 'REZ Signal Aggregator unavailable' };
    }
  }

  async emitSignal(signal: {
    event: string;
    userId: string;
    data: Record<string, any>;
    timestamp?: Date;
  }): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.REZ_INTELLIGENCE.signalAggregator}/api/signals`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(signal),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] emitSignal failed:', message);
      return { success: false, error: message || 'REZ Signal Aggregator unavailable' };
    }
  }

  /**
   * Predictive Engine - Churn, LTV, Revisit predictions
   */
  async getAttritionPrediction(employeeId: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.REZ_INTELLIGENCE.predictiveEngine}/api/predict/attrition/${employeeId}`, {
        headers: this.getHeaders(),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getAttritionPrediction failed:', message);
      return { success: false, error: message || 'REZ Predictive Engine unavailable' };
    }
  }

  async getProductivityPrediction(employeeId: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.REZ_INTELLIGENCE.predictiveEngine}/api/predict/productivity/${employeeId}`, {
        headers: this.getHeaders(),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getProductivityPrediction failed:', message);
      return { success: false, error: message || 'REZ Predictive Engine unavailable' };
    }
  }

  async getBurnoutPrediction(employeeId: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.REZ_INTELLIGENCE.predictiveEngine}/api/predict/burnout/${employeeId}`, {
        headers: this.getHeaders(),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getBurnoutPrediction failed:', message);
      return { success: false, error: message || 'REZ Predictive Engine unavailable' };
    }
  }

  /**
   * Intent Graph - Career intent and goal detection
   */
  async getCareerIntent(employeeId: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.REZ_INTELLIGENCE.intentGraph}/api/intent/career/${employeeId}`, {
        headers: this.getHeaders(),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getCareerIntent failed:', message);
      return { success: false, error: message || 'REZ Intent Graph unavailable' };
    }
  }

  async predictIntent(userId: string, context: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.REZ_INTELLIGENCE.intentGraph}/api/intent/predict`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId, context }),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] predictIntent failed:', message);
      return { success: false, error: message || 'REZ Intent Graph unavailable' };
    }
  }

  /**
   * Feature Store - ML features for workforce
   */
  async getWorkforceFeatures(employeeId: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.REZ_INTELLIGENCE.featureStore}/api/features/workforce/${employeeId}`, {
        headers: this.getHeaders(),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getWorkforceFeatures failed:', message);
      return { success: false, error: message || 'REZ Feature Store unavailable' };
    }
  }

  /**
   * Decision Engine - Cashback, fraud, pricing decisions
   */
  async getCashbackDecision(userId: string, amount: number): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.REZ_INTELLIGENCE.decisionEngine}/api/decide/cashback`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId, amount }),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getCashbackDecision failed:', message);
      return { success: false, error: message || 'REZ Decision Engine unavailable' };
    }
  }

  // ==========================================
  // REZ MEDIA INTEGRATION
  // ==========================================

  /**
   * Karma Service - Trust scores and reputation
   */
  async getKarmaScore(employeeId: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.REZ_MEDIA.karmaService}/api/karma/${employeeId}`, {
        headers: this.getHeaders(),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getKarmaScore failed:', message);
      return { success: false, error: message || 'REZ Karma service unavailable' };
    }
  }

  async updateKarma(employeeId: string, delta: number, reason: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.REZ_MEDIA.karmaService}/api/karma/update`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ employeeId, delta, reason }),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] updateKarma failed:', message);
      return { success: false, error: message || 'REZ Karma service unavailable' };
    }
  }

  /**
   * Gamification Service - Points, badges, achievements
   */
  async awardBadge(employeeId: string, badgeId: string): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.REZ_MEDIA.gamificationService}/api/badges/award`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ employeeId, badgeId, source: 'corpperks-intelligence' }),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] awardBadge failed:', message);
      return { success: false, error: message || 'REZ Gamification service unavailable' };
    }
  }

  async getLeaderboard(department?: string): Promise<ServiceResponse> {
    try {
      const url = department
        ? `${this.REZ_MEDIA.gamificationService}/api/leaderboard?department=${department}`
        : `${this.REZ_MEDIA.gamificationService}/api/leaderboard`;
      const response = await fetchWithTimeout(url, { headers: this.getHeaders() });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getLeaderboard failed:', message);
      return { success: false, error: message || 'REZ Gamification service unavailable' };
    }
  }

  // ==========================================
  // RTNM GROUP INTEGRATION
  // ==========================================

  /**
   * Platform Admin - Admin controls and oversight
   */
  async getTenantHealth(): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.RTNM_GROUP.platformAdmin}/api/admin/health/${this.tenantId}`, {
        headers: this.getHeaders(),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getTenantHealth failed:', message);
      return { success: false, error: message || 'RTNM Platform Admin unavailable' };
    }
  }

  async getFeatureFlags(): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.RTNM_GROUP.opsDashboard}/api/feature-flags`, {
        headers: this.getHeaders(),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] getFeatureFlags failed:', message);
      return { success: false, error: message || 'RTNM Ops Dashboard unavailable' };
    }
  }

  /**
   * Support Dashboard - Support tickets and issues
   */
  async createSupportTicket(ticket: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    employeeId?: string;
  }): Promise<ServiceResponse> {
    try {
      const response = await fetchWithTimeout(`${this.RTNM_GROUP.supportDashboard}/api/tickets`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(ticket),
      });
      return { success: response.ok, data: await response.json() };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Ecosystem] createSupportTicket failed:', message);
      return { success: false, error: message || 'RTNM Support Dashboard unavailable' };
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check health of a single service with timeout
   */
  private async checkServiceHealth(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      const response = await fetch(`${url}/health`, { method: 'GET', signal: controller.signal });
      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.debug(`[Ecosystem] Health check failed for ${url}:`, message);
      return false;
    }
  }

  /**
   * Get service health status for all integrations
   */
  async getEcosystemHealth(): Promise<ServiceResponse<{
    rabtul: Record<string, boolean>;
    rezIntelligence: Record<string, boolean>;
    rezMedia: Record<string, boolean>;
    rtnmGroup: Record<string, boolean>;
  }>> {
    // Check all services in parallel
    const [
      authHealth,
      profileHealth,
      walletHealth,
      notificationsHealth,
      analyticsHealth,
      signalHealth,
      predictiveHealth,
      intentHealth,
      featureHealth,
      decisionHealth,
      karmaHealth,
      rewardsHealth,
      gamificationHealth,
      platformAdminHealth,
      supportHealth,
      opsHealth,
    ] = await Promise.all([
      this.checkServiceHealth(this.RABTUL.authService),
      this.checkServiceHealth(this.RABTUL.profileService),
      this.checkServiceHealth(this.RABTUL.walletService),
      this.checkServiceHealth(this.RABTUL.notificationService),
      this.checkServiceHealth(this.RABTUL.analyticsService),
      this.checkServiceHealth(this.REZ_INTELLIGENCE.signalAggregator),
      this.checkServiceHealth(this.REZ_INTELLIGENCE.predictiveEngine),
      this.checkServiceHealth(this.REZ_INTELLIGENCE.intentGraph),
      this.checkServiceHealth(this.REZ_INTELLIGENCE.featureStore),
      this.checkServiceHealth(this.REZ_INTELLIGENCE.decisionEngine),
      this.checkServiceHealth(this.REZ_MEDIA.karmaService),
      this.checkServiceHealth(this.REZ_MEDIA.rewardsService),
      this.checkServiceHealth(this.REZ_MEDIA.gamificationService),
      this.checkServiceHealth(this.RTNM_GROUP.platformAdmin),
      this.checkServiceHealth(this.RTNM_GROUP.supportDashboard),
      this.checkServiceHealth(this.RTNM_GROUP.opsDashboard),
    ]);

    const health = {
      rabtul: {
        auth: authHealth,
        profile: profileHealth,
        wallet: walletHealth,
        notifications: notificationsHealth,
        analytics: analyticsHealth,
      },
      rezIntelligence: {
        signalAggregator: signalHealth,
        predictiveEngine: predictiveHealth,
        intentGraph: intentHealth,
        featureStore: featureHealth,
        decisionEngine: decisionHealth,
      },
      rezMedia: {
        karma: karmaHealth,
        rewards: rewardsHealth,
        gamification: gamificationHealth,
      },
      rtnmGroup: {
        platformAdmin: platformAdminHealth,
        support: supportHealth,
        ops: opsHealth,
      },
    };

    return { success: true, data: health };
  }

  /**
   * Get all connected services info
   */
  getConnectedServices(): {
    name: string;
    services: { name: string; url: string }[];
  }[] {
    return [
      {
        name: 'RABTUL Technologies',
        services: [
          { name: 'Auth Service', url: this.RABTUL.authService },
          { name: 'Profile Service', url: this.RABTUL.profileService },
          { name: 'Wallet Service', url: this.RABTUL.walletService },
          { name: 'Notifications Service', url: this.RABTUL.notificationService },
          { name: 'Analytics Service', url: this.RABTUL.analyticsService },
        ],
      },
      {
        name: 'REZ Intelligence',
        services: [
          { name: 'Signal Aggregator', url: this.REZ_INTELLIGENCE.signalAggregator },
          { name: 'Predictive Engine', url: this.REZ_INTELLIGENCE.predictiveEngine },
          { name: 'Intent Graph', url: this.REZ_INTELLIGENCE.intentGraph },
          { name: 'Feature Store', url: this.REZ_INTELLIGENCE.featureStore },
          { name: 'Decision Engine', url: this.REZ_INTELLIGENCE.decisionEngine },
        ],
      },
      {
        name: 'REZ Media',
        services: [
          { name: 'Karma Service', url: this.REZ_MEDIA.karmaService },
          { name: 'Rewards Service', url: this.REZ_MEDIA.rewardsService },
          { name: 'Gamification Service', url: this.REZ_MEDIA.gamificationService },
        ],
      },
      {
        name: 'RTNM Group',
        services: [
          { name: 'Platform Admin', url: this.RTNM_GROUP.platformAdmin },
          { name: 'Support Dashboard', url: this.RTNM_GROUP.supportDashboard },
          { name: 'Ops Dashboard', url: this.RTNM_GROUP.opsDashboard },
        ],
      },
    ];
  }
}

export const ecosystemIntegration = new EcosystemIntegrationService();
export default ecosystemIntegration;
