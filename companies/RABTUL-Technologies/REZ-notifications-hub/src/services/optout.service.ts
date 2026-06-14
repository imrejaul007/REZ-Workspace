import { v4 as uuidv4 } from 'uuid';
import { database } from './database';
import { cacheService } from './cache';
import { OptOutRecord, GlobalOptOut, NotificationChannel } from '../types';
import { OptOutInput, GlobalOptOutInput } from '../utils/validators';
import logger from '../utils/logger';

// Bounce tracking constants
const BOUNCE_THRESHOLD = 0.05; // 5% bounce rate triggers auto-optout
const SOFT_BOUNCE_THRESHOLD = 0.02; // 2% triggers warning
const BOUNCE_WINDOW_DAYS = 30; // 30 day rolling window for bounce tracking

export class OptOutService {
  async optOut(input: OptOutInput): Promise<OptOutRecord> {
    const { userId, channel, reason } = input;

    // Check if already opted out
    const existing = await this.isOptedOut(userId, channel);
    if (existing) {
      const record = await this.getOptOutRecord(userId, channel);
      if (record) return record;
    }

    const record: OptOutRecord = {
      id: uuidv4(),
      userId,
      channel,
      reason,
      optedOutAt: new Date(),
      source: 'user_request',
    };

    await database.query(
      `INSERT INTO opt_outs (id, user_id, channel, reason, source)
       VALUES ($1, $2, $3, $4, $5)`,
      [record.id, record.userId, record.channel, record.reason, record.source]
    );

    // Cache the opt-out status
    await cacheService.cacheOptOut(userId, channel, 86400 * 30); // 30 days

    logger.info('User opted out', { userId, channel, reason });

    return record;
  }

  async optIn(userId: string, channel: NotificationChannel): Promise<boolean> {
    const result = await database.query(
      `DELETE FROM opt_outs WHERE user_id = $1 AND channel = $2 AND source = 'user_request'`,
      [userId, channel]
    );

    if (result.rowCount > 0) {
      logger.info('User opted back in', { userId, channel });
      return true;
    }

    return false;
  }

  async isOptedOut(
    userId: string,
    channel: NotificationChannel
  ): Promise<boolean> {
    // Check cache first
    const cached = await cacheService.isOptedOut(userId, channel);
    if (cached) {
      return true;
    }

    // Check database
    const result = await database.query(
      `SELECT 1 FROM opt_outs WHERE user_id = $1 AND channel = $2`,
      [userId, channel]
    );

    const isOptedOut = result.rows.length > 0;

    // Cache result if opted out
    if (isOptedOut) {
      await cacheService.cacheOptOut(userId, channel);
    }

    return isOptedOut;
  }

  async getOptOutRecord(
    userId: string,
    channel: NotificationChannel
  ): Promise<OptOutRecord | null> {
    const result = await database.query<OptOutRecord>(
      `SELECT * FROM opt_outs WHERE user_id = $1 AND channel = $2`,
      [userId, channel]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      id: result.rows[0].id as string,
      userId: result.rows[0].user_id as string,
      channel: result.rows[0].channel as NotificationChannel,
      reason: result.rows[0].reason as string | undefined,
      optedOutAt: new Date(result.rows[0].opted_out_at as string),
      source: result.rows[0].source as 'user_request' | 'bounce' | 'complaint' | 'system',
    };
  }

