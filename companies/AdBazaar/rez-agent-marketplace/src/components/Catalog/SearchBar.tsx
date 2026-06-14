'use client';

import { Search } from 'lucide-react';
import { useMarketplaceStore } from '@/store/marketplaceStore';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useMarketplaceStore();

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search agents by name, category, or capability..."
        className="search-input pl-12"
      />
    </div>
  );
}
