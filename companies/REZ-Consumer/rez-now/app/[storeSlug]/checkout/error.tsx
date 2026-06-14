'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Button from '@/components/ui/Button';

interface CheckoutErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CheckoutError({ error, reset }: CheckoutErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100">
        <svg
          className="w-8 h-8 text-indigo-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Checkout error</h1>
        <p className="text-sm text-gray-500 max-w-xs">
          Something went wrong during checkout. Your cart is safe — nothing was charged.
        </p>
      </div>

      {process.env.NODE_ENV === 'development' && error.message && (
        <pre className="w-full max-w-md text-left text-xs bg-gray-100 text-gray-700 rounded-lg p-4 overflow-auto whitespace-pre-wrap break-words">
          {error.message}
        </pre>
      )}

      <Button onClick={reset} variant="primary">
        Try again
      </Button>
    </div>
  );
}
