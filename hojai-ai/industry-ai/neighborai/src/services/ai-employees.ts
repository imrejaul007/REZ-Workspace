/**
 * NEIGHBORAI - AI Employee Services
 * Society Manager, Visitor Agent, Complaint Agent, Community Agent
 */

import { Resident, Visitor, Complaint, Maintenance, Event } from '../models';
import { logger } from '../middleware/logger';

// ============================================
// SOCIETY MANAGER - Operations & Billing AI
// ============================================

export class SocietyManagerService {
  /**
   * Handle general society queries
   */
  static async handleQuery(flatNumber: string | undefined, query: string): Promise<any> {
    const lowerQuery = query.toLowerCase();

    // Analyze query intent
    if (this.contains(lowerQuery, ['complaint', 'issue', 'problem', ' complaint'])) {
      return this.handleComplaintQuery(flatNumber);
    }

    if (this.contains(lowerQuery, ['maintenance', 'bill', 'payment', 'dues', 'charge'])) {
      return this.handleBillingQuery(flatNumber);
    }

    if (this.contains(lowerQuery, ['resident', 'neighbor', 'flat', 'family'])) {
      return this.handleResidentQuery(flatNumber);
    }

    if (this.contains(lowerQuery, ['visitor', 'guest', 'entry'])) {
      return this.handleVisitorQuery(flatNumber);
    }

    if (this.contains(lowerQuery, ['event', 'party', 'celebration', 'gathering'])) {
      return this.handleEventQuery();
    }

    if (this.contains(lowerQuery, ['maintenance request', 'repair', 'fix'])) {
      return this.handleMaintenanceQuery(flatNumber);
    }

    // Default response
    return {
      type: 'general',
      message: 'Hello! I\'m the Society Manager AI. I can help you with:',
      capabilities: [
        'Complaints - Track and register complaints',
        'Billing - View maintenance dues and payments',
        'Visitors - Pre-approve guests',
        'Events - View and plan community events',
        'Maintenance - Request repairs',
        'Resident Info - View society directory'
      ],
      tip: 'Ask me anything about society management!'
    };
  }

  /**
   * Get billing summary for a flat
   */
  static async handleBillingQuery(flatNumber?: string): Promise<any> {
    if (!flatNumber) {
      return {
        type: 'billing',
        message: 'Please provide your flat number to view billing information.',
        action: 'required: flatNumber'
      };
    }

    const bills = await Maintenance.find({ flatNumber }).sort({ dueDate: -1 }).limit(12);
    const pending = bills.filter(b => b.status !== 'paid');
    const totalPending = pending.reduce((sum, b) => sum + b.amount, 0);

    return {
      type: 'billing',
      flatNumber,
      summary: {
        totalBills: bills.length,
        pendingBills: pending.length,
        totalPendingAmount: totalPending,
        nextDueDate: pending.length > 0 ? pending[0].dueDate : null
      },
      recentBills: bills.slice(0, 5).map(b => ({
        category: b.category,
        amount: b.amount,
        dueDate: b.dueDate,
        status: b.status
      })),
      message: pending.length > 0
        ? `You have ${pending.length} pending bill(s) totaling Rs. ${totalPending.toLocaleString()}.`
        : 'All your bills are paid! Thank you.'
    };
  }

  /**
   * Get resident information
   */
  static async handleResidentQuery(flatNumber?: string): Promise<any> {
    if (flatNumber) {
      const resident = await Resident.findOne({ flatNumber });
      if (!resident) {
        return { type: 'resident', found: false, message: `No resident found for Flat ${flatNumber}.` };
      }
      return {
        type: 'resident',
        found: true,
        resident: {
          name: resident.name,
          flatNumber: resident.flatNumber,
          wing: resident.wing,
          status: resident.status,
          familyMembers: resident.familyMembers,
          moveInDate: resident.moveInDate
        }
      };
    }

    const totalResidents = await Resident.countDocuments();
    const owners = await Resident.countDocuments({ status: 'owner' });
    const tenants = await Resident.countDocuments({ status: 'tenant' });

    return {
      type: 'resident',
      summary: { totalResidents, owners, tenants },
      message: `Society has ${totalResidents} registered residents (${owners} owners, ${tenants} tenants).`
    };
  }

