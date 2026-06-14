/**
 * Onboarding Step 2 — redirects to Store Details, guarded by step 1 completion.
 * M6 FIX: If step 1 is not yet complete, bounces user back to step 1.
 */

import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { onboardingService } from '@/services/api/onboarding';

export default function Step2Screen() {
  const router = useRouter();

  useEffect(() => {
    onboardingService
      .getOnboardingStatus()
      .then((status) => {
        // currentStep < 2 means step 1 is not yet submitted
        if (status.currentStep < 2) {
          router.replace('/onboarding/step1');
        }
      })
      .catch(() => {
        // On error, fall back to step 1 to be safe
        router.replace('/onboarding/step1');
      });
  }, []);

  return <Redirect href="/onboarding/store-details" />;
}
