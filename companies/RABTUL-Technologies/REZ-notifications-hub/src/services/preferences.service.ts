import { v4 as uuidv4 } from 'uuid';
import { database } from './database';
import { cacheService } from './cache';
import {
  NotificationPreferences,
  CategoryPreferences,
  NotificationChannel,
  ChannelPreference,
} from '../types';
import { PreferencesInput, CategoryPreferencesInput } from '../utils/validators';
import logger from '../utils/logger';

export class PreferencesService {
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    // Try cache first
    const cached = await cacheService.getPreferences<NotificationPreferences>(userId);
    if (cached) {
      return cached;
    }

    const result = await database.query<{
      user_id: string;
      preferences: NotificationPreferences;
    }>(`SELECT * FROM user_preferences WHERE user_id = $1`, [userId]);

    if (result.rows.length === 0) {
      // Return default preferences
      return this.getDefaultPreferences(userId);
    }

    const preferences: NotificationPreferences = {
      ...result.rows[0].preferences,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await cacheService.cachePreferences(userId, preferences);

    return preferences;
  }

  async updatePreferences(
    userId: string,
    input: Partial<PreferencesInput>
  ): Promise<NotificationPreferences> {
    const existing = await this.getPreferences(userId);
    const updated: NotificationPreferences = {
      ...existing,
      ...input,
      userId,
      updatedAt: new Date(),
    };

    await database.query(
      `INSERT INTO user_preferences (user_id, preferences)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET preferences = $2, updated_at = NOW()`,
      [userId, JSON.stringify(updated)]
    );

    // Invalidate cache
    await cacheService.invalidatePreferences(userId);

    logger.info('User preferences updated', { userId });

    return updated;
  }

  async getCategoryPreferences(
    userId: string
  ): Promise<CategoryPreferences> {
    const result = await database.query<{
      user_id: string;
      category: string;
      enabled: boolean;
      channels: NotificationChannel[];
    }>(`SELECT * FROM category_preferences WHERE user_id = $1`, [userId]);

    const categoryPrefs: CategoryPreferences = {};

    for (const row of result.rows) {
      categoryPrefs[row.category] = {
        enabled: row.enabled,
        channels: row.channels,
      };
    }

    return categoryPrefs;
  }

  async updateCategoryPreferences(
    userId: string,
    categoryPreferences: CategoryPreferencesInput[]
  ): Promise<CategoryPreferences> {
    for (const catPref of categoryPreferences) {
      await database.query(
        `INSERT INTO category_preferences (user_id, category, enabled, channels)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, category)
         DO UPDATE SET enabled = $3, channels = $4, updated_at = NOW()`,
        [userId, catPref.category, catPref.enabled, JSON.stringify(catPref.channels)]
      );
    }

    logger.info('Category preferences updated', { userId });

    return this.getCategoryPreferences(userId);
  }

  async canReceiveNotification(
    userId: string,
    channel: NotificationChannel,
    category?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const preferences = await this.getPreferences(userId);

    // Check channel preference
    const channelPref = preferences[channel];
    if (channelPref && !channelPref.enabled) {
      return { allowed: false, reason: `Channel ${channel} is disabled` };
    }

    // Check quiet hours
    if (channelPref?.quietHoursStart && channelPref?.quietHoursEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (this.isInQuietHours(currentTime, channelPref.quietHoursStart, channelPref.quietHoursEnd)) {
        return { allowed: false, reason: 'Quiet hours active' };
      }
    }

    // Check category preference if provided
    if (category) {
      const categoryPrefs = await this.getCategoryPreferences(userId);
      const catPref = categoryPrefs[category];

      if (catPref && !catPref.enabled) {
        return { allowed: false, reason: `Category ${category} is disabled` };
      }

      if (catPref && !catPref.channels.includes(channel)) {
        return { allowed: false, reason: `Channel ${channel} not enabled for category ${category}` };
      }
    }

    return { allowed: true };
  }

  private isInQuietHours(
    currentTime: string,
    start: string,
    end: string
  ): boolean {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const [currHour, currMin] = currentTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const currentMinutes = currHour * 60 + currMin;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (endMinutes < startMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    const defaultChannelPreference: ChannelPreference = {
      enabled: true,
    };

    return {
      userId,
      email: { ...defaultChannelPreference },
      sms: { ...defaultChannelPreference },
      whatsapp: { ...defaultChannelPreference },
      push: { ...defaultChannelPreference },
      marketingEnabled: true,
      transactionEnabled: true,
      securityEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deletePreferences(userId: string): Promise<boolean> {
    const result = await database.query(
      `DELETE FROM user_preferences WHERE user_id = $1`,
      [userId]
    );

    if (result.rowCount > 0) {
      await cacheService.invalidatePreferences(userId);
      return true;
    }

    return false;
  }
}

export const preferencesService = new PreferencesService();
export default preferencesService;
