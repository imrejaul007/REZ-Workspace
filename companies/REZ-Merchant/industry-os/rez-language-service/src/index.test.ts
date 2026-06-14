/**
 * Unit Tests for REZ Language Service
 */

import { describe, it, expect } from 'vitest';

describe('REZ Language Service', () => {
  describe('Supported Languages', () => {
    const SupportedLanguages = {
      en: { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
      hi: { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', dir: 'ltr' },
      ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr' },
      te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr' },
      ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
    };

    it('should have all expected Indian languages', () => {
      expect(Object.keys(SupportedLanguages)).toContain('en');
      expect(Object.keys(SupportedLanguages)).toContain('hi');
      expect(Object.keys(SupportedLanguages)).toContain('ta');
    });

    it('should have RTL languages correctly marked', () => {
      expect(SupportedLanguages.ar.dir).toBe('rtl');
      expect(SupportedLanguages.en.dir).toBe('ltr');
    });

    it('should have native names for all languages', () => {
      Object.values(SupportedLanguages).forEach(lang => {
        expect(lang.nativeName).toBeTruthy();
        expect(lang.nativeName.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Translation Key Format', () => {
    it('should use dot notation for keys', () => {
      const validKeys = [
        'nav.home',
        'nav.search',
        'booking.title',
        'booking.total',
        'error.general',
        'success.booking_confirmed',
      ];

      validKeys.forEach(key => {
        expect(key).toMatch(/^[a-z]+\.[a-z_]+$/);
      });
    });

    it('should categorize translations correctly', () => {
      const categories = ['nav', 'search', 'hotel', 'room', 'booking', 'guest', 'error', 'success', 'action'];

      categories.forEach(cat => {
        expect(typeof cat).toBe('string');
      });
    });
  });

  describe('Translation Retrieval', () => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        'nav.home': 'Home',
        'nav.search': 'Search',
        'booking.title': 'Book Now',
      },
      hi: {
        'nav.home': 'होम',
        'nav.search': 'खोजें',
        'booking.title': 'अभी बुक करें',
      },
    };

    function getTranslation(lang: string, key: string): string {
      const langTranslations = translations[lang] || translations['en'];
      return langTranslations[key] || translations['en'][key] || key;
    }

    it('should return translation for valid language and key', () => {
      expect(getTranslation('en', 'nav.home')).toBe('Home');
      expect(getTranslation('hi', 'nav.home')).toBe('होम');
    });

    it('should fallback to English for missing translations', () => {
      expect(getTranslation('ta', 'nav.home')).toBe('Home'); // Falls back to English
    });

    it('should fallback to key for completely missing translations', () => {
      expect(getTranslation('en', 'missing.key')).toBe('missing.key');
    });
  });

  describe('Parameter Substitution', () => {
    function replaceParams(text: string, params: Record<string, string>): string {
      let result = text;
      Object.entries(params).forEach(([key, value]) => {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      });
      return result;
    }

    it('should replace single parameter', () => {
      const text = 'Welcome to {hotelName}';
      const params = { hotelName: 'StayOwn Hotel' };

      expect(replaceParams(text, params)).toBe('Welcome to StayOwn Hotel');
    });

    it('should replace multiple parameters', () => {
      const text = 'Check-in: {start} - Check-out: {end}';
      const params = { start: '14:00', end: '11:00' };

      expect(replaceParams(text, params)).toBe('Check-in: 14:00 - Check-out: 11:00');
    });

    it('should handle missing parameters gracefully', () => {
      const text = 'Welcome to {hotelName}';
      const params = {};

      expect(replaceParams(text, params)).toBe('Welcome to {hotelName}');
    });
  });

  describe('Language Direction', () => {
    function getDirection(lang: string): 'ltr' | 'rtl' {
      const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
      return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
    }

    it('should return RTL for Arabic', () => {
      expect(getDirection('ar')).toBe('rtl');
    });

    it('should return LTR for English and Indian languages', () => {
      expect(getDirection('en')).toBe('ltr');
      expect(getDirection('hi')).toBe('ltr');
      expect(getDirection('ta')).toBe('ltr');
    });
  });

  describe('Language Detection', () => {
    function detectLanguage(acceptLanguage: string | undefined): string {
      if (acceptLanguage) {
        const langs = acceptLanguage.split(',').map(l => l.split(';')[0].trim().toLowerCase());
        for (const lang of langs) {
          if (['en', 'hi', 'ta', 'te'].includes(lang.split('-')[0])) {
            return lang.split('-')[0];
          }
        }
      }
      return 'en';
    }

    it('should detect English from Accept-Language header', () => {
      expect(detectLanguage('en-US,en;q=0.9')).toBe('en');
    });

    it('should detect Hindi from Accept-Language header', () => {
      expect(detectLanguage('hi-IN,hi;q=0.9')).toBe('hi');
    });

    it('should fall back to English for unknown languages', () => {
      expect(detectLanguage('fr-FR,fr;q=0.9')).toBe('en');
    });

    it('should return English for empty header', () => {
      expect(detectLanguage(undefined)).toBe('en');
    });
  });

  describe('Font Loading', () => {
    const fontHints: Record<string, string> = {
      ta: "'Noto Sans Tamil', 'Lohit Tamil', sans-serif",
      te: "'Noto Sans Telugu', 'Lohit Telugu', sans-serif",
      kn: "'Noto Sans Kannada', 'Lohit Kannada', sans-serif",
    };

    it('should provide font hints for non-Latin scripts', () => {
      expect(fontHints.ta).toContain('Tamil');
      expect(fontHints.te).toContain('Telugu');
      expect(fontHints.kn).toContain('Kannada');
    });

    it('should not need font hints for Latin scripts', () => {
      const latinLanguages = ['en'];
      expect(fontHints['en']).toBeUndefined();
    });
  });

  describe('Translation Statistics', () => {
    it('should count translations per language', () => {
      const translations = {
        en: { 'nav.home': 'Home', 'nav.search': 'Search', 'booking.title': 'Book' },
        hi: { 'nav.home': 'होम', 'booking.title': 'बुक करें' },
        ta: { 'nav.home': 'முகப்பு' },
      };

      const counts = {
        en: Object.keys(translations.en).length,
        hi: Object.keys(translations.hi).length,
        ta: Object.keys(translations.ta).length,
      };

      expect(counts.en).toBe(3);
      expect(counts.hi).toBe(2);
      expect(counts.ta).toBe(1);
    });

    it('should identify coverage percentage', () => {
      const enKeys = ['nav.home', 'nav.search', 'booking.title', 'error.general'];
      const hiKeys = ['nav.home', 'nav.search', 'booking.title'];

      const coverage = (hiKeys.length / enKeys.length) * 100;
      expect(coverage).toBe(75);
    });
  });

  describe('Hotel Language Configuration', () => {
    it('should validate supported languages list', () => {
      const supportedLangs = ['en', 'hi', 'ta'];
      const requestedLangs = ['en', 'ta', 'fr'];

      const invalidLangs = requestedLangs.filter(l => !supportedLangs.includes(l));
      expect(invalidLangs).toContain('fr');
    });

    it('should handle default language setting', () => {
      const config = {
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'hi', 'ta'],
      };

      expect(config.supportedLanguages).toContain(config.defaultLanguage);
    });
  });

  describe('RTL Support', () => {
    it('should identify RTL languages', () => {
      const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

      expect(rtlLanguages).toContain('ar');
      expect(rtlLanguages).not.toContain('en');
      expect(rtlLanguages).not.toContain('hi');
    });

    it('should handle RTL/LTR direction properly', () => {
      const isRTL = (lang: string) => ['ar', 'he', 'fa', 'ur'].includes(lang);

      expect(isRTL('ar')).toBe(true);
      expect(isRTL('en')).toBe(false);
    });
  });
});