  /**
   * Get maintenance requests
   */
  static async handleMaintenanceQuery(flatNumber?: string): Promise<any> {
    const query = flatNumber ? { flatNumber } : {};
    const requests = await Maintenance.find(query).sort({ createdAt: -1 }).limit(10);

    return {
      type: 'maintenance',
      flatNumber,
      requests: requests.map(r => ({
        category: r.category,
        description: r.description,
        status: r.status,
        amount: r.amount,
        dueDate: r.dueDate
      })),
      message: flatNumber
        ? `Found ${requests.length} maintenance record(s) for Flat ${flatNumber}.`
        : `Showing recent ${requests.length} maintenance records.`
    };
  }

  private static contains(text: string, keywords: string[]): boolean {
    return keywords.some(kw => text.includes(kw));
  }
}

// ============================================
// VISITOR AGENT - Visitor Management AI
// ============================================

export class VisitorAgentService {
  /**
   * Pre-approve a visitor
   */
  static async preApproveVisitor(
    flatNumber: string,
    visitorName: string,
    phone: string,
    purpose: string
  ): Promise<any> {
    // Generate entry code
    const entryCode = this.generateEntryCode();

    // Create visitor record
    const visitor = await Visitor.create({
      name: visitorName,
      phone,
      purpose,
      hostFlat: flatNumber,
      checkIn: new Date(),
      status: 'pending',
      entryCode
    });

    logger.info('Visitor pre-approved by AI', {
      visitorId: visitor._id,
      flatNumber,
      visitorName
    });

    // Get host resident info
    const resident = await Resident.findOne({ flatNumber });

    return {
      success: true,
      visitor: {
        id: visitor._id,
        name: visitor.name,
        phone: visitor.phone,
        purpose: visitor.purpose,
        hostFlat: visitor.hostFlat,
        entryCode: visitor.entryCode,
        status: visitor.status
      },
      host: resident ? { name: resident.name, phone: resident.phone } : null,
      message: `Visitor ${visitorName} registered for Flat ${flatNumber}. Entry code: ${entryCode}`,
      instructions: [
        'Share the entry code with your visitor',
        'Visitor should show this code at the gate',
        'Security will verify and allow entry'
      ]
    };
  }

  /**
   * Check in visitor
   */
  static async checkInVisitor(visitorId: string): Promise<any> {
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      throw new Error('Visitor not found');
    }

    visitor.status = 'checked-in';
    visitor.checkIn = new Date();
    await visitor.save();

    logger.info('Visitor checked in', { visitorId, flatNumber: visitor.hostFlat });

