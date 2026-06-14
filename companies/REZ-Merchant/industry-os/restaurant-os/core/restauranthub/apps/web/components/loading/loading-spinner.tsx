'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChefHat, Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'restaurant';
  className?: string;
  text?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className,
  text,
  showText = true,
}: LoadingSpinnerProps) {
  const IconComponent = variant === 'restaurant' ? ChefHat : Loader2;

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      <div className="relative">
        <IconComponent
          className={cn(
            'animate-spin',
            sizeClasses[size],
            variant === 'primary' && 'text-primary',
            variant === 'restaurant' && 'text-primary animate-bounce'
          )}
        />
        {variant === 'restaurant' && (
          <div className={cn(
            'absolute inset-0 rounded-full border-2 border-primary/20 animate-ping',
            sizeClasses[size]
          )} />
        )}
      </div>

      {showText && (
        <p className={cn(
          'text-muted-foreground animate-pulse',
          textSizeClasses[size]
        )}>
          {text || 'Loading...'}
        </p>
      )}
    </div>
  );
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingDots({ size = 'md', className }: LoadingDotsProps) {
  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 150, 300].map((delay, index) => (
        <div
          key={index}
          className={cn(
            'bg-primary rounded-full animate-bounce',
            dotSizes[size]
          )}
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

interface LoadingBarProps {
  progress?: number;
  indeterminate?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingBar({
  progress = 0,
  indeterminate = false,
  className,
  size = 'md'
}: LoadingBarProps) {
  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full bg-muted rounded-full overflow-hidden', heights[size], className)}>
      <div
        className={cn(
          'h-full bg-primary transition-all duration-300 ease-in-out',
          indeterminate && 'animate-pulse'
        )}
        style={{
          width: indeterminate ? '100%' : `${Math.min(100, Math.max(0, progress))}%`,
          animation: indeterminate ? 'shimmer 2s infinite' : undefined,
        }}
      />
    </div>
  );
}