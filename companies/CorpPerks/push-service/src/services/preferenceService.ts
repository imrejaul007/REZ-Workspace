import { v4 as uuidv4 } from 'uuid';
import { NotificationPreference, INotificationPreference, IChannelPreference, ITypePreference } from '../models';

// ==================== TYPES ====================

export interface UpdatePreferencesInput {
  globalEnabled?: boolean;
  channels?: Partial<IChannelPreference>[];
  typePreferences?: ITypePreference[];
  notificationSummary?: 'instant' | 'hourly' | 'daily' | 'weekly' | 'off';
  doNotDisturbUntil?: Date;
  modifiedBy?: string;
}

export interface GetPreferencesInput {
  userId: string;
  companyId: string;
  createIfNotExists?: boolean;
}

/**
 * Preference Service - Manage user notification preferences
 */
export class PreferenceService {
  /**
   * Get user preferences
   */
  async getPreferences(
    userId: string,
    companyId: string
  ): Promise<INotificationPreference | null> {
    return NotificationPreference.findOne({ userId, companyId }).lean() as Promise<INotificationPreference | null>;
  }

  /**
   * Get or create user preferences
   */
  async getOrCreatePreferences(input: GetPreferencesInput): Promise<INotificationPreference> {
    const { userId, companyId, createIfNotExists = true } = input;

    let preferences = await this.getPreferences(userId, companyId);

    if (!preferences && createIfNotExists) {
      const newPrefs = new NotificationPreference({
        preferenceId: `pref_${uuidv4()}`,
        userId,
        companyId,
      });
      await newPrefs.save();
      preferences = newPrefs;
    }

    return preferences as INotificationPreference;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    companyId: string,
    input: UpdatePreferencesInput
  ): Promise<INotificationPreference | null> {
    const updateData: Record<string, unknown> = {};

    if (input.globalEnabled !== undefined) {
      updateData.globalEnabled = input.globalEnabled;
    }

    if (input.notificationSummary !== undefined) {
      updateData.notificationSummary = input.notificationSummary;
    }

    if (input.doNotDisturbUntil !== undefined) {
      updateData.doNotDisturbUntil = input.doNotDisturbUntil;
    }

    if (input.channels) {
      // Merge channel updates with existing
      const existing = await this.getPreferences(userId, companyId);
      if (existing) {
        const updatedChannels = [...existing.channels];
        for (const channelUpdate of input.channels) {
          const index = updatedChannels.findIndex(
            (c) => c.channel === channelUpdate.channel
          );
          if (index >= 0) {
            updatedChannels[index] = { ...updatedChannels[index], ...channelUpdate };
          } else {
            updatedChannels.push(channelUpdate as IChannelPreference);
          }
        }
        updateData.channels = updatedChannels;
      }
    }

    if (input.typePreferences) {
      // Merge type preferences
      const existing = await this.getPreferences(userId, companyId);
      if (existing) {
        const typePrefMap = new Map(
          existing.typePreferences.map((tp) => [tp.type, tp])
        );
        for (const typePref of input.typePreferences) {
          const existingType = typePrefMap.get(typePref.type);
          if (existingType) {
            typePrefMap.set(typePref.type, { ...existingType, ...typePref });
          } else {
            typePrefMap.set(typePref.type, typePref);
          }
        }
        updateData.typePreferences = Array.from(typePrefMap.values());
      }
    }

    updateData.lastModifiedBy = input.modifiedBy || userId;

    const updated = await NotificationPreference.findOneAndUpdate(
      { userId, companyId },
      { $set: updateData },
      { new: true }
    );

    return updated as INotificationPreference | null;
  }

  /**
   * Enable/disable channel for user
   */
  async toggleChannel(
    userId: string,
    companyId: string,
    channel: 'push' | 'in_app' | 'email' | 'sms',
    enabled: boolean
  ): Promise<INotificationPreference | null> {
    const preferences = await this.getOrCreatePreferences({ userId, companyId });

    const channelIndex = preferences.channels.findIndex((c) => c.channel === channel);
    if (channelIndex >= 0) {
      preferences.channels[channelIndex].enabled = enabled;
    }

    preferences.lastModifiedBy = userId;
    await preferences.save();

    return preferences;
  }

