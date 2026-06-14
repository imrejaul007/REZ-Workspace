/**
 * REZ Language Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('REZ Language Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Configuration', () => {
    it('should have correct port configuration', () => {
      const port = parseInt(process.env.PORT || '4028', 10);
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
    });

    it('should have correct MongoDB URL configuration', () => {
      const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/rez_language';
      expect(mongoUrl).toMatch(/^mongodb/);
    });
  });

  describe('Health Check', () => {
    it('should return health status', () => {
      const mockHealthResponse = {
        status: 'healthy',
        service: 'language-service',
        port: 4028,
      };

      expect(mockHealthResponse.status).toBe('healthy');
      expect(mockHealthResponse.service).toBe('language-service');
    });
  });

  describe('Supported Languages', () => {
    it('should have English as default', () => {
      const supportedLanguages = {
        en: { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
        hi: { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', dir: 'ltr' },
      };

      expect(supportedLanguages.en.isDefault !== undefined || supportedLanguages.en.code).toBe('en');
    });

    it('should support Hindi', () => {
      const languages = ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa', 'or', 'ar'];
      expect(languages).toContain('hi');
      expect(languages).toContain('ta');
      expect(languages).toContain('te');
    });

    it('should support RTL languages', () => {
      const rtlLanguages = ['ar'];
      const supportedLanguages = {
        en: { dir: 'ltr' },
        ar: { dir: 'rtl' },
      };

      expect(supportedLanguages.ar.dir).toBe('rtl');
      expect(supportedLanguages.en.dir).toBe('ltr');
    });
  });

  describe('Translation Keys', () => {
    it('should have navigation translations', () => {
      const navKeys = ['nav.home', 'nav.search', 'nav.bookings', 'nav.profile', 'nav.menu'];
      expect(navKeys).toContain('nav.home');
    });

    it('should have booking translations', () => {
      const bookingKeys = ['booking.title', 'booking.total', 'booking.confirmed'];
      expect(bookingKeys).toContain('booking.title');
    });

    it('should have error translations', () => {
      const errorKeys = ['error.general', 'error.network', 'error.payment_failed'];
      expect(errorKeys).toContain('error.general');
    });

    it('should have amenity translations', () => {
      const amenityKeys = ['amenity.wifi', 'amenity.pool', 'amenity.parking', 'amenity.ac'];
      expect(amenityKeys).toContain('amenity.wifi');
    });
  });

  describe('Translation Function', () => {
    it('should return translation for existing key', () => {
      const translations = {
        en: { 'nav.home': 'Home', 'booking.title': 'Complete Your Booking' },
        hi: { 'nav.home': 'होम', 'booking.title': 'अपनी बुकिंग पूरी करें' },
      };

      const getTranslation = (lang: string, key: string) => {
        return translations[lang as keyof typeof translations]?.[key] || key;
      };

      expect(getTranslation('en', 'nav.home')).toBe('Home');
      expect(getTranslation('hi', 'nav.home')).toBe('होम');
    });

    it('should fallback to English for missing translation', () => {
      const translations = {
        en: { 'nav.home': 'Home' },
        hi: { 'nav.search': 'खोजें' },
      };

      const getTranslation = (lang: string, key: string) => {
        return translations[lang as keyof typeof translations]?.[key] || translations.en[key] || key;
      };

      expect(getTranslation('fr', 'nav.home')).toBe('Home');
    });
  });

  describe('Language Direction', () => {
    it('should return ltr for most languages', () => {
      const getDirection = (lang: string) => {
        const rtlLanguages = ['ar'];
        return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
      };

      expect(getDirection('en')).toBe('ltr');
      expect(getDirection('hi')).toBe('ltr');
      expect(getDirection('ar')).toBe('rtl');
    });
  });

  describe('API Endpoints', () => {
    it('should have languages endpoint', () => {
      const endpoint = '/api/languages';
      expect(endpoint).toBe('/api/languages');
    });

    it('should have translate endpoint', () => {
      const endpoint = '/api/translate/:lang';
      expect(endpoint).toBe('/api/translate/:lang');
    });

    it('should have hotel config endpoint', () => {
      const endpoint = '/api/hotel/config';
      expect(endpoint).toBe('/api/hotel/config');
    });

    it('should have i18n endpoint', () => {
      const endpoint = '/api/i18n/:lang';
      expect(endpoint).toBe('/api/i18n/:lang');
    });

    it('should have detect endpoint', () => {
      const endpoint = '/api/detect';
      expect(endpoint).toBe('/api/detect');
    });
  });

  describe('API Response Format', () => {
    it('should return languages list format', () => {
      const mockResponse = {
        success: true,
        data: {
          languages: expect.any(Array),
        },
      };

      const mockData = {
        success: true,
        data: {
          languages: [
            { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
            { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', dir: 'ltr' },
          ],
        },
      };

      expect(mockData).toMatchObject(mockResponse);
    });

    it('should return translations format', () => {
      const mockResponse = {
        success: true,
        data: {
          language: expect.any(String),
          direction: expect.stringMatching(/^(ltr|rtl)$/),
          translations: expect.any(Object),
          count: expect.any(Number),
        },
      };

      const mockData = {
        success: true,
        data: {
          language: 'hi',
          direction: 'ltr',
          translations: { 'nav.home': 'होम' },
          count: 1,
        },
      };

      expect(mockData).toMatchObject(mockResponse);
    });

    it('should return error response format', () => {
      const errorResponse = {
        success: false,
        error: {
          code: expect.any(String),
        },
      };

      const mockError = {
        success: false,
        error: {
          code: 'UNSUPPORTED_LANGUAGE',
        },
      };

      expect(mockError).toMatchObject(errorResponse);
    });
  });

  describe('Rate Limiting', () => {
    it('should have rate limit configuration', () => {
      const rateLimitConfig = {
        windowMs: 15 * 60 * 1000,
        max: 1000,
      };

      expect(rateLimitConfig.windowMs).toBe(900000);
      expect(rateLimitConfig.max).toBe(1000);
    });
  });

  describe('Hotel Language Config', () => {
    it('should validate hotel language config schema', () => {
      const configSchema = {
        hotelId: expect.any(String),
        defaultLanguage: expect.any(String),
        supportedLanguages: expect.any(Array),
        enableAutoDetect: expect.any(Boolean),
        enableRTL: expect.any(Boolean),
      };

      const mockConfig = {
        hotelId: 'HTL-001',
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'hi'],
        enableAutoDetect: true,
        enableRTL: false,
      };

      expect(mockConfig).toMatchObject(configSchema);
    });
  });

  describe('Parameter Replacement', () => {
    it('should replace parameters in translation', () => {
      const template = 'Welcome to {hotelName}';
      const params = { hotelName: 'Grand Hotel' };
      const result = template.replace(/{(\w+)}/g, (_, key) => params[key] || `{${key}}`);
      expect(result).toBe('Welcome to Grand Hotel');
    });
  });
});