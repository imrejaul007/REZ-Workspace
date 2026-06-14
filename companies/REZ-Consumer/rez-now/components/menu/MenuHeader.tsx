import Badge from '@/components/ui/Badge';
import StoreImage from '@/components/ui/StoreImage';
import { StoreInfo } from '@/lib/types';
import MenuShareButton from './MenuShareButton';

interface MenuHeaderProps {
  store: StoreInfo;
  tableNumber?: string;
}

export default function MenuHeader({ store, tableNumber }: MenuHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100">
      {/* Banner */}
      {store.banner ? (
        <div className="relative h-32 sm:h-40 w-full overflow-hidden">
          <StoreImage
            src={store.banner}
            alt={store.name}
            width={800}
            height={160}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      ) : (
        /* Fallback gradient when no banner */
        <div className="h-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />
      )}

      {/* Store Info */}
      <div className="px-4 py-4 flex items-start gap-3">
        {/* Logo */}
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-lg flex-shrink-0 -mt-8 bg-white">
          <StoreImage
            src={store.logo}
            alt={store.name}
            width={64}
            height={64}
            fill
            sizes="64px"
            className="object-cover"
            priority
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name & Share */}
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-gray-900 truncate">{store.name}</h1>
            <MenuShareButton storeName={store.name} storeSlug={store.slug} />
          </div>

          {/* Address */}
          <p className="text-xs text-gray-500 truncate mt-0.5">{store.address}</p>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Open/Closed */}
            <Badge variant={store.isOpen ? 'green' : 'red'}>
              <span className={`w-1.5 h-1.5 rounded-full ${store.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-400'} mr-1.5 inline-block`} />
              {store.isOpen
                ? store.nextChangeLabel
                  ? `Open · ${store.nextChangeLabel}`
                  : 'Open now'
                : store.nextChangeLabel
                  ? `Closed · ${store.nextChangeLabel}`
                  : 'Closed'}
            </Badge>

            {/* Prep Time */}
            {store.estimatedPrepMinutes > 0 && (
              <Badge variant="blue">
                ⏱ {store.estimatedPrepMinutes} min
              </Badge>
            )}

            {/* REZ Coins */}
            {store.isProgramMerchant && (
              <Badge variant="indigo">
                🪙 Earn REZ Coins
              </Badge>
            )}

            {/* Table */}
            {tableNumber && (
              <Badge variant="purple">
                Table {tableNumber}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
