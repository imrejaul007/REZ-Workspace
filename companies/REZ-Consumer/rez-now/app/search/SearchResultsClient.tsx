'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StoreCard from '@/components/store/StoreCard';
import type { StoreSearchResult } from '@/lib/api/search';

// ── Types ─────────────────────────────────────────────────────────────────────

type CategoryFilter =
  | 'all'
  | 'restaurant'
  | 'cafe'
  | 'bakery'
  | 'salon'
  | 'spa'
  | 'retail';

interface SearchApiResponse {
  success: boolean;
  data?: StoreSearchResult[];
  message?: string;
}

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Café' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'salon', label: 'Salon' },
  { value: 'spa', label: 'Spa' },
  { value: 'retail', label: 'Retail' },
];

const PAGE_SIZE = 9;

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse"
      aria-hidden="true"
    >
      <div className="h-36 bg-gray-100" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-8 bg-gray-100 rounded-xl mt-1" />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ q }: { q: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        aria-hidden="true"
        className="text-gray-200"
      >
        {/* Magnifier */}
        <circle cx="34" cy="34" r="20" stroke="currentColor" strokeWidth="5" />
        <line
          x1="49"
          y1="49"
          x2="68"
          y2="68"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Fork tines */}
        <line x1="27" y1="24" x2="27" y2="32" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
        <line x1="34" y1="24" x2="34" y2="32" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
        <line x1="41" y1="24" x2="41" y2="32" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
        {/* Fork handle */}
        <line x1="34" y1="32" x2="34" y2="44" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div>
        <p className="text-base font-semibold text-gray-700">
          No stores found
        </p>
        {q && (
          <p className="text-sm text-gray-400 mt-1">
            No results for &ldquo;{q}&rdquo;
          </p>
        )}
        <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">
          Try a different name or browse by category.
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  q: string;
}

export default function SearchResultsClient({ q: initialQ }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQ);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [results, setResults] = useState<StoreSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loadingMore' | 'done' | 'error'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const doSearch = useCallback(
    async (q: string, pg: number, append: boolean) => {
      if (!q.trim()) {
        setResults([]);
        setStatus('idle');
        return;
      }

      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setStatus(append ? 'loadingMore' : 'loading');

      try {
        const params = new URLSearchParams({
          q: q.trim(),
          limit: String(PAGE_SIZE),
          page: String(pg),
        });

        const res = await fetch(`/api/web-ordering/search?${params}`, {
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          setStatus('error');
          return;
        }

        const json: SearchApiResponse = await res.json();
        const fetched = json.data ?? [];

        setResults((prev) => (append ? [...prev, ...fetched] : fetched));
        setHasMore(fetched.length === PAGE_SIZE);
        setStatus('done');
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') return;
        setStatus('error');
      }
    },
    []
  );

  // Debounce query changes → navigate + search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setPage(1);
      // Update URL without pushing to history for every keystroke
      const url = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search';
      router.replace(url, { scroll: false });
      void doSearch(query, 1, false);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, router, doSearch]);

  // Initial load
  useEffect(() => {
    if (initialQ.trim()) {
      void doSearch(initialQ, 1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    void doSearch(query, nextPage, true);
  }

  const filtered =
    category === 'all'
      ? results
      : results.filter(
          (s) =>
            s.storeType === category ||
            s.category?.toLowerCase() === category
        );

  const isLoading = status === 'loading';
  const isLoadingMore = status === 'loadingMore';
  const showEmpty =
    status === 'done' && filtered.length === 0 && query.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {isLoading && (
              <span
                role="status"
                aria-label="Searching"
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <svg
                  className="w-4 h-4 text-indigo-500 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              </span>
            )}
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants, cafes..."
              className="w-full pl-9 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all placeholder:text-gray-400"
              aria-label="Search for a store"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5">
        {/* Category chips */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none"
          role="group"
          aria-label="Filter by category"
        >
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 ${
                category === value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
              aria-pressed={category === value}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Result count */}
        {status === 'done' && query.trim() && (
          <p className="text-xs text-gray-600 mb-4" aria-live="polite" aria-atomic="true">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query.trim()}&rdquo;
          </p>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {/* Results grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {showEmpty && <EmptyState q={query.trim()} />}

        {/* Idle hint */}
        {status === 'idle' && !query.trim() && (
          <p className="text-center text-sm text-gray-400 mt-12">
            Start typing to search for stores.
          </p>
        )}

        {/* Error */}
        {status === 'error' && (
          <p role="alert" className="text-center text-sm text-gray-600 mt-12">
            Could not reach the search service. Please try again.
          </p>
        )}

        {/* Load more */}
        {status === 'done' && hasMore && !isLoading && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
