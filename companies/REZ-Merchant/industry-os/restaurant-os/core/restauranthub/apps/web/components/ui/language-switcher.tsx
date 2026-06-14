'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'next-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
];

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'inline' | 'compact';
  showFlag?: boolean;
  showNativeName?: boolean;
}

export function LanguageSwitcher({
  className = '',
  variant = 'dropdown',
  showFlag = true,
  showNativeName = true,
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (languageCode: string) => {
    try {
      // Store the preference
      localStorage.setItem('preferred-language', languageCode);

      // Update the URL with new locale
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;

      // Remove current locale from path if present
      const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');

      // Construct new path with new locale
      const newPath = languageCode === 'en'
        ? pathWithoutLocale || '/'
        : `/${languageCode}${pathWithoutLocale || ''}`;

      // Navigate to new path
      router.push(`${newPath}${currentSearch}`);

      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={`h-8 w-8 p-0 ${className}`}>
            <Globe className="h-4 w-4" />
            <span className="sr-only">{t('language.select')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                {showFlag && <span className="text-sm">{language.flag}</span>}
                <span className="text-sm">{language.nativeName}</span>
              </div>
              {currentLanguage.code === language.code && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {languages.slice(0, 8).map((language) => (
          <Button
            key={language.code}
            variant={currentLanguage.code === language.code ? 'default' : 'outline'}
            
            onClick={() => handleLanguageChange(language.code)}
            className="h-8"
          >
            {showFlag && <span className="mr-1 text-xs">{language.flag}</span>}
            <span className="text-xs">
              {showNativeName ? language.nativeName : language.name}
            </span>
          </Button>
        ))}
        {languages.length > 8 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"  className="h-8">
                <span className="text-xs">+{languages.length - 8}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {languages.slice(8).map((language) => (
                <DropdownMenuItem
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    {showFlag && <span className="text-sm">{language.flag}</span>}
                    <span className="text-sm">{language.nativeName}</span>
                  </div>
                  {currentLanguage.code === language.code && (
                    <Check className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center space-x-2 ${className}`}
        >
          {showFlag && <span>{currentLanguage.flag}</span>}
          <span>{showNativeName ? currentLanguage.nativeName : currentLanguage.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
        <div className="p-2">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {t('language.select')}
          </p>
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center justify-between cursor-pointer p-2 rounded-md hover:bg-accent"
            >
              <div className="flex items-center space-x-3">
                {showFlag && (
                  <span className="text-lg">{language.flag}</span>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {language.nativeName}
                  </span>
                  {language.nativeName !== language.name && (
                    <span className="text-xs text-muted-foreground">
                      {language.name}
                    </span>
                  )}
                </div>
              </div>
              {currentLanguage.code === language.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook for using language utilities
export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const isRTL = currentLanguage.rtl || false;

  const formatCurrency = (amount: number, currency = 'USD') => {
    const locale = i18n.language === 'hi' ? 'hi-IN' :
                   i18n.language === 'es' ? 'es-ES' :
                   i18n.language === 'fr' ? 'fr-FR' :
                   i18n.language === 'de' ? 'de-DE' :
                   i18n.language === 'zh' ? 'zh-CN' :
                   i18n.language === 'ja' ? 'ja-JP' :
                   i18n.language === 'ko' ? 'ko-KR' :
                   i18n.language === 'ar' ? 'ar-SA' : 'en-US';

    const currencyCode = i18n.language === 'hi' ? 'INR' :
                        i18n.language === 'es' ? 'EUR' :
                        i18n.language === 'fr' ? 'EUR' :
                        i18n.language === 'de' ? 'EUR' :
                        i18n.language === 'zh' ? 'CNY' :
                        i18n.language === 'ja' ? 'JPY' :
                        i18n.language === 'ko' ? 'KRW' :
                        i18n.language === 'ar' ? 'SAR' : currency;

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const locale = i18n.language === 'en' ? 'en-US' : i18n.language;
    return new Intl.DateTimeFormat(locale, options).format(new Date(date));
  };

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    const locale = i18n.language === 'en' ? 'en-US' : i18n.language;
    return new Intl.NumberFormat(locale, options).format(number);
  };

  return {
    currentLanguage,
    isRTL,
    formatCurrency,
    formatDate,
    formatNumber,
    languages,
  };
}