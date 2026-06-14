import ReservationClient from './ReservationClient';

export default async function ReservePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  return <ReservationClient storeSlug={storeSlug} />;
}
