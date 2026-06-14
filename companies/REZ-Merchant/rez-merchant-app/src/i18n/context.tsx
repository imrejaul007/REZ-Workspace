import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { translations, Language, languages } from './index';
import { getTranslation } from './index';

interface I18nContextType {
  locale: Language;
  setLocale: (locale: Language) => void;
  t: (key: string) => string;
  languages: typeof languages;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Language;
}

export function I18nProvider({ children, initialLocale = 'en' }: I18nProviderProps) {
  const [locale, setLocale] = useState<Language>(initialLocale);

  const t = useCallback(
    (key: string): string => {
      return getTranslation(locale, key);
    },
    [locale]
  );

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    languages,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