  /**
   * Enable/disable notification type
   */
  async toggleType(
    userId: string,
    companyId: string,
    type: string,
    enabled: boolean,
    channels?: ('push' | 'in_app' | 'email' | 'sms')[]
  ): Promise<INotificationPreference | null> {
    const preferences = await this.getOrCreatePreferences({ userId, companyId });

    const typeIndex = preferences.typePreferences.findIndex(
      (tp) => tp.type === type
    );
    if (typeIndex >= 0) {
      preferences.typePreferences[typeIndex].enabled = enabled;
      if (channels) {
        preferences.typePreferences[typeIndex].channels = channels;
      }
    } else {
      preferences.typePreferences.push({
        type,
        enabled,
        channels: channels || ['push', 'in_app'],
      });
    }

    preferences.lastModifiedBy = userId;
    await preferences.save();

    return preferences;
  }

  /**
   * Set quiet hours
   */
  async setQuietHours(
    userId: string,
    companyId: string,
    channel: 'push' | 'in_app' | 'email' | 'sms',
    enabled: boolean,
    start?: string,
    end?: string
  ): Promise<INotificationPreference | null> {
    const preferences = await this.getOrCreatePreferences({ userId, companyId });

    const channelIndex = preferences.channels.findIndex((c) => c.channel === channel);
    if (channelIndex >= 0) {
      preferences.channels[channelIndex].quietHoursEnabled = enabled;
      if (start) preferences.channels[channelIndex].quietHoursStart = start;
      if (end) preferences.channels[channelIndex].quietHoursEnd = end;
    }

    preferences.lastModifiedBy = userId;
    await preferences.save();

    return preferences;
  }

  /**
   * Register device token
   */
  async registerDeviceToken(
    userId: string,
    companyId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceId?: string,
    deviceName?: string
  ): Promise<INotificationPreference | null> {
    const preferences = await this.getOrCreatePreferences({ userId, companyId });

    const pushChannel = preferences.channels.find((c) => c.channel === 'push');
    if (pushChannel) {
      if (!pushChannel.deviceTokens) {
        pushChannel.deviceTokens = [];
      }

      // Remove old token if exists
      pushChannel.deviceTokens = pushChannel.deviceTokens.filter((t) => t !== token);
      // Add new token
      pushChannel.deviceTokens.push(token);
    }

    preferences.lastModifiedBy = userId;
    await preferences.save();

    return preferences;
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(
    userId: string,
    companyId: string,
    token: string
  ): Promise<INotificationPreference | null> {
    const preferences = await this.getPreferences(userId, companyId);
    if (!preferences) return null;

    for (const channel of preferences.channels) {
      if (channel.deviceTokens) {
        channel.deviceTokens = channel.deviceTokens.filter((t) => t !== token);
      }
    }

    preferences.lastModifiedBy = userId;
    await preferences.save();

    return preferences;
  }

  /**
   * Reset preferences to defaults
   */
  async resetToDefaults(userId: string, companyId: string): Promise<INotificationPreference | null> {
    const newPrefs = new NotificationPreference({
      preferenceId: `pref_${uuidv4()}`,
      userId,
      companyId,
    });
    await newPrefs.save();

    // Delete old preferences
    await NotificationPreference.deleteOne({ userId, companyId, preferenceId: { $ne: newPrefs.preferenceId } });

    return newPrefs;
  }

  /**
   * Check if user can receive notification type on channel
   */
  async canReceive(
    userId: string,
    companyId: string,
    type: string,
    channel: 'push' | 'in_app' | 'email' | 'sms'
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId, companyId);

    // Default to allowing if no preferences set
    if (!preferences) return true;

    // Check global enabled
    if (!preferences.globalEnabled) return false;

    // Check channel enabled
    const channelPref = preferences.channels.find((c) => c.channel === channel);
    if (channelPref && !channelPref.enabled) return false;

    // Check type preferences
    const typePref = preferences.typePreferences.find((tp) => tp.type === type);
    if (typePref) {
      if (!typePref.enabled) return false;
      if (typePref.channels && !typePref.channels.includes(channel)) return false;
    }

    return true;
  }

  /**
   * Set do not disturb
   */
  async setDoNotDisturb(
    userId: string,
    companyId: string,
    until: Date
  ): Promise<INotificationPreference | null> {
    return this.updatePreferences(userId, companyId, {
      doNotDisturbUntil: until,
      modifiedBy: userId,
    });
  }
}

// Export singleton instance
export const notificationPreferenceService = new PreferenceService();
