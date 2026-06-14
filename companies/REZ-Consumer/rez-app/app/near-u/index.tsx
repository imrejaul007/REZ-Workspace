// @ts-nocheck
/**
 * /near-u
 *
 * Near-U index route. The main Near-U content lives inside the home tab
 * (`(tabs)/index.tsx`), so navigating directly to /near-u redirects to
 * the home screen and activates the Near-U tab.
 */
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSetActiveTab } from '@/stores';

export default function NearUIndex() {
  const router = useRouter();
  const setActiveTab = useSetActiveTab();

  useEffect(() => {
    // Activate the near-u tab on the home screen and navigate there
    setActiveTab('near-u');
    router.replace('/(tabs)' as unknown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
