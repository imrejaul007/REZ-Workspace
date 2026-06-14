import axios from 'axios';
import { Ticket } from '../models/index.js';
import type { ITicket } from '../models/index.js';
import { employeeSupportService } from './employeeSupportService.js';

const REZ_CARE_SERVICE_URL = process.env.REZ_CARE_SERVICE_URL || 'http://localhost:4058';

export type EscalationLevel = 'none' | 'level1' | 'level2' | 'manager' | 'executive';

interface EscalationRule {
  trigger: string;
  condition: (ticket: ITicket) => boolean;
  level: EscalationLevel;
  assignTo?: string;
  message: string;
}

export class TicketWorkflowService {
  private escalationRules: EscalationRule[] = [
    {
      trigger: 'sla_breach',
      condition: (ticket) => ticket.status !== 'resolved' && ticket.status !== 'closed' &&
        ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date(),
      level: 'level1',
      message: 'Ticket has breached SLA',
    },
    {
      trigger: 'urgent_priority',
      condition: (ticket) => (ticket.priority === 'urgent' || ticket.priority === 'critical') &&
        ticket.status === 'open',
      level: 'level2',
      message: 'Urgent ticket requires immediate attention',
    },
    {
      trigger: 'repeated_escalation',
      condition: (ticket) => {
        const metadata = ticket.metadata as Record<string, unknown> | undefined;
        return (metadata?.escalationCount as number || 0) >= 2;
      },
      level: 'manager',
      message: 'Ticket has been escalated multiple times',
    },
    {
      trigger: 'negative_feedback',
      condition: (ticket) => ticket.satisfactionRating !== undefined && ticket.satisfactionRating <= 2,
      level: 'manager',
      message: 'Customer provided negative satisfaction rating',
    },
  ];

  /**
   * Check and process escalations for a ticket
   */
  async processEscalations(ticketId: string): Promise<{ escalated: boolean; level?: EscalationLevel }> {
    const ticket = await Ticket.findOne({ ticketId }).lean();
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    for (const rule of this.escalationRules) {
      if (rule.condition(ticket as ITicket)) {
        return await this.escalateTicket(ticketId, rule);
      }
    }

    return { escalated: false };
  }

  /**
   * Escalate a ticket
   */
  async escalateTicket(
    ticketId: string,
    rule: EscalationRule
  ): Promise<{ escalated: boolean; level: EscalationLevel }> {
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Update ticket
    ticket.status = 'escalated';
    ticket.metadata = {
      ...ticket.metadata,
      escalationTrigger: rule.trigger,
      escalationLevel: rule.level,
      escalationCount: ((ticket.metadata as Record<string, unknown>)?.escalationCount as number || 0) + 1,
      lastEscalatedAt: new Date(),
    };

    // Assign based on escalation level
    if (rule.assignTo) {
      ticket.assignedTo = rule.assignTo;
    }

    await ticket.save();

    // Notify escalation handlers
    await this.notifyEscalation(ticket, rule);

    return { escalated: true, level: rule.level };
  }

  /**
   * Route ticket to appropriate queue
   */
  async routeTicket(ticketId: string): Promise<{ routed: boolean; queue?: string }> {
    const ticket = await Ticket.findOne({ ticketId }).lean();
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Determine queue based on category
    const queueMap: Record<string, string> = {
      benefits: 'benefits-queue',
      enrollment: 'benefits-queue',
      claims: 'claims-queue',
      payroll: 'payroll-queue',
      hr_policy: 'hr-queue',
      technical: 'technical-queue',
      feedback: 'feedback-queue',
      other: 'general-queue',
    };

    const queue = queueMap[ticket.category] || 'general-queue';

    // Update ticket with routing
    await Ticket.findOneAndUpdate(
      { ticketId },
      {
        $set: {
          'metadata.routedTo': queue,
          'metadata.routedAt': new Date(),
        },
      }
    );

    return { routed: true, queue };
  }

  /**
   * Auto-assign ticket based on load balancing
   */
  async autoAssignTicket(ticketId: string): Promise<{ assigned: boolean; agentId?: string }> {
    const ticket = await Ticket.findOne({ ticketId }).lean();
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Get queue based on category
    const queueMap: Record<string, string> = {
      benefits: 'benefits-queue',
      enrollment: 'benefits-queue',
      claims: 'claims-queue',
      payroll: 'payroll-queue',
      hr_policy: 'hr-queue',
      technical: 'technical-queue',
      feedback: 'feedback-queue',
      other: 'general-queue',
    };

    const queue = queueMap[ticket.category] || 'general-queue';

    // Get agent with least load in queue (simplified)
    const agentId = await this.getLeastLoadedAgent(queue, ticket.companyId);

    if (agentId) {
      await Ticket.findOneAndUpdate(
        { ticketId },
        {
          $set: {
            assignedTo: agentId,
            status: 'in_progress',
          },
        }
      );
      return { assigned: true, agentId };
    }

    return { assigned: false };
  }

