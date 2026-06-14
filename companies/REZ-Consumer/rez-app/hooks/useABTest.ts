// @ts-nocheck

/**
 * AB Testing Hook
 * Connects to REZ-ab-testing-service (Port 4125)
 */

import { useState, useEffect } from 'react';
import { useAuthUser } from '@/stores/selectors';
import apiClient from '@/services/apiClient';

const AB_TEST_URL = process.env.EXPO_PUBLIC_AB_TEST_URL || 'https://REZ-ab-testing.onrender.com';

interface ABVariant {
  testId: string;
  variantId: string;
  variantName: string;
  config: Record<string, unknown>;
}

export function useABTest(testId: string): { variant: ABVariant | null; loading: boolean } {
  const [variant, setVariant] = useState<ABVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthUser();

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    apiClient.get<ABVariant>(`${AB_TEST_URL}/assign/${testId}?userId=${user.id}`)
      .then((res) => {
        if (res.success && res.data) setVariant(res.data);
      })
      .finally(() => setLoading(false));
  }, [testId, user?.id]);

  return { variant, loading };
}
