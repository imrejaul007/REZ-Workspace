/**
 * Onboarding Step 5 — redirects to Review & Submit, guarded by steps 1-4 completion.
 * M6 FIX: Bounces user back to their current incomplete step.
 */

import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { onboardingService } from '@/services/api/onboarding';

const STEP_HREFS = [
  '/onboarding/step1',
  '/onboarding/step2',
  '/onboarding/step3',
  '/onboarding/step4',
  '/onboarding/step5',
];

export default function Step5Screen() {
  const router = useRouter();

  useEffect(() => {
    onboardingService
      .getOnboardingStatus()
      .then((status) => {
        if (status.currentStep < 5) {
          router.replace(STEP_HREFS[status.currentStep - 1]);
        }
      })
      .catch(() => {
        router.replace('/onboarding/step1');
      });
  }, []);

  return <Redirect href="/onboarding/review-submit" />;
}
