'use client';

import { TIER_DISPLAY, type LoyaltyTier } from '@/lib/loyalty';

interface LoyaltyBadgeProps {
  tier: LoyaltyTier;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export default function LoyaltyBadge({
  tier,
  size = 'md',
  showName = true,
}: LoyaltyBadgeProps) {
  const display = TIER_DISPLAY[tier];

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2',
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: display.color + '20',
        color: display.color === '#E5E4E2' ? '#666' : display.color,
      }}
    >
      <span className="text-lg">{display.icon}</span>
      {showName && <span>{display.name}</span>}
    </div>
  );
}
