import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
  </div>
);

// Lazy load heavy components
export const LazyChart = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Chart),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyDataTable = dynamic(
  () => import('@tanstack/react-table').then((mod) => ({
    default: mod.useReactTable as unknown,
  })),
  {
    loading: () => <LoadingSkeleton />,
  }
);

export const LazyCalendar = dynamic(
  () => import('react-day-picker').then((mod) => mod.DayPicker),
  {
    loading: () => <LoadingSkeleton />,
    ssr: false,
  }
);

export const LazyFileUpload = dynamic(
  () => import('react-dropzone'),
  {
    loading: () => <LoadingSkeleton />,
    ssr: false,
  }
);

export const LazyCodeEditor = dynamic(
  () => import('@monaco-editor/react'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// Page-level lazy components
export const LazyDashboard = dynamic(
  () => import('../../app/dashboard/page'),
  {
    loading: () => <LoadingSkeleton />,
  }
);

export const LazyAnalytics = dynamic(
  () => import('../../app/analytics/page'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // Analytics likely needs client-side data
  }
);

export const LazyReports = dynamic(
  () => import('../../app/reports/page'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazySettings = dynamic(
  () => import('../../app/settings/page'),
  {
    loading: () => <LoadingSkeleton />,
  }
);

// Feature-specific lazy components
export const LazyInventoryManager = dynamic(
  () => import('../../components/inventory/InventoryManager'),
  {
    loading: () => <LoadingSkeleton />,
  }
);

export const LazyOrderTracking = dynamic(
  () => import('../../components/orders/OrderTracking'),
  {
    loading: () => <LoadingSpinner />,
  }
);

export const LazyPaymentGateway = dynamic(
  () => import('../../components/payments/PaymentGateway'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyVideoPlayer = dynamic(
  () => import('../../components/media/VideoPlayer'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyNotificationCenter = dynamic(
  () => import('../../components/notifications/NotificationCenter'),
  {
    loading: () => <LoadingSkeleton />,
  }
);

// Higher-order component for conditional lazy loading
export const withLazyLoading = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
    condition?: boolean;
  }
) => {
  const { loading = LoadingSpinner, ssr = true, condition = true } = options || {};

  if (!condition) {
    return dynamic(importFunc, { loading, ssr });
  }

  // Return the component directly if condition is false
  return dynamic(importFunc, { loading, ssr });
};

// Bundle splitting utilities
export const createLazyComponent = <T extends ComponentType<unknown>>(
  componentImport: () => Promise<{ default: T } | T>,
  loadingComponent?: ComponentType,
  ssrEnabled: boolean = true
) => {
  return dynamic(
    () => componentImport().then((mod) => ('default' in mod ? mod : { default: mod as T })),
    {
      loading: loadingComponent || LoadingSpinner,
      ssr: ssrEnabled,
    }
  );
};

// Route-based code splitting
export const LazyRoutes = {
  Jobs: dynamic(() => import('../../app/jobs/page'), {
    loading: () => <LoadingSkeleton />,
  }),

  JobCreate: dynamic(() => import('../../app/jobs/create/page'), {
    loading: () => <LoadingSkeleton />,
  }),

  Community: dynamic(() => import('../../app/community/page'), {
    loading: () => <LoadingSkeleton />,
  }),

  Marketplace: dynamic(() => import('../../app/marketplace/page'), {
    loading: () => <LoadingSkeleton />,
  }),

  Profile: dynamic(() => import('../../app/profile/page'), {
    loading: () => <LoadingSkeleton />,
  }),

  Restaurant: dynamic(() => import('../../app/restaurant/page'), {
    loading: () => <LoadingSkeleton />,
  }),

  AdminPanel: dynamic(() => import('../../app/admin/page'), {
    loading: () => <LoadingSpinner />,
    ssr: false, // Admin panel likely needs authentication
  }),
};

// Performance monitoring for lazy components
export const withPerformanceTracking = <P extends object>(
  Component: ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    const startTime = performance.now();

    React.useEffect(() => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Report to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'component_load_time', {
          event_category: 'Performance',
          event_label: componentName,
          value: Math.round(loadTime),
        });
      }

      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      }
    }, []);

    return <Component {...props} />;
  };
};