import { CalendarSettings, ICalendarSettings, DefaultViewType } from '../models/index.js';
import { platformColors } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface UpdateSettingsInput {
  defaultView?: DefaultViewType;
  workingHours?: { start: string; end: string };
  blackoutDates?: Date[];
  colorScheme?: Record<string, string>;
}

export class SettingsService {
  async getSettings(userId: string): Promise<ICalendarSettings> {
    let settings = await CalendarSettings.findOne({ userId });

    if (!settings) {
      settings = await this.createDefaultSettings(userId);
    }

    return settings.toJSON() as ICalendarSettings;
  }

  async updateSettings(userId: string, input: UpdateSettingsInput): Promise<ICalendarSettings> {
    let settings = await CalendarSettings.findOne({ userId });

    if (!settings) {
      settings = await this.createDefaultSettings(userId);
    }

    if (input.defaultView) {
      settings.defaultView = input.defaultView;
    }

    if (input.workingHours) {
      settings.workingHours = input.workingHours;
    }

    if (input.blackoutDates !== undefined) {
      settings.blackoutDates = input.blackoutDates;
    }

    if (input.colorScheme) {
      for (const [platform, color] of Object.entries(input.colorScheme)) {
        settings.colorScheme.set(platform, color);
      }
    }

    await settings.save();
    logger.info('Settings updated', { userId });

    return settings.toJSON() as ICalendarSettings;
  }

  async addBlackoutDate(userId: string, date: Date): Promise<ICalendarSettings> {
    const settings = await this.getSettings(userId);

    if (!settings.blackoutDates.some(d => d.getTime() === date.getTime())) {
      settings.blackoutDates.push(date);
      await CalendarSettings.updateOne(
        { userId },
        { $push: { blackoutDates: date } }
      );
    }

    return settings;
  }

  async removeBlackoutDate(userId: string, date: Date): Promise<ICalendarSettings> {
    await CalendarSettings.updateOne(
      { userId },
      { $pull: { blackoutDates: date } }
    );

    return this.getSettings(userId);
  }

  async updatePlatformColor(userId: string, platform: string, color: string): Promise<ICalendarSettings> {
    const settings = await this.getSettings(userId);

    if (!settings.colorScheme) {
      settings.colorScheme = new Map();
    }

    settings.colorScheme.set(platform, color);

    await CalendarSettings.updateOne(
      { userId },
      { $set: { colorScheme: Object.fromEntries(settings.colorScheme) } }
    );

    return settings;
  }

  async isBlackoutDate(date: Date, userId: string): Promise<boolean> {
    const settings = await this.getSettings(userId);
    return settings.blackoutDates.some(d => d.getTime() === date.getTime());
  }

  async resetToDefaults(userId: string): Promise<ICalendarSettings> {
    const defaultColorScheme: Record<string, string> = {};
    for (const [platform, color] of Object.entries(platformColors)) {
      defaultColorScheme[platform] = color;
    }

    await CalendarSettings.updateOne(
      { userId },
      {
        $set: {
          defaultView: 'month',
          workingHours: { start: '09:00', end: '18:00' },
          blackoutDates: [],
          colorScheme: defaultColorScheme,
        },
      }
    );

    return this.getSettings(userId);
  }

  private async createDefaultSettings(userId: string): Promise<CalendarSettings> {
    const defaultColorScheme: Record<string, string> = {};
    for (const [platform, color] of Object.entries(platformColors)) {
      defaultColorScheme[platform] = color;
    }

    const settings = new CalendarSettings({
      userId,
      defaultView: 'month',
      workingHours: { start: '09:00', end: '18:00' },
      blackoutDates: [],
      colorScheme: defaultColorScheme,
    });

    await settings.save();
    logger.info('Default settings created', { userId });

    return settings;
  }
}

export const settingsService = new SettingsService();