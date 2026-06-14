// ReZ Schedule - Waiting List Service
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { notificationService } from './notificationService';

export class WaitingListService {
  /**
   * Add someone to the waiting list
   */
  async addToWaitingList(data: {
    eventTypeId: string;
    requestedStart: Date;
    requestedEnd: Date;
    email: string;
    name: string;
    phone?: string;
  }): Promise<{ position: number; waitingListId: string }> {
    // Get current position
    const currentCount = await prisma.waitingList.count({
      where: {
        eventTypeId: data.eventTypeId,
        status: 'waiting',
      },
    });

    const waitingList = await prisma.waitingList.create({
      data: {
        eventTypeId: data.eventTypeId,
        requestedStart: data.requestedStart,
        requestedEnd: data.requestedEnd,
        email: data.email,
        name: data.name,
        phone: data.phone,
        status: 'waiting',
        position: currentCount + 1,
      },
    });

    logger.info(`[WaitingList] Added ${data.email} to waiting list at position ${currentCount + 1}`);

    return {
      position: currentCount + 1,
      waitingListId: waitingList.id,
    };
  }

  /**
   * Remove from waiting list
   */
  async removeFromWaitingList(waitingListId: string): Promise<void> {
    const entry = await prisma.waitingList.findUnique({
      where: { id: waitingListId },
    });

    if (!entry) {
      throw new Error('Waiting list entry not found');
    }

    await prisma.waitingList.update({
      where: { id: waitingListId },
      data: { status: 'expired' },
    });

    // Reorder remaining entries
    await this.reorderWaitingList(entry.eventTypeId);

    logger.info(`[WaitingList] Removed entry ${waitingListId} from waiting list`);
  }

  /**
   * Get next in line when a slot becomes available
   */
  async getNextInLine(eventTypeId: string, requestedStart: Date, requestedEnd: Date): Promise<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    position: number;
  } | null> {
    // Find the first entry that matches the requested time range
    // In production, you'd have more sophisticated matching
    const entry = await prisma.waitingList.findFirst({
      where: {
        eventTypeId,
        status: 'waiting',
        requestedStart,
        requestedEnd,
      },
      orderBy: { position: 'asc' },
    });

    return entry ? {
      id: entry.id,
      email: entry.email,
      name: entry.name,
      phone: entry.phone,
      position: entry.position,
    } : null;
  }

  /**
   * Notify next person when slot becomes available
   */
  async notifyNextInLine(eventTypeId: string, availableStart: Date, availableEnd: Date): Promise<boolean> {
    const nextPerson = await this.getNextInLine(eventTypeId, availableStart, availableEnd);

    if (!nextPerson) {
      return false;
    }

    // Get event type for context
    const eventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId },
      include: { user: true },
    });

    if (!eventType) {
      return false;
    }

    // Update entry with notification time
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours to respond

    await prisma.waitingList.update({
      where: { id: nextPerson.id },
      data: {
        status: 'notified',
        notifiedAt: new Date(),
        expiresAt,
      },
    });

    // Send notification
    await notificationService.sendEmail({
      to: nextPerson.email,
      subject: `Slot Available: ${eventType.title}`,
      template: 'waiting_list_slot_available',
      data: {
        name: nextPerson.name,
        eventTitle: eventType.title,
        hostName: eventType.user.name,
        availableStart: availableStart.toISOString(),
        availableEnd: availableEnd.toISOString(),
        expiresAt: expiresAt.toISOString(),
        bookUrl: `${process.env.NEXT_PUBLIC_SCHEDULE_URL}/${eventType.user.username}/${eventType.slug}?slot=${availableStart.toISOString()}`,
      },
    });

    logger.info(`[WaitingList] Notified ${nextPerson.email} about available slot`);

    // Schedule expiration check
    setTimeout(async () => {
      await this.handleExpiration(nextPerson.id);
    }, 24 * 60 * 60 * 1000);

    return true;
  }

  /**
   * Handle waiting list entry expiration
   */
  async handleExpiration(waitingListId: string): Promise<void> {
    const entry = await prisma.waitingList.findUnique({
      where: { id: waitingListId },
    });

    if (!entry || entry.status !== 'notified') {
      return;
    }

    // Mark as expired
    await prisma.waitingList.update({
      where: { id: waitingListId },
      data: { status: 'expired' },
    });

    logger.info(`[WaitingList] Entry ${waitingListId} expired`);

    // Notify next person
    await this.notifyNextInLine(entry.eventTypeId, entry.requestedStart, entry.requestedEnd);
  }

  /**
   * Confirm booking from waiting list
   */
  async confirmFromWaitingList(
    waitingListId: string,
    bookingId: string
  ): Promise<void> {
    await prisma.waitingList.update({
      where: { id: waitingListId },
      data: { status: 'booked' },
    });

    // Reorder remaining entries
    const entry = await prisma.waitingList.findUnique({
      where: { id: waitingListId },
    });

    if (entry) {
      await this.reorderWaitingList(entry.eventTypeId);
    }

    logger.info(`[WaitingList] Entry ${waitingListId} confirmed with booking ${bookingId}`);
  }

  /**
   * Get waiting list position
   */
  async getPosition(waitingListId: string): Promise<number | null> {
    const entry = await prisma.waitingList.findUnique({
      where: { id: waitingListId },
    });

    if (!entry || entry.status !== 'waiting') {
      return null;
    }

    return entry.position;
  }

  /**
   * Get all waiting list entries for an event type
   */
  async getWaitingList(eventTypeId: string): Promise<{
    total: number;
    entries: {
      id: string;
      name: string;
      email: string;
      requestedStart: Date;
      requestedEnd: Date;
      position: number;
      status: string;
      createdAt: Date;
    }[];
  }> {
    const [entries, total] = await Promise.all([
      prisma.waitingList.findMany({
        where: { eventTypeId },
        orderBy: { position: 'asc' },
      }),
      prisma.waitingList.count({
        where: { eventTypeId, status: 'waiting' },
      }),
    ]);

    return {
      total,
      entries: entries.map(e => ({
        id: e.id,
        name: e.name,
        email: e.email,
        requestedStart: e.requestedStart,
        requestedEnd: e.requestedEnd,
        position: e.position,
        status: e.status,
        createdAt: e.createdAt,
      })),
    };
  }

  /**
   * Reorder waiting list positions after removal
   */
  private async reorderWaitingList(eventTypeId: string): Promise<void> {
    const entries = await prisma.waitingList.findMany({
      where: { eventTypeId, status: 'waiting' },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < entries.length; i++) {
      if (entries[i].position !== i + 1) {
        await prisma.waitingList.update({
          where: { id: entries[i].id },
          data: { position: i + 1 },
        });
      }
    }
  }

  /**
   * Process waiting list when a booking is cancelled
   */
  async processCancellation(eventTypeId: string, cancelledStart: Date, cancelledEnd: Date): Promise<void> {
    await this.notifyNextInLine(eventTypeId, cancelledStart, cancelledEnd);
  }
}

export const waitingListService = new WaitingListService();
export default waitingListService;
