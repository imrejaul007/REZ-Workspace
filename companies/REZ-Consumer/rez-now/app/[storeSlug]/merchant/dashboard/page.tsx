import type { Metadata } from 'next';
import { getScanPayStore } from '@/lib/api/store';
import MultiStoreAnalytics from '@/components/merchant/MultiStoreAnalytics';

interface DashboardPageProps {
  params: Promise<{ storeSlug: string }>;
}

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { storeSlug } = await params;
  let storeName = storeSlug;
  try {
    const store = await getScanPayStore(storeSlug);
    storeName = store.name;
  } catch {
    // fallback to slug
  }
  return {
    title: `Dashboard — ${storeName}`,
    description: `Merchant dashboard for ${storeName}`,
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { storeSlug } = await params;
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Merchant Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Store: {storeSlug}</p>
      <MultiStoreAnalytics />
    </div>
  );
}
