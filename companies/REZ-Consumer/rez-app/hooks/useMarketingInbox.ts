import { useState, useEffect, useCallback } from 'react';
import marketingInboxApi, { MarketingMessage } from '@/services/marketingInboxApi';
import { useAuthStore } from '@/stores/authStore';

export function useMarketingInbox() {
  const [messages, setMessages] = useState<MarketingMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const isAuthenticated = useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.state.isAuthenticated);

  const fetchInbox = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await marketingInboxApi.getInbox();
      if (res.success && res.data) {
        setMessages(res.data.messages ?? []);
      }
    } catch {
      // silent — inbox is non-critical
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const dismiss = useCallback(async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    marketingInboxApi.dismissMessage(messageId).catch(() => {});
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  return { messages, loading, refresh: fetchInbox, dismiss, unreadCount: messages.length };
}
