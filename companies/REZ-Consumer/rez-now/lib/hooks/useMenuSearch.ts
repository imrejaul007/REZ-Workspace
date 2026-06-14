'use client';

import { useState, useEffect, useRef } from 'react';
import { MenuCategory } from '@/lib/types';

export interface UseMenuSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: MenuCategory[];
  isSearching: boolean;
}

/**
 * Debounced full-text search over menu categories.
 *
 * Matches items by name, description, and tags (case-insensitive, partial).
 * Returns filtered categories containing only matched items.
 * Empty query returns all categories unchanged.
 *
 * @param categories - The full list of menu categories from the store context
 * @param debounceMs - Debounce delay in milliseconds (default 300)
 */
export function useMenuSearch(
  categories: MenuCategory[],
  debounceMs = 300,
): UseMenuSearchReturn {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // If query is empty, resolve immediately — no spinner needed
    if (trimmed === '') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing derived state on empty query is intentional
      setIsSearching(false);
      setDebouncedQuery('');
      return;
    }

    setIsSearching(true);

    timerRef.current = setTimeout(() => {
      setDebouncedQuery(trimmed);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, debounceMs]);

  const results: MenuCategory[] =
    debouncedQuery === ''
      ? categories
      : categories
          .map((cat) => ({
            ...cat,
            items: cat.items.filter((item) => {
              const needle = debouncedQuery.toLowerCase();
              if (item.name.toLowerCase().includes(needle)) return true;
              if (item.description?.toLowerCase().includes(needle)) return true;
              return false;
            }),
          }))
          .filter((cat) => cat.items.length > 0);

  return { query, setQuery, results, isSearching };
}
