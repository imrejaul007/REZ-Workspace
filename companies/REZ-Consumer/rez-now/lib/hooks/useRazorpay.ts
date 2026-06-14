'use client';

import { useState, useCallback, useEffect } from 'react';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    __razorpayLoadFailed?: boolean;
  }
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: { contact?: string; email?: string; name?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

// NW-MED-015 FIX: Removed the useEffect that loaded the Razorpay script on every mount.
// The script is now lazy-loaded only when the user actually reaches the payment step
// (i.e., when openPayment is called). This avoids blocking page render with a 150KB
// script on pages that never initiate a payment.
export function useRazorpay() {
  // ready = true when the script is already in the DOM from a prior openPayment call
  const [ready, setReady] = useState(typeof window !== 'undefined' && typeof window.Razorpay !== 'undefined');
  const [loadFailed, setLoadFailed] = useState(typeof window !== 'undefined' && !!window.__razorpayLoadFailed);

  // Keep ready/loadFailed in sync if another tab or module pre-loaded the script
  // Using setTimeout to defer state updates and avoid cascading renders (react-hooks/set-state-in-effect)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        if (typeof window.Razorpay !== 'undefined') setReady(true);
        if (window.__razorpayLoadFailed) setLoadFailed(true);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  /**
   * Loads the Razorpay script if not already loaded. Idempotent — subsequent calls
   * while loading or already loaded return immediately.
   */
  const ensureLoaded = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    if (typeof window.Razorpay !== 'undefined') return;
    if (window.__razorpayLoadFailed) return;

    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        // Script tag exists but may still be loading — wait for it
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => {
          window.__razorpayLoadFailed = true;
          setLoadFailed(true);
          reject(new Error('Razorpay script failed to load'));
        }, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setReady(true);
        resolve();
      };
      script.onerror = () => {
        window.__razorpayLoadFailed = true;
        setLoadFailed(true);
        reject(new Error('Razorpay script failed to load'));
      };
      document.body.appendChild(script);
    });
  }, []);

  function openPayment(options: RazorpayOptions): void {
    if (typeof window === 'undefined') throw new Error('Razorpay not available on server');
    if (loadFailed) throw new Error('Razorpay failed to load');
    // Trigger lazy-load synchronously — openPayment is async-safe via caller handling
    // We throw if not ready since the caller checks `ready` before calling this.
    if (typeof window.Razorpay === 'undefined') {
      throw new Error('Razorpay not loaded — call ensureLoaded() first');
    }
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  return { ready, loadFailed, openPayment, ensureLoaded };
}
