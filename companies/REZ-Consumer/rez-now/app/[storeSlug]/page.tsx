import type { Metadata } from 'next';
import { getStoreMenu, getScanPayStore } from '@/lib/api/store';
import { StoreInfo, MenuCategory } from '@/lib/types';
import StorePageClient from './StorePageClient';

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
  const title = `${store.name} — Order Online | REZ Now`;
  const description = `Order from ${store.name} online. Fast delivery, earn REZ coins on every order.`;
  const url = `https://now.rez.money/${storeSlug}`;
  const images = store.logo ? [store.logo] : [];

  return {
    title,
    description,
    alternates: {
      canonical: url,
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

export default function StorePage() {
  return <StorePageClient />;
}
