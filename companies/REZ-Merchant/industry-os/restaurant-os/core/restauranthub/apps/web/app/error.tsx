'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertCircle,
  RefreshCw,
  Home,
  Bug,
  ChefHat
} from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-6 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="h-16 w-16 text-red-600" />
              </div>
              <div className="absolute -top-2 -right-2 p-2 bg-background rounded-full shadow-lg">
                <Bug className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-4">Something went wrong!</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            We encountered an unexpected error. Our team has been notified and is working on a fix. 
            Please try refreshing the page or come back later.
          </p>
          
          {error.message && (
            <div className="mb-6 p-4 bg-muted rounded-lg text-left">
              <p className="text-sm font-mono text-muted-foreground">
                Error: {error.message}
              </p>
              {error.digest && (
                <p className="text-xs font-mono text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => reset()}
              size="lg"
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again
            </Button>
            
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Home className="mr-2 h-5 w-5" />
              Go to Homepage
            </Button>
          </div>
          
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Need immediate assistance?
            </p>
            <Button
              onClick={() => router.push('/support')}
              variant="link"
              className="text-primary"
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}