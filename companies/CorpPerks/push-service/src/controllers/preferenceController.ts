import { Request, Response } from 'express';
import { notificationPreferenceService } from '../services';
import { UpdatePreferencesSchema, DeviceTokenSchema } from '../validators';

/**
 * Get user preferences
 * GET /api/notifications/preferences
 */
export async function getPreferences(req: Request, res: Response): Promise<void> {
  const { userId, companyId } = req.query;

  if (!userId || !companyId || typeof userId !== 'string' || typeof companyId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'userId and companyId query parameters are required',
    });
    return;
  }

  try {
    const preferences = await notificationPreferenceService.getPreferences(userId, companyId);

    if (!preferences) {
      res.status(404).json({
        success: false,
        error: 'Preferences not found',
      });
      return;
    }

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preferences',
    });
  }
}

/**
 * Get or create user preferences
 * POST /api/notifications/preferences
 */
export async function getOrCreatePreferences(req: Request, res: Response): Promise<void> {
  const { userId, companyId } = req.body;

  if (!userId || !companyId) {
    res.status(400).json({
      success: false,
      error: 'userId and companyId are required',
    });
    return;
  }

  try {
    const preferences = await notificationPreferenceService.getOrCreatePreferences({
      userId,
      companyId,
    });

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get preferences',
    });
  }
}

/**
 * Update user preferences
 * PATCH /api/notifications/preferences
 */
export async function updatePreferences(req: Request, res: Response): Promise<void> {
  const { userId, companyId, ...updates } = req.body;

  if (!userId || !companyId) {
    res.status(400).json({
      success: false,
      error: 'userId and companyId are required',
    });
    return;
  }

  const validation = UpdatePreferencesSchema.safeParse(updates);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.error.flatten(),
    });
    return;
  }

  try {
    const preferences = await notificationPreferenceService.updatePreferences(
      userId,
      companyId,
      {
        ...validation.data,
        doNotDisturbUntil: validation.data.doNotDisturbUntil
          ? new Date(validation.data.doNotDisturbUntil)
          : undefined,
      }
    );

    if (!preferences) {
      res.status(404).json({
        success: false,
        error: 'Preferences not found',
      });
      return;
    }

    res.json({
      success: true,
      data: preferences,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
    });
  }
}

/**
 * Toggle channel
 * PATCH /api/notifications/preferences/channel
 */
export async function toggleChannel(req: Request, res: Response): Promise<void> {
  const { userId, companyId, channel, enabled } = req.body;

  if (!userId || !companyId || !channel || typeof enabled !== 'boolean') {
    res.status(400).json({
      success: false,
      error: 'userId, companyId, channel, and enabled are required',
    });
    return;
  }

  const validChannels = ['push', 'in_app', 'email', 'sms'];
  if (!validChannels.includes(channel)) {
    res.status(400).json({
      success: false,
      error: `Invalid channel. Must be one of: ${validChannels.join(', ')}`,
    });
    return;
  }

  try {
    const preferences = await notificationPreferenceService.toggleChannel(
      userId,
      companyId,
      channel as 'push' | 'in_app' | 'email' | 'sms',
      enabled
    );

    res.json({
      success: true,
      data: preferences,
      message: `Channel '${channel}' ${enabled ? 'enabled' : 'disabled'}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to toggle channel',
    });
  }
}

/**
 * Toggle notification type
 * PATCH /api/notifications/preferences/type
 */
export async function toggleType(req: Request, res: Response): Promise<void> {
  const { userId, companyId, type, enabled, channels } = req.body;

  if (!userId || !companyId || !type || typeof enabled !== 'boolean') {
    res.status(400).json({
      success: false,
      error: 'userId, companyId, type, and enabled are required',
    });
    return;
  }

  try {
    const preferences = await notificationPreferenceService.toggleType(
      userId,
      companyId,
      type,
      enabled,
      channels
    );

    res.json({
      success: true,
      data: preferences,
      message: `Notification type '${type}' ${enabled ? 'enabled' : 'disabled'}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to toggle notification type',
    });
  }
}

/**
 * Set quiet hours
 * PATCH /api/notifications/preferences/quiet-hours
 */
export async function setQuietHours(req: Request, res: Response): Promise<void> {
  const { userId, companyId, channel, enabled, start, end } = req.body;

  if (!userId || !companyId || !channel || typeof enabled !== 'boolean') {
    res.status(400).json({
      success: false,
      error: 'userId, companyId, channel, and enabled are required',
    });
    return;
  }

  const validChannels = ['push', 'in_app', 'email', 'sms'];
  if (!validChannels.includes(channel)) {
    res.status(400).json({
      success: false,
      error: `Invalid channel. Must be one of: ${validChannels.join(', ')}`,
    });
    return;
  }

  try {
    const preferences = await notificationPreferenceService.setQuietHours(
      userId,
      companyId,
      channel as 'push' | 'in_app' | 'email' | 'sms',
      enabled,
      start,
      end
    );

    res.json({
      success: true,
      data: preferences,
      message: 'Quiet hours updated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to set quiet hours',
    });
  }
}

/**
 * Register device token
 * POST /api/notifications/preferences/device
 */
export async function registerDevice(req: Request, res: Response): Promise<void> {
  const validation = DeviceTokenSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.error.flatten(),
    });
    return;
  }

  const { userId, companyId, token, platform, deviceId, deviceName } = validation.data;

  try {
    const preferences = await notificationPreferenceService.registerDeviceToken(
      userId,
      companyId,
      token,
      platform,
      deviceId,
      deviceName
    );

    res.json({
      success: true,
      data: preferences,
      message: 'Device registered successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to register device',
    });
  }
}

/**
 * Unregister device token
 * DELETE /api/notifications/preferences/device
 */
export async function unregisterDevice(req: Request, res: Response): Promise<void> {
  const { userId, companyId, token } = req.body;

  if (!userId || !companyId || !token) {
    res.status(400).json({
      success: false,
      error: 'userId, companyId, and token are required',
    });
    return;
  }

  try {
    const preferences = await notificationPreferenceService.unregisterDeviceToken(
      userId,
      companyId,
      token
    );

    res.json({
      success: true,
      data: preferences,
      message: 'Device unregistered successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to unregister device',
    });
  }
}

/**
 * Set do not disturb
 * POST /api/notifications/preferences/dnd
 */
export async function setDoNotDisturb(req: Request, res: Response): Promise<void> {
  const { userId, companyId, until } = req.body;

  if (!userId || !companyId || !until) {
    res.status(400).json({
      success: false,
      error: 'userId, companyId, and until are required',
    });
    return;
  }

  try {
    const preferences = await notificationPreferenceService.setDoNotDisturb(
      userId,
      companyId,
      new Date(until)
    );

    res.json({
      success: true,
      data: preferences,
      message: 'Do not disturb set',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to set do not disturb',
    });
  }
}

/**
 * Reset preferences to defaults
 * POST /api/notifications/preferences/reset
 */
export async function resetPreferences(req: Request, res: Response): Promise<void> {
  const { userId, companyId } = req.body;

  if (!userId || !companyId) {
    res.status(400).json({
      success: false,
      error: 'userId and companyId are required',
    });
    return;
  }

  try {
    const preferences = await notificationPreferenceService.resetToDefaults(userId, companyId);

    res.json({
      success: true,
      data: preferences,
      message: 'Preferences reset to defaults',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to reset preferences',
    });
  }
}
