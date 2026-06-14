'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, RefreshCw, Settings } from 'lucide-react';
import { ErrorFallbackProps } from './error-boundary';

interface NetworkErrorFallbackProps extends ErrorFallbackProps {
  showNetworkTips?: boolean;
}

export function NetworkErrorFallback({
  error,
  resetError,
  errorId,
  showNetworkTips = true
}: NetworkErrorFallbackProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  const networkTips = [
    'Check your internet connection',
    'Try connecting to a different network',
    'Disable VPN or proxy if enabled',
    'Clear your browser cache and cookies',
    'Try again in a few minutes',
  ];

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <Wifi className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-xl">Connection Problem</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>We're having trouble connecting to our servers.</p>
            <p className="text-sm mt-2">
              This could be due to a network issue or temporary server maintenance.
            </p>
          </div>

          {showNetworkTips && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Things you can try:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {networkTips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5 mr-3 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={resetError} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={handleRefresh}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>

            <Button
              variant="ghost"
              onClick={() => window.open('/support', '_blank')}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
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