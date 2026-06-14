'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw, AlertCircle, Wifi } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader } from './card';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

// Basic loading spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  );
}

// Pulsing dots loader
export function PulsingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="h-2 w-2 bg-primary rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );
}

// Skeleton loaders for different content types
export function JobCardSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SupplierCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-4">
      {/* Table header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-20" />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 py-4 border-b"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-5 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Full page loading states
interface PageLoadingProps {
  title?: string;
  description?: string;
  showLogo?: boolean;
}

export function PageLoading({ title = 'Loading...', description, showLogo = true }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md">
        {showLogo && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <div className="w-8 h-8 bg-primary rounded-lg"></div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <LoadingSpinner size="lg" />
        </motion.div>
      </div>
    </div>
  );
}

// Error states
interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  showRetry?: boolean;
  onRetry?: () => void;
  type?: 'error' | 'network' | 'notFound' | 'forbidden';
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this content.',
  action,
  showRetry = true,
  onRetry,
  type = 'error',
}: ErrorStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'network':
        return <Wifi className="h-8 w-8 text-muted-foreground" />;
      case 'notFound':
        return <AlertCircle className="h-8 w-8 text-muted-foreground" />;
      case 'forbidden':
        return <AlertCircle className="h-8 w-8 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-8 w-8 text-destructive" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'network':
        return 'Connection Error';
      case 'notFound':
        return 'Not Found';
      case 'forbidden':
        return 'Access Denied';
      default:
        return title;
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'notFound':
        return 'The content you\'re looking for doesn\'t exist or has been moved.';
      case 'forbidden':
        return 'You don\'t have permission to access this content.';
      default:
        return message;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="space-y-4 max-w-md"
      >
        <div className="flex justify-center">
          {getIcon()}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{getTitle()}</h3>
          <p className="text-muted-foreground text-sm">{getMessage()}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showRetry && onRetry && (
            <Button onClick={onRetry} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}

          {action && (
            <Button onClick={action.onClick} variant="outline" size="sm">
              {action.label}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Empty states
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="space-y-4 max-w-md"
      >
        {icon && (
          <div className="flex justify-center text-muted-foreground">
            {icon}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>

        {action && (
          <Button onClick={action.onClick} size="sm">
            {action.label}
          </Button>
        )}
      </motion.div>
    </div>
  );
}

// Inline loading states
export function InlineLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2 text-muted-foreground">
      <LoadingSpinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

export function ButtonLoading({
  loading,
  children,
  loadingText = 'Loading...',
  ...props
}: {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
} & React.ComponentProps<typeof Button>) {
  return (
    <Button disabled={loading} {...props}>
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

// Progressive loading wrapper
interface ProgressiveLoadingProps {
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  isEmpty?: boolean;
  children: React.ReactNode;
}

export function ProgressiveLoading({
  isLoading,
  error,
  onRetry,
  loadingComponent,
  errorComponent,
  emptyComponent,
  isEmpty = false,
  children,
}: ProgressiveLoadingProps) {
  if (isLoading) {
    return loadingComponent || <InlineLoading />;
  }

  if (error) {
    return (
      errorComponent || (
        <ErrorState
          message={error}
          showRetry={!!onRetry}
          onRetry={onRetry}
        />
      )
    );
  }

  if (isEmpty) {
    return emptyComponent || null;
  }

  return <>{children}</>;
}