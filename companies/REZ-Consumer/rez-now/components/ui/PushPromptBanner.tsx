'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { subscribeToPush } from '@/lib/push/webPush';

const DISMISSED_KEY = 'rez_push_dismissed';

interface PushPromptBannerProps {
  show: boolean;
  onDismiss: () => void;
}

export default function PushPromptBanner({ show, onDismiss }: PushPromptBannerProps) {
  const t = useTranslations('push');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;

    // Do not show if already dismissed, already granted, or denied
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DISMISSED_KEY) === '1') return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'denied') return;
    if (Notification.permission === 'granted') return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- setting derived state from prop guard conditions is intentional
    setVisible(true);
  }, [show]);

  if (!visible) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
    onDismiss();
  }

  async function handleEnable() {
    setStatus('loading');
    const sub = await subscribeToPush();
    if (sub) {
      setStatus('success');
      // Auto-hide after showing success message
      setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 2000);
    } else {
      // Permission denied or error — dismiss silently
      handleDismiss();
    }
  }

  return (
    <div
      role="banner"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none"
    >
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg px-4 py-4 flex items-center gap-3 pointer-events-auto">
        {/* Bell icon */}
        <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {status === 'success' ? (
            <p className="text-sm font-semibold text-green-700">{t('success')}</p>
          ) : (
            <p className="text-sm font-medium text-gray-800 leading-snug">{t('prompt')}</p>
          )}
        </div>

        {status !== 'success' && (
          <>
            <button
              onClick={handleEnable}
              disabled={status === 'loading'}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              {status === 'loading' ? '...' : t('enable')}
            </button>

            <button
              onClick={handleDismiss}
              aria-label={t('dismiss')}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
