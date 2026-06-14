// Marketing inbox — broadcast messages sent by merchants via rez-marketing-service.
// These are stored in Redis by the marketing service and surfaced here.

import apiClient from './apiClient';

export interface MarketingMessage {
  id: string;
  type: 'broadcast';
  merchantId: string;
  campaignId: string;
  title: string;
  message: string;
  channel: string;
  ctaUrl?: string;
  sentAt: string;
}

export interface MarketingInboxResponse {
  messages: MarketingMessage[];
  total: number;
}

export const marketingInboxApi = {
  getInbox: () =>
    apiClient.get<MarketingInboxResponse>('/notifications/marketing-inbox'),

  dismissMessage: (messageId: string) =>
    apiClient.delete<{ removed: boolean }>(`/notifications/marketing-inbox/${messageId}`),
};

export default marketingInboxApi;
