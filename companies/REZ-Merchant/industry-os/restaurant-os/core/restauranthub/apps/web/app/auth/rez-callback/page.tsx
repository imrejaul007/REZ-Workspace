'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const API_BASE = '/api/proxy';

export default function RezCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your REZ account…');

  useEffect(() => {
    const rezToken = searchParams.get('token') || searchParams.get('rez_token');

    if (!rezToken) {
      setStatus('error');
      setMessage('No REZ token received. Please try signing in again.');
      return;
    }

    async function exchange() {
      try {
        const res = await fetch(`${API_BASE}/auth/rez-bridge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ rezToken }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || 'REZ authentication failed');
        }

        // Store the RestoPapa token
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }

        setStatus('success');
        setMessage('Authenticated! Redirecting to your dashboard…');

        setTimeout(() => {
          router.push('/restaurant/dashboard');
        }, 1000);
      } catch (err: unknown) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
      }
    }

    exchange();
  }, [searchParams, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-background p-4">
      <div className="text-center space-y-4 max-w-sm">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-semibold">Signing you in with REZ</h1>
            <p className="text-muted-foreground text-sm">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold">Authenticated!</h1>
            <p className="text-muted-foreground text-sm">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold">Authentication Failed</h1>
            <p className="text-muted-foreground text-sm">{message}</p>
            <a
              href="/auth/login"
              className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Back to Login
            </a>
          </>
        )}
      </div>
    </main>
  );
}
