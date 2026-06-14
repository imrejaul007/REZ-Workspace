'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigateToMarketplaceWithSmartTag } from '@/lib/marketplace-navigation';

interface ClickableTagProps {
  tag: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  onRemove?: () => void;
  showRemove?: boolean;
  showExternalIcon?: boolean;
  className?: string;
  disabled?: boolean;
}

export function ClickableTag({ 
  tag, 
  variant = 'secondary',
  size = 'default',
  onRemove,
  showRemove = false,
  showExternalIcon = true,
  className,
  disabled = false
}: ClickableTagProps) {
  const router = useRouter();
  
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (showRemove && onRemove) {
      onRemove();
    } else {
      navigateToMarketplaceWithSmartTag(router, tag);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        'cursor-pointer transition-all duration-200 group',
        sizeClasses[size],
        !disabled && !showRemove && 'hover:bg-primary hover:text-white hover:border-primary',
        showRemove && 'hover:bg-destructive hover:text-white hover:border-destructive',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
    >
      #{tag}
      {showRemove && (
        <X className="h-2.5 w-2.5 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
      )}
      {showExternalIcon && !showRemove && !disabled && (
        <ExternalLink className="h-2.5 w-2.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </Badge>
  );
}