// @ts-nocheck
import React, { useState, useEffect, ComponentType } from 'react';
import { Platform } from 'react-native';
import SectionLoader from './SectionLoader';
import { useIsMounted } from '@/hooks/useIsMounted';

interface LazyLoadWrapperProps {
  importFn: () => Promise<{ default: ComponentType<unknown> }>;
  fallback?: React.ReactNode;
  [key: string];
}

/**
 * LazyLoadWrapper - React Native Compatible Lazy Loading
 *
 * Since React.lazy() doesn't work on React Native mobile,
 * this component provides a cross-platform solution using dynamic imports.
 *
 * For web: Uses React.lazy() and Suspense
 * For mobile: Uses dynamic import with state management
 *
 * @example
 * ```tsx
 * <LazyLoadWrapper
 *   importFn={() => import('@/components/AboutModal')}
 *   visible={showModal}
 *   onClose={handleClose}
 * />
 * ```
 */
export default function LazyLoadWrapper({
  importFn,
  fallback,
  ...props
}: LazyLoadWrapperProps) {
  const [Component, setComponent] = useState<ComponentType<unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useIsMounted();

  useEffect(() => {
    let mounted = true;

    const loadComponent = async () => {
      try {
        const module = await importFn();
        if (mounted) {
          if (!isMounted()) return;
          setComponent(() => module.default);
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          if (!isMounted()) return;
          setIsLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importFn]);

  if (isLoading) {
    return fallback || <SectionLoader />;
  }

  if (!Component) {
    return null;
  }

  return <Component {...props} />;
}
