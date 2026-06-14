'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoreResult {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  category: string;
  address: string;
}

interface SearchResponse {
  success: boolean;
  data?: StoreResult[];
  message?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    restaurant: 'Restaurant',
    cafe: 'Cafe',
    cloud_kitchen: 'Cloud Kitchen',
    retail: 'Retail',
    salon: 'Salon',
    hotel: 'Hotel',
    service: 'Service',
    general: 'Store',
  };
  return map[category] ?? 'Store';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StoreCard({ store }: { store: StoreResult }) {
  return (
    <Link
      href={`/${store.slug}`}
      className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all group"
    >
      {/* Logo */}
      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex-shrink-0 overflow-hidden border border-indigo-100 flex items-center justify-center">
        {store.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.logo}
            alt={store.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-indigo-400 font-bold text-lg">
            {store.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
          {store.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">
            {categoryLabel(store.category)}
          </span>
          {store.address && (
            <span className="text-[11px] text-gray-400 truncate">{store.address}</span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
          now.rez.money/{store.slug}
        </p>
      </div>

      {/* Arrow */}
      <svg
        className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg
      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <span className="absolute right-4 top-1/2 -translate-y-1/2">
      <svg
        className="w-5 h-5 text-indigo-500 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Searching"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </span>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function SearchSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StoreResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error' | 'unavailable'>('idle');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Derive dropdown state from query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing derived state on empty query is intentional
      setResults([]);
      setStatus('idle');
      setDropdownOpen(false);
      return;
    }

    // Debounce 300ms — show top 3 in dropdown
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setStatus('loading');
      try {
        const res = await fetch(
          `/api/web-ordering/search?q=${encodeURIComponent(trimmed)}&limit=3`,
          { signal: AbortSignal.timeout(8000) }
        );

        if (res.status === 404 || res.status === 501) {
          setResults([]);
          setStatus('unavailable');
          setDropdownOpen(false);
          return;
        }

        if (!res.ok) {
          setResults([]);
          setStatus('error');
          setDropdownOpen(false);
          return;
        }

        const json: SearchResponse = await res.json();
        setResults(json.data ?? []);
        setStatus('done');
        setDropdownOpen(true);
      } catch {
        setResults([]);
        setStatus('error');
        setDropdownOpen(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  function navigateToSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setDropdownOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      navigateToSearch();
    }
    if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  }

  const showDropdown = dropdownOpen && status === 'done' && query.trim().length > 0;

  return (
    <section className="w-full max-w-xl mx-auto px-4" aria-label="Find a store">
      {/* Input */}
      <div className="relative" ref={containerRef}>
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (status === 'done' && results.length > 0) setDropdownOpen(true); }}
          placeholder="Search by restaurant or store name..."
          className="w-full pl-12 pr-12 py-4 text-base bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all placeholder:text-gray-400"
          aria-label="Search for a store"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          autoComplete="off"
          spellCheck={false}
        />
        {status === 'loading' && <LoadingSpinner />}

        {/* Dropdown preview — top 3 results */}
        {showDropdown && (
          <div
            className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-gray-100 shadow-lg z-50 overflow-hidden"
            role="listbox"
            aria-label="Quick search results"
          >
            {results.length > 0 ? (
              <>
                <div className="p-2 flex flex-col gap-1">
                  {results.map((store) => (
                    <div key={store.id} role="option" aria-selected={false}>
                      <StoreCard store={store} />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={navigateToSearch}
                  className="w-full py-3 px-4 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors border-t border-gray-100 text-center"
                >
                  See all results for &ldquo;{query.trim()}&rdquo; →
                </button>
              </>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">
                  No stores found for &ldquo;{query.trim()}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {status === 'error' && query.trim().length > 0 && (
        <div className="mt-6 text-center py-8">
          <p className="text-sm font-medium text-gray-500">
            Could not reach the search service. Please try again.
          </p>
        </div>
      )}

      {/* Endpoint not available yet */}
      {status === 'unavailable' && query.trim().length > 0 && (
        <div className="mt-6 text-center py-8">
          <p className="text-sm font-medium text-gray-700">
            Store search is coming soon.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Store pages are shared by businesses directly — scan their QR code to open the menu.
          </p>
        </div>
      )}

      {/* Default hint when idle */}
      {status === 'idle' && (
        <p className="mt-3 text-xs text-center text-gray-400">
          Press Enter or click a result to browse stores.
        </p>
      )}
    </section>
  );
}
