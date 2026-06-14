'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { StoreSearchResult } from '@/lib/api/search';

// ── Helpers ─────────────────────────────────────────────────────────────────────

function storeTypeLabel(storeType: string): string {
  const map: Record<string, string> = {
    restaurant: 'Restaurant',
    cafe: 'Café',
    cloud_kitchen: 'Cloud Kitchen',
    bakery: 'Bakery',
    salon: 'Salon',
    spa: 'Spa',
    hotel: 'Hotel',
    retail: 'Retail',
    service: 'Service',
    general: 'Store',
  };
  return map[storeType] ?? 'Store';
}

function storeTypeBadgeColor(storeType: string): { bg: string; text: string; icon: string } {
  const map: Record<string, { bg: string; text: string; icon: string }> = {
    restaurant: { bg: 'bg-orange-50', text: 'text-orange-600', icon: '🍽️' },
    cafe: { bg: 'bg-amber-50', text: 'text-amber-700', icon: '☕' },
    cloud_kitchen: { bg: 'bg-rose-50', text: 'text-rose-600', icon: '📦' },
    bakery: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '🥐' },
    salon: { bg: 'bg-pink-50', text: 'text-pink-600', icon: '💇' },
    spa: { bg: 'bg-teal-50', text: 'text-teal-700', icon: '💆' },
    hotel: { bg: 'bg-blue-50', text: 'text-blue-600', icon: '🏨' },
    retail: { bg: 'bg-purple-50', text: 'text-purple-600', icon: '🛍️' },
    general: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: '🏪' },
  };
  return map[storeType] ?? { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: '🏪' };
}

// ── Rating Stars ────────────────────────────────────────────────────────────────

function RatingStars({ rating }: { rating?: number }) {
  if (!rating) return null;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 20 20"
          fill={star <= Math.round(rating) ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.5}
          className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300'}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1 font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface StoreCardProps {
  store: StoreSearchResult;
}

export default function StoreCard({ store }: StoreCardProps) {
  const router = useRouter();
  const { bg, text, icon } = storeTypeBadgeColor(store.storeType);

  function handleOrder() {
    router.push(`/${store.slug}`);
  }

  const initials = store.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  // Generate gradient based on store type
  const gradients: Record<string, string> = {
    restaurant: 'from-orange-100 to-red-50',
    cafe: 'from-amber-100 to-yellow-50',
    cloud_kitchen: 'from-rose-100 to-pink-50',
    bakery: 'from-yellow-100 to-amber-50',
    salon: 'from-pink-100 to-rose-50',
    spa: 'from-teal-100 to-cyan-50',
    hotel: 'from-blue-100 to-indigo-50',
    retail: 'from-purple-100 to-violet-50',
    general: 'from-indigo-100 to-purple-50',
  };
  const gradient = gradients[store.storeType] ?? 'from-indigo-100 to-purple-50';

  return (
    <article
      role="article"
      aria-label={`${store.name} — ${storeTypeLabel(store.storeType)}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-100"
    >
      {/* Logo area */}
      <div className={`relative h-40 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        {store.logo ? (
          <Image
            src={store.logo}
            alt={store.name}
            fill
            sizes="(max-width:640px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span
              className="text-5xl opacity-80 transition-transform duration-300 group-hover:scale-110"
              aria-hidden="true"
            >
              {icon}
            </span>
            <span className="text-xl font-black text-gray-400 select-none">
              {initials}
            </span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />

        {/* Open/closed badge */}
        <div
          className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-transform duration-300 ${
            store.isOpen
              ? 'bg-green-50/90 text-green-700 border border-green-200'
              : 'bg-red-50/90 text-red-600 border border-red-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              store.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-400'
            }`}
            aria-hidden="true"
          />
          <span>{store.isOpen ? 'Open' : 'Closed'}</span>
        </div>

        {/* Quick action on hover */}
        <button
          onClick={handleOrder}
          disabled={!store.isOpen}
          className="absolute bottom-3 left-3 right-3 py-2.5 rounded-xl bg-white/95 text-indigo-700 font-bold text-sm shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-white disabled:opacity-50"
          aria-label={`Order from ${store.name}`}
        >
          {store.isOpen ? 'Order Now →' : 'Currently Closed'}
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title & Rating */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-indigo-700 transition-colors">
              {store.name}
            </h3>
            {store.rating && <RatingStars rating={store.rating} />}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${bg} ${text}`}>
              {icon}
              {storeTypeLabel(store.storeType)}
            </span>
            {store.cuisine && (
              <span className="text-xs text-gray-400 font-medium truncate">
                {store.cuisine}
              </span>
            )}
          </div>
        </div>

        {/* Address */}
        {store.address && (
          <div className="flex items-start gap-1.5 text-xs text-gray-500">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mt-0.5 text-gray-400 flex-shrink-0">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="line-clamp-1">{store.address}</span>
          </div>
        )}

        {/* Distance or delivery info */}
        {store.distance && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-400">
              <path fillRule="evenodd" d="M12.079 1.58a.75.75 0 01.746.744l.29 5.507a.75.75 0 01-.135.676L9.5 12.439l-4.778 2.67a.75.75 0 01-.97-.97l2.69-4.778a.75.75 0 01.675-.135l5.508.29zM6.75 13.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <span>{store.distance} km away</span>
          </div>
        )}

        {/* Order button (mobile - visible on small screens) */}
        <button
          type="button"
          onClick={handleOrder}
          disabled={!store.isOpen}
          className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-300 sm:hidden focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
          aria-label={`Order from ${store.name}`}
        >
          {store.isOpen ? 'Order Now' : 'Currently Closed'}
        </button>
      </div>
    </article>
  );
}
