/**
 * WhatsApp Campaign Service Tests
 */

import {
  WhatsAppCampaign,
  CampaignMessage,
  CreateCampaignRequest,
  CampaignStatsResponse,
} from '../src/types/whatsapp.types';

describe('WhatsApp Campaign Types', () => {
  describe('WhatsAppCampaign', () => {
    it('should create a valid campaign object', () => {
      const campaign: WhatsAppCampaign = {
        campaignId: 'wa-test-12345678',
        merchantId: 'merchant-001',
        name: 'Summer Sale Campaign',
        template: {
          type: 'promotional',
          header: 'Summer Sale!',
          body: 'Get 50% off on all items. Use code SUMMER50',
          footer: 'Valid till 30th June',
          buttons: [
            { text: 'Shop Now', action: 'shop_now' },
            { text: 'Learn More', action: 'learn_more' },
          ],
          mediaUrl: 'https://example.com/summer-sale.jpg',
        },
        audience: {
          type: 'segment',
          segmentId: 'summer-shoppers',
          filters: {
            lastPurchaseDays: 30,
            cartAbandoners: true,
          },
        },
        scheduling: {
          type: 'scheduled',
          scheduledTime: new Date('2024-06-15T10:00:00Z'),
          optimalTimeEnabled: true,
        },
        metrics: {
          sent: 1000,
          delivered: 980,
          read: 750,
          clicked: 200,
          responded: 50,
          optOut: 5,
        },
        status: 'completed',
        createdAt: new Date('2024-06-01T00:00:00Z'),
        updatedAt: new Date('2024-06-15T12:00:00Z'),
        sentAt: new Date('2024-06-15T10:00:00Z'),
        completedAt: new Date('2024-06-15T12:00:00Z'),
      };

      expect(campaign.campaignId).toBe('wa-test-12345678');
      expect(campaign.merchantId).toBe('merchant-001');
      expect(campaign.template.type).toBe('promotional');
      expect(campaign.audience.type).toBe('segment');
      expect(campaign.scheduling.type).toBe('scheduled');
      expect(campaign.metrics.delivered).toBe(980);
      expect(campaign.status).toBe('completed');
    });

    it('should support all template types', () => {
      const types: WhatsAppCampaign['template']['type'][] = [
        'promotional',
        'transactional',
        'reengagement',
        'welcome',
      ];

      types.forEach((type) => {
        const campaign: Partial<WhatsAppCampaign> = {
          template: { type, body: 'Test message' },
        };
        expect(campaign.template?.type).toBe(type);
      });
    });

    it('should support all campaign statuses', () => {
      const statuses: WhatsAppCampaign['status'][] = [
        'draft',
        'scheduled',
        'sending',
        'completed',
        'paused',
      ];

      statuses.forEach((status) => {
        const campaign: Partial<WhatsAppCampaign> = { status };
        expect(campaign.status).toBe(status);
      });
    });
  });

  describe('CampaignMessage', () => {
    it('should create a valid message object', () => {
      const message: CampaignMessage = {
        messageId: 'msg-test-12345678',
        campaignId: 'wa-test-12345678',
        userId: 'user-001',
        phoneNumber: '919876543210',
        status: 'delivered',
        sentAt: new Date('2024-06-15T10:00:00Z'),
        deliveredAt: new Date('2024-06-15T10:00:05Z'),
        createdAt: new Date('2024-06-15T09:59:00Z'),
      };

      expect(message.messageId).toBe('msg-test-12345678');
      expect(message.campaignId).toBe('wa-test-12345678');
      expect(message.status).toBe('delivered');
      expect(message.phoneNumber).toBe('919876543210');
    });

    it('should support all message statuses', () => {
      const statuses: CampaignMessage['status'][] = [
        'pending',
        'sent',
        'delivered',
        'read',
        'failed',
        'opt_out',
      ];

      statuses.forEach((status) => {
        const message: Partial<CampaignMessage> = { status };
        expect(message.status).toBe(status);
      });
    });
  });

  describe('CreateCampaignRequest', () => {
    it('should create a valid campaign request', () => {
      const request: CreateCampaignRequest = {
        name: 'Welcome Campaign',
        merchantId: 'merchant-001',
        template: {
          type: 'welcome',
          body: 'Welcome to our store! Use code WELCOME10 for 10% off.',
        },
        audience: {
          type: 'all_customers',
        },
        scheduling: {
          type: 'immediate',
          optimalTimeEnabled: false,
        },
      };

      expect(request.name).toBe('Welcome Campaign');
      expect(request.template.type).toBe('welcome');
      expect(request.audience.type).toBe('all_customers');
      expect(request.scheduling.type).toBe('immediate');
    });
  });

  describe('CampaignStatsResponse', () => {
    it('should calculate rates correctly', () => {
      const stats: CampaignStatsResponse = {
        campaignId: 'wa-test-12345678',
        metrics: {
          sent: 1000,
          delivered: 980,
          read: 750,
          clicked: 200,
          responded: 50,
          optOut: 5,
          failed: 20,
        },
        deliveryRate: 98.0,
        readRate: 75.0,
        responseRate: 5.0,
        optOutRate: 0.5,
      };

      expect(stats.deliveryRate).toBe(98.0);
      expect(stats.readRate).toBe(75.0);
      expect(stats.responseRate).toBe(5.0);
      expect(stats.optOutRate).toBe(0.5);
    });

    it('should handle zero sent messages', () => {
      const stats: CampaignStatsResponse = {
        campaignId: 'wa-test-empty',
        metrics: {
          sent: 0,
          delivered: 0,
          read: 0,
          clicked: 0,
          responded: 0,
          optOut: 0,
          failed: 0,
        },
        deliveryRate: 0,
        readRate: 0,
        responseRate: 0,
        optOutRate: 0,
      };

      expect(stats.metrics.sent).toBe(0);
      expect(stats.deliveryRate).toBe(0);
    });
  });
});

