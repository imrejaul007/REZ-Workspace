'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface Pairing {
  name: string;
  type: 'wine' | 'beer' | 'cocktail' | 'beverage' | 'dessert_wine';
  description?: string;
}

interface PairingSuggestionsProps {
  pairings: Pairing[];
  className?: string;
}

const TYPE_CONFIG: Record<Pairing['type'], { label: string; icon: string; bgColor: string; textColor: string }> = {
  wine: { label: 'Wine', icon: '🍷', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  beer: { label: 'Beer', icon: '🍺', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
  cocktail: { label: 'Cocktail', icon: '🍸', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
  beverage: { label: 'Beverage', icon: '🥤', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  dessert_wine: { label: 'Dessert Wine', icon: '🍾', bgColor: 'bg-pink-50', textColor: 'text-pink-700' },
};

export default function PairingSuggestions({ pairings, className }: PairingSuggestionsProps) {
  const [expanded, setExpanded] = useState(false);

  if (!pairings || pairings.length === 0) return null;

  const visible = expanded ? pairings : pairings.slice(0, 2);
  const hasMore = pairings.length > 2;

  return (
    <div className={cn('rounded-lg border border-gray-100 bg-white overflow-hidden', className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">🍷</span>
          <span className="text-sm font-semibold text-gray-800">Pairing Suggestions</span>
        </div>
        <span className="text-xs text-gray-400">
          {expanded ? 'Hide' : `See all (${pairings.length})`}
        </span>
      </button>

      <div className={cn('px-4 pb-3 space-y-2', !expanded && 'hidden')}>
        {visible.map((pairing, index) => {
          const config = TYPE_CONFIG[pairing.type];
          return (
            <div
              key={`${pairing.name}-${index}`}
              className={cn('flex items-start gap-3 p-2 rounded-lg', config.bgColor)}
            >
              <span className="text-lg flex-shrink-0" aria-hidden="true">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{pairing.name}</span>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', config.textColor, config.bgColor)}>
                    {config.label}
                  </span>
                </div>
                {pairing.description && (
                  <p className="text-xs text-gray-600 mt-0.5">{pairing.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
