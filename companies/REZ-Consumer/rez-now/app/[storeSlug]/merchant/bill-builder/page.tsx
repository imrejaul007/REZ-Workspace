import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScanPayStore } from '@/lib/api/store';

interface BillBuilderPageProps {
  params: Promise<{ storeSlug: string }>;
}

export async function generateMetadata({ params }: BillBuilderPageProps): Promise<Metadata> {
  const { storeSlug } = await params;
  let storeName = storeSlug;
  try {
    const store = await getScanPayStore(storeSlug);
    storeName = store.name;
  } catch {
    // fallback to slug
  }
  return {
    title: `Bill Builder — ${storeName}`,
    description: `Create bills and generate payment QR codes for ${storeName}`,
  };
}

export default async function BillBuilderPage({ params }: BillBuilderPageProps) {
  const { storeSlug } = await params;

  let store;
  try {
    store = await getScanPayStore(storeSlug);
  } catch {
    notFound();
    return null;
  }

  return (
    <BillBuilderClientWrapper
      storeSlug={storeSlug}
      storeName={store.name}
      storeLogo={store.logo}
    />
  );
}

// Dynamic import to avoid 'use client' in a server component
import BillBuilderClient from './BillBuilderClient';

function BillBuilderClientWrapper({
  storeSlug,
  storeName,
  storeLogo,
}: {
  storeSlug: string;
  storeName: string;
  storeLogo: string | null;
}) {
  return (
    <BillBuilderClient
      storeSlug={storeSlug}
      storeName={storeName}
      storeLogo={storeLogo}
    />
  );
}
