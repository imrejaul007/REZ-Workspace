import { Router, Request, Response } from 'express';
import { channelDispatcher } from '../services/channel-dispatcher.service';
import { authenticate, asyncHandler, APIError } from '../middleware';
import { ChannelInfo, Channel } from '../types';
import { config } from '../config';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/channels
 * List available channels with their capabilities
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const channels: ChannelInfo[] = [
      {
        channel: 'whatsapp',
        name: 'WhatsApp',
        description: 'Rich messaging with templates, media, and interactive buttons',
        capabilities: [
          'Template messages',
          'Media attachments (images, video, documents)',
          'Interactive buttons',
          'Quick replies',
          'Read receipts',
          'Session messages',
        ],
        maxMessageLength: 4096,
        supportsMedia: true,
        supportsTemplates: true,
        estimatedReach: 400000000,
      },
      {
        channel: 'sms',
        name: 'SMS',
        description: 'Text messages with high delivery and open rates',
        capabilities: [
          'Plain text messages',
          'Concatenated messages',
          'Sender ID customization',
          'High delivery rate',
          'Instant delivery',
        ],
        maxMessageLength: 160,
        supportsMedia: false,
        supportsTemplates: false,
        estimatedReach: 1200000000,
      },
      {
        channel: 'email',
        name: 'Email',
        description: 'HTML emails with templates, tracking, and analytics',
        capabilities: [
          'HTML templates',
          'Rich content',
          'Attachment support',
          'Open tracking',
          'Click tracking',
          'Unsubscribe management',
        ],
        maxMessageLength: 50000,
        supportsMedia: true,
        supportsTemplates: true,
        estimatedReach: 600000000,
      },
      {
        channel: 'push',
        name: 'Push Notifications',
        description: 'Mobile and web push notifications with rich media',
        capabilities: [
          'Rich notifications',
          'Image attachments',
          'Action buttons',
          'Badge updates',
          'Silent notifications',
          'Category actions',
        ],
        maxMessageLength: 500,
        supportsMedia: true,
        supportsTemplates: false,
        estimatedReach: 500000000,
      },
    ];

    res.json({
      success: true,
      data: channels,
    });
  })
);

/**
 * GET /api/channels/:channel
 * Get specific channel information and status
 */
router.get(
  '/:channel',
  asyncHandler(async (req: Request, res: Response) => {
    const { channel } = req.params;

    if (!['whatsapp', 'sms', 'email', 'push'].includes(channel)) {
      throw APIError.badRequest('Invalid channel');
    }

    const channelConfig = config.channels[channel as Channel];
    const health = await channelDispatcher.getChannelHealth(channel as Channel);
    const queueStatus = channelDispatcher.getQueueStatus(channel as Channel);

    const channelInfo: ChannelInfo & { config: typeof channelConfig; health: typeof health; queue: typeof queueStatus } = {
      channel: channel as Channel,
      name: channel.charAt(0).toUpperCase() + channel.slice(1),
      description: getChannelDescription(channel as Channel),
      capabilities: getChannelCapabilities(channel as Channel),
      maxMessageLength: getMaxMessageLength(channel as Channel),
      supportsMedia: supportsMedia(channel as Channel),
      supportsTemplates: supportsTemplates(channel as Channel),
      estimatedReach: getEstimatedReach(channel as Channel),
      config: channelConfig,
      health,
      queue: queueStatus,
    };

    res.json({
      success: true,
      data: channelInfo,
    });
  })
);

/**
 * GET /api/channels/:channel/health
 * Get channel health status
 */
router.get(
  '/:channel/health',
  asyncHandler(async (req: Request, res: Response) => {
    const { channel } = req.params;

    if (!['whatsapp', 'sms', 'email', 'push'].includes(channel)) {
      throw APIError.badRequest('Invalid channel');
    }

    const health = await channelDispatcher.getChannelHealth(channel as Channel);

    res.json({
      success: true,
      data: {
        channel,
        ...health,
      },
    });
  })
);

/**
 * GET /api/channels/status
 * Get status of all channels
 */
router.get(
  '/status',
  asyncHandler(async (_req: Request, _res: Response) => {
    const health = await channelDispatcher.getAllChannelsHealth();

    const channels = ['whatsapp', 'sms', 'email', 'push'] as Channel[];
    const status = channels.map((channel) => ({
      channel,
      healthy: health[channel].healthy,
      latency: health[channel].latency,
      error: health[channel].error,
      queue: channelDispatcher.getQueueStatus(channel),
    }));

    _res.json({
      success: true,
      data: status,
    });
  })
);

// Helper functions
function getChannelDescription(channel: Channel): string {
  const descriptions: Record<Channel, string> = {
    whatsapp: 'Rich messaging with templates, media, and interactive buttons',
    sms: 'Text messages with high delivery and open rates',
    email: 'HTML emails with templates, tracking, and analytics',
    push: 'Mobile and web push notifications with rich media',
  };
  return descriptions[channel];
}

function getChannelCapabilities(channel: Channel): string[] {
  const capabilities: Record<Channel, string[]> = {
    whatsapp: ['Template messages', 'Media attachments', 'Interactive buttons', 'Quick replies'],
    sms: ['Plain text', 'Concatenated messages', 'Sender ID', 'High delivery'],
    email: ['HTML templates', 'Rich content', 'Attachments', 'Open/Click tracking'],
    push: ['Rich notifications', 'Images', 'Action buttons', 'Badge updates'],
  };
  return capabilities[channel];
}

function getMaxMessageLength(channel: Channel): number {
  const limits: Record<Channel, number> = {
    whatsapp: 4096,
    sms: 160,
    email: 50000,
    push: 500,
  };
  return limits[channel];
}

function supportsMedia(channel: Channel): boolean {
  return ['whatsapp', 'email', 'push'].includes(channel);
}

function supportsTemplates(channel: Channel): boolean {
  return ['whatsapp', 'email'].includes(channel);
}

function getEstimatedReach(channel: Channel): number {
  const reach: Record<Channel, number> = {
    whatsapp: 400000000,
    sms: 1200000000,
    email: 600000000,
    push: 500000000,
  };
  return reach[channel];
}

export default router;