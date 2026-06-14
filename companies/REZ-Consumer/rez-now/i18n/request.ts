import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export type Locale = 'en' | 'hi';
export const defaultLocale: Locale = 'en';
export const locales: Locale[] = ['en', 'hi'];

export default getRequestConfig(async () => {
  // Read locale preference from cookie; fall back to English
  const cookieStore = await cookies();
  const raw = cookieStore.get('NEXT_LOCALE')?.value ?? defaultLocale;
  const locale: Locale = locales.includes(raw as Locale) ? (raw as Locale) : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
