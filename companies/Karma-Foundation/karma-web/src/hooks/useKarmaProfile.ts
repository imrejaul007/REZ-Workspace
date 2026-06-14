'use client';

import { useState, useEffect, useCallback } from 'react';
import { getKarmaProfile, getMissions, getBadges } from '@/lib/karmaApi';
import type { KarmaProfile, KarmaMission, KarmaBadge } from '@/types/karma';

export interface KarmaProfileData {
  profile: KarmaProfile | null;
  missions: KarmaMission[];
  badges: KarmaBadge[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useKarmaProfile(): KarmaProfileData {
  const [profile, setProfile] = useState<KarmaProfile | null>(null);
  const [missions, setMissions] = useState<KarmaMission[]>([]);
  const [badges, setBadges] = useState<KarmaBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const [profileRes, missionsRes, badgesRes] = await Promise.all([
        getKarmaProfile('me'),
        getMissions(),
        getBadges(),
      ]);

      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
      } else {
        setIsError(true);
      }

      if (missionsRes.success && missionsRes.data) {
        setMissions(missionsRes.data.missions ?? []);
      }

      if (badgesRes.success && badgesRes.data) {
        setBadges(badgesRes.data.badges ?? []);
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    profile,
    missions,
    badges,
    isLoading,
    isError,
    refetch: fetchData,
  };
}
