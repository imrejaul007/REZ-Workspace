/**
 * useTranslation — i18n stub hook
 *
 * TS-L1: This is a stub implementation that wraps the centralized Strings constant.
 * It provides the same interface as react-i18next's `useTranslation` so that
 * migrating to react-i18next in Phase 2 requires minimal component changes.
 *
 * Usage:
 *   const { t } = useTranslation();
 *   <Text>{t('common.loading')}</Text>
 *
 *   const { t } = useTranslation('orders');
 *   <Text>{t('newOrder')}</Text>
 *
 * Phase 2 migration plan (when react-i18next is added):
 *   1. npm install react-i18next i18next
 *   2. Create i18n/index.ts with i18next instance and locale files (en.json, hi.json)
 *   3. Export locale files from constants/strings.ts source
 *   4. Replace this stub with: import { useTranslation as _useTranslation } from 'react-i18next'
 *      export const useTranslation = (ns?: string) => _useTranslation(ns ?? 'common')
 *   5. Run codemod across all files: t('old.string') → t('new.string')
 *
 * See TS-L1 in docs/Bugs/15-TYPESCRIPT-UI.md for tracking.
 */

import { Strings } from '@/constants/strings';

type Namespace = keyof typeof Strings;
type StringKey<N extends Namespace> = keyof (typeof Strings)[N];

interface UseTranslationReturn {
  t: (key: string, options?: { fallback?: string }) => string;
}

/**
 * Returns a translation function for the given namespace (or 'common' by default).
 * Keys are dot-notation paths into the Strings object.
 * Falls back to the key itself if not found.
 */
export function useTranslation(namespace: Namespace = 'common'): UseTranslationReturn {
  const t = (key: string, options?: { fallback?: string }): string => {
    const parts = key.split('.');
    let value: unknown = Strings[namespace];

    for (const part of parts) {
      if (value == null || typeof value !== 'object') {
        return options?.fallback ?? key;
      }
      value = value[part];
    }

    return typeof value === 'string' ? value : (options?.fallback ?? key);
  };

  return { t };
}

/**
 * Get a translation by absolute key path (namespace.key format).
 * Convenience for cases where you only need one string.
 */
export function translate(key: string, fallback?: string): string {
  const dotIndex = key.indexOf('.');
  if (dotIndex === -1) return fallback ?? key;
  const ns = key.slice(0, dotIndex) as Namespace;
  const rest = key.slice(dotIndex + 1);
  return useTranslation(ns).t(rest, { fallback });
}

export default useTranslation;
