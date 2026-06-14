'use client';

import React from 'react';
import { AIFloatingChat, AIAppType, CustomerContext } from '@rez/chat';
import { logger } from '@/lib/utils/logger';

interface HotelRoomChatWidgetProps {
  hotelId: string;
  roomId: string;
  guestName: string;
  guestId: string;
  tier?: string;
  socketUrl?: string;
}

export function HotelRoomChatWidget({
  hotelId,
  roomId,
  guestName,
  guestId,
  tier,
  socketUrl,
}: HotelRoomChatWidgetProps) {
  const customerContext: CustomerContext = {
    customerId: guestId,
    name: guestName,
    tier,
    preferences: {
      roomId,
      hotelId,
    },
  };

  const apiUrl = socketUrl || process.env.NEXT_PUBLIC_API_URL || 'https://api.rez.money';

  return (
    <AIFloatingChat
      appType="room-qr"
      industryCategory="hotel"
      userId={guestId}
      merchantId={hotelId}
      customerContext={customerContext}
      socketUrl={apiUrl}
      position="bottom-right"
      themeColor="#0ea5e9"
      showSuggestions={true}
      enableTransfer={true}
      onEscalate={(data) => {
        logger.info('Room chat escalated', { data });
      }}
      onAction={(action) => {
        logger.info('Room chat action', { action });
      }}
    />
  );
}

export default HotelRoomChatWidget;
