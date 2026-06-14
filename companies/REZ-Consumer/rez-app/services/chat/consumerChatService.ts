// ── ReZ Consumer Chat Service ──────────────────────────────────────────────────────
// Consumer app chat - unified access to all ReZ services

import { io, Socket } from 'socket.io-client';
import { logger } from '@/utils/logger';

// Platform types for consumer app
export type ReZPlatform = 'consumer' | 'hotel' | 'store';

const CONSUMER_NAMESPACE = '/ai/consumer';

export interface ConsumerChatContext {
  userId: string;
  sessionId: string;
  platform: ReZPlatform;
}

// ── Consumer Chat Service ──────────────────────────────────────────────────────

class ConsumerChatService {
  private socket: Socket | null = null;
  private context: ConsumerChatContext | null = null;

  connect(serverUrl: string, context: ConsumerChatContext): void {
    this.context = context;

    this.socket = io(`${serverUrl}${CONSUMER_NAMESPACE}`, {
      auth: {
        userId: context.userId,
        sessionId: context.sessionId,
        platform: context.platform,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      logger.info('Consumer chat connected', { userId: context.userId });
    });

    // Hotel events
    this.socket.on('booking_update', (data) => this.handleBookingUpdate(data));
    this.socket.on('checkin_reminder', (data) => this.handleCheckinReminder(data));

    // Order events
    this.socket.on('order_update', (data) => this.handleOrderUpdate(data));
    this.socket.on('delivery_update', (data) => this.handleDeliveryUpdate(data));

    // Rendez events
    this.socket.on('new_match', (data) => this.handleNewMatch(data));
    this.socket.on('message_received', (data) => this.handleMessage(data));

    // Karma events
    this.socket.on('karma_earned', (data) => this.handleKarmaEarned(data));
    this.socket.on('achievement_unlocked', (data) => this.handleAchievement(data));
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ── Universal Actions ──────────────────────────────────────────────────────

  async searchHotels(query: { location?: string; checkIn?: string; checkOut?: string; guests?: number }): Promise<{
    success: boolean;
    data?: unknown;
    message: string;
  }> {
    return this.executeAction({ type: 'search_hotels', payload: query });
  }

  async searchRestaurants(query: { location?: string; cuisine?: string }): Promise<{
    success: boolean;
    data?: unknown;
    message: string;
  }> {
    return this.executeAction({ type: 'search_restaurants', payload: query });
  }

  async viewBookings(): Promise<{
    success: boolean;
    data?: unknown;
    message: string;
  }> {
    return this.executeAction({ type: 'view_bookings', payload: {} });
  }

  async viewOrders(): Promise<{
    success: boolean;
    data?: unknown;
    message: string;
  }> {
    return this.executeAction({ type: 'view_orders', payload: {} });
  }

  async checkKarma(): Promise<{
    success: boolean;
    data?: unknown;
    message: string;
  }> {
    return this.executeAction({ type: 'check_karma', payload: {} });
  }

  async openRendez(): Promise<{
    success: boolean;
    data?: unknown;
    message: string;
  }> {
    return this.executeAction({ type: 'open_rendez', payload: {} });
  }

  // ── Private Methods ──────────────────────────────────────────────────────

  private async executeAction(action: { type: string; payload?: Record<string, unknown> }): Promise<{
    success: boolean;
    data?: unknown;
    message: string;
  }> {
    if (!this.socket?.connected) {
      return { success: false, message: 'Not connected to chat server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('consumer_action', {
        ...action,
        context: this.context,
      }, (response: { success: boolean; data?: unknown; message: string }) => {
        resolve(response);
      });
    });
  }

  // ── Event Handlers ──────────────────────────────────────────────────────

  private handleBookingUpdate(data: { bookingId: string; status: string }): void {
    logger.info('Booking update', data);
  }

  private handleCheckinReminder(data: { bookingId: string; time: string }): void {
    logger.info('Check-in reminder', data);
  }

  private handleOrderUpdate(data: { orderId: string; status: string }): void {
    logger.info('Order update', data);
  }

  private handleDeliveryUpdate(data: { orderId: string; driver?: string; eta?: string }): void {
    logger.info('Delivery update', data);
  }

  private handleNewMatch(data: { matchId: string; name: string; photo?: string }): void {
    logger.info('New match', data);
  }

  private handleMessage(data: { fromUserId: string; content: string }): void {
    logger.info('New message', data);
  }

  private handleKarmaEarned(data: { points: number; reason: string }): void {
    logger.info('Karma earned', data);
  }

  private handleAchievement(data: { achievement: string; description: string }): void {
    logger.info('Achievement unlocked', data);
  }
}

export const consumerChatService = new ConsumerChatService();
export default consumerChatService;
