'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import Button from '@/components/ui/Button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
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
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="text-sm text-gray-500 max-w-xs">
          We hit an unexpected error. Try refreshing.
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
          <Button variant="secondary">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
