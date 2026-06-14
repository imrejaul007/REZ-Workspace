import StaffDashboardClient from './StaffDashboardClient';

interface StaffPageProps {
  params: Promise<{ storeSlug: string }>;
}

export default async function StaffPage({ params }: StaffPageProps) {
  const { storeSlug } = await params;
  return <StaffDashboardClient storeSlug={storeSlug} />;
}
