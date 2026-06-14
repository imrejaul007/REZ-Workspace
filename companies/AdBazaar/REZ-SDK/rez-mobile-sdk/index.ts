/**
 * REZ AdBazaar Mobile SDK
 * React Native SDK for AdBazaar Intelligence Services
 */

export interface MobileConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  enableOffline?: boolean;
  offlineCacheDuration?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class AdIntelligenceMobile {
  private config: Required<MobileConfig>;
  private cache: Map<string, { data: unknown; expiry: number }> = new Map();

  constructor(config: MobileConfig) {
    this.config = {
      baseUrl: 'http://localhost',
      timeout: 10000,
      retryAttempts: 3,
      enableOffline: false,
      offlineCacheDuration: 3600,
      ...config,
    };
  }

  private getPort(service: string): number {
    const ports: Record<string, number> = {
      email: 4810,
      fraud: 4811,
      ab: 4812,
      brandSafety: 4813,
      viewability: 4814,
      attribution: 4815,
      audience: 4816,
      creative: 4817,
      frequency: 4818,
      budget: 4819,
      churn: 4900,
      ltv: 4901,
      nba: 4902,
      sentiment: 4903,
      competitor: 4904,
    };
    return ports[service] || 4810;
  }

  private async fetch<T>(
    service: string,
    endpoint: string,
    method: string = 'GET',
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const port = this.getPort(service);
    const url = `${this.config.baseUrl}:${port}${endpoint}`;

    // Check cache for GET requests
    if (method === 'GET' && this.config.enableOffline) {
      const cached = this.cache.get(url);
      if (cached && cached.expiry > Date.now()) {
        return { success: true, data: cached.data as T };
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      // Cache successful GET responses
      if (response.ok && method === 'GET' && this.config.enableOffline) {
        this.cache.set(url, {
          data,
          expiry: Date.now() + this.config.offlineCacheDuration * 1000,
        });
      }

      return { success: response.ok, data };
    } catch (error) {
      // Return cached data on network error
      if (this.config.enableOffline) {
        const cached = this.cache.get(url);
        if (cached) {
          return { success: true, data: cached.data as T };
        }
      }
      return { success: false, error: (error as Error).message };
    }
  }

  // Email Validator
  async validateEmail(email: string) {
    return this.fetch('email', '/api/validate', 'POST', { email });
  }

  // Fraud Detection
  async detectFraud(params: {
    userId: string;
    ip: string;
    deviceFingerprint?: string;
    eventType: 'click' | 'view' | 'conversion';
  }) {
    return this.fetch('fraud', '/api/detect', 'POST', params);
  }

  // A/B Testing
  async getVariant(experimentId: string, userId: string) {
    return this.fetch('ab', `/api/experiments/${experimentId}/variant/${userId}`);
  }

  async trackConversion(experimentId: string, variant: string, userId: string) {
    return this.fetch('ab', `/api/experiments/${experimentId}/conversion`, 'POST', {
      variant,
      userId,
    });
  }

  // Brand Safety
  async checkBrandSafety(content: string, type: 'text' | 'image' = 'text') {
    return this.fetch('brandSafety', '/api/check', 'POST', { content, type });
  }

  // Viewability
  async trackViewability(params: {
    adId: string;
    impressionId: string;
    visible: boolean;
    duration: number;
  }) {
    return this.fetch('viewability', '/api/track', 'POST', params);
  }

  // Attribution
  async attributeConversion(params: {
    customerId: string;
    touches: Array<{ channel: string; timestamp: string }>;
    conversionValue: number;
    model?: string;
  }) {
    return this.fetch('attribution', '/api/attribute', 'POST', params);
  }

  // Audience Sync
  async createAudience(params: { name: string; source: string; segments: string[] }) {
    return this.fetch('audience', '/api/audiences', 'POST', params);
  }

  // Creative Rotation
  async getCreative(params: { campaignId: string; userId: string; context?: object }) {
    return this.fetch('creative', '/api/rotate', 'POST', params);
  }

  // Frequency Capping
  async checkFrequency(params: { userId: string; campaignId: string; adId?: string }) {
    return this.fetch('frequency', '/api/check', 'POST', params);
  }

  // Budget Allocator
  async allocateBudget(params: {
    totalBudget: number;
    channels: string[];
    historical: Array<{ channel: string; spend: number; conversions: number }>;
  }) {
    return this.fetch('budget', '/api/allocate', 'POST', params);
  }

  // Analytics - Churn Predictor
  async churnPredict(params: {
    customerId: string;
    features: {
      daysSinceLastPurchase: number;
      totalOrders: number;
      avgOrderValue: number;
      engagementScore: number;
    };
  }) {
    return this.fetch('churn', '/api/predict', 'POST', params);
  }

  // Analytics - LTV Calculator
  async calculateLTV(params: {
    customerId: string;
    features: {
      totalRevenue: number;
      totalOrders: number;
      avgOrderValue: number;
      customerAge: number;
    };
  }) {
    return this.fetch('ltv', '/api/calculate', 'POST', params);
  }

  // Analytics - Next Best Action
  async getNextBestAction(params: {
    customerId: string;
    context: {
      lastPurchase?: string;
      cartValue?: number;
      segment?: string;
    };
  }) {
    return this.fetch('nba', '/api/recommend', 'POST', params);
  }

  // Analytics - Sentiment Analyzer
  async analyzeSentiment(text: string, source?: string) {
    return this.fetch('sentiment', '/api/analyze', 'POST', { text, source });
  }

  // Competitor Monitor
  async listCompetitors() {
    return this.fetch('competitor', '/api/competitors');
  }

  async addCompetitor(params: { name: string; website: string; industry: string }) {
    return this.fetch('competitor', '/api/competitors', 'POST', params);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export default AdIntelligenceMobile;


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-mobile-sdk',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
