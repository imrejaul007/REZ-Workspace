import { InboxSettings } from '../models';
import { InboxSettingsDocument } from '../models';
import { AssignmentRule, WorkingHours, SLASettings, NotificationSettings } from '../types';
import { createModuleLogger } from 'utils/logger.js';

const logger = createModuleLogger('SettingsService');

export class SettingsService {
  /**
   * Get or create settings for an account
   */
  async getOrCreateSettings(accountId: string): Promise<InboxSettingsDocument> {
    try {
      let settings = await InboxSettings.findOne({ accountId });

      if (!settings) {
        settings = new InboxSettings({ accountId });
        await settings.save();
        logger.info('Created default settings', { accountId });
      }

      return settings;
    } catch (error) {
      logger.error('Failed to get/create settings', { error, accountId });
      throw error;
    }
  }

  /**
   * Get settings for an account
   */
  async getSettings(accountId: string): Promise<InboxSettingsDocument | null> {
    return InboxSettings.findOne({ accountId });
  }

  /**
   * Update settings
   */
  async updateSettings(
    accountId: string,
    updates: Partial<{
      autoAssign: boolean;
      assignmentRules: AssignmentRule[];
      notificationSettings: NotificationSettings;
      workingHours: WorkingHours;
      slaSettings: SLASettings;
      sentimentThreshold: number;
    }>
  ): Promise<InboxSettingsDocument | null> {
    try {
      const settings = await InboxSettings.findOneAndUpdate(
        { accountId },
        { $set: updates },
        { new: true, upsert: true }
      );

      logger.info('Settings updated', { accountId, updates: Object.keys(updates) });
      return settings;
    } catch (error) {
      logger.error('Failed to update settings', { error, accountId });
      throw error;
    }
  }

  /**
   * Add assignment rule
   */
  async addAssignmentRule(
    accountId: string,
    rule: AssignmentRule
  ): Promise<InboxSettingsDocument | null> {
    try {
      const settings = await InboxSettings.findOneAndUpdate(
        { accountId },
        { $push: { assignmentRules: rule } },
        { new: true, upsert: true }
      );

      logger.info('Assignment rule added', { accountId, ruleId: rule.id });
      return settings;
    } catch (error) {
      logger.error('Failed to add assignment rule', { error, accountId });
      throw error;
    }
  }

  /**
   * Remove assignment rule
   */
  async removeAssignmentRule(
    accountId: string,
    ruleId: string
  ): Promise<InboxSettingsDocument | null> {
    try {
      const settings = await InboxSettings.findOneAndUpdate(
        { accountId },
        { $pull: { assignmentRules: { id: ruleId } } },
        { new: true }
      );

      logger.info('Assignment rule removed', { accountId, ruleId });
      return settings;
    } catch (error) {
      logger.error('Failed to remove assignment rule', { error, accountId, ruleId });
      throw error;
    }
  }

  /**
   * Get assignment rule for keyword
   */
  async getAssignmentForKeyword(
    accountId: string,
    keyword: string
  ): Promise<AssignmentRule | null> {
    try {
      const settings = await InboxSettings.findOne({ accountId });
      if (!settings) return null;

      // Find first matching rule (case-insensitive)
      const lowerKeyword = keyword.toLowerCase();
      return settings.assignmentRules.find(rule =>
        lowerKeyword.includes(rule.keyword.toLowerCase())
      ) || null;
    } catch (error) {
      logger.error('Failed to get assignment for keyword', { error, accountId, keyword });
      throw error;
    }
  }

  /**
   * Check if within working hours
   */
  isWithinWorkingHours(settings: InboxSettingsDocument): boolean {
    if (!settings.workingHours.enabled) return true;

    const now = new Date();
    const localHour = now.getHours();
    const localDay = now.getDay();

    // Check if it's a day off
    if (settings.workingHours.daysOff.includes(localDay)) {
      return false;
    }

    // Check if within hours
    return (
      localHour >= settings.workingHours.startHour &&
      localHour < settings.workingHours.endHour
    );
  }

  /**
   * Get SLA status for conversation
   */
  getSLAStatus(
    settings: InboxSettingsDocument,
    createdAt: Date,
    firstResponseAt?: Date,
    resolvedAt?: Date
  ): {
    status: 'on_track' | 'at_risk' | 'breached';
    firstResponseRemaining?: number;
    resolutionRemaining?: number;
  } {
    const now = new Date();
    const sla = settings.slaSettings;

    // If resolved, check resolution SLA
    if (resolvedAt) {
      const resolutionTime = (resolvedAt.getTime() - createdAt.getTime()) / 1000;
      return {
        status: resolutionTime > sla.resolutionTime ? 'breached' : 'on_track',
        resolutionRemaining: 0,
      };
    }

    // Check first response SLA
    if (firstResponseAt) {
      const responseTime = (firstResponseAt.getTime() - createdAt.getTime()) / 1000;
      const remaining = sla.resolutionTime - responseTime;
      const threshold = remaining / sla.resolutionTime;

      return {
        status: threshold < (1 - sla.warningThreshold) ? 'at_risk' : 'on_track',
        resolutionRemaining: remaining,
      };
    }

    // No response yet - check first response SLA
    const elapsed = (now.getTime() - createdAt.getTime()) / 1000;
    const remaining = sla.firstResponseTime - elapsed;
    const threshold = remaining / sla.firstResponseTime;

    if (remaining <= 0) {
      return { status: 'breached', firstResponseRemaining: 0 };
    }

    if (threshold < (1 - sla.warningThreshold)) {
      return { status: 'at_risk', firstResponseRemaining: remaining };
    }

    return { status: 'on_track', firstResponseRemaining: remaining };
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(accountId: string): Promise<InboxSettingsDocument> {
    try {
      const settings = await InboxSettings.findOneAndUpdate(
        { accountId },
        {
          $set: {
            autoAssign: false,
            assignmentRules: [],
            notificationSettings: { email: true, push: true, slack: false },
            workingHours: {
              enabled: false,
              timezone: 'Asia/Kolkata',
              startHour: 9,
              endHour: 18,
              daysOff: [0, 6],
            },
            slaSettings: {
              firstResponseTime: 300,
              resolutionTime: 3600,
              warningThreshold: 0.8,
            },
            sentimentThreshold: 0.5,
          },
        },
        { new: true, upsert: true }
      );

      logger.info('Settings reset to defaults', { accountId });
      return settings;
    } catch (error) {
      logger.error('Failed to reset settings', { error, accountId });
      throw error;
    }
  }
}
