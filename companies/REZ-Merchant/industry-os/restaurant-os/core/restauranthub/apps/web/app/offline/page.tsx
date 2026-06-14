'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  Download,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PWAManager } from '@/lib/pwa';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [pwaManager] = useState(() => PWAManager.getInstance());
  const [installStatus, setInstallStatus] = useState({
    canInstall: false,
    isInstalled: false,
    isStandalone: false,
  });

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Update install status
    setInstallStatus(pwaManager.getInstallStatus());

    // Listen for network changes
    const handleNetworkChange = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setIsOnline(detail.online);
    };

    // Listen for PWA events
    const handleInstallable = () => {
      setInstallStatus(pwaManager.getInstallStatus());
    };

    window.addEventListener('pwa-networkchange', handleNetworkChange);
    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstallable);

    return () => {
      window.removeEventListener('pwa-networkchange', handleNetworkChange);
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstallable);
    };
  }, [pwaManager]);

  const handleRetry = async () => {
    setIsRetrying(true);

    // Wait a moment for visual feedback
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (navigator.onLine) {
      window.location.href = '/dashboard';
    } else {
      setIsRetrying(false);
    }
  };

  const handleInstallApp = async () => {
    const installed = await pwaManager.installApp();
    if (installed) {
      setInstallStatus(pwaManager.getInstallStatus());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="text-center">
              <motion.div
                animate={{
                  scale: isOnline ? [1, 1.1, 1] : 1,
                  rotate: isOnline ? 0 : [0, -10, 10, 0]
                }}
                transition={{
                  duration: isOnline ? 1 : 0.5,
                  repeat: isOnline ? Infinity : 0,
                  repeatDelay: 2
                }}
                className="mx-auto mb-4"
              >
                {isOnline ? (
                  <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                    <Wifi className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="p-4 bg-red-100 dark:bg-red-900 rounded-full">
                    <WifiOff className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                )}
              </motion.div>

              <CardTitle className="text-xl">
                {isOnline ? "You're back online!" : "You're offline"}
              </CardTitle>

              <CardDescription>
                {isOnline
                  ? "Your internet connection has been restored"
                  : "Please check your internet connection and try again"
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center space-y-4">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full"
                variant={isOnline ? "default" : "outline"}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking connection...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {isOnline ? "Go to Dashboard" : "Try Again"}
                  </>
                )}
              </Button>

              {!isOnline && (
                <div className="text-sm text-muted-foreground">
                  <p>While offline, you can still:</p>
                  <ul className="mt-2 space-y-1 text-left">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      View cached restaurant data
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Browse job listings
                    </li>
                    <li className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                      Limited messaging features
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Install App Prompt */}
        {installStatus.canInstall && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Smartphone className="mr-2 h-5 w-5" />
                  Install RestoPapa
                </CardTitle>
                <CardDescription>
                  Get the best experience with our mobile app
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <p>Benefits of installing:</p>
                    <ul className="mt-2 space-y-1">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Works offline
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Push notifications
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Faster loading
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Home screen access
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleInstallApp}
                    className="w-full"
                    variant="secondary"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Install App
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Already Installed Message */}
        {installStatus.isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent className="text-center py-6">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  RestoPapa is installed and ready to use offline!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>RestoPapa works even when you're offline</p>
        </div>
      </div>
    </div>
  );
}