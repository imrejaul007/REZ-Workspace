'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service if available
    logger.error('[RezNow Global Error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0a0a0a', color: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#ef4444' }}>
            Something went wrong
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error.digest && (
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                Error ID: {error.digest}
              </span>
            )}
            We encountered an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: '#22c55e',
              color: '#000',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
