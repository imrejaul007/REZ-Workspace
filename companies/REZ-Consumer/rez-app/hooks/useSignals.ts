/**
 * Signal Aggregator Hook
 * Connects to REZ-signal-aggregator (Port 4142)
 */

import { useState, useCallback } from 'react';
import { useAuthUser } from '@/stores/selectors';
import apiClient from '@/services/apiClient';
import { logger } from '@/utils/logger';

const SIGNAL_SERVICE = process.env.EXPO_PUBLIC_SIGNAL_SERVICE_URL || 'https://REZ-signal-aggregator.onrender.com';

export interface SignalEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export function useSignals() {
  const user = useAuthUser();

  const track = useCallback(async (type: string, data: Record<string, unknown>) => {
    if (!user?.id) return;

    try {
      await apiClient.post(`${SIGNAL_SERVICE}/track`, {
        userId: user.id,
        type,
        data,
        source: 'mobile_app',
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      logger.error('[Signals] Track failed:', e);
    }
  }, [user?.id]);

  return { track };
}
