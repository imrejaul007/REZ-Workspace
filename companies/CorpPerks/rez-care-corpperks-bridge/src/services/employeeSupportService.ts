import axios from 'axios';
import { Ticket, ITicket } from '../models/index.js';
import { generateTicketId, generateMessageId, type CreateTicketDTO, type UpdateTicketDTO, type AddCommentDTO, type TicketMetrics } from '../types/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const REZ_CARE_SERVICE_URL = process.env.REZ_CARE_SERVICE_URL || 'http://localhost:4058';

export class EmployeeSupportService {
  /**
   * Create a new support ticket
   */
  async createTicket(dto: CreateTicketDTO): Promise<ITicket> {
    // Calculate SLA deadline based on priority
    const slaHours = this.getSLADeadline(dto.priority || 'normal');
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const ticket = new Ticket({
      ticketId: generateTicketId(),
      ...dto,
      priority: dto.priority || 'normal',
      source: dto.source || 'app',
      status: 'open',
      comments: [],
      tags: dto.tags || [],
      slaDeadline,
    });

    await ticket.save();

    // Sync with REZ Care Service
    await this.syncWithRezCare(ticket, 'create');

    return ticket;
  }

  /**
   * Get ticket by ID
   */
  async getTicket(ticketId: string): Promise<ITicket> {
    const ticket = await Ticket.findOne({ ticketId }).lean();
    if (!ticket) throw new NotFoundError('Ticket', ticketId);
    return ticket as ITicket;
  }

  /**
   * Get tickets with filters
   */
  async getTickets(
    filters: {
      companyId: string;
      employeeId?: string;
      status?: string;
      category?: string;
      priority?: string;
      assignedTo?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ tickets: ITicket[]; total: number }> {
    const { companyId, employeeId, status, category, priority, assignedTo, page = 1, limit = 20 } = filters;

    const filter: Record<string, unknown> = { companyId };
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    return { tickets: tickets as ITicket[], total };
  }

  /**
   * Update ticket
   */
  async updateTicket(ticketId: string, dto: UpdateTicketDTO): Promise<ITicket> {
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) throw new NotFoundError('Ticket', ticketId);

    // Track first response
    if (dto.status === 'in_progress' && !ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
    }

    // Track resolution
    if (dto.status === 'resolved' || dto.status === 'closed') {
      ticket.resolvedAt = new Date();
      if (dto.resolution) {
        ticket.resolution = dto.resolution;
      }
    }

    // Close ticket
    if (dto.status === 'closed' && !ticket.closedAt) {
      ticket.closedAt = new Date();
    }

    Object.assign(ticket, dto);
    await ticket.save();

    await this.syncWithRezCare(ticket, 'update');

    return ticket;
  }

  /**
   * Add comment to ticket
   */
  async addComment(ticketId: string, dto: AddCommentDTO): Promise<ITicket> {
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) throw new NotFoundError('Ticket', ticketId);

    const comment = {
      id: generateMessageId(),
      authorId: dto.authorId,
      authorName: dto.authorName,
      authorRole: dto.authorRole,
      content: dto.content,
      attachments: dto.attachments || [],
      isInternal: dto.isInternal || false,
      createdAt: new Date(),
    };

    ticket.comments.push(comment);

    // Track first response if this is from an agent/bot
    if ((dto.authorRole === 'agent' || dto.authorRole === 'bot') && !ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
    }

