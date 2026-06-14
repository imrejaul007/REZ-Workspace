'use client';

import { cn } from '@/lib/utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div
      className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', sizes[size], className)}
      role="status"
      aria-label="Loading"
    />
  );
}
