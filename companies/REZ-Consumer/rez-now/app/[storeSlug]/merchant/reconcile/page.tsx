import type { Metadata } from 'next';
import { getScanPayStore } from '@/lib/api/store';
import ReconcileClient from './ReconcileClient';

interface ReconcilePageProps {
  params: Promise<{ storeSlug: string }>;
}

export async function generateMetadata({ params }: ReconcilePageProps): Promise<Metadata> {
  const { storeSlug } = await params;
  let storeName = storeSlug;
  try {
    const store = await getScanPayStore(storeSlug);
    storeName = store.name;
  } catch {
    // fallback to slug
  }
  return {
    title: `Reconcile — ${storeName}`,
    description: `End-of-day cash and digital reconciliation for ${storeName}`,
  };
}

export default async function ReconcilePage({ params }: ReconcilePageProps) {
  const { storeSlug } = await params;

  return <ReconcileClient storeSlug={storeSlug} />;
}
