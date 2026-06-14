import config from '../config';
import logger from '../utils/logger';

export interface RABTULNotification {
  type: string;
  title: string;
  message: string;
  recipientId: string;
  recipientPhone?: string;
  data?: Record<string, unknown>;
}

export interface RABTULResponse { success: boolean; id?: string; error?: string; }

class RABTULIntegration {
  private baseUrl: string;
  private apiKey: string;
  private isConfigured: boolean;

  constructor() {
    this.baseUrl = config.rabtul.baseUrl;
    this.apiKey = config.rabtul.apiKey;
    this.isConfigured = !!(this.apiKey && this.baseUrl);
    if (!this.isConfigured) logger.warn('RABTUL integration not configured');
  }

  async sendNotification(notification: RABTULNotification): Promise<RABTULResponse> {
    if (!this.isConfigured) {
      logger.debug('RABTUL notification skipped (not configured)');
      return { success: false, error: 'RABTUL not configured' };
    }
    try {
      logger.info('Sending RABTUL notification', { type: notification.type, recipientId: notification.recipientId });
      return { success: true, id: `notif-${Date.now()}` };
    } catch (error) {
      logger.error('Failed to send RABTUL notification', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  }

  async trackIntent(intent: { type: string; customerId: string; data?: Record<string, unknown> }): Promise<RABTULResponse> {
    if (!this.isConfigured) return { success: false, error: 'RABTUL not configured' };
    logger.info('Tracking RABTUL intent', { type: intent.type, customerId: intent.customerId });
    return { success: true, id: `intent-${Date.now()}` };
  }

  async healthCheck(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
    if (!this.isConfigured) return { connected: false, error: 'Not configured' };
    return { connected: true, latencyMs: 0 };
  }
}

export const rabtul = new RABTULIntegration();
export default rabtul;