    return {
      success: true,
      visitor,
      message: `${visitor.name} has checked in. Welcome!`
    };
  }

  /**
   * Check out visitor
   */
  static async checkOutVisitor(visitorId: string): Promise<any> {
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      throw new Error('Visitor not found');
    }

    visitor.status = 'checked-out';
    visitor.checkOut = new Date();
    await visitor.save();

    const duration = visitor.checkOut.getTime() - visitor.checkIn.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));

    logger.info('Visitor checked out', { visitorId, duration: `${hours} hours` });

    return {
      success: true,
      visitor,
      duration: `${hours} hour(s)`,
      message: `${visitor.name} has checked out. Visit duration: ${hours} hour(s).`
    };
  }

  /**
   * Get visitor summary
   */
  static async getVisitorSummary(flatNumber?: string): Promise<any> {
    const query = flatNumber ? { hostFlat: flatNumber } : {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVisitors = await Visitor.countDocuments({
      ...query,
      checkIn: { $gte: today }
    });

    const checkedIn = await Visitor.countDocuments({
      ...query,
      status: 'checked-in'
    });

    const pending = await Visitor.countDocuments({
      ...query,
      status: 'pending'
    });

    return {
      type: 'visitor',
      flatNumber,
      summary: {
        todayVisitors,
        currentlyCheckedIn: checkedIn,
        pendingApproval: pending
      },
      message: flatNumber
        ? `Flat ${flatNumber}: ${todayVisitors} visitor(s) today, ${checkedIn} currently present.`
        : `Society: ${todayVisitors} visitor(s) today, ${checkedIn} currently present.`
    };
  }

  private static generateEntryCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

// ============================================
// COMPLAINT AGENT - Issue Tracking & Escalation AI
// ============================================

export class ComplaintAgentService {
  /**
   * Register a new complaint
   */
  static async registerComplaint(
    residentId: string,
    flatNumber: string,
    category: string,
    description: string,
    priority: string = 'medium',
    wing?: string
  ): Promise<any> {
    const complaint = await Complaint.create({
      residentId,
      flatNumber,
      wing,
      category,
      description,
      priority,
      status: 'open'
    });

    // Auto-assign based on category
    const assignments = this.getAutoAssignment(category);
    if (assignments) {
      complaint.assignedTo = assignments;
      await complaint.save();
    }

    logger.info('Complaint registered by AI', {
      complaintId: complaint._id,
      category,
      priority
    });

    const ticketNumber = `COMP-${complaint._id.toString().slice(-8).toUpperCase()}`;

    return {
      success: true,
      complaint: {
        id: complaint._id,
        ticketNumber,
        category: complaint.category,
        description: complaint.description,
        priority: complaint.priority,
        status: complaint.status,
        assignedTo: complaint.assignedTo
      },
      message: `Complaint registered successfully. Ticket: ${ticketNumber}`,
      eta: this.getExpectedResolution(priority),
      escalation: this.getEscalationInfo(priority)
    };
  }

  /**
   * Track complaint status
   */
  static async trackComplaint(complaintId: string): Promise<any> {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    const daysOpen = Math.floor(
      (Date.now() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    let resolutionStatus = 'on-track';
    let message = 'This complaint is being addressed as per timeline.';

    if (complaint.status === 'resolved') {
      resolutionStatus = 'resolved';
      message = 'This complaint has been resolved.';
    } else if (complaint.status === 'closed') {
      resolutionStatus = 'closed';
      message = 'This complaint is closed.';
    } else if (complaint.priority === 'urgent' && daysOpen > 1) {
      resolutionStatus = 'escalated';
      message = 'URGENT: This complaint requires immediate attention!';
    } else if (complaint.priority === 'high' && daysOpen > 3) {
      resolutionStatus = 'escalated';
      message = 'This high-priority complaint has exceeded expected resolution time.';
    } else if (complaint.priority === 'medium' && daysOpen > 7) {
      resolutionStatus = 'delayed';
      message = 'This complaint is taking longer than expected.';
    } else if (complaint.priority === 'low' && daysOpen > 14) {
      resolutionStatus = 'delayed';
      message = 'This complaint resolution is in progress.';
    }

    return {
      success: true,
      complaint: {
        id: complaint._id,
        ticketNumber: `COMP-${complaint._id.toString().slice(-8).toUpperCase()}`,
        category: complaint.category,
        description: complaint.description,
        status: complaint.status,
        priority: complaint.priority,
        assignedTo: complaint.assignedTo,
        createdAt: complaint.createdAt,
        daysOpen
      },
      resolution: {
        status: resolutionStatus,
        message,
        isOverdue: daysOpen > this.getSlaDays(complaint.priority)
      },
      timeline: this.getTimeline(complaint)
    };
  }

  /**
   * Resolve complaint
   */
  static async resolveComplaint(
    complaintId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<any> {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    complaint.status = 'resolved';
    complaint.resolution = resolution;
    complaint.resolvedAt = new Date();
    await complaint.save();

    logger.info('Complaint resolved', {
      complaintId,
      resolvedBy,
      resolutionTime: `${Math.floor(
        (complaint.resolvedAt.getTime() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )} days`
    });

    return {
      success: true,
      complaint: {
        id: complaint._id,
        ticketNumber: `COMP-${complaint._id.toString().slice(-8).toUpperCase()}`,
        status: 'resolved',
        resolution: complaint.resolution,
        resolvedAt: complaint.resolvedAt
      },
      message: `Complaint ${ticketNumber} has been resolved.`,
      satisfactionSurvey: {
        question: 'How satisfied are you with the resolution?',
        scale: '1-5',
        options: ['Very Unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very Satisfied']
      }
    };
  }

  /**
   * Get complaint statistics
   */
  static async getComplaintStats(): Promise<any> {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'open' }),
      Complaint.countDocuments({ status: 'in-progress' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'closed' })
    ]);

    const byPriority = await Complaint.aggregate([
      { $match: { status: { $in: ['open', 'in-progress'] } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const byCategory = await Complaint.aggregate([
      { $match: { status: { $in: ['open', 'in-progress'] } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    return {
      summary: { total, open, inProgress, resolved, closed },
      byPriority: Object.fromEntries(byPriority.map(p => [p._id, p.count])),
      byCategory: Object.fromEntries(byCategory.map(c => [c._id, c.count])),
      resolutionRate: total > 0 ? ((resolved + closed) / total * 100).toFixed(1) + '%' : 'N/A'
    };
  }

  private static getAutoAssignment(category: string): string {
    const assignments: Record<string, string> = {
      maintenance: 'Maintenance Team',
      plumbing: 'Plumbing Team',
      electrical: 'Electrical Team',
      security: 'Security Team',
      cleanliness: 'Sanitation Team',
      noise: 'Society Committee',
      parking: 'Parking Committee'
    };
    return assignments[category] || 'Society Committee';
  }

  private static getExpectedResolution(priority: string): string {
    const eta: Record<string, string> = {
      urgent: '4-6 hours',
      high: '1-2 days',
      medium: '3-5 days',
      low: '7-14 days'
    };
    return eta[priority] || '3-5 days';
  }

  private static getEscalationInfo(priority: string): any {
    if (priority === 'urgent') {
      return { level: 3, contacts: ['Security: ext 101', 'Secretary: ext 100'] };
    } else if (priority === 'high') {
      return { level: 2, contacts: ['Committee Member: ext 200'] };
    }
    return { level: 1, contacts: [] };
  }

  private static getSlaDays(priority: string): number {
    const sla: Record<string, number> = { urgent: 1, high: 3, medium: 7, low: 14 };
    return sla[priority] || 7;
  }

  private static getTimeline(complaint: any): any[] {
    const timeline = [
      {
        status: 'open',
        timestamp: complaint.createdAt,
        message: 'Complaint registered'
      }
    ];

    if (complaint.assignedTo) {
      timeline.push({
        status: 'assigned',
        timestamp: complaint.updatedAt,
        message: `Assigned to ${complaint.assignedTo}`
      });
    }

    if (complaint.status === 'in-progress') {
      timeline.push({
        status: 'in-progress',
        timestamp: complaint.updatedAt,
        message: 'Work in progress'
      });
    }

    if (complaint.resolvedAt) {
      timeline.push({
        status: 'resolved',
        timestamp: complaint.resolvedAt,
        message: 'Complaint resolved'
      });
    }

    return timeline;
  }
}

// ============================================
// COMMUNITY AGENT - Events & Announcements AI
// ============================================

export class CommunityAgentService {
  /**
   * Plan a new event
   */
  static async planEvent(
    title: string,
    description: string,
    suggestedDate?: Date,
    organizer?: string
  ): Promise<any> {
    const date = suggestedDate || this.suggestNextAvailableDate();

    const event = await Event.create({
      title,
      description,
      date,
      organizer: organizer || 'Society Committee',
      attendees: []
    });

    logger.info('Event planned by AI', {
      eventId: event._id,
      title,
      date
    });

    // Get resident count for RSVP distribution
    const totalResidents = await Resident.countDocuments();

    return {
      success: true,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        description: event.description,
        organizer: event.organizer,
        rsvpCount: 0
      },
      message: `Event "${title}" has been scheduled for ${date.toLocaleDateString()}.`,
      reminders: [
        'WhatsApp group announcement',
        'Notice board posting',
        'Door-to-door collection (optional)'
      ],
      estimatedReach: totalResidents,
      rsvpLink: `/api/events/${event._id}/rsvp`
    };
  }

  /**
   * Get upcoming events
   */
  static async getUpcomingEvents(): Promise<any> {
    const events = await Event.find({
      date: { $gte: new Date() }
    }).sort({ date: 1 }).limit(10);

    const today = new Date();
    const thisWeek = events.filter(e => {
      const eventDate = new Date(e.date);
      const diff = eventDate.getTime() - today.getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    });

    return {
      success: true,
      upcoming: events.map(e => ({
        id: e._id,
        title: e.title,
        date: e.date,
        time: e.time,
        venue: e.venue,
        description: e.description,
        organizer: e.organizer,
        attendeeCount: e.attendees.length
      })),
      thisWeek: thisWeek.length,
      totalUpcoming: events.length,
      message: thisWeek.length > 0
        ? `${thisWeek.length} event(s) this week!`
        : `No events this week. ${events.length} upcoming event(s) on the calendar.`
    };
  }

  /**
   * RSVP to event
   */
  static async rsvpEvent(eventId: string, flatNumber: string, attending: boolean): Promise<any> {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (attending) {
      if (!event.attendees.includes(flatNumber)) {
        event.attendees.push(flatNumber);
        await event.save();
      }
    } else {
      event.attendees = event.attendees.filter(a => a !== flatNumber);
      await event.save();
    }

    const resident = await Resident.findOne({ flatNumber });

    return {
      success: true,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        attendeeCount: event.attendees.length
      },
      rsvp: attending ? 'attending' : 'not attending',
      attendee: resident ? resident.name : flatNumber,
      message: attending
        ? `${resident?.name || flatNumber} is attending "${event.title}"!`
        : `${resident?.name || flatNumber} cannot attend "${event.title}".`
    };
  }

  /**
   * Get event analytics
   */
  static async getEventAnalytics(): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [upcomingEvents, pastEvents, totalRsvps] = await Promise.all([
      Event.countDocuments({ date: { $gte: now } }),
      Event.countDocuments({ date: { $gte: thirtyDaysAgo, $lte: now } }),
      Event.aggregate([
        { $match: { date: { $gte: thirtyDaysAgo, $lte: now } } },
        { $project: { attendeeCount: { $size: '$attendees' } } },
        { $group: { _id: null, total: { $sum: '$attendeeCount' } } }
      ])
    ]);

    return {
      summary: {
        upcomingEvents,
        pastEventsLast30Days: pastEvents,
        totalRsvpsLast30Days: totalRsvps[0]?.total || 0,
        averageAttendance: pastEvents > 0 ? Math.round((totalRsvps[0]?.total || 0) / pastEvents) : 0
      },
      message: `Society has ${upcomingEvents} upcoming event(s) and ${pastEvents} event(s) in the last 30 days.`
    };
  }

  private static suggestNextAvailableDate(): Date {
    const today = new Date();
    // Find next Saturday if today is not Saturday/Sunday
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = dayOfWeek === 6 ? 0 : dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
    const nextDate = new Date(today.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
    nextDate.setHours(17, 0, 0, 0); // 5 PM default
    return nextDate;
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  SocietyManagerService,
  VisitorAgentService,
  ComplaintAgentService,
  CommunityAgentService
};