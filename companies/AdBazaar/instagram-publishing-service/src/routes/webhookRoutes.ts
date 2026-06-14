import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import config from '../config/index.js';
import { PublishedContent, PublishRequest } from '../models/index.js';
import { asyncHandler } from '../middleware/index.js';
import logger from 'utils/logger.js';

const router = Router();

/**
 * GET /api/webhooks/instagram
 * Webhook verification endpoint for Instagram
 */
router.get('/instagram',
  asyncHandler(async (req: Request, res: Response) => {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    // Verify the webhook
    if (mode === 'subscribe' && token === config.webhook.verifyToken) {
      logger.info('Webhook verified successfully');
      res.status(200).send(challenge);
      return;
    }

    logger.warn('Webhook verification failed', { mode, token });
    res.status(403).send('Forbidden');
  })
);

/**
 * POST /api/webhooks/instagram
 * Handle Instagram webhook events
 */
router.post('/instagram',
  asyncHandler(async (req: Request, res: Response) => {
    // Respond immediately to avoid timeout
    res.status(200).send('OK');

    const { object, entry } = req.body;

    if (object !== 'instagram') {
      logger.warn('Received webhook for non-instagram object', { object });
      return;
    }

    for (const entryItem of entry) {
      const instagramId = entryItem.id;
      const time = entryItem.time;
      const changes = entryItem.changes || [];
      const messaging = entryItem.messaging || [];

      // Handle changes (e.g., comments, insights)
      for (const change of changes) {
        await handleChange(instagramId, change, time);
      }

      // Handle messaging events
      for (const message of messaging) {
        await handleMessaging(instagramId, message);
      }
    }
  })
);

/**
 * Handle content changes from webhook
 */
async function handleChange(
  instagramId: string,
  change: { field: string; value: Record<string, unknown> },
  timestamp: number
): Promise<void> {
  try {
    const { field, value } = change;

    switch (field) {
      case 'comments':
        await handleCommentChange(instagramId, value, timestamp);
        break;

      case 'mentions':
        await handleMentionChange(instagramId, value, timestamp);
        break;

      case 'story_insights':
        await handleStoryInsightsChange(instagramId, value, timestamp);
        break;

      case 'live_comments':
        await handleLiveCommentChange(instagramId, value, timestamp);
        break;

      default:
        logger.info('Unhandled webhook change field', { field, value });
    }
  } catch (error) {
    logger.error('Error handling webhook change', { instagramId, change, error });
  }
}

/**
 * Handle comment changes
 */
async function handleCommentChange(
  instagramId: string,
  value: Record<string, unknown>,
  timestamp: number
): Promise<void> {
  const mediaId = value.media?.id as string;
  const commentId = value.id as string;
  const text = value.text as string;
  const fromId = value.from?.id as string;
  const fromUsername = value.from?.username as string;
  const createdAt = value.created_at as number;

  logger.info('New comment received', {
    mediaId,
    commentId,
    fromUsername,
    text: text?.substring(0, 50),
  });

  // Update the published content with the new comment
  const content = await PublishedContent.findOne({ instagramMediaId: mediaId });
  if (content) {
    content.commentsCount = (content.commentsCount || 0) + 1;
    if (content.metrics) {
      content.metrics.comments += 1;
    }
    await content.save();

    logger.info('Content comment count updated', {
      contentId: content._id,
      newCount: content.commentsCount,
    });
  }
}

/**
 * Handle mention changes
 */
async function handleMentionChange(
  instagramId: string,
  value: Record<string, unknown>,
  timestamp: number
): Promise<void> {
  const mediaId = value.media?.id as string;
  const mentionText = value.text as string;

  logger.info('Mention received', {
    mediaId,
    mentionText: mentionText?.substring(0, 50),
  });
}

/**
 * Handle story insights changes
 */
async function handleStoryInsightsChange(
  instagramId: string,
  value: Record<string, unknown>,
  timestamp: number
): Promise<void> {
  const storyId = value.media?.id as string;
  const reach = value.reach as number;
  const impressions = value.impressions as number;
  const replies = value.replies as number;
  const tapsForward = value.taps_forward as number;
  const tapsBack = value.taps_back as number;
  const exits = value.exits as number;

  logger.info('Story insights received', {
    storyId,
    reach,
    impressions,
    replies,
  });

  // Update the story content with insights
  const content = await PublishedContent.findOne({ instagramMediaId: storyId });
  if (content && content.metrics) {
    content.metrics.reach = reach || content.metrics.reach;
    content.metrics.impressions = impressions || content.metrics.impressions;
    await content.save();

    logger.info('Story insights updated', {
      contentId: content._id,
      reach,
      impressions,
    });
  }
}

/**
 * Handle live comment changes
 */
async function handleLiveCommentChange(
  instagramId: string,
  value: Record<string, unknown>,
  timestamp: number
): Promise<void> {
  const broadcastId = value.broadcast?.id as string;
  const text = value.text as string;

  logger.info('Live comment received', {
    broadcastId,
    text: text?.substring(0, 50),
  });
}

/**
 * Handle messaging events
 */
async function handleMessaging(
  instagramId: string,
  messaging: { sender: { id: string }; recipient: { id: string }; timestamp: string; message?: Record<string, unknown> }
): Promise<void> {
  const senderId = messaging.sender?.id;
  const messageText = messaging.message?.text as string;

  logger.info('Messaging event received', {
    senderId,
    messageText: messageText?.substring(0, 50),
  });
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature || ''),
    Buffer.from(expectedSignature)
  );
}

export default router;