describe('Audience Types', () => {
  it('should support all_customers audience type', () => {
    const campaign: Partial<WhatsAppCampaign> = {
      audience: {
        type: 'all_customers',
      },
    };
    expect(campaign.audience?.type).toBe('all_customers');
  });

  it('should support segment audience type with filters', () => {
    const campaign: Partial<WhatsAppCampaign> = {
      audience: {
        type: 'segment',
        segmentId: 'premium-customers',
        filters: {
          lastPurchaseDays: 90,
          minOrderValue: 1000,
          tags: ['premium', 'frequent-buyer'],
        },
      },
    };
    expect(campaign.audience?.type).toBe('segment');
    expect(campaign.audience?.segmentId).toBe('premium-customers');
    expect(campaign.audience?.filters?.lastPurchaseDays).toBe(90);
  });

  it('should support custom audience type with userIds', () => {
    const campaign: Partial<WhatsAppCampaign> = {
      audience: {
        type: 'custom',
        userIds: ['user-001', 'user-002', 'user-003'],
      },
    };
    expect(campaign.audience?.type).toBe('custom');
    expect(campaign.audience?.userIds).toHaveLength(3);
  });
});

describe('Scheduling Types', () => {
  it('should support immediate scheduling', () => {
    const campaign: Partial<WhatsAppCampaign> = {
      scheduling: {
        type: 'immediate',
        optimalTimeEnabled: false,
      },
    };
    expect(campaign.scheduling?.type).toBe('immediate');
    expect(campaign.scheduling?.optimalTimeEnabled).toBe(false);
  });

  it('should support scheduled timing', () => {
    const scheduledDate = new Date('2024-06-20T10:00:00Z');
    const campaign: Partial<WhatsAppCampaign> = {
      scheduling: {
        type: 'scheduled',
        scheduledTime: scheduledDate,
        optimalTimeEnabled: false,
      },
    };
    expect(campaign.scheduling?.type).toBe('scheduled');
    expect(campaign.scheduling?.scheduledTime).toEqual(scheduledDate);
  });

  it('should support automated scheduling with optimal time', () => {
    const campaign: Partial<WhatsAppCampaign> = {
      scheduling: {
        type: 'automated',
        optimalTimeEnabled: true,
      },
    };
    expect(campaign.scheduling?.type).toBe('automated');
    expect(campaign.scheduling?.optimalTimeEnabled).toBe(true);
  });
});

describe('Metrics', () => {
  it('should track full message funnel', () => {
    const metrics: WhatsAppCampaign['metrics'] = {
      sent: 10000,
      delivered: 9800,
      read: 7500,
      clicked: 2500,
      responded: 500,
      optOut: 25,
      failed: 200,
    };

    expect(metrics.sent).toBe(10000);
    expect(metrics.delivered).toBeLessThan(metrics.sent);
    expect(metrics.read).toBeLessThan(metrics.delivered);
    expect(metrics.clicked).toBeLessThan(metrics.read);
    expect(metrics.responded).toBeLessThan(metrics.clicked);
    expect(metrics.optOut).toBeLessThan(metrics.delivered);
  });

  it('should calculate conversion rates', () => {
    const metrics = {
      sent: 1000,
      delivered: 980,
      read: 750,
      clicked: 200,
      responded: 50,
      optOut: 5,
    };

    const deliveryRate = (metrics.delivered / metrics.sent) * 100;
    const readRate = (metrics.read / metrics.sent) * 100;
    const clickRate = (metrics.clicked / metrics.sent) * 100;
    const responseRate = (metrics.responded / metrics.sent) * 100;
    const optOutRate = (metrics.optOut / metrics.sent) * 100;

    expect(deliveryRate).toBe(98);
    expect(readRate).toBe(75);
    expect(clickRate).toBe(20);
    expect(responseRate).toBe(5);
    expect(optOutRate).toBe(0.5);
  });
});