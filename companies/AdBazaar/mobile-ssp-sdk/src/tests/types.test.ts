import type {
  Platform,
  PublisherStatus,
  AppStatus,
  AdFormat,
  AdRequestStatus,
  AdType,
  SDKConfig,
  AppPublisher,
  App,
  Placement,
  AdRequest,
  AdResponse,
  Impression,
  Click,
  PublisherEarnings,
  ApiResponse,
  PaginatedResponse,
  JWTPayload,
  AuthContext,
} from '../types/index.js';

describe('Type Definitions', () => {
  describe('Platform', () => {
    it('should define valid platform types', () => {
      const platforms: Platform[] = ['ios', 'android', 'react-native', 'flutter'];
      expect(platforms).toHaveLength(4);
    });
  });

  describe('PublisherStatus', () => {
    it('should define valid publisher statuses', () => {
      const statuses: PublisherStatus[] = ['active', 'pending', 'suspended'];
      expect(statuses).toHaveLength(3);
    });
  });

  describe('AppStatus', () => {
    it('should define valid app statuses', () => {
      const statuses: AppStatus[] = ['active', 'pending', 'suspended'];
      expect(statuses).toHaveLength(3);
    });
  });

  describe('AdFormat', () => {
    it('should define valid ad formats', () => {
      const formats: AdFormat[] = ['banner', 'interstitial', 'native', 'rewarded', 'app-open'];
      expect(formats).toHaveLength(5);
    });
  });

  describe('AdRequestStatus', () => {
    it('should define valid ad request statuses', () => {
      const statuses: AdRequestStatus[] = ['pending', 'filled', 'no-fill', 'expired'];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('AdType', () => {
    it('should define valid ad types', () => {
      const types: AdType[] = ['display', 'video', 'native', 'rich-media'];
      expect(types).toHaveLength(4);
    });
  });

  describe('SDKConfig', () => {
    it('should allow valid SDK config structure', () => {
      const config: SDKConfig = {
        appId: 'app_123',
        publisherId: 'pub_123',
        platform: 'ios',
        adFormats: ['banner', 'interstitial'],
        ecpm: 1.5,
        refreshInterval: 30,
        timeout: 5000,
        retryAttempts: 3,
        testMode: false,
        consentRequired: true,
        gdprEnabled: true,
        coppaEnabled: true,
        customParameters: {},
      };

      expect(config.appId).toBe('app_123');
      expect(config.platform).toBe('ios');
      expect(config.adFormats).toContain('banner');
    });
  });

  describe('AppPublisher', () => {
    it('should allow valid publisher structure', () => {
      const publisher: AppPublisher = {
        publisherId: 'pub_123',
        name: 'Test Publisher',
        email: 'test@example.com',
        company: 'Test Company',
        apps: [],
        settings: {
          adFormats: ['banner'],
          minCPM: 1.0,
          autoRefresh: true,
          testMode: false,
        },
        stats: {
          totalImpressions: 1000,
          totalClicks: 50,
          totalEarnings: 5.0,
          todayImpressions: 100,
          todayClicks: 5,
          todayEarnings: 0.5,
          yesterdayImpressions: 90,
          yesterdayClicks: 4,
          yesterdayEarnings: 0.45,
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(publisher.publisherId).toBe('pub_123');
      expect(publisher.status).toBe('active');
      expect(publisher.stats.totalImpressions).toBe(1000);
    });
  });

  describe('App', () => {
    it('should allow valid app structure', () => {
      const app: App = {
        appId: 'app_123',
        name: 'Test App',
        platform: 'ios',
        bundleId: 'com.example.app',
        category: 'Games',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(app.appId).toBe('app_123');
      expect(app.platform).toBe('ios');
    });
  });

  describe('Placement', () => {
    it('should allow valid placement structure', () => {
      const placement: Placement = {
        placementId: 'plc_123',
        appId: 'app_123',
        name: 'Banner Ad',
        adFormat: 'banner',
        width: 320,
        height: 50,
        position: 'bottom',
        refreshInterval: 30,
        ecpm: 1.5,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(placement.placementId).toBe('plc_123');
      expect(placement.adFormat).toBe('banner');
    });
  });

  describe('AdRequest', () => {
    it('should allow valid ad request structure', () => {
      const adRequest: AdRequest = {
        requestId: 'req_123',
        placementId: 'plc_123',
        appId: 'app_123',
        publisherId: 'pub_123',
        platform: 'ios',
        adFormat: 'banner',
        deviceId: 'device_123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        language: 'en',
        country: 'US',
        timestamp: new Date(),
        status: 'filled',
      };

      expect(adRequest.requestId).toBe('req_123');
      expect(adRequest.status).toBe('filled');
    });
  });

  describe('AdResponse', () => {
    it('should allow valid ad response structure', () => {
      const adResponse: AdResponse = {
        requestId: 'req_123',
        adId: 'ad_123',
        adType: 'display',
        adFormat: 'banner',
        creativeUrl: 'https://example.com/creative.png',
        clickUrl: 'https://example.com/click',
        impressionUrl: 'https://example.com/imp',
        width: 320,
        height: 50,
        ecpm: 1.5,
        currency: 'USD',
        fallback: false,
      };

      expect(adResponse.adId).toBe('ad_123');
      expect(adResponse.adType).toBe('display');
    });
  });

  describe('Impression', () => {
    it('should allow valid impression structure', () => {
      const impression: Impression = {
        impressionId: 'imp_123',
        requestId: 'req_123',
        adId: 'ad_123',
        placementId: 'plc_123',
        appId: 'app_123',
        publisherId: 'pub_123',
        timestamp: new Date(),
        viewable: true,
        viewableTime: 2000,
      };

      expect(impression.impressionId).toBe('imp_123');
      expect(impression.viewable).toBe(true);
    });
  });

  describe('Click', () => {
    it('should allow valid click structure', () => {
      const click: Click = {
        clickId: 'clk_123',
        impressionId: 'imp_123',
        requestId: 'req_123',
        adId: 'ad_123',
        placementId: 'plc_123',
        appId: 'app_123',
        publisherId: 'pub_123',
        timestamp: new Date(),
        deviceType: 'mobile',
      };

      expect(click.clickId).toBe('clk_123');
      expect(click.deviceType).toBe('mobile');
    });
  });

  describe('PublisherEarnings', () => {
    it('should allow valid earnings structure', () => {
      const earnings: PublisherEarnings = {
        publisherId: 'pub_123',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        totalEarnings: 100.50,
        totalImpressions: 10000,
        totalClicks: 500,
        averageECPM: 10.05,
        breakdown: [
          {
            date: '2024-01-01',
            impressions: 1000,
            clicks: 50,
            ecpm: 1.5,
            earnings: 1.5,
          },
        ],
      };

      expect(earnings.publisherId).toBe('pub_123');
      expect(earnings.totalEarnings).toBe(100.50);
      expect(earnings.breakdown).toHaveLength(1);
    });
  });

  describe('ApiResponse', () => {
    it('should allow valid API response structure', () => {
      const response: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: '123' },
        message: 'Success',
      };

      expect(response.success).toBe(true);
      expect(response.data?.id).toBe('123');
    });

    it('should allow error response', () => {
      const response: ApiResponse = {
        success: false,
        error: 'Something went wrong',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('Something went wrong');
    });
  });

  describe('PaginatedResponse', () => {
    it('should allow valid paginated response structure', () => {
      const response: PaginatedResponse<string> = {
        success: true,
        data: ['item1', 'item2', 'item3'],
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
        },
      };

      expect(response.data).toHaveLength(3);
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.totalPages).toBe(10);
    });
  });

  describe('JWTPayload', () => {
    it('should allow valid JWT payload structure', () => {
      const payload: JWTPayload = {
        publisherId: 'pub_123',
        email: 'test@example.com',
      };

      expect(payload.publisherId).toBe('pub_123');
      expect(payload.email).toBe('test@example.com');
    });
  });

  describe('AuthContext', () => {
    it('should allow valid auth context structure', () => {
      const context: AuthContext = {
        publisherId: 'pub_123',
        email: 'test@example.com',
      };

      expect(context.publisherId).toBe('pub_123');
    });
  });
});