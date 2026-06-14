import { Event, EventStatus, Vendor, Guest, Ticket, VendorStatus } from '../models';
import logger from '../utils/logger';

export interface EventSummary {
  eventId: string;
  name: string;
  type: string;
  status: EventStatus;
  startDate: Date;
  endDate: Date;
  expectedGuests: number;
  confirmedGuests: number;
  budget: number;
  spent: number;
  vendorsBooked: number;
  ticketsSold: number;
  ticketRevenue: number;
}

export interface EventCoordinationResult {
  success: boolean;
  event?: EventSummary;
  message: string;
  details?: Record<string, unknown>;
}

export class EventCoordinatorService {
  /**
   * Get comprehensive event summary with all related data
   */
  async getEventSummary(eventId: string): Promise<EventSummary> {
    const event = await Event.findOne({ eventId });
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    const [vendors, guests, tickets] = await Promise.all([
      Vendor.find({ eventId }),
      Guest.find({ eventId }),
      Ticket.find({ eventId })
    ]);

    const vendorsBooked = vendors.filter(v =>
      v.status === VendorStatus.BOOKED || v.status === VendorStatus.CONTRACTED
    ).length;

    const ticketsSold = tickets.reduce((sum, t) => sum + t.soldQty, 0);
    const ticketRevenue = tickets.reduce((sum, t) => sum + t.soldQty * t.price, 0);

    const confirmedGuests = guests.filter(g =>
      g.status === 'CONFIRMED' || g.status === 'ATTENDED'
    ).length;

    return {
      eventId: event.eventId,
      name: event.name,
      type: event.type,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate,
      expectedGuests: event.expectedGuests,
      confirmedGuests,
      budget: event.budget,
      spent: event.spent,
      vendorsBooked,
      ticketsSold,
      ticketRevenue
    };
  }

  /**
   * Get upcoming events for a merchant
   */
  async getUpcomingEvents(merchantId: string, daysAhead: number = 30): Promise<Event[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return Event.find({
      merchantId,
      startDate: { $lte: futureDate },
      status: { $nin: [EventStatus.COMPLETED, EventStatus.CANCELLED] }
    }).sort({ startDate: 1 });
  }

  /**
   * Get events needing attention (low guest confirmation, budget concerns)
   */
  async getEventsNeedingAttention(merchantId: string): Promise<{
    lowConfirmation: Event[];
    budgetExceeded: Event[];
    upcomingToday: Event[];
  }> {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const allEvents = await Event.find({
      merchantId,
      status: { $nin: [EventStatus.COMPLETED, EventStatus.CANCELLED] }
    });

    const lowConfirmation: Event[] = [];
    const budgetExceeded: Event[] = [];
    const upcomingToday: Event[] = [];

    for (const event of allEvents) {
      // Low guest confirmation (less than 50% confirmed)
      if (event.expectedGuests > 0) {
        const confirmationRate = event.confirmedGuests / event.expectedGuests;
        if (confirmationRate < 0.5 && event.startDate > now) {
          lowConfirmation.push(event);
        }
      }

      // Budget exceeded or over 90%
      if (event.budget > 0 && event.spent > event.budget * 0.9) {
        budgetExceeded.push(event);
      }

      // Events starting today
      if (event.startDate >= startOfDay && event.startDate <= endOfDay) {
        upcomingToday.push(event);
      }
    }

    return { lowConfirmation, budgetExceeded, upcomingToday };
  }

  /**
   * Coordinate event status transition
   */
  async transitionEventStatus(
    eventId: string,
    newStatus: EventStatus
  ): Promise<EventCoordinationResult> {
    const event = await Event.findOne({ eventId });
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    const oldStatus = event.status;

    // Validate status transitions
    const validTransitions: Record<EventStatus, EventStatus[]> = {
      [EventStatus.PLANNING]: [EventStatus.CONFIRMED, EventStatus.CANCELLED],
      [EventStatus.CONFIRMED]: [EventStatus.IN_PROGRESS, EventStatus.CANCELLED],
      [EventStatus.IN_PROGRESS]: [EventStatus.COMPLETED, EventStatus.CANCELLED],
      [EventStatus.COMPLETED]: [],
      [EventStatus.CANCELLED]: []
    };

    if (!validTransitions[oldStatus].includes(newStatus)) {
      return {
        success: false,
        message: `Cannot transition from ${oldStatus} to ${newStatus}`
      };
    }

    // Update event status
    await Event.findOneAndUpdate(
      { eventId },
      { $set: { status: newStatus } }
    );

    logger.info(`Event ${eventId} status transitioned from ${oldStatus} to ${newStatus}`);

    const summary = await this.getEventSummary(eventId);

    return {
      success: true,
      event: summary,
      message: `Event status updated from ${oldStatus} to ${newStatus}`,
      details: { previousStatus: oldStatus, newStatus }
    };
  }

  /**
   * Get event timeline with milestones
   */
  async getEventTimeline(eventId: string): Promise<{
    milestones: Array<{
      name: string;
      status: 'pending' | 'in_progress' | 'completed';
      dueDate?: Date;
      completedAt?: Date;
    }>;
    countdown: {
      daysUntilStart: number;
      daysUntilEnd: number;
    };
    criticalPath: string[];
  }> {
    const event = await Event.findOne({ eventId });
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    const now = new Date();
    const daysUntilStart = Math.ceil(
      (event.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUntilEnd = Math.ceil(
      (event.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Define milestones
    const milestones = [
      {
        name: 'Planning',
        status: event.status !== EventStatus.PLANNING ? 'completed' :
                daysUntilStart > 7 ? 'pending' : 'in_progress' as 'pending' | 'in_progress' | 'completed',
        dueDate: new Date(event.startDate.getTime() - 14 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Venue Confirmed',
        status: event.venueId ? 'completed' as const : 'pending' as const,
        dueDate: new Date(event.startDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Vendors Booked',
        status: 'pending' as const,
        dueDate: new Date(event.startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Guest List Finalized',
        status: 'pending' as const,
        dueDate: new Date(event.startDate.getTime() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Event Day',
        status: event.status === EventStatus.COMPLETED ? 'completed' as const :
                now >= event.startDate && now <= event.endDate ? 'in_progress' as const :
                'pending' as const,
        dueDate: event.startDate
      }
    ];

    // Critical path items
    const criticalPath: string[] = [];
    if (!event.venueId) criticalPath.push('Book venue');
    if (event.confirmedGuests < event.expectedGuests * 0.5) {
      criticalPath.push('Confirm more guests');
    }
    if (event.spent > event.budget * 0.9) {
      criticalPath.push('Review budget');
    }

    return {
      milestones,
      countdown: { daysUntilStart, daysUntilEnd },
      criticalPath
    };
  }

  /**
   * Generate event readiness report
   */
  async getEventReadinessReport(eventId: string): Promise<{
    event: Event;
    readinessScore: number;
    checklist: Array<{
      item: string;
      status: 'complete' | 'incomplete' | 'at_risk';
      details: string;
    }>;
    recommendations: string[];
  }> {
    const summary = await this.getEventSummary(eventId);

    const checklist: Array<{
      item: string;
      status: 'complete' | 'incomplete' | 'at_risk';
      details: string;
    }> = [];

    // Venue
    const event = await Event.findOne({ eventId });
    checklist.push({
      item: 'Venue Booking',
      status: event?.venueId ? 'complete' : 'incomplete',
      details: event?.venueId ? 'Venue confirmed' : 'No venue selected'
    });

    // Guest confirmation
    const confirmationRate = summary.expectedGuests > 0
      ? summary.confirmedGuests / summary.expectedGuests
      : 0;
    checklist.push({
      item: 'Guest Confirmation',
      status: confirmationRate >= 0.75 ? 'complete' :
             confirmationRate >= 0.5 ? 'at_risk' : 'incomplete',
      details: `${summary.confirmedGuests}/${summary.expectedGuests} confirmed (${(confirmationRate * 100).toFixed(1)}%)`
    });

    // Budget
    const budgetUsage = summary.budget > 0 ? summary.spent / summary.budget : 0;
    checklist.push({
      item: 'Budget Management',
      status: budgetUsage <= 0.9 ? 'complete' :
             budgetUsage <= 1 ? 'at_risk' : 'incomplete',
      details: `Spent ${summary.spent} of ${summary.budget} budget (${(budgetUsage * 100).toFixed(1)}%)`
    });

    // Vendors
    checklist.push({
      item: 'Vendor Bookings',
      status: summary.vendorsBooked >= 3 ? 'complete' :
             summary.vendorsBooked >= 1 ? 'at_risk' : 'incomplete',
      details: `${summary.vendorsBooked} vendors booked`
    });

    // Calculate readiness score
    const completeCount = checklist.filter(c => c.status === 'complete').length;
    const atRiskCount = checklist.filter(c => c.status === 'at_risk').length;
    const readinessScore = ((completeCount * 100) + (atRiskCount * 50)) / checklist.length;

    // Generate recommendations
    const recommendations: string[] = [];
    for (const item of checklist) {
      if (item.status === 'incomplete') {
        recommendations.push(`Complete ${item.item.toLowerCase()}`);
      } else if (item.status === 'at_risk') {
        recommendations.push(`Review ${item.item.toLowerCase()}: ${item.details}`);
      }
    }

    return {
      event: event!,
      readinessScore: Math.round(readinessScore),
      checklist,
      recommendations
    };
  }
}

export const eventCoordinatorService = new EventCoordinatorService();