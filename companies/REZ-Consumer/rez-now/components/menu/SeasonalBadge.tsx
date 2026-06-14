'use client';

import { cn } from '@/lib/utils/cn';

interface SeasonalBadgeProps {
  isSeasonal?: boolean;
  isChefSpecial?: boolean;
  isPopular?: boolean;
  badge?: string | null;
  badgeVariant?: 'gold' | 'red' | 'green' | 'blue' | 'purple';
  className?: string;
}

const VARIANT_CONFIG = {
  gold: {
    bg: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400',
    text: 'text-amber-900',
    icon: '⭐',
  },
  red: {
    bg: 'bg-gradient-to-r from-red-500 to-rose-500',
    text: 'text-white',
    icon: '🔥',
  },
  green: {
    bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
    text: 'text-white',
    icon: '🌿',
  },
  blue: {
    bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    text: 'text-white',
    icon: '❄️',
  },
  purple: {
    bg: 'bg-gradient-to-r from-purple-500 to-violet-500',
    text: 'text-white',
    icon: '✨',
  },
};

export default function SeasonalBadge({
  isSeasonal,
  isChefSpecial,
  isPopular,
  badge,
  badgeVariant = 'gold',
  className,
}: SeasonalBadgeProps) {
  // Priority: explicit badge text > chef special > seasonal > popular
  let label = badge;
  let variant = badgeVariant;
  let icon = VARIANT_CONFIG[badgeVariant].icon;

  if (!label && isChefSpecial) {
    label = "Chef's Special";
    variant = 'gold';
    icon = '👨‍🍳';
  } else if (!label && isSeasonal) {
    label = 'Seasonal';
    variant = 'green';
    icon = '🍂';
  } else if (!label && isPopular) {
    label = 'Popular';
    variant = 'red';
    icon = '🔥';
  }

  if (!label) return null;

  const config = VARIANT_CONFIG[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
        config.bg,
        config.text,
        className
      )}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  );
}
