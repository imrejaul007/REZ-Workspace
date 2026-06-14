'use client';

import { useLoyalty } from '@/lib/hooks/useLoyalty';
import type { Badge } from '@/lib/loyalty';

const RARITY_COLORS: Record<Badge['rarity'], string> = {
  common: 'bg-gray-100 text-gray-600',
  rare: 'bg-blue-100 text-blue-600',
  epic: 'bg-purple-100 text-purple-600',
  legendary: 'bg-yellow-100 text-yellow-700',
};

interface BadgesShowcaseProps {
  maxDisplay?: number;
}

export default function BadgesShowcase({ maxDisplay = 6 }: BadgesShowcaseProps) {
  const { badges, loading } = useLoyalty();

  if (loading || !badges || badges.length === 0) {
    return null;
  }

  const displayedBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className="badges-showcase">
      <h4 className="text-sm font-medium text-gray-500 mb-2">Your Badges</h4>

      <div className="flex flex-wrap gap-2">
        {displayedBadges.map((badge: Badge) => (
          <div
            key={badge.id}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${
              RARITY_COLORS[badge.rarity] || RARITY_COLORS.common
            }`}
            title={`${badge.name} - ${badge.rarity}`}
          >
            {badge.icon && <span>{badge.icon}</span>}
            <span>{badge.name}</span>
          </div>
        ))}
      </div>

      {remainingCount > 0 && (
        <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          +{remainingCount} more badges
        </button>
      )}
    </div>
  );
}
