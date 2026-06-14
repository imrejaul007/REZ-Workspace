'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';
import Toast from '@/components/ui/Toast';
import LoginModal from '@/components/auth/LoginModal';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import OfflineBanner from '@/components/ui/OfflineBanner';
import { ReZChatWidget } from '@/components/chat/ReZChatWidget';

export function Providers({ children }: { children: React.ReactNode }) {
  const clearSession = useAuthStore((s) => s.clearSession);
  const openLoginModal = useUIStore((s) => s.openLoginModal);

  // Listen for global session-expired events fired by the axios interceptor
  useEffect(() => {
    function handleSessionExpired() {
      clearSession();
      openLoginModal();
    }
    window.addEventListener('rez:session-expired', handleSessionExpired);
    return () => window.removeEventListener('rez:session-expired', handleSessionExpired);
  }, [clearSession, openLoginModal]);

  return (
    <ErrorBoundary>
      {children}
      <LoginModal />
      <Toast />
      <OfflineBanner />
      {/* ReZ AI Chat Widget - available on all pages */}
      <ReZChatWidget appType="general" />
    </ErrorBoundary>
  );
}
