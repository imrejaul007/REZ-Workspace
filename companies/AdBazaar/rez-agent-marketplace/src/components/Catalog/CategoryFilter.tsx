'use client';

import Link from 'next/link';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { categories } from '@/data/agents';

export default function CategoryFilter() {
  const { selectedCategory, setSelectedCategory } = useMarketplaceStore();

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
      <button
        onClick={() => setSelectedCategory(null)}
        className={`category-pill whitespace-nowrap ${!selectedCategory ? 'active' : ''}`}
      >
        All Categories
      </button>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/${category.slug}`}
          onClick={(e) => {
            e.preventDefault();
            setSelectedCategory(category.slug);
          }}
          className={`category-pill whitespace-nowrap ${selectedCategory === category.slug ? 'active' : ''}`}
        >
          <span>{category.icon}</span>
          <span>{category.name}</span>
        </Link>
      ))}
    </div>
  );
}
