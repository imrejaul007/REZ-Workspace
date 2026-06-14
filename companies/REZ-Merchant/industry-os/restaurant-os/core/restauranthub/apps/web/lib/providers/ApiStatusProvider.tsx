'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../api';

interface ApiStatus {
  isOnline: boolean;
  isHealthy: boolean;
  lastChecked: Date | null;
  version: string;
  environment: string;
  uptime: number;
  services: Record<string, boolean>;
  responseTime?: number;
}

interface ApiStatusContextValue {
  status: ApiStatus;
  checkHealth: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}

const ApiStatusContext = createContext<ApiStatusContextValue | undefined>(undefined);

interface ApiStatusProviderProps {
  children: ReactNode;
  checkInterval?: number; // in milliseconds
  enableAutoCheck?: boolean;
}

export function ApiStatusProvider({
  children,
  checkInterval = 30000, // 30 seconds
  enableAutoCheck = true,
}: ApiStatusProviderProps) {
  const [status, setStatus] = useState<ApiStatus>({
    isOnline: false,
    isHealthy: false,
    lastChecked: null,
    version: 'unknown',
    environment: 'unknown',
    uptime: 0,
    services: {},
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const startTime = Date.now();

      // Check health status
      const [healthResponse, infoResponse] = await Promise.all([
        api.healthCheck().catch(() => ({
          status: 'error' as const,
          timestamp: new Date().toISOString(),
          services: {},
        })),
        api.getServerInfo().catch(() => ({
          version: 'unknown',
          environment: 'unknown',
          uptime: 0,
        })),
      ]);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      setStatus({
        isOnline: true,
        isHealthy: healthResponse.status === 'ok',
        lastChecked: new Date(),
        version: infoResponse.version,
        environment: infoResponse.environment,
        uptime: infoResponse.uptime,
        services: healthResponse.services,
        responseTime,
      });
    } catch (err) {
      console.error('API health check failed:', err);
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isHealthy: false,
        lastChecked: new Date(),
      }));
      setError('Failed to connect to API server');
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    // Initial health check
    checkHealth();

    // Set up periodic health checks
    let intervalId: NodeJS.Timeout;

    if (enableAutoCheck) {
      intervalId = setInterval(checkHealth, checkInterval);
    }

    // Check connection when window regains focus
    const handleFocus = () => {
      if (!status.isOnline || Date.now() - (status.lastChecked?.getTime() || 0) > 60000) {
        checkHealth();
      }
    };

    // Check connection when back online
    const handleOnline = () => {
      checkHealth();
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isHealthy: false,
      }));
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableAutoCheck, checkInterval, status.isOnline, status.lastChecked]);

  const contextValue: ApiStatusContextValue = {
    status,
    checkHealth,
    isConnecting,
    error,
  };

  return (
    <ApiStatusContext.Provider value={contextValue}>
      {children}
    </ApiStatusContext.Provider>
  );
}

export function useApiStatus(): ApiStatusContextValue {
  const context = useContext(ApiStatusContext);
  if (context === undefined) {
    throw new Error('useApiStatus must be used within an ApiStatusProvider');
  }
  return context;
}

// Helper hook for conditional API calls based on connectivity
export function useApiReady() {
  const { status } = useApiStatus();
  return status.isOnline && status.isHealthy;
}

// Component for displaying API status
export function ApiStatusIndicator({
  showDetails = false,
  className = '',
}: {
  showDetails?: boolean;
  className?: string;
}) {
  const { status, isConnecting, error, checkHealth } = useApiStatus();

  const getStatusColor = () => {
    if (isConnecting) return 'bg-yellow-500';
    if (!status.isOnline) return 'bg-red-500';
    if (!status.isHealthy) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (!status.isOnline) return 'Offline';
    if (!status.isHealthy) return 'Degraded';
    return 'Online';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`w-2 h-2 rounded-full ${getStatusColor()} transition-colors duration-200`}
        title={error || getStatusText()}
      />

      {showDetails && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">{getStatusText()}</span>

          {status.responseTime && (
            <span className="ml-2 text-xs">
              ({status.responseTime}ms)
            </span>
          )}

          {status.lastChecked && (
            <div className="text-xs text-gray-500">
              Last checked: {status.lastChecked.toLocaleTimeString()}
            </div>
          )}

          {error && (
            <div className="text-xs text-red-600 mt-1">
              {error}
            </div>
          )}

          <button
            onClick={checkHealth}
            disabled={isConnecting}
            className="text-xs text-blue-600 hover:text-blue-800 underline ml-2"
          >
            {isConnecting ? 'Checking...' : 'Check now'}
          </button>
        </div>
      )}
    </div>
  );
}

// Hook for automatic retry of failed API calls
export function useApiRetry<T>(
  apiCall: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    enabled?: boolean;
  } = {}
) {
  const { maxRetries = 3, retryDelay = 1000, enabled = true } = options;
  const { status } = useApiStatus();
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = async (): Promise<T> => {
    if (!enabled || !status.isOnline) {
      throw new Error('API not available');
    }

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        const result = await apiCall();
        setRetryCount(0);
        return result;
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          throw error;
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    setRetryCount(0);
    throw lastError;
  };

  return {
    executeWithRetry,
    retryCount,
    isRetrying: retryCount > 0,
  };
}