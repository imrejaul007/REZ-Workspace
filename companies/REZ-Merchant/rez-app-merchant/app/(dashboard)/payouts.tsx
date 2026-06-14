import { useEffect } from 'react';
import { router } from 'expo-router';

// Redirect placeholder — Tabs.Screen href="/payouts" handles navigation.
// This file exists only to satisfy Expo Router's file-based resolver.
export default function PayoutsTabRedirect() {
  useEffect(() => {
    router.replace('/payouts');
  }, []);
  return null;
}
