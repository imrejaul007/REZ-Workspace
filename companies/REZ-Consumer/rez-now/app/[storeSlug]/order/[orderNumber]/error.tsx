'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import Button from '@/components/ui/Button';

interface OrderErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OrderError({ error, reset }: OrderErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Couldn&apos;t load order details</h1>
        <p className="text-sm text-gray-500 max-w-xs">
          We had trouble fetching your order. Please refresh or check your order history.
        </p>
      </div>

      {process.env.NODE_ENV === 'development' && error.message && (
        <pre className="w-full max-w-md text-left text-xs bg-gray-100 text-gray-700 rounded-lg p-4 overflow-auto whitespace-pre-wrap break-words">
          {error.message}
        </pre>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={reset} variant="primary">
          Refresh
        </Button>
        <Link href="../../history">
          <Button variant="secondary">View order history</Button>
        </Link>
      </div>
    </div>
  );
}
