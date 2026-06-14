'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { MenuCategory } from '@/lib/types';

interface CategoryNavProps {
  categories: MenuCategory[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function CategoryNav({ categories, activeId, onSelect }: CategoryNavProps) {
  const scrollRef = useRef<HTMLElement>(null);

  function scrollToCategory(id: string) {
    onSelect(id);
    const el = document.getElementById(`cat-${id}`);
    if (el) {
      const offset = 120; // sticky header height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    // Scroll the nav pill into view
    const btn = scrollRef.current?.querySelector(`[data-cat="${id}"]`) as HTMLElement;
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  return (
    <nav
      ref={scrollRef}
      role="navigation"
      aria-label="Menu categories"
      className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2 bg-white border-b border-gray-100"
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          data-cat={cat.id}
          onClick={() => scrollToCategory(cat.id)}
          aria-label={cat.name}
          aria-current={activeId === cat.id ? 'true' : undefined}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
            activeId === cat.id
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}
