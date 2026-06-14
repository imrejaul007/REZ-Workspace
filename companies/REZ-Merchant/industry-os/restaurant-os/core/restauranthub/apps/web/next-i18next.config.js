/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'mr', 'pa', 'kn', 'ml', 'or', 'as', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar'],
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',

  // Locale detection
  localDetection: true,

  // Path-based routing
  localeDetection: true,

  // Namespace configuration
  ns: [
    'common',
    'auth',
    'dashboard',
    'jobs',
    'marketplace',
    'restaurants',
    'employees',
    'vendors',
    'orders',
    'payments',
    'messaging',
    'analytics',
    'admin',
    'errors',
    'forms',
    'navigation',
  ],

  defaultNS: 'common',

  // Fallback configuration
  fallbackLng: {
    'hi-IN': ['hi', 'en'],
    'ta-IN': ['ta', 'en'],
    'te-IN': ['te', 'en'],
    'bn-IN': ['bn', 'en'],
    'gu-IN': ['gu', 'en'],
    'mr-IN': ['mr', 'en'],
    'pa-IN': ['pa', 'en'],
    'kn-IN': ['kn', 'en'],
    'ml-IN': ['ml', 'en'],
    'or-IN': ['or', 'en'],
    'as-IN': ['as', 'en'],
    default: ['en'],
  },

  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',

  // Server-side configuration
  serializeConfig: false,

  // Load path for translation files
  loadPath: '/locales/{{lng}}/{{ns}}.json',

  // Interpolation options
  interpolation: {
    escapeValue: false, // React already escapes values
    format: function (value, format, lng) {
      if (format === 'currency') {
        if (lng === 'hi' || lng.startsWith('hi-')) {
          return new Intl.NumberFormat('hi-IN', {
            style: 'currency',
            currency: 'INR',
          }).format(value);
        }
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      }

      if (format === 'number') {
        return new Intl.NumberFormat(lng).format(value);
      }

      if (format === 'date') {
        return new Intl.DateTimeFormat(lng).format(new Date(value));
      }

      if (format === 'relative') {
        const rtf = new Intl.RelativeTimeFormat(lng, { numeric: 'auto' });
        const now = new Date();
        const date = new Date(value);
        const diffInSeconds = (date.getTime() - now.getTime()) / 1000;

        if (Math.abs(diffInSeconds) < 60) {
          return rtf.format(Math.round(diffInSeconds), 'second');
        } else if (Math.abs(diffInSeconds) < 3600) {
          return rtf.format(Math.round(diffInSeconds / 60), 'minute');
        } else if (Math.abs(diffInSeconds) < 86400) {
          return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
        } else {
          return rtf.format(Math.round(diffInSeconds / 86400), 'day');
        }
      }

      return value;
    },
  },

  // React options
  react: {
    useSuspense: false,
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span'],
  },

  // Backend options for server-side
  backend: {
    loadPath: './public/locales/{{lng}}/{{ns}}.json',
  },

  // Custom detection for restaurant industry
  detection: {
    order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage', 'cookie'],
    lookupQuerystring: 'lng',
    lookupCookie: 'i18next',
    lookupLocalStorage: 'i18nextLng',
    excludeCacheFor: ['cimode'],
  },
};