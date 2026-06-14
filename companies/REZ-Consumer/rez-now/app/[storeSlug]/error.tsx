'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import Button from '@/components/ui/Button';

interface StoreErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function StoreError({ error, reset }: StoreErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100">
        <svg
          className="w-8 h-8 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Couldn&apos;t load this store</h1>
        <p className="text-sm text-gray-500 max-w-xs">
          There was a problem loading this store. Please try again or find another store.
        </p>
      </div>

      {process.env.NODE_ENV === 'development' && error.message && (
        <pre className="w-full max-w-md text-left text-xs bg-gray-100 text-gray-700 rounded-lg p-4 overflow-auto whitespace-pre-wrap break-words">
          {error.message}
        </pre>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={reset} variant="primary">
          Try again
        </Button>
        <Link href="/">
          <Button variant="secondary">Find another store</Button>
        </Link>
      </div>
    </div>
  );
}
