import { useEffect } from 'react';
import { router } from 'expo-router';

// Redirect placeholder — Tabs.Screen href="/subscription" handles navigation.
// This file exists only to satisfy Expo Router's file-based resolver.
export default function SubscriptionTabRedirect() {
  useEffect(() => {
    router.replace('/subscription');
  }, []);
  return null;
}
