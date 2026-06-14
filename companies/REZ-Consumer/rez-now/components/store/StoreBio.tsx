'use client';

import { cn } from '@/lib/utils/cn';

interface StoreBioProps {
  name: string;
  tagline?: string | null;
  bio?: string | null;
  accentColor?: string;
  className?: string;
}

export default function StoreBio({
  name,
  tagline,
  bio,
  accentColor = '#4F46E5',
  className,
}: StoreBioProps) {
  const truncatedBio = bio && bio.length > 250 ? `${bio.slice(0, 247)}...` : bio;

  return (
    <div className={cn('text-center', className)}>
      {tagline && (
        <p
          className="text-sm font-medium mb-2"
          style={{ color: accentColor }}
        >
          {tagline}
        </p>
      )}
      {truncatedBio && (
        <p className="text-sm text-gray-600 leading-relaxed">
          {truncatedBio}
        </p>
      )}
      {!tagline && !truncatedBio && (
        <p className="text-sm text-gray-400 italic">
          Welcome to {name}
        </p>
      )}
    </div>
  );
}

// ── Store theme colors helper ─────────────────────────────────────────────────

export interface StoreTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export function getStoreTheme(customColor?: string | null): StoreTheme {
  const defaultTheme: StoreTheme = {
    primary: '#4F46E5',
    secondary: '#818CF8',
    background: '#F9FAFB',
    text: '#111827',
    accent: '#6366F1',
  };

  if (!customColor) {
    return defaultTheme;
  }

  // Parse hex color and generate variations
  const hex = customColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const lighten = (amount: number) => {
    const nr = Math.min(255, r + amount);
    const ng = Math.min(255, g + amount);
    const nb = Math.min(255, b + amount);
    return `rgb(${nr}, ${ng}, ${nb})`;
  };

  const darken = (amount: number) => {
    const nr = Math.max(0, r - amount);
    const ng = Math.max(0, g - amount);
    const nb = Math.max(0, b - amount);
    return `rgb(${nr}, ${ng}, ${nb})`;
  };

  return {
    primary: customColor,
    secondary: lighten(20),
    background: lighten(240),
    text: darken(120),
    accent: customColor,
  };
}
