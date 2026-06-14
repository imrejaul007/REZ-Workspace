import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import { Expiration, IExpiration, Rule, IRule, Notification, INotification } from '../models';
import { createServiceLogger } from '../utils/logger';

const logger = createServiceLogger('ExpirationService');

export class ExpirationService {
  private cronJob: cron.ScheduledTask | null = null;

  async createExpiration(data: {
    memberId: string;
    userId: string;
    companyId: string;
    pointsId: string;
    pointsAmount: number;
    earnedDate: Date;
    expirationMonths: number;
  }): Promise<IExpiration> {
    const expirationDate = new Date(data.earnedDate);
    expirationDate.setMonth(expirationDate.getMonth() + data.expirationMonths);

    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const expiration = new Expiration({
      expirationId: `exp_${uuidv4()}`,
      ...data,
      expirationDate,
      daysUntilExpiration,
      status: daysUntilExpiration <= 30 ? 'expiring_soon' : 'pending'
    });

    await expiration.save();
    logger.info('Expiration record created', { expirationId: expiration.expirationId, memberId: data.memberId });
    return expiration;
  }

  async getExpirationById(expirationId: string): Promise<IExpiration | null> {
    return Expiration.findOne({ expirationId });
  }

  async getExpirationsByMember(memberId: string): Promise<IExpiration[]> {
    return Expiration.find({ memberId }).sort({ expirationDate: 1 });
  }

  async getPendingExpirations(companyId?: string): Promise<IExpiration[]> {
    const query: Record<string, unknown> = {
      status: { $in: ['pending', 'expiring_soon'] },
      expirationDate: { $gt: new Date() }
    };
    if (companyId) {
      query['companyId'] = companyId;
    }
    return Expiration.find(query).sort({ expirationDate: 1 });
  }

  async getExpiringSoon(days: number = 30, companyId?: string): Promise<IExpiration[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const query: Record<string, unknown> = {
      status: 'pending',
      expirationDate: { $lte: cutoffDate, $gt: new Date() }
    };
    if (companyId) {
      query['companyId'] = companyId;
    }

    return Expiration.find(query).sort({ expirationDate: 1 });
  }

  async updateExpirationRules(expirationId: string, updates: Partial<IRule>): Promise<IRule | null> {
    const rule = await Rule.findOneAndUpdate({ ruleId: expirationId }, updates, { new: true });
    if (rule) {
      logger.info('Expiration rule updated', { ruleId: expirationId });
    }
    return rule;
  }

  async createRule(data: Partial<IRule>): Promise<IRule> {
    const ruleId = `rule_${uuidv4()}`;
    const rule = new Rule({ ...data, ruleId });
    await rule.save();
    logger.info('Expiration rule created', { ruleId, name: data.name });
    return rule;
  }

  async getDefaultRule(companyId?: string): Promise<IRule | null> {
    const query: Record<string, unknown> = { isActive: true };
    if (companyId) {
      query['$or'] = [{ companyId }, { companyId: { $exists: false } }];
    }
    return Rule.findOne(query).sort({ priority: -1 });
  }

  async processExpirations(): Promise<{ processed: number; expired: number; forgiven: number }> {
    const now = new Date();
    const result = { processed: 0, expired: 0, forgiven: 0 };

    // Find all expired but not yet processed
    const expiredRecords = await Expiration.find({
      status: { $in: ['pending', 'expiring_soon'] },
      expirationDate: { $lte: now }
    });

    for (const record of expiredRecords) {
      const rule = await this.getDefaultRule(record.companyId);

      if (rule?.autoForgive && record.pointsAmount <= (rule.maxForgiveAmount || 0)) {
        record.status = 'forgiven';
        record.forgivenBy = 'system';
        record.forgivenReason = 'Auto-forgiven per rule';
        result.forgiven++;
      } else {
        record.status = 'expired';
        record.expiredAt = now;
        result.expired++;
      }

      await record.save();
      result.processed++;

      // Send notification
      await this.sendExpirationNotification(record);
    }

    logger.info('Expiration processing complete', result);
    return result;
  }

  async sendExpirationNotification(expiration: IExpiration): Promise<INotification | null> {
    const notification = new Notification({
      notificationId: `notif_${uuidv4()}`,
      expirationId: expiration.expirationId,
      memberId: expiration.memberId,
      userId: expiration.userId,
      type: expiration.status === 'forgiven' ? 'forgiven' : 'expired',
      channel: 'in_app',
      title: expiration.status === 'forgiven'
        ? 'Points Forgiven'
        : 'Points Expired',
      message: expiration.status === 'forgiven'
        ? `Your ${expiration.pointsAmount} points have been forgiven.`
        : `Your ${expiration.pointsAmount} points have expired.`,
      pointsAmount: expiration.pointsAmount,
      daysUntilExpiration: 0
    });

    await notification.save();
    logger.info('Expiration notification sent', { notificationId: notification.notificationId });
    return notification;
  }

  async forgiveExpiration(expirationId: string, forgivenBy: string, reason: string): Promise<IExpiration | null> {
    const expiration = await Expiration.findOne({ expirationId });
    if (!expiration) return null;

    expiration.status = 'forgiven';
    expiration.forgivenBy = forgivenBy;
    expiration.forgivenReason = reason;
    await expiration.save();

    await this.sendExpirationNotification(expiration);
    logger.info('Expiration forgiven', { expirationId, forgivenBy, reason });
    return expiration;
  }

  async getExpirationStats(companyId?: string): Promise<{
    totalPending: number;
    totalExpiringSoon: number;
    totalExpired: number;
    totalForgiven: number;
    totalPointsExpiring: number;
    totalPointsExpired: number;
    upcomingExpirations: IExpiration[];
  }> {
    const query: Record<string, unknown> = {};
    if (companyId) {
      query['companyId'] = companyId;
    }

    const allExpirations = await Expiration.find(query);

    const stats = {
      totalPending: allExpirations.filter(e => e.status === 'pending').length,
      totalExpiringSoon: allExpirations.filter(e => e.status === 'expiring_soon').length,
      totalExpired: allExpirations.filter(e => e.status === 'expired').length,
      totalForgiven: allExpirations.filter(e => e.status === 'forgiven').length,
      totalPointsExpiring: allExpirations
        .filter(e => e.status === 'pending' || e.status === 'expiring_soon')
        .reduce((sum, e) => sum + e.pointsAmount, 0),
      totalPointsExpired: allExpirations
        .filter(e => e.status === 'expired')
        .reduce((sum, e) => sum + e.pointsAmount, 0),
      upcomingExpirations: await this.getExpiringSoon(7, companyId)
    };

    return stats;
  }

  startCronJob(): void {
    // Run every day at midnight
    this.cronJob = cron.schedule('0 0 * * *', async () => {
      logger.info('Running scheduled expiration processing');
      await this.processExpirations();
    });
    logger.info('Expiration cron job started');
  }

  stopCronJob(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Expiration cron job stopped');
    }
  }
}

export const expirationService = new ExpirationService();