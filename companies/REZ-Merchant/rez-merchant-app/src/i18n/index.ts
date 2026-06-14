import en from './locales/en.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import mr from './locales/mr.json';

export const translations = { en, hi, ta, te, mr };

export type Language = 'en' | 'hi' | 'ta' | 'te' | 'mr';

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'mr', name: 'मराठी' },
];

export const getTranslation = (locale: Language, key: string): string => {
  const keys = key.split('.');
  let value: unknown = translations[locale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
};
