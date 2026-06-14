'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';
import { shareContent } from '@/lib/utils/share';
import { shareViaWhatsApp } from '@/lib/utils/share';

const DISMISSED_KEY = 'rez-referral-banner-dismissed';
const REFERRAL_BASE = 'https://now.rez.money';

export default function ReferralBanner() {
  const { isLoggedIn, user } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR flash
  const [copied, setCopied] = useState(false);

  // Read sessionStorage only on the client after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wasDismissed = sessionStorage.getItem(DISMISSED_KEY) === '1';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding client-side state from sessionStorage on mount is intentional
    setDismissed(wasDismissed);
  }, []);

  if (!isLoggedIn || !user?.id || dismissed) return null;

  const referralCode = user.id.slice(-6).toUpperCase();
  const referralUrl = `${REFERRAL_BASE}?ref=${user.id}`;

  function handleDismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  }

  async function handleShare() {
    const title = 'REZ Now — Order & Earn Coins';
    const text = `Join me on REZ Now! Use my invite code ${referralCode} and we both earn ₹50 in REZ coins.`;

    try {
      await shareContent({ title, text, url: referralUrl });

      // Detect clipboard fallback: navigator.share absent
      const usedClipboard =
        typeof navigator === 'undefined' || typeof navigator.share !== 'function';

      if (usedClipboard) {
        setCopied(true);
        showToast('Referral link copied!', 'success');
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // navigator.share cancelled or totally unavailable — WhatsApp fallback
      shareViaWhatsApp(`Join me on REZ Now! Use my invite code ${referralCode} and we both earn ₹50 in REZ coins.\n${referralUrl}`);
    }
  }

  return (
    <div className="mx-4 mt-3 mb-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 shadow-sm relative">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss referral banner"
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Content */}
      <div className="pr-6">
        <p className="text-white font-semibold text-sm leading-snug">
          Invite friends, earn ₹50 REZ coins each!
        </p>
        <p className="text-white/75 text-xs mt-0.5">
          Your referral code:{' '}
          <span className="font-mono font-bold text-white tracking-widest">{referralCode}</span>
        </p>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
      >
        {copied ? (
          <>
            <CheckIcon className="w-4 h-4 text-green-600" />
            <span className="text-green-700">Link copied!</span>
          </>
        ) : (
          <>
            <ShareIcon className="w-4 h-4" />
            <span>Share & Earn</span>
          </>
        )}
      </button>
    </div>
  );
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
