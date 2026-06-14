'use client';

import { useState, useCallback } from 'react';
import { STORAGE_KEYS } from './types';
import { trackInstallPromptAction } from './utils/analytics';

interface InstallAppPromptProps {
  onDismiss?: () => void;
  onContinueWeb?: () => void;
  className?: string;
}

/**
 * InstallAppPrompt - Prompt mobile users to install the REZ App
 * Shows when user is on mobile but doesn't have the native app
 */
export default function InstallAppPrompt({
  onDismiss,
  onContinueWeb,
  className = '',
}: InstallAppPromptProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showQR, setShowQR] = useState(false);

  // Check if prompt was previously dismissed
  const wasRecentlyDismissed = useCallback((): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INSTALL_PROMPTED);
      if (stored) {
        const { dismissedAt } = JSON.parse(stored);
        // Only show again if dismissed more than 7 days ago
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        return Date.now() - dismissedAt < sevenDaysMs;
      }
    } catch {
      // Ignore errors
    }
    return false;
  }, []);

  // Dismiss the prompt
  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPTED, JSON.stringify({
        dismissedAt: Date.now(),
      }));
    } catch {
      // Ignore storage errors
    }

    setIsVisible(false);
    trackInstallPromptAction('dismiss');
    onDismiss?.();
  }, [onDismiss]);

  // Continue in web
  const handleContinueWeb = useCallback(() => {
    trackInstallPromptAction('continue_web');
    setIsVisible(false);
    onContinueWeb?.();
  }, [onContinueWeb]);

  // Install app
  const handleInstall = useCallback(() => {
    trackInstallPromptAction('install');

    // Detect platform and redirect to appropriate store
    const userAgent = navigator.userAgent.toLowerCase();

    if (/android/i.test(userAgent)) {
      // Android - redirect to Google Play
      window.location.href = 'https://play.google.com/store/apps/details?id=com.reznow.app';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      // iOS - redirect to App Store
      window.location.href = 'https://apps.apple.com/app/rez-now/id123456789';
    } else {
      // Desktop or unknown - show QR code
      setShowQR(true);
    }
  }, []);

  // Don't render if dismissed or not mobile
  if (!isVisible || wasRecentlyDismissed()) {
    return null;
  }

  return (
    <div className={`bg-gray-900 rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">
            Get the REZ App
          </h3>
          <p className="text-sm text-gray-400">
            For the best experience, download the REZ App to scan QR codes instantly.
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="space-y-3 mb-6">
        <BenefitItem
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          text="Faster QR code scanning"
        />
        <BenefitItem
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          text="Push notifications for orders"
        />
        <BenefitItem
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          text="Save favorite restaurants"
        />
      </div>

      {/* QR Code display */}
      {showQR && (
        <div className="mb-6 p-4 bg-white rounded-xl flex items-center justify-center">
          {/* Placeholder for QR code - would be actual QR code component */}
          <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-lg mx-auto mb-2" />
              <p className="text-xs text-gray-600">Scan to download</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleInstall}
          className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          {showQR ? 'Open App Store' : 'Install REZ App'}
        </button>
        <button
          onClick={handleContinueWeb}
          className="w-full text-gray-400 text-sm font-medium py-2 hover:text-gray-300 transition-colors"
        >
          Continue in web browser
        </button>
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-400 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Benefit item component
interface BenefitItemProps {
  icon: React.ReactNode;
  text: string;
}

function BenefitItem({ icon, text }: BenefitItemProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-300">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
        {icon}
      </div>
      {text}
    </div>
  );
}
