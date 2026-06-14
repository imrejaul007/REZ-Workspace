import type { Metadata } from 'next';
import { getScanPayStore } from '@/lib/api/store';
import CrmDashboard from '@/components/merchant/crm/CrmDashboard';

interface CrmPageProps {
  params: Promise<{ storeSlug: string }>;
}

export async function generateMetadata({ params }: CrmPageProps): Promise<Metadata> {
  const { storeSlug } = await params;
  let storeName = storeSlug;
  try {
    const store = await getScanPayStore(storeSlug);
    storeName = store.name;
  } catch {
    // fallback to slug
  }
  return {
    title: `Customer CRM — ${storeName}`,
    description: `Customer analytics and insights for ${storeName}`,
  };
}

export default async function CrmPage({ params }: CrmPageProps) {
  const { storeSlug } = await params;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Customer CRM</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Analyze customer segments, track visits, and re-engage at-risk customers.
        </p>
      </div>
      <CrmDashboard storeSlug={storeSlug} />
    </div>
  );
}
