import { useEffect } from 'react';
import { router } from 'expo-router';

// Redirect placeholder — Tabs.Screen href="/kds" handles navigation for staff/cashier.
// This file exists only to satisfy Expo Router's file-based resolver.
export default function KdsTabRedirect() {
  useEffect(() => {
    router.replace('/kds');
  }, []);
  return null;
}
