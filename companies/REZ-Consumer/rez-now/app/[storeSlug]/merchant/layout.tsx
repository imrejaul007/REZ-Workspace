'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { getMerchantStores } from '@/lib/api/merchant';
import { OutletOption, getStoredOutlet, setStoredOutlet } from '@/components/merchant/StoreSwitcher';
import StoreSwitcher from '@/components/merchant/StoreSwitcher';
import { MerchantContextProvider } from './MerchantContext';
import { cn } from '@/lib/utils/cn';

function mapOutletSummary(outlets: { slug: string; name: string; outletCode: string; city?: string; isPrimaryOutlet: boolean }[]): OutletOption[] {
  return outlets.map((o) => ({
    slug: o.slug,
    name: o.name,
    outletCode: o.outletCode,
    city: o.city ?? '',
    isPrimaryOutlet: o.isPrimaryOutlet,
  }));
}

function MerchantNav({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const storeSlug = params.storeSlug as string;
  const pathname = usePathname();

  const [outlets, setOutlets] = useState<OutletOption[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredOutlet();
    if (stored !== null) setSelectedOutlet(stored);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const response = await getMerchantStores();
        const opts = mapOutletSummary(response.stores);
        setOutlets(opts);

        // NW-CRIT-003 FIX: Verify the current storeSlug belongs to this merchant.
        // If the merchant navigates to a store they don't own, redirect to the
        // merchant landing page. This is defense-in-depth — the middleware only
        // checks token existence, not store ownership.
        const ownsThisStore = opts.some((o) => o.slug === storeSlug);
        if (!ownsThisStore) {
          router.push('/merchant');
          return;
        }

        if (opts.length === 1 && opts[0].slug) {
          setSelectedOutlet(opts[0].slug);
          setStoredOutlet(opts[0].slug);
        }
      } catch (err: unknown) {
        // NW-CRIT-003 FIX: Catch auth errors (401/403) and redirect to merchant login.
        // Without this, an unauthenticated user could see a broken merchant page.
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) {
          router.push('/merchant');
          return;
        }
        // For other errors, silently continue without the store switcher
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeSlug]);

  function handleSwitch(slug: string) {
    setSelectedOutlet(slug);
  }

  const navLinks = [
    { href: `/${storeSlug}/merchant/dashboard`, label: 'Dashboard' },
    { href: `/${storeSlug}/merchant/bill-builder`, label: 'Bill Builder' },
    { href: `/${storeSlug}/merchant/pay-display`, label: 'Pay Display' },
    { href: `/${storeSlug}/merchant/reconcile`, label: 'Reconcile' },
    { href: `/${storeSlug}/merchant/rez-go`, label: 'REZ Go 🛒' },
    { href: `/${storeSlug}/merchant/rez-go/qr-generator`, label: 'QR Generator' },
    { href: `/${storeSlug}/merchant/rez-go/exit-verification`, label: 'Exit Verify' },
    { href: `/${storeSlug}/merchant/rez-go/recovery`, label: 'Recovery' },
    { href: `/${storeSlug}/merchant/crm`, label: 'CRM' },
    { href: `/${storeSlug}/merchant/offers/automation`, label: 'Offer Automation' },
  ];

  return (
    <MerchantContextProvider
      outlets={outlets}
      selectedOutlet={selectedOutlet}
      setSelectedOutlet={setSelectedOutlet}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Merchant header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              {/* Back link + breadcrumb */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/${storeSlug}`}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Back to store"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">Merchant</span>
                  <span className="text-gray-300">/</span>
                  <span className="text-sm text-gray-600">{storeSlug}</span>
                </div>
              </div>

              {/* Outlet switcher */}
              {!loading && outlets.length > 0 && (
                <StoreSwitcher
                  currentSlug={selectedOutlet}
                  outlets={outlets}
                  onSwitch={handleSwitch}
                />
              )}
            </div>

            {/* Navigation tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto py-1 -mb-px">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href === `/${storeSlug}/merchant/dashboard` && pathname === `/${storeSlug}/merchant`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap',
                      isActive
                        ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      </div>
    </MerchantContextProvider>
  );
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return <MerchantNav>{children}</MerchantNav>;
}
