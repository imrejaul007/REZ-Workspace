/**
 * Onboarding Step 1 — redirects to the real Business Info screen.
 */

import { Redirect } from 'expo-router';

export default function Step1Screen() {
  return <Redirect href="/onboarding/business-info" />;
}
