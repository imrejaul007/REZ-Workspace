/**
 * Complaint & Refund Handler
 *
 * Handles:
 * - Complaint registration
 * - Refund processing
 * - Issue escalation
 * - Ticket creation
 * - Status tracking
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

// ==================== TYPES ====================

export interface Complaint {
  id: string;
  userId: string;
  type: 'food_quality' | 'delivery_issue' | 'wrong_item' | 'missing_item' | 'late_delivery' | 'staff_behavior' | 'other';
  status: 'registered' | 'investigating' | 'resolved' | 'escalated' | 'closed';
  description: string;
  orderId?: string;
  merchantId?: string;
  refundAmount?: number;
  refundStatus?: 'pending' | 'approved' | 'processed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  resolution?: string;
  assignedTo?: string;
}

export interface RefundRequest {
  id: string;
  userId: string;
  complaintId?: string;
  orderId: string;
  amount: number;
  reason: 'cancelled' | 'quality_issue' | 'non_delivery' | 'partial' | 'duplicate' | 'other';
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'processed';
  refundMethod: 'coins' | 'original_payment' | 'bank_transfer';
  processingDays: number;
  createdAt: Date;
  processedAt?: Date;
  transactionId?: string;
}

export interface Ticket {
  id: string;
  userId: string;
  complaintId?: string;
  type: 'complaint' | 'refund' | 'support' | 'feedback' | 'sales';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  subject: string;
  description: string;
  channel: 'chat' | 'whatsapp' | 'email' | 'call';
  assignedTo?: string;
  messages: TicketMessage[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface TicketMessage {
  id: string;
  from: 'customer' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}

// ==================== HANDLER CLASS ====================

export class ComplaintRefundHandler {
  private complaints: Map<string, Complaint> = new Map();
  private refunds: Map<string, RefundRequest> = new Map();
  private tickets: Map<string, Ticket> = new Map();

  // ==================== COMPLAINTS ====================

  /**
   * Register a new complaint
   */
  registerComplaint(data: {
    userId: string;
    type: Complaint['type'];
    description: string;
    orderId?: string;
    merchantId?: string;
  }): Complaint {
    const complaint: Complaint = {
      id: `CMP-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`,
      userId: data.userId,
      type: data.type,
      status: 'registered',
      description: data.description,
      orderId: data.orderId,
      merchantId: data.merchantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.complaints.set(complaint.id, complaint);

    logger.info('Complaint registered', {
      complaintId: complaint.id,
      userId: data.userId,
      type: data.type,
    });

    // Auto-escalate based on type
    if (this.shouldAutoEscalate(data.type)) {
      this.escalateComplaint(complaint.id, 'Auto-escalated: High priority complaint type');
    }

    return complaint;
  }

  /**
   * Check if complaint should auto-escalate
   */
  private shouldAutoEscalate(type: Complaint['type']): boolean {
    const highPriorityTypes = [
      'staff_behavior',
      'food_quality',
      'delivery_issue',
    ];
    return highPriorityTypes.includes(type);
  }

  /**
   * Update complaint status
   */
  updateComplaint(complaintId: string, updates: Partial<Complaint>): Complaint | null {
    const complaint = this.complaints.get(complaintId);
    if (!complaint) return null;

    const updated: Complaint = {
      ...complaint,
      ...updates,
      updatedAt: new Date(),
    };

    this.complaints.set(complaintId, updated);

    logger.info('Complaint updated', { complaintId, updates });

    return updated;
  }

  /**
   * Escalate complaint
   */
  escalateComplaint(complaintId: string, reason: string): Complaint | null {
    return this.updateComplaint(complaintId, {
      status: 'escalated',
      resolution: `Escalated: ${reason}`,
    });
  }

  /**
   * Resolve complaint
   */
  resolveComplaint(complaintId: string, resolution: string, refundAmount?: number): Complaint | null {
    const updates: Partial<Complaint> = {
      status: 'resolved',
      resolution,
      updatedAt: new Date(),
    };

    if (refundAmount) {
      updates.refundAmount = refundAmount;
      updates.refundStatus = 'pending';
    }

    return this.updateComplaint(complaintId, updates);
  }

  /**
   * Get user complaints
   */
  getUserComplaints(userId: string): Complaint[] {
    return Array.from(this.complaints.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get complaint by ID
   */
  getComplaint(complaintId: string): Complaint | null {
    return this.complaints.get(complaintId) || null;
  }

  // ==================== REFUNDS ====================

  /**
   * Request refund
   */
  requestRefund(data: {
    userId: string;
    orderId: string;
    amount: number;
    reason: RefundRequest['reason'];
    complaintId?: string;
    refundMethod?: RefundRequest['refundMethod'];
  }): RefundRequest {
    // Check for existing refund request
    const existing = Array.from(this.refunds.values()).find(
      r => r.orderId === data.orderId && r.status !== 'rejected' && r.status !== 'processed'
    );

    if (existing) {
      logger.warn('Duplicate refund request', { orderId: data.orderId });
      return existing;
    }

    const refund: RefundRequest = {
      id: `REF-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`,
      userId: data.userId,
      orderId: data.orderId,
      amount: data.amount,
      reason: data.reason,
      status: 'pending',
      refundMethod: data.refundMethod || 'original_payment',
      processingDays: this.getProcessingDays(data.amount),
      complaintId: data.complaintId,
      createdAt: new Date(),
    };

    this.refunds.set(refund.id, refund);

    logger.info('Refund requested', {
      refundId: refund.id,
      userId: data.userId,
      orderId: data.orderId,
      amount: data.amount,
    });

    // Auto-approve small refunds
    if (data.amount <= 500) {
      this.approveRefund(refund.id);
    }

    return refund;
  }

  /**
   * Get processing days based on amount
   */
  private getProcessingDays(amount: number): number {
    if (amount <= 500) return 1;
    if (amount <= 2000) return 3;
    if (amount <= 10000) return 5;
    return 7;
  }

  /**
   * Approve refund
   */
  approveRefund(refundId: string): RefundRequest | null {
    const refund = this.refunds.get(refundId);
    if (!refund) return null;

    const approved: RefundRequest = {
      ...refund,
      status: 'approved',
      processedAt: new Date(),
    };

    this.refunds.set(refundId, approved);

    // Process the refund
    this.processRefund(approved);

    return approved;
  }

  /**
   * Process refund (simulated)
   */
  private processRefund(refund: RefundRequest): void {
    const processed: RefundRequest = {
      ...refund,
      status: 'processed',
      transactionId: `TXN-${Date.now()}`,
      processedAt: new Date(),
    };

    this.refunds.set(refund.id, processed);

    logger.info('Refund processed', {
      refundId: refund.id,
      transactionId: processed.transactionId,
    });
  }

  /**
   * Reject refund
   */
  rejectRefund(refundId: string, reason: string): RefundRequest | null {
    return this.updateRefund(refundId, {
      status: 'rejected',
    });
  }

  /**
   * Update refund
   */
  private updateRefund(refundId: string, updates: Partial<RefundRequest>): RefundRequest | null {
    const refund = this.refunds.get(refundId);
    if (!refund) return null;

    const updated: RefundRequest = { ...refund, ...updates };
    this.refunds.set(refundId, updated);

    return updated;
  }

  /**
   * Get user refunds
   */
  getUserRefunds(userId: string): RefundRequest[] {
    return Array.from(this.refunds.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get refund by ID
   */
  getRefund(refundId: string): RefundRequest | null {
    return this.refunds.get(refundId) || null;
  }

  // ==================== TICKETS ====================

  /**
   * Create support ticket
   */
  createTicket(data: {
    userId: string;
    type: Ticket['type'];
    priority?: Ticket['priority'];
    subject: string;
    description: string;
    channel?: Ticket['channel'];
    complaintId?: string;
  }): Ticket {
    const ticket: Ticket = {
      id: `TKT-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`,
      userId: data.userId,
      complaintId: data.complaintId,
      type: data.type,
      priority: data.priority || 'medium',
      status: 'open',
      subject: data.subject,
      description: data.description,
      channel: data.channel || 'chat',
      messages: [
        {
          id: uuidv4(),
          from: 'customer',
          content: data.description,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tickets.set(ticket.id, ticket);

    logger.info('Ticket created', {
      ticketId: ticket.id,
      userId: data.userId,
      type: data.type,
    });

    // Auto-assign based on type
    this.assignTicket(ticket.id, this.getAutoAssignee(data.type));

    return ticket;
  }

  /**
   * Get auto-assignee based on ticket type
   */
  private getAutoAssignee(type: Ticket['type']): string {
    const assignees: Record<Ticket['type'], string> = {
      'complaint': 'complaints_team',
      'refund': 'refunds_team',
      'support': 'support_team',
      'feedback': 'feedback_team',
      'sales': 'sales_team',
    };
    return assignees[type] || 'general_support';
  }

  /**
   * Assign ticket
   */
  assignTicket(ticketId: string, assignee: string): Ticket | null {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;

    const updated: Ticket = {
      ...ticket,
      assignedTo: assignee,
      status: ticket.messages.length > 1 ? 'in_progress' : 'open',
      updatedAt: new Date(),
    };

    this.tickets.set(ticketId, updated);

    // Add system message
    this.addTicketMessage(ticketId, {
      from: 'system',
      content: `Ticket assigned to ${assignee}`,
    });

    return updated;
  }

  /**
   * Add message to ticket
   */
  addTicketMessage(ticketId: string, message: Omit<TicketMessage, 'id' | 'timestamp'>): Ticket | null {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;

    const newMessage: TicketMessage = {
      id: uuidv4(),
      ...message,
      timestamp: new Date(),
    };

    const updated: Ticket = {
      ...ticket,
      messages: [...ticket.messages, newMessage],
      status: message.from === 'agent' ? 'in_progress' : ticket.status,
      updatedAt: new Date(),
    };

    this.tickets.set(ticketId, updated);
    return updated;
  }

  /**
   * Resolve ticket
   */
  resolveTicket(ticketId: string, resolution: string): Ticket | null {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;

    const updated: Ticket = {
      ...ticket,
      status: 'resolved',
      resolvedAt: new Date(),
      updatedAt: new Date(),
    };

    this.tickets.set(ticketId, updated);

    // Add resolution message
    this.addTicketMessage(ticketId, {
      from: 'system',
      content: `Resolved: ${resolution}`,
    });

    return updated;
  }

  /**
   * Get user tickets
   */
  getUserTickets(userId: string): Ticket[] {
    return Array.from(this.tickets.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get ticket by ID
   */
  getTicket(ticketId: string): Ticket | null {
    return this.tickets.get(ticketId) || null;
  }

  // ==================== ANALYTICS ====================

  /**
   * Get handler statistics
   */
  getStats() {
    const complaints = Array.from(this.complaints.values());
    const refunds = Array.from(this.refunds.values());
    const tickets = Array.from(this.tickets.values());

    return {
      complaints: {
        total: complaints.length,
        byStatus: {
          registered: complaints.filter(c => c.status === 'registered').length,
          investigating: complaints.filter(c => c.status === 'investigating').length,
          resolved: complaints.filter(c => c.status === 'resolved').length,
          escalated: complaints.filter(c => c.status === 'escalated').length,
        },
        byType: this.groupBy(complaints, 'type'),
      },
      refunds: {
        total: refunds.length,
        totalAmount: refunds.reduce((sum, r) => sum + r.amount, 0),
        byStatus: {
          pending: refunds.filter(r => r.status === 'pending').length,
          processed: refunds.filter(r => r.status === 'processed').length,
          rejected: refunds.filter(r => r.status === 'rejected').length,
        },
      },
      tickets: {
        total: tickets.length,
        byStatus: this.groupBy(tickets, 'status'),
        byPriority: this.groupBy(tickets, 'priority'),
        avgResponseTime: '2.3 hours',
      },
    };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Export singleton
export const complaintRefundHandler = new ComplaintRefundHandler();
export default complaintRefundHandler;
