/**
 * Subscriber Routes
 */

import { Router, Request, Response } from 'express';
import { NotificationPreferences } from '../models/NotificationPreferences';

const router = Router();

/**
 * GET /api/v1/subscribers/:userId
 * Get subscriber preferences
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const preferences = await NotificationPreferences.findOne({ userId });

    if (!preferences) {
      return res.json({
        preferences: {
          userId,
          channels: {
            push: true,
            sms: true,
            email: true,
            whatsapp: false,
            inApp: true,
          },
        },
      });
    }

    res.json({ preferences });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

/**
 * PUT /api/v1/subscribers/:userId
 * Update subscriber preferences
 */
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { channels, quietHours, email, phone, pushToken, whatsappNumber } = req.body;

    const preferences = await NotificationPreferences.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...(channels && { channels }),
          ...(quietHours && { quietHours }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(pushToken && { pushToken }),
          ...(whatsappNumber && { whatsappNumber }),
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, preferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * POST /api/v1/subscribers/:userId/tokens/push
 * Register push token
 */
router.post('/:userId/tokens/push', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    await NotificationPreferences.findOneAndUpdate(
      { userId },
      { $set: { pushToken: token } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ error: 'Failed to register token' });
  }
});

/**
 * DELETE /api/v1/subscribers/:userId/tokens/push
 * Remove push token
 */
router.delete('/:userId/tokens/push', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    await NotificationPreferences.findOneAndUpdate(
      { userId },
      { $unset: { pushToken: '' } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing push token:', error);
    res.status(500).json({ error: 'Failed to remove token' });
  }
});

/**
 * PUT /api/v1/subscribers/:userId/channels/:channel
 * Toggle channel
 */
router.put('/:userId/channels/:channel', async (req: Request, res: Response) => {
  try {
    const { userId, channel } = req.params;
    const { enabled } = req.body;

    const channelMap: Record<string, string> = {
      push: 'channels.push',
      sms: 'channels.sms',
      email: 'channels.email',
      whatsapp: 'channels.whatsapp',
      inApp: 'channels.inApp',
    };

    const field = channelMap[channel];
    if (!field) {
      return res.status(400).json({ error: 'Invalid channel' });
    }

    await NotificationPreferences.findOneAndUpdate(
      { userId },
      { $set: { [field]: enabled } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling channel:', error);
    res.status(500).json({ error: 'Failed to toggle channel' });
  }
});

export { router as subscriberRoutes };
