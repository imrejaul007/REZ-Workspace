'use client';

import React from 'react';
import { AIFloatingChat, AIAppType, CustomerContext } from '@rez/chat';
import { useAuthStore } from '@/lib/store/authStore';
import { logger } from '@/lib/utils/logger';

interface ReZChatWidgetProps {
  /** Override app type - defaults to 'general' */
  appType?: AIAppType | string;
  /** Override industry category */
  industryCategory?: string;
  /** Merchant/hotel/restaurant ID */
  merchantId?: string;
  /** Socket URL - defaults to API URL */
  socketUrl?: string;
}

export function ReZChatWidget({
  appType = 'general',
  industryCategory,
  merchantId,
  socketUrl,
}: ReZChatWidgetProps) {
  const { user } = useAuthStore();

  // Don't render if no user
  if (!user) {
    return null;
  }

  const customerContext: CustomerContext = {
    customerId: user.id,
    name: user.name || user.phone,
    email: user.email,
    phone: user.phone,
    tier: user.membershipTier,
    preferences: {
      defaultAddress: user.defaultAddress,
    },
    recentOrders: [], // Could fetch from store
    bookings: [],
  };

  const apiUrl = socketUrl || process.env.NEXT_PUBLIC_API_URL || 'https://api.rez.money';

  return (
    <AIFloatingChat
      appType={appType}
      industryCategory={industryCategory}
      userId={user.id}
      merchantId={merchantId}
      customerContext={customerContext}
      socketUrl={apiUrl}
      token={user.token}
      position="bottom-right"
      themeColor="#6366f1"
      showSuggestions={true}
      enableTransfer={true}
      onEscalate={(data) => {
        logger.info('Chat escalated', { data });
        // Could open support ticket or redirect
      }}
      onAction={(action) => {
        logger.info('Chat action', { action });
        // Handle specific actions like order, booking, etc.
      }}
    />
  );
}

export default ReZChatWidget;
