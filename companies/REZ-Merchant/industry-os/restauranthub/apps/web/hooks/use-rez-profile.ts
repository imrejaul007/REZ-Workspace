'use client';

import { useEffect, useState } from 'react';

export interface RezStats {
  activeHires?: number;
  trainingCompletions?: number;
  benchmarkParticipant?: boolean;
}

export interface RezProfile {
  restopapaUserId: string;
  rezMerchantId: string | null;
  isRezVerified: boolean;
  consentTier: 0 | 1 | 2;
  rezStats: RezStats | null;
}

interface UseRezProfileResult {
  profile: RezProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRezProfile(restopapaUserId: string): UseRezProfileResult {
  const [profile, setProfile] = useState<RezProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!restopapaUserId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`/api/users/${restopapaUserId}/rez-profile`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json() as Promise<RezProfile>;
      })
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load REZ profile');
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restopapaUserId, tick]);

  return {
    profile,
    isLoading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}
