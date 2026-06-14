import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScanPayStore } from '@/lib/api/store';

interface PayDisplayPageProps {
  params: Promise<{ storeSlug: string }>;
}

export async function generateMetadata({ params }: PayDisplayPageProps): Promise<Metadata> {
  const { storeSlug } = await params;
  let storeName = storeSlug;
  try {
    const store = await getScanPayStore(storeSlug);
    storeName = store.name;
  } catch {
    // fallback to slug
  }
  return {
    title: `Payment Kiosk — ${storeName}`,
    description: `Real-time payment display for ${storeName}`,
  };
}

export default async function PayDisplayPage({ params }: PayDisplayPageProps) {
  const { storeSlug } = await params;

  let store;
  try {
    store = await getScanPayStore(storeSlug);
  } catch {
    notFound();
    return null;
  }

  return (
    <PayDisplayClientWrapper
      storeSlug={storeSlug}
      storeName={store.name}
      storeLogo={store.logo}
    />
  );
}

// Dynamic import to avoid 'use client' in a server component
import PayDisplayClient from './PayDisplayClient';

function PayDisplayClientWrapper({
  storeSlug,
  storeName,
  storeLogo,
}: {
  storeSlug: string;
  storeName: string;
  storeLogo: string | null;
}) {
  return (
    <PayDisplayClient
      storeSlug={storeSlug}
      storeName={storeName}
      storeLogo={storeLogo}
    />
  );
}
