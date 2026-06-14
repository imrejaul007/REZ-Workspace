'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { ErrorFallbackProps } from './error-boundary';

export function ChunkErrorFallback({
  error,
  resetError,
  errorId
}: ErrorFallbackProps) {
  const [isReloading, setIsReloading] = useState(false);
  const [reloadProgress, setReloadProgress] = useState(0);

  const handleReload = () => {
    setIsReloading(true);
    setReloadProgress(0);

    // Simulate progress for user feedback
    const interval = setInterval(() => {
      setReloadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          // Force a hard refresh to get new chunks
          window.location.reload();
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  // Auto-retry after 3 seconds if it's a chunk error
  useEffect(() => {
    const timer = setTimeout(() => {
      if (error.message.includes('ChunkLoadError')) {
        handleReload();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Download className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-xl">Update Available</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>A new version of the application is available.</p>
            <p className="text-sm mt-2">
              We need to reload the page to apply the latest updates.
            </p>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Auto-reloading in progress...
              </p>
              <p className="text-amber-600 dark:text-amber-300">
                Your work will be preserved
              </p>
            </div>
          </div>

          {isReloading && (
            <div className="space-y-3">
              <Progress value={reloadProgress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Loading latest version... {reloadProgress}%
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleReload}
              className="w-full"
              disabled={isReloading}
            >
              {isReloading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reloading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Now
                </>
              )}
            </Button>

            {!isReloading && (
              <Button
                variant="outline"
                onClick={resetError}
                className="w-full"
              >
                Try Without Reloading
              </Button>
            )}
          </div>

          <div className="text-xs text-center text-muted-foreground">
            <p>If this problem persists, please clear your browser cache.</p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-muted rounded text-xs">
              <p className="font-medium mb-1">Debug Info:</p>
              <p>Error: {error.message}</p>
              <p>ID: {errorId}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}