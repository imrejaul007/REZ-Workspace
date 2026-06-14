import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import { getStoreMenu, getScanPayStore } from '@/lib/api/store';
import { StoreInfo, MenuCategory } from '@/lib/types';
import StoreContextProvider from './StoreContextProvider';
import StoreJsonLd from '@/components/seo/StoreJsonLd';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}

export interface StoreContext {
  store: StoreInfo;
  categories?: MenuCategory[];
}

/** Shared helper — fetch store with Order & Pay first, Scan & Pay fallback. */
async function fetchStore(
  storeSlug: string,
): Promise<{ store: StoreInfo; categories?: MenuCategory[] } | null> {
  try {
    try {
      const result = await getStoreMenu(storeSlug);
      return { store: result.store, categories: result.categories };
    } catch {
      const store = await getScanPayStore(storeSlug);
      return { store };
    }
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const data = await fetchStore(storeSlug);

  if (!data) {
    return { title: 'Store not found — REZ Now' };
  }

  const { store } = data;
  const title = `${store.name} — Order on REZ Now`;
  const description = `Order from ${store.name}. Fast delivery, earn REZ coins on every order.`;
  const url = `https://now.rez.money/${storeSlug}`;
  const images = store.logo ? [store.logo] : [];

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      images,
      type: 'website',
      url,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images,
    },
  };
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { storeSlug } = await params;

  const [data, locale] = await Promise.all([fetchStore(storeSlug), getLocale()]);

  if (!data) {
    notFound();
    return null;
  }

  const { store, categories } = data;

  return (
    <StoreContextProvider store={store} categories={categories}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:ring-2 focus:ring-indigo-500"
      >
        Skip to main content
      </a>
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4"
              />
            </svg>
            My Orders
          </Link>
          <Link
            href="/profile"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
            aria-label="My Profile"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z"
              />
            </svg>
            Profile
          </Link>
        </div>
        <LanguageSwitcher locale={locale} />
      </header>
      <main id="main-content" role="main">
        {children}
      </main>
      <StoreJsonLd store={store} />
    </StoreContextProvider>
  );
}
