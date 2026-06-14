'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useStore } from './StoreContextProvider';
import { useCartStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import { prefillCartFromOrder } from '@/lib/api/reorder';
import MenuHeader from '@/components/menu/MenuHeader';
import CategoryNav from '@/components/menu/CategoryNav';
import MenuItem from '@/components/menu/MenuItem';
import CartSummaryBar from '@/components/menu/CartSummaryBar';
import PromoBanner from '@/components/menu/PromoBanner';
import WaiterCallButton from '@/components/menu/WaiterCallButton';
import MenuSocketProvider from '@/lib/socket/MenuSocketProvider';
import ScanPayPage from './pay/page';
import { getUICopy } from '@/lib/utils/storeType';
import { useMenuSearch } from '@/lib/hooks/useMenuSearch';
import { useTrack } from '@/lib/analytics/events';
import StoreFooter from '@/components/store/StoreFooter';
import GoogleReviews from '@/components/store/GoogleReviews';
import ReferralBanner from '@/components/ui/ReferralBanner';
import RetailCatalog from '@/components/catalog/RetailCatalog';
import ServicesCatalog from '@/components/catalog/ServicesCatalog';
import AppointmentsCatalog from '@/components/catalog/AppointmentsCatalog';
import dynamic from 'next/dynamic';

const KitchenChatDrawer = dynamic(
  () => import('@/components/table/KitchenChatDrawer'),
  { ssr: false },
);

const AIChatWidget = dynamic(
  () => import('@/components/chat/AIChatWidget'),
  { ssr: false },
);

export default function StorePage() {
  const { store, categories } = useStore();
  const t = useTranslations('store');
  const searchParams = useSearchParams();
  const setStore = useCartStore((s) => s.setStore);
  const showToast = useUIStore((s) => s.showToast);
  const track = useTrack();

  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories && categories.length > 0 ? categories[0].id : null
  );
  const [vegOnly, setVegOnly] = useState(false);
  const { query, setQuery, results: searchResults, isSearching } = useMenuSearch(categories || []);

  const tableNumber = searchParams.get('table') || undefined;
  const refParam = searchParams.get('ref') || undefined;
  const reorderParam = searchParams.get('reorder') || undefined;
  const uiCopy = useMemo(() => getUICopy(store.storeType), [store.storeType]);
  const catalogV2Enabled = process.env.NEXT_PUBLIC_FEATURE_CATALOG_V2 === 'true';

  // Set table number in cart
  useEffect(() => {
    setStore(store.slug, tableNumber);
  }, [store.slug, tableNumber, setStore]);

  // Persist referral code to localStorage so checkout can pick it up
  useEffect(() => {
    if (refParam && typeof window !== 'undefined') {
      localStorage.setItem('rez-ref', refParam);
    }
  }, [refParam]);

  // Pre-fill cart from a previous order when ?reorder=<orderNumber> is present
  // (deep-linked from a WhatsApp reorder message)
  useEffect(() => {
    if (!reorderParam) return;
    prefillCartFromOrder(reorderParam, store.slug).then((ok) => {
      if (ok) {
        showToast("We've loaded your previous order. Tap checkout to reorder.", 'info');
      }
    });
    // Run once per unique reorder param — intentionally omit showToast from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reorderParam, store.slug]);

  // Fire store_viewed once on mount
  useEffect(() => {
    track({
      event: 'store_viewed',
      storeSlug: store.slug,
      properties: {
        storeType: store.storeType,
        hasMenu: store.hasMenu,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.slug]);

  // Track active category on scroll - MEMOIZED to prevent unnecessary re-renders
  const handleScroll = useCallback(() => {
    if (!categories) return;
    for (const cat of [...categories].reverse()) {
      const el = document.getElementById(`cat-${cat.id}`);
      if (el && el.getBoundingClientRect().top <= 140) {
        setActiveCategory(cat.id);
        break;
      }
    }
  }, [categories]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // If no menu → render Scan & Pay
  if (!store.hasMenu) {
    return <ScanPayPage />;
  }

  // Universal Catalog routing (R5) — displayMode determines the catalog layout.
  // NW-HIGH-001: ServicesCatalog and AppointmentsCatalog are gated behind NEXT_PUBLIC_FEATURE_CATALOG_V2.
  // Until fully implemented, they render a clear "coming soon" message instead of broken UI.
  if (store.displayMode === 'catalog') {
    return <RetailCatalog store={store} />;
  }
  if (store.displayMode === 'services') {
    if (!catalogV2Enabled) {
      return (
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{store.name}</h1>
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-indigo-700 font-medium">Services</p>
            <p className="text-sm text-indigo-500 mt-1">Coming soon — set NEXT_PUBLIC_FEATURE_CATALOG_V2=true to activate.</p>
          </div>
        </div>
      );
    }
    return <ServicesCatalog store={store} />;
  }
  if (store.displayMode === 'appointments') {
    if (!catalogV2Enabled) {
      return (
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{store.name}</h1>
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-indigo-700 font-medium">Book an Appointment</p>
            <p className="text-sm text-indigo-500 mt-1">Coming soon — set NEXT_PUBLIC_FEATURE_CATALOG_V2=true to activate.</p>
          </div>
        </div>
      );
    }
    return <AppointmentsCatalog store={store} />;
  }
  // displayMode === 'menu' falls through to the existing Order & Pay menu flow below

  // PERFORMANCE FIX: Memoize filtered categories to avoid recalculation on every render
  const filteredCategories = useMemo(() => {
    return searchResults
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
          if (vegOnly && !item.isVeg) return false;
          return true;
        }),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchResults, vegOnly]);

  // PERFORMANCE FIX: Memoize total result count
  const totalResultCount = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0);
  }, [filteredCategories]);

  // PERFORMANCE FIX: Memoize veg toggle handler
  const handleVegToggle = useCallback(() => {
    setVegOnly(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <MenuHeader store={store} tableNumber={tableNumber} />
      <PromoBanner promos={store.activePromos ?? []} />
      <ReferralBanner />

      {/* Sticky controls */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <CategoryNav
          categories={categories || []}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
        <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-50">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              aria-label={t('searchPlaceholder')}
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            />
            {isSearching && (
              <span
                role="status"
                aria-label="Searching"
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <svg className="w-4 h-4 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </span>
            )}
          </div>
          <button
            onClick={handleVegToggle}
            aria-pressed={vegOnly}
            aria-label={t('veg')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${vegOnly ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
          >
            <span className="w-3 h-3 rounded-sm border-2 border-green-600 flex items-center justify-center">
              {vegOnly && <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />}
            </span>
            {t('veg')}
          </button>
        </div>
      </div>

      {/* Menu sections */}
      <div className="px-4 pt-2">
        {/* Search result counter */}
        {query.trim() !== '' && !isSearching && filteredCategories.length > 0 && (
          <p className="text-xs text-gray-500 mb-2">
            {totalResultCount} result{totalResultCount !== 1 ? 's' : ''} for &ldquo;{query.trim()}&rdquo;
          </p>
        )}

        {filteredCategories.length === 0 ? (
          query.trim() !== '' ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-base font-medium text-gray-700">No items found for &ldquo;{query.trim()}&rdquo;</p>
              <p className="text-sm mt-1 text-gray-400">Check the spelling or try a broader term</p>
              <button
                onClick={() => setQuery('')}
                className="mt-4 text-sm text-indigo-600 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No items found</p>
              <p className="text-sm mt-1">Try a different search or filter</p>
            </div>
          )
        ) : (
          <MenuSocketProvider storeId={store.id}>
            {filteredCategories.map((cat) => (
              <div key={cat.id} id={`cat-${cat.id}`} className="mb-4">
                <h2 className="text-base font-bold text-gray-900 py-3 sticky top-[105px] bg-gray-50 z-20">
                  {cat.name}
                </h2>
                <div className="bg-white rounded-xl divide-y divide-gray-50 px-4">
                  {cat.items.map((item) => (
                    <MenuItem
                      key={item.id}
                      item={item}
                      addLabel={uiCopy.addToCartLabel}
                      searchQuery={query.trim()}
                    />
                  ))}
                </div>
              </div>
            ))}
          </MenuSocketProvider>
        )}
      </div>

      {/* Waiter call button */}
      {tableNumber && (
        <div className="fixed bottom-24 right-4 z-40">
          <WaiterCallButton storeSlug={store.slug} tableNumber={tableNumber} />
        </div>
      )}

      {/* Kitchen / staff chat drawer — only shown when seated at a table */}
      {tableNumber && (
        <div className="fixed bottom-40 right-4 z-40">
          <KitchenChatDrawer
            storeSlug={store.slug}
            tableNumber={tableNumber}
          />
        </div>
      )}

      {store.reservationsEnabled && (
        <div className="px-4 py-3">
          <Link
            href={`/${store.slug}/reserve`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-indigo-600 text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Reserve a Table
          </Link>
        </div>
      )}

      <GoogleReviews storeSlug={store.slug} />

      <StoreFooter store={store} />

      {/* AI Chat Widget - always visible for AI-powered support */}
      <AIChatWidget />

      <CartSummaryBar storeSlug={store.slug} />
    </div>
  );
}