    // Update status if transitioning from pending
    if (ticket.status === 'pending_customer') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    return ticket;
  }

  /**
   * Get employee tickets
   */
  async getEmployeeTickets(
    employeeId: string,
    companyId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ tickets: ITicket[]; total: number }> {
    return this.getTickets({ companyId, employeeId, ...options });
  }

  /**
   * Get ticket metrics
   */
  async getTicketMetrics(
    companyId: string,
    options: { employeeId?: string; startDate?: Date; endDate?: Date } = {}
  ): Promise<TicketMetrics> {
    const filter: Record<string, unknown> = { companyId };
    if (options.employeeId) filter.employeeId = options.employeeId;
    if (options.startDate || options.endDate) {
      filter.createdAt = {};
      if (options.startDate) (filter.createdAt as Record<string, Date>).$gte = options.startDate;
      if (options.endDate) (filter.createdAt as Record<string, Date>).$lte = options.endDate;
    }

    const tickets = await Ticket.find(filter).lean();

    const metrics: TicketMetrics = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      inProgress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
      closed: tickets.filter((t) => t.status === 'closed').length,
      escalated: tickets.filter((t) => t.status === 'escalated').length,
      avgResponseTime: 0,
      avgResolutionTime: 0,
      firstResponseTime: 0,
    };

    // Calculate response times
    const ticketsWithResponse = tickets.filter(
      (t) => t.firstResponseAt && t.createdAt
    );
    if (ticketsWithResponse.length > 0) {
      const totalResponseTime = ticketsWithResponse.reduce((sum, t) => {
        return sum + (new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime());
      }, 0);
      metrics.firstResponseTime = Math.round(totalResponseTime / ticketsWithResponse.length / 1000 / 60); // minutes
      metrics.avgResponseTime = metrics.firstResponseTime;
    }

    const resolvedTickets = tickets.filter(
      (t) => t.resolvedAt && t.createdAt
    );
    if (resolvedTickets.length > 0) {
      const totalResolutionTime = resolvedTickets.reduce((sum, t) => {
        return sum + (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime());
      }, 0);
      metrics.avgResolutionTime = Math.round(totalResolutionTime / resolvedTickets.length / 1000 / 60 / 60); // hours
    }

    // Satisfaction score
    const ratedTickets = tickets.filter((t) => t.satisfactionRating);
    if (ratedTickets.length > 0) {
      const totalRating = ratedTickets.reduce((sum, t) => sum + (t.satisfactionRating || 0), 0);
      metrics.satisfactionScore = Math.round((totalRating / ratedTickets.length) * 100) / 100;
    }

    return metrics;
  }

  /**
   * Rate ticket satisfaction
   */
  async rateTicket(ticketId: string, rating: number): Promise<ITicket> {
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) throw new NotFoundError('Ticket', ticketId);

    ticket.satisfactionRating = Math.min(5, Math.max(1, rating));
    await ticket.save();

    return ticket;
  }

  /**
   * Get SLA status for ticket
   */
  async getSLAStatus(ticketId: string): Promise<{ breached: boolean; remaining?: number; overdue?: number }> {
    const ticket = await Ticket.findOne({ ticketId }).lean();
    if (!ticket) throw new NotFoundError('Ticket', ticketId);

    if (!ticket.slaDeadline) {
      return { breached: false };
    }

    const now = new Date();
    const deadline = new Date(ticket.slaDeadline);

    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      return { breached: false };
    }

    if (now > deadline) {
      const overdue = Math.round((now.getTime() - deadline.getTime()) / 1000 / 60 / 60); // hours
      return { breached: true, overdue };
    }

    const remaining = Math.round((deadline.getTime() - now.getTime()) / 1000 / 60 / 60); // hours
    return { breached: false, remaining };
  }

  /**
   * Calculate SLA deadline based on priority
   */
  private getSLADeadline(priority: string): number {
    switch (priority) {
      case 'critical':
        return 1; // 1 hour
      case 'urgent':
        return 4; // 4 hours
      case 'high':
        return 8; // 8 hours
      case 'normal':
        return 24; // 24 hours
      case 'low':
        return 48; // 48 hours
      default:
        return 24;
    }
  }

  /**
   * Sync with REZ Care Service
   */
  private async syncWithRezCare(ticket: ITicket, action: string): Promise<void> {
    try {
      await axios.post(
        `${REZ_CARE_SERVICE_URL}/api/tickets/sync`,
        {
          ticketId: ticket.ticketId,
          employeeId: ticket.employeeId,
          companyId: ticket.companyId,
          category: ticket.category,
          status: ticket.status,
          action,
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
      logger.error('Failed to sync with REZ Care Service:', error);
    }
  }
}

export const employeeSupportService = new EmployeeSupportService();
