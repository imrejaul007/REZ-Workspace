import { v4 as uuidv4 } from 'uuid';
import { WaitlistEntry, WaitlistEntryDocument } from '../models';
import { sendWaitlistNotification } from './notificationService';
import { createLogger } from '../utils/logger';
import { AddToWaitlistParams, WaitlistEntry as IWaitlistEntry, WaitlistStatus } from '../types';

const logger = createLogger('waitlist-service');

// Default expiry time for waitlist entries (24 hours)
const DEFAULT_EXPIRY_HOURS = 24;

// ============================================
// Add to Waitlist
// ============================================

export async function addToWaitlist(params: AddToWaitlistParams): Promise<IWaitlistEntry> {
  const {
    userId,
    vertical,
    merchantId,
    date,
    time,
    partySize,
    notificationEmail,
    notificationPhone,
  } = params;

  // Check if user is already on the waitlist for this merchant/date/time
  const existing = await WaitlistEntry.findOne({
    userId,
    merchantId,
    date,
    time: time || null,
    status: { $in: ['waiting', 'notified'] },
  });

  if (existing) {
    throw new Error('User is already on the waitlist for this slot');
  }

  // Create waitlist entry
  const entry = new WaitlistEntry({
    entryId: `WL-${uuidv4()}`,
    userId,
    vertical,
    merchantId,
    date,
    time,
    partySize,
    status: 'waiting',
    notificationEmail,
    notificationPhone,
    expiresAt: new Date(Date.now() + DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000),
  });

  await entry.save();

  logger.info('Added to waitlist', {
    entryId: entry.entryId,
    userId,
    merchantId,
    vertical,
    date,
    time,
    partySize,
  });

  return entry.toObject() as IWaitlistEntry;
}

// ============================================
// Get User Waitlist Entries
// ============================================

export async function getUserWaitlistEntries(
  userId: string,
  status?: string
): Promise<IWaitlistEntry[]> {
  const query: Record<string, unknown> = { userId };

  if (status) {
    query.status = status;
  }

  const entries = await WaitlistEntry.find(query).sort({ createdAt: -1 });
  return entries.map((e) => e.toObject() as IWaitlistEntry);
}

// ============================================
// Remove from Waitlist
// ============================================

export async function removeFromWaitlist(entryId: string): Promise<boolean> {
  const entry = await WaitlistEntry.findByEntryId(entryId);

  if (!entry) {
    return false;
  }

  entry.status = 'cancelled';
  await entry.save();

  logger.info('Removed from waitlist', {
    entryId,
    userId: entry.userId,
  });

  return true;
}

// ============================================
// Notify Waitlist Entry
// ============================================

export interface NotifyWaitlistResult {
  notified: boolean;
  notificationSent: boolean;
  entryId: string;
}

export async function notifyWaitlistEntry(entryId: string): Promise<NotifyWaitlistResult | null> {
  const entry = await WaitlistEntry.findByEntryId(entryId);

  if (!entry) {
    return null;
  }

  if (entry.status !== 'waiting') {
    logger.warn('Cannot notify entry - not in waiting status', {
      entryId,
      status: entry.status,
    });
    return { notified: false, notificationSent: false, entryId };
  }

  // Mark as notified and extend expiry
  entry.status = 'notified';
  entry.notifiedAt = new Date();
  entry.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes to book
  await entry.save();

  // Send notification
  try {
    await sendWaitlistNotification(entry, {});
  } catch (error) {
    logger.error('Failed to send waitlist notification', {
      entryId,
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }

  logger.info('Waitlist entry notified', {
    entryId,
    expiresAt: entry.expiresAt,
  });

  return { notified: true, notificationSent: true, entryId };
}

// ============================================
// Check Waitlist for Slot
// ============================================

export async function checkWaitlist(
  merchantId: string,
  date: string,
  time: string
): Promise<IWaitlistEntry[]> {
  const entries = await WaitlistEntry.findWaitingByMerchantDateTime(merchantId, date, time);
  return entries.map((e) => e.toObject() as IWaitlistEntry);
}

// ============================================
// Notify All Waitlist for Slot
// ============================================

export interface NotifySlotResult {
  notifiedCount: number;
  entries: IWaitlistEntry[];
}

export async function notifyWaitlistForSlot(
  merchantId: string,
  date: string,
  time: string,
  slotInfo: Record<string, unknown>
): Promise<NotifySlotResult> {
  const entries = await checkWaitlist(merchantId, date, time);

  let notifiedCount = 0;

  for (const entry of entries) {
    try {
      await notifyWaitlistEntry(entry.entryId);
      notifiedCount++;
    } catch (error) {
      logger.error('Failed to notify waitlist entry', {
        entryId: entry.entryId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  logger.info('Waitlist notifications sent', {
    merchantId,
    date,
    time,
    notifiedCount,
  });

  return { notifiedCount, entries };
}

// ============================================
// Expire Waitlist Entries
// ============================================

export async function expireWaitlistEntries(): Promise<number> {
  const expired = await WaitlistEntry.findExpiredEntries();

  let expiredCount = 0;

  for (const entry of expired) {
    try {
      entry.status = 'expired';
      await entry.save();
      expiredCount++;
    } catch (error) {
      logger.error('Failed to mark waitlist entry as expired', {
        entryId: entry.entryId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  logger.info('Expired waitlist entries', { count: expiredCount });

  return expiredCount;
}

// ============================================
// Get Merchant Waitlist Summary
// ============================================

export async function getMerchantWaitlistSummary(
  merchantId: string,
  date: string
): Promise<{
  total: number;
  byTime: Record<string, number>;
  byStatus: Record<WaitlistStatus, number>;
}> {
  const entries = await WaitlistEntry.findByMerchantAndDate(merchantId, date);

  const byTime: Record<string, number> = {};
  const byStatus: Record<WaitlistStatus, number> = {
    waiting: 0,
    notified: 0,
    booked: 0,
    expired: 0,
    cancelled: 0,
  };

  for (const entry of entries) {
    const timeKey = entry.time || 'unspecified';
    byTime[timeKey] = (byTime[timeKey] || 0) + 1;
    byStatus[entry.status] = (byStatus[entry.status] || 0) + 1;
  }

  return {
    total: entries.length,
    byTime,
    byStatus,
  };
}

export default {
  addToWaitlist,
  getUserWaitlistEntries,
  removeFromWaitlist,
  notifyWaitlistEntry,
  checkWaitlist,
  notifyWaitlistForSlot,
  expireWaitlistEntries,
  getMerchantWaitlistSummary,
};