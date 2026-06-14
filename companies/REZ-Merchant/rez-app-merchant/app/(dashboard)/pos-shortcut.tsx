/**
 * POS Shortcut — Redirects to the POS stack immediately.
 * This file exists only to satisfy expo-router's file-based routing.
 */

import { useEffect } from 'react';
import { router } from 'expo-router';

export default function POSShortcut() {
  useEffect(() => {
    router.replace('/pos');
  }, []);

  return null;
}
