import mongoose, { Types } from 'mongoose';
import { Waitlist, IWaitlistEntry } from '../models/Waitlist';
import { logger } from '../config/logger';

export interface WaitlistInput {
  storeId: string;
  customerId?: string;
  customerName: string;
  phone: string;
  partySize: number;
  quotedTime?: Date;
  notes?: string;
}

export class WaitlistService {
  /**
   * Add a customer to the waitlist
   */
  async addToWaitlist(data: WaitlistInput): Promise<IWaitlistEntry> {
    const storeId = new Types.ObjectId(data.storeId);

    // Get the next position for this store's waitlist
    const lastEntry = await Waitlist.findOne({ storeId, status: 'waiting' })
      .sort({ position: -1 })
      .lean();

    const position = lastEntry ? lastEntry.position + 1 : 1;

    const entry = new Waitlist({
      storeId,
      customerId: data.customerId,
      customerName: data.customerName,
      phone: data.phone,
      partySize: data.partySize,
      quotedTime: data.quotedTime,
      status: 'waiting',
      position,
      notes: data.notes,
    });

    await entry.save();

    logger.info('[Waitlist] Customer added to waitlist', {
      entryId: entry._id,
      storeId: data.storeId,
      customerName: data.customerName,
      position,
    });

    return entry;
  }

  /**
   * Get current position of a customer by phone number
   */
  async getPosition(phone: string): Promise<number | null> {
    const entry = await Waitlist.findOne({ phone, status: 'waiting' })
      .sort({ position: 1 })
      .lean();

    return entry ? entry.position : null;
  }

  /**
   * Get all waitlist entries for a store
   */
  async getWaitlist(storeId: string): Promise<IWaitlistEntry[]> {
    const entries = await Waitlist.find({
      storeId: new Types.ObjectId(storeId),
      status: 'waiting',
    })
      .sort({ position: 1 })
      .lean();

    return entries;
  }

  /**
   * Seat a customer from the waitlist
   */
  async seatCustomer(waitlistId: string): Promise<void> {
    const entry = await Waitlist.findById(waitlistId);
    if (!entry) {
      throw new Error('Waitlist entry not found');
    }

    if (entry.status !== 'waiting') {
      throw new Error('Customer is not in waiting status');
    }

    entry.status = 'seated';
    entry.actualTime = new Date();
    await entry.save();

    // Reorder positions for remaining waiting customers
    await Waitlist.updateMany(
      {
        storeId: entry.storeId,
        status: 'waiting',
        position: { $gt: entry.position },
      },
      { $inc: { position: -1 } },
    );

    logger.info('[Waitlist] Customer seated', {
      entryId: waitlistId,
      storeId: entry.storeId.toString(),
      customerName: entry.customerName,
    });
  }

  /**
   * Cancel a waitlist entry
   */
  async cancelEntry(waitlistId: string): Promise<void> {
    const entry = await Waitlist.findById(waitlistId);
    if (!entry) {
      throw new Error('Waitlist entry not found');
    }

    if (entry.status !== 'waiting') {
      throw new Error('Customer is not in waiting status');
    }

    const previousPosition = entry.position;
    entry.status = 'cancelled';
    await entry.save();

    // Reorder positions for remaining waiting customers
    await Waitlist.updateMany(
      {
        storeId: entry.storeId,
        status: 'waiting',
        position: { $gt: previousPosition },
      },
      { $inc: { position: -1 } },
    );

    logger.info('[Waitlist] Entry cancelled', {
      entryId: waitlistId,
      storeId: entry.storeId.toString(),
    });
  }

  /**
   * Mark a customer as no-show
   */
  async markNoShow(waitlistId: string): Promise<void> {
    const entry = await Waitlist.findById(waitlistId);
    if (!entry) {
      throw new Error('Waitlist entry not found');
    }

    if (entry.status !== 'waiting') {
      throw new Error('Customer is not in waiting status');
    }

    const previousPosition = entry.position;
    entry.status = 'no_show';
    await entry.save();

    // Reorder positions for remaining waiting customers
    await Waitlist.updateMany(
      {
        storeId: entry.storeId,
        status: 'waiting',
        position: { $gt: previousPosition },
      },
      { $inc: { position: -1 } },
    );

    logger.info('[Waitlist] Customer marked as no-show', {
      entryId: waitlistId,
      storeId: entry.storeId.toString(),
    });
  }

  /**
   * Get estimated wait time for a party size
   * This is a simplified estimation - in production, this could use historical data
   */
  async getEstimatedWait(storeId: string, partySize: number): Promise<number> {
    // Get current waiting count
    const waitingCount = await Waitlist.countDocuments({
      storeId: new Types.ObjectId(storeId),
      status: 'waiting',
    });

    // Simple estimation: assume ~15 minutes per party on average
    // Adjust based on party size (larger parties may take longer to seat)
    const avgMinutesPerParty = 15;
    const partySizeMultiplier = Math.ceil(partySize / 2);

    const estimatedMinutes = waitingCount * avgMinutesPerParty * partySizeMultiplier;

    return Math.max(0, estimatedMinutes);
  }

  /**
   * Notify the next customer in line
   */
  async notifyNext(storeId: string): Promise<void> {
    const nextEntry = await Waitlist.findOne({
      storeId: new Types.ObjectId(storeId),
      status: 'waiting',
    }).sort({ position: 1 });

    if (!nextEntry) {
      logger.info('[Waitlist] No customers to notify', { storeId });
      return;
    }

    logger.info('[Waitlist] Notifying next customer', {
      storeId,
      customerName: nextEntry.customerName,
      phone: nextEntry.phone,
      position: nextEntry.position,
    });

    // Send SMS notification via notification service
    const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004/api/notifications/send';
    const message = `Hi ${nextEntry.customerName}! Your table at position ${nextEntry.position} is almost ready. Please be nearby.`;

    try {
      const response = await fetch(notificationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'waitlist_notification',
          storeId,
          customerName: nextEntry.customerName,
          phone: nextEntry.phone,
          message,
          position: nextEntry.position,
          entryId: nextEntry._id.toString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Notification service error: ${response.status} - ${errorText}`);
      }

      logger.info('[Waitlist] Notification sent successfully', {
        storeId,
        entryId: nextEntry._id.toString(),
        phone: nextEntry.phone,
      });
    } catch (error) {
      // Log warning but don't fail - notification service may be unavailable
      logger.warn('[Waitlist] Failed to send notification, customer will be notified manually', {
        storeId,
        entryId: nextEntry._id.toString(),
        customerName: nextEntry.customerName,
        phone: nextEntry.phone,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Factory function
export function createWaitlistService(): WaitlistService {
  return new WaitlistService();
}