  async getUserOptOuts(userId: string): Promise<OptOutRecord[]> {
    const result = await database.query(
      `SELECT * FROM opt_outs WHERE user_id = $1 ORDER BY opted_out_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      channel: row.channel as NotificationChannel,
      reason: row.reason as string | undefined,
      optedOutAt: new Date(row.opted_out_at as string),
      source: row.source as 'user_request' | 'bounce' | 'complaint' | 'system',
    }));
  }

  // Global opt-out methods (for email/phone based unsubscribes)
  async globalOptOut(input: GlobalOptOutInput): Promise<GlobalOptOut> {
    const { userId, email, phone, reason } = input;

    const record: GlobalOptOut = {
      userId,
      email,
      phone,
      optedOutAt: new Date(),
      reason,
    };

    await database.query(
      `INSERT INTO global_opt_outs (user_id, email, phone, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         email = COALESCE($2, global_opt_outs.email),
         phone = COALESCE($3, global_opt_outs.phone),
         reason = $4,
         opted_out_at = NOW()`,
      [userId, email, phone, reason]
    );

    logger.info('Global opt-out registered', { userId, email, phone });

    return record;
  }

  async isGloballyOptedOut(email?: string, phone?: string): Promise<boolean> {
    if (!email && !phone) {
      return false;
    }

    // Use parameterized queries with explicit conditions
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (email) {
      params.push(email);
      conditions.push(`email = $${params.length}`);
    }

    if (phone) {
      params.push(phone);
      conditions.push(`phone = $${params.length}`);
    }

    if (conditions.length === 0) {
      return false;
    }

    const query = `SELECT 1 FROM global_opt_outs WHERE ${conditions.join(' OR ')} LIMIT 1`;
    const result = await database.query(query, params);
    return result.rows.length > 0;
  }

  async getGlobalOptOut(
    email?: string,
    phone?: string
  ): Promise<GlobalOptOut | null> {
    if (!email && !phone) {
      return null;
    }

    // Use parameterized queries with explicit conditions
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (email) {
      params.push(email);
      conditions.push(`email = $${params.length}`);
    }

    if (phone) {
      params.push(phone);
      conditions.push(`phone = $${params.length}`);
    }

    if (conditions.length === 0) {
      return null;
    }

    const query = `SELECT * FROM global_opt_outs WHERE ${conditions.join(' OR ')} LIMIT 1`;
    const result = await database.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      userId: row.user_id as string,
      email: row.email as string | undefined,
      phone: row.phone as string | undefined,
      optedOutAt: new Date(row.opted_out_at as string),
      reason: row.reason as string | undefined,
    };
  }

  // System-initiated opt-outs (for bounces/complaints)
  async systemOptOut(
    userId: string,
    channel: NotificationChannel,
    source: 'bounce' | 'complaint',
    reason?: string
  ): Promise<OptOutRecord> {
    const record: OptOutRecord = {
      id: uuidv4(),
      userId,
      channel,
      reason,
      optedOutAt: new Date(),
      source,
    };

    // Delete existing user opt-outs for this channel first
    await database.query(
      `DELETE FROM opt_outs WHERE user_id = $1 AND channel = $2`,
      [userId, channel]
    );

    // Insert new system opt-out
    await database.query(
      `INSERT INTO opt_outs (id, user_id, channel, reason, source)
       VALUES ($1, $2, $3, $4, $5)`,
      [record.id, record.userId, record.channel, record.reason, record.source]
    );

    // Cache the opt-out
    await cacheService.cacheOptOut(userId, channel, 86400 * 30);

    logger.info('System-initiated opt-out', { userId, channel, source, reason });

    return record;
  }

  // Bounce tracking methods
  async trackBounce(address: string, bounceType: 'hard' | 'soft'): Promise<void> {
    const bounceId = uuidv4();
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - BOUNCE_WINDOW_DAYS);

    // Insert bounce record with timestamp
    await database.query(
      `INSERT INTO notification_bounces (id, address, bounce_type, campaign_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [bounceId, address, bounceType, null]
    );

    // Count bounces for this address in the rolling window
    const countResult = await database.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM notification_bounces
       WHERE address = $1 AND created_at >= $2`,
      [address, windowStart]
    );

    const bounceCount = parseInt(countResult.rows[0]?.count ?? '0', 10);

    if (bounceType === 'hard' || bounceCount >= 2) {
      // Hard bounce = immediate unsubscribe
      // Also auto-optout on 2+ soft bounces
      await this.systemOptOut(address, 'email', 'bounce',
        `${bounceType === 'hard' ? 'Hard' : 'Multiple'} bounce detected (${bounceCount} total)`
      );
      logger.info('[Bounce] Auto unsubscribed', {
        address,
        bounceType,
        totalBounces: bounceCount
      });
    } else {
      logger.warn('[Bounce] Recorded bounce', {
        address,
        bounceType,
        totalBounces: bounceCount
      });
    }
  }

  async checkBounceRate(
    campaignId: string,
    sentCount: number,
    bounceCount: number
  ): Promise<void> {
    if (sentCount === 0) return;

    const bounceRate = bounceCount / sentCount;

    if (bounceRate > BOUNCE_THRESHOLD) {
      logger.error('[Bounce] High bounce rate alert', {
        campaignId,
        bounceRate: (bounceRate * 100).toFixed(2) + '%',
        sent: sentCount,
        bounces: bounceCount
      });

      // Get list of bounced addresses and unsubscribe them
      const bouncedAddresses = await this.getBouncedAddresses(campaignId);
      for (const address of bouncedAddresses) {
        await this.systemOptOut(
          address,
          'email',
          'bounce',
          `High bounce rate (${(bounceRate * 100).toFixed(1)}%)`
        );
      }
    } else if (bounceRate > SOFT_BOUNCE_THRESHOLD) {
      logger.warn('[Bounce] Elevated bounce rate', {
        campaignId,
        bounceRate: (bounceRate * 100).toFixed(2) + '%'
      });
    }
  }

  async getBouncedAddresses(campaignId: string): Promise<string[]> {
    const result = await database.query<{ address: string }>(
      `SELECT DISTINCT address FROM notification_bounces
       WHERE campaign_id = $1`,
      [campaignId]
    );

    return result.rows.map(row => row.address);
  }

  async getAddressBounceCount(address: string): Promise<{
    hard: number;
    soft: number;
    total: number;
  }> {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - BOUNCE_WINDOW_DAYS);

    const result = await database.query<{
      bounce_type: string;
      count: string;
    }>(
      `SELECT bounce_type, COUNT(*) as count
       FROM notification_bounces
       WHERE address = $1 AND created_at >= $2
       GROUP BY bounce_type`,
      [address, windowStart]
    );

    let hard = 0;
    let soft = 0;

    for (const row of result.rows) {
      if (row.bounce_type === 'hard') {
        hard = parseInt(row.count, 10);
      } else if (row.bounce_type === 'soft') {
        soft = parseInt(row.count, 10);
      }
    }

    return { hard, soft, total: hard + soft };
  }

  // Cleanup expired opt-outs (can be run as a scheduled job)
  async cleanupExpiredOptOuts(daysOld: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await database.query(
      `DELETE FROM opt_outs
       WHERE source = 'user_request'
       AND opted_out_at < $1`,
      [cutoffDate]
    );

    if (result.rowCount > 0) {
      logger.info('Cleaned up expired opt-outs', {
        count: result.rowCount,
        cutoffDate: cutoffDate.toISOString(),
      });
    }

    return result.rowCount;
  }
}

export const optOutService = new OptOutService();
export default optOutService;
