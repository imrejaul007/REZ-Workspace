'use client';

import { useRouter } from 'next/navigation';

interface LanguageSwitcherProps {
  locale: string;
}

export default function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const router = useRouter();

  const switchLocale = (next: 'en' | 'hi') => {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  const pillBase = 'px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer';
  const active = 'bg-indigo-600 text-white';
  const inactive = 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50';

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => switchLocale('en')}
        className={`${pillBase} ${locale === 'en' ? active : inactive}`}
        aria-pressed={locale === 'en'}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLocale('hi')}
        className={`${pillBase} ${locale === 'hi' ? active : inactive}`}
        aria-pressed={locale === 'hi'}
        aria-label="Switch to Hindi"
      >
        हिं
      </button>
    </div>
  );
}