  /**
   * Get least loaded agent
   */
  private async getLeastLoadedAgent(queue: string, companyId: string): Promise<string | null> {
    // This would integrate with an agent management system
    // For now, return a placeholder
    // In production, query agent service for availability and load
    return null;
  }

  /**
   * Auto-respond to common queries
   */
  async autoRespond(ticketId: string): Promise<{ responded: boolean; response?: string }> {
    const ticket = await Ticket.findOne({ ticketId }).lean();
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const response = this.getAutoResponse(ticket.category, ticket.subject, ticket.description);

    if (response) {
      await employeeSupportService.addComment(ticketId, {
        authorId: 'system',
        authorName: 'Auto Response',
        authorRole: 'bot',
        content: response,
        isInternal: false,
      });

      return { responded: true, response };
    }

    return { responded: false };
  }

  /**
   * Get auto response based on ticket content
   */
  private getAutoResponse(category: string, subject: string, description: string): string | null {
    const lowerSubject = subject.toLowerCase();
    const lowerDesc = description.toLowerCase();

    // Benefits related
    if (category === 'benefits' || lowerSubject.includes('benefit')) {
      if (lowerSubject.includes('enroll')) {
        return "Thank you for your enrollment inquiry. Our team will review your request and get back to you within 24 hours. You can also check your enrollment status in the Benefits section of the app.";
      }
      if (lowerSubject.includes('claim')) {
        return "Thank you for your claim inquiry. To check your claim status, please provide your claim ID. You can also track claims in real-time through the Claims section.";
      }
    }

    // Technical related
    if (category === 'technical' || lowerSubject.includes('error') || lowerSubject.includes('bug')) {
      return "Thank you for reporting this technical issue. Our technical team has been notified and will investigate. We'll update you within 4-24 hours depending on severity.";
    }

    // Feedback
    if (category === 'feedback') {
      return "Thank you for your feedback! We value your input and will use it to improve our services.";
    }

    return null;
  }

  /**
   * Process ticket closure
   */
  async processClosure(ticketId: string, autoClose: boolean = true): Promise<void> {
    const ticket = await Ticket.findOne({ ticketId }).lean();
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.status === 'resolved') {
      // Wait for satisfaction rating before closing
      if (autoClose) {
        // Auto-close after 48 hours if no response
        const resolvedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt) : new Date();
        const hoursSinceResolved = (Date.now() - resolvedAt.getTime()) / 1000 / 60 / 60;

        if (hoursSinceResolved >= 48) {
          await employeeSupportService.updateTicket(ticketId, { status: 'closed' });
        }
      }
    }
  }

  /**
   * Notify escalation handlers
   */
  private async notifyEscalation(ticket: InstanceType<typeof Ticket>, rule: EscalationRule): Promise<void> {
    try {
      await axios.post(
        `${REZ_CARE_SERVICE_URL}/api/escalations/notify`,
        {
          ticketId: ticket.ticketId,
          employeeId: ticket.employeeId,
          companyId: ticket.companyId,
          escalationLevel: rule.level,
          trigger: rule.trigger,
          message: rule.message,
          source: 'rez-care-corpperks-bridge',
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
          },
        }
      );
    } catch (error) {
      logger.error('Failed to notify escalation:', error);
    }
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(companyId: string): Promise<{
    totalEscalations: number;
    avgResolutionTime: number;
    ticketsByStatus: Record<string, number>;
    ticketsByPriority: Record<string, number>;
    slaCompliance: number;
  }> {
    const tickets = await Ticket.find({ companyId }).lean();

    const stats = {
      totalEscalations: tickets.filter((t) => t.status === 'escalated').length,
      avgResolutionTime: 0,
      ticketsByStatus: {} as Record<string, number>,
      ticketsByPriority: {} as Record<string, number>,
      slaCompliance: 0,
    };

    // Status distribution
    for (const ticket of tickets) {
      stats.ticketsByStatus[ticket.status] = (stats.ticketsByStatus[ticket.status] || 0) + 1;
      stats.ticketsByPriority[ticket.priority] = (stats.ticketsByPriority[ticket.priority] || 0) + 1;
    }

    // Resolution time
    const resolvedTickets = tickets.filter((t) => t.resolvedAt);
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, t) => {
        return sum + (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime());
      }, 0);
      stats.avgResolutionTime = Math.round(totalTime / resolvedTickets.length / 1000 / 60 / 60); // hours
    }

    // SLA compliance
    const deadlineTickets = tickets.filter((t) => t.slaDeadline);
    const metSLA = deadlineTickets.filter((t) => {
      const deadline = new Date(t.slaDeadline!);
      const resolved = t.resolvedAt ? new Date(t.resolvedAt) : new Date();
      return resolved <= deadline;
    });
    stats.slaCompliance = deadlineTickets.length > 0
      ? Math.round((metSLA.length / deadlineTickets.length) * 100)
      : 100;

    return stats;
  }
}

export const ticketWorkflowService = new TicketWorkflowService();
