'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface CatalogHeaderProps {
  storeName: string;
  storeLogo?: string | null;
  categories?: string[];
  onSearch: (query: string) => void;
  onCategoryChange: (category: string | null) => void;
  selectedCategory: string | null;
}

export default function CatalogHeader({
  storeName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  storeLogo,
  categories,
  onSearch,
  onCategoryChange,
  selectedCategory,
}: CatalogHeaderProps) {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          placeholder={`Search in ${storeName}...`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onSearch(e.target.value);
          }}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Category filters */}
      {categories && categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => onCategoryChange(null)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              selectedCategory === null
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
