'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  homeHref?: string;
  homeLabel?: string;
}

export function Breadcrumb({ items, className, homeHref = "/", homeLabel = "Home" }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      <Link
        href={homeHref}
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">{homeLabel}</span>
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4" />
          {item.href && index < items.length - 1 ? (
            <Link 
              href={item.href} 
              className="flex items-center hover:text-foreground transition-colors"
            >
              {item.icon && <item.icon className="h-4 w-4 mr-1" />}
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              "flex items-center",
              index === items.length - 1 && "text-foreground font-medium"
            )}>
              {item.icon && <item.icon className="h-4 w-4 mr-1" />}
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}