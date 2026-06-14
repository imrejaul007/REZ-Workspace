// @ts-nocheck
/**
 * useReferralTiers Hook
 * Fetches referral tiers from backend API with fallback to hardcoded values
 *
 * Backend endpoint: GET /user/referral/tiers
 */

import { useState, useEffect, useCallback } from 'react';
import { referralService } from '@/services/referralService';
import { ReferralTier } from '@/types/referral.types';
import { logger } from '@/utils/logger';

// Fallback tiers (from referral.types.ts)
const FALLBACK_TIERS: Record<string, ReferralTier> = {
  STARTER: {
    name: 'REZ Starter',
    referralsRequired: 0,
    badge: 'Starter',
    rewards: { perReferral: 50 }
  },
  PRO: {
    name: 'REZ Pro',
    referralsRequired: 5,
    badge: 'Pro',
    rewards: { perReferral: 75, tierBonus: 100 }
  },
  ELITE: {
    name: 'REZ Elite',
    referralsRequired: 15,
    badge: 'Elite',
    rewards: { perReferral: 100, tierBonus: 500 }
  },
  CHAMPION: {
    name: 'REZ Champion',
    referralsRequired: 50,
    badge: 'Champion',
    rewards: { perReferral: 150, tierBonus: 1000 }
  },
};

interface UseReferralTiersReturn {
  tiers: Record<string, ReferralTier>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReferralTiers(): UseReferralTiersReturn {
  const [tiers, setTiers] = useState<Record<string, ReferralTier>>(FALLBACK_TIERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await referralService.getTiers();

      if (response.success && response.data) {
        setTiers(response.data);
      } else {
        // Use fallback on API failure
        setTiers(FALLBACK_TIERS);
      }
    } catch (err) {
      logger.warn('[useReferralTiers] Failed to fetch tiers, using fallback:', err);
      setError('Failed to load referral tiers');
      setTiers(FALLBACK_TIERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  return {
    tiers,
    loading,
    error,
    refetch: fetchTiers,
  };
}

export default useReferralTiers;
