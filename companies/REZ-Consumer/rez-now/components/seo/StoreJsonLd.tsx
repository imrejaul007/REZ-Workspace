import { StoreInfo } from '@/lib/types';

interface StoreJsonLdProps {
  store: StoreInfo;
}

const FOOD_TYPES: StoreInfo['storeType'][] = ['restaurant', 'cafe', 'cloud_kitchen'];

export default function StoreJsonLd({ store }: StoreJsonLdProps) {
  const isFoodEstablishment = FOOD_TYPES.includes(store.storeType);
  const storeUrl = `https://now.rez.money/${store.slug}`;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': isFoodEstablishment ? 'FoodEstablishment' : 'LocalBusiness',
    name: store.name,
    url: storeUrl,
    image: store.logo ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: store.address,
      addressCountry: 'IN',
    },
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, Credit Card, UPI',
    telephone: store.phone || undefined,
  };

  if (store.googlePlaceId) {
    jsonLd.hasMap = `https://www.google.com/maps/place/?q=place_id:${store.googlePlaceId}`;
  }

  if (isFoodEstablishment) {
    jsonLd.servesCuisine = store.storeType;
  }

  return (
    <script
      type="application/ld+json"
       
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
