// @ts-nocheck
/**
 * useStreakShield
 *
 * Manages the weekly streak shield — a one-per-week protection that restores a
 * broken streak. The shield resets every Monday at 00:00 UTC.
 *
 * AsyncStorage key: 'rez_streak_shield'
 * Stored shape: { usedAt: string | null }
 *
 * API: POST /api/gamification/streak/use-shield
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/services/apiClient';

const STORAGE_KEY = 'rez_streak_shield';

interface ShieldRecord {
  usedAt: string | null;
}

/**
 * Returns the ISO date string for the most recent Monday at 00:00 UTC.
 * If today is Monday, it returns today's Monday.
 */
function getLastMonday(): string {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  // Days since last Monday: Monday=0, Tuesday=1, ..., Sunday=6
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastMonday = new Date(now);
  lastMonday.setUTCDate(now.getUTCDate() - daysSinceMonday);
  lastMonday.setUTCHours(0, 0, 0, 0);
  return lastMonday.toISOString();
}

interface UseStreakShieldResult {
  shieldAvailable: boolean;
  shieldFn: () => Promise<boolean>;
  isLoading: boolean;
  lastUsedDate: string | null;
}

export function useStreakShield(): UseStreakShieldResult {
  const [usedAt, setUsedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted shield state on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const record: ShieldRecord = JSON.parse(raw);
          setUsedAt(record.usedAt);
        }
      })
      .catch(() => {
        // Use default state (shield available)
      })
      .finally(() => setHydrated(true));
  }, []);

  const shieldAvailable = hydrated
    ? usedAt === null || usedAt < getLastMonday()
    : false; // treat as unavailable until we've read storage

  const useShield = useCallback(async (): Promise<boolean> => {
    if (!shieldAvailable || isLoading) return false;

    setIsLoading(true);
    try {
      await (apiClient as unknown).post('/gamification/streak/use-shield');
      const now = new Date().toISOString();
      const record: ShieldRecord = { usedAt: now };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      setUsedAt(now);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [shieldAvailable, isLoading]);

  return {
    shieldAvailable,
    shieldFn: useShield,
    isLoading,
    lastUsedDate: usedAt,
  };
}

export default useStreakShield;
