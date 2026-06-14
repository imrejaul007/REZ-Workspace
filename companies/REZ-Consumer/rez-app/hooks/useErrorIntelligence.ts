/**
 * Error Intelligence Hook
 * Connects to REZ-error-intelligence (Port 4058)
 */

import { useCallback } from 'react';
import { useAuthUser } from '@/stores/selectors';
import apiClient from '@/services/apiClient';

const ERROR_INTEL_URL = process.env.EXPO_PUBLIC_ERROR_INTEL_URL || 'https://REZ-error-intelligence.onrender.com';

export function useErrorIntelligence() {
  const user = useAuthUser();

  const trackError = useCallback(
    async (error: Error, context?: Record<string, unknown>) => {
      if (!user?.id) return;

      try {
        await apiClient.post(`${ERROR_INTEL_URL}/track`, {
          userId: user.id,
          error: {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
          },
        });
      } catch {
        // Silent fail - don't break app for error tracking
      }
    },
    [user?.id]
  );

  return { trackError };
}
