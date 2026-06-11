/**
 * Support AI - Customer Support Assistant
 * Part of TRIPMIND - Travel Agency AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface SupportTicket {
  id: string;
  ticketRef: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  type: 'booking_inquiry' | 'booking_modification' | 'booking_cancellation' | 'refund' | 'complaint' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
  subject: string;
  description: string;
  bookingRef?: string;
  assignedTo?: string;
  responses: { agent: string; message: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  helpful: number;
  keywords: string[];
}

export class SupportAI {
  private faqs: FAQ[] = [];
  private tickets: Map<string, SupportTicket> = new Map();

  constructor() {
    this.initializeFAQs();
  }

  private initializeFAQs(): void {
    this.faqs = [
      {
        id: '1',
        category: 'Booking',
        question: 'How can I modify my booking?',
        answer: 'You can modify your booking by logging into your account, going to "My Bookings", and clicking "Modify". You can change dates, passenger details, or upgrade your seat/hotel room. Changes are subject to availability and fare difference.',
        helpful: 245,
        keywords: ['modify', 'change', 'update', 'booking']
      },
      {
        id: '2',
        category: 'Cancellation',
        question: 'What is your cancellation policy?',
        answer: 'Our cancellation policy varies by booking type:\n- Flights: 24-hour free cancellation, then airline penalty applies\n- Hotels: Free cancellation up to 48 hours before check-in\n- Packages: 15+ days = 90% refund, 7-15 days = 50% refund, <7 days = no refund\nRefunds are processed within 7-14 business days.',
        helpful: 312,
        keywords: ['cancel', 'refund', 'policy']
      },
      {
        id: '3',
        category: 'Payment',
        question: 'What payment methods do you accept?',
        answer: 'We accept:\n- Credit/Debit Cards (Visa, Mastercard, American Express)\n- Net Banking\n- UPI/GPay/PhonePe\n- EMI options available\n- Corporate billing for business clients',
        helpful: 189,
        keywords: ['payment', 'pay', 'card', 'upi', 'emi']
      },
      {
        id: '4',
        category: 'Visa',
        question: 'Do you help with visa applications?',
        answer: 'Yes! We provide complete visa assistance for most countries. Our services include:\n- Document checklist preparation\n- Application form filling\n- Appointment booking\n- Status tracking\n- Interview preparation tips\nContact our visa desk or book through our website.',
        helpful: 276,
        keywords: ['visa', 'passport', 'application']
      },
      {
        id: '5',
        category: 'Baggage',
        question: 'What is the baggage allowance?',
        answer: 'Baggage allowances vary by airline and ticket class:\n- Economy: 15-23kg check-in + 7kg cabin\n- Business: 32kg check-in + 14kg cabin\n- Some airlines offer extra baggage at discounted rates\nYou can pre-purchase extra baggage through our website.',
        helpful: 167,
        keywords: ['baggage', 'luggage', 'bags', 'weight']
      }
    ];
  }

  async createTicket(data: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    type: SupportTicket['type'];
    priority: SupportTicket['priority'];
    subject: string;
    description: string;
    bookingRef?: string;
  }): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      id: uuidv4(),
      ticketRef: `TKT${Date.now().toString(36).toUpperCase()}`,
      ...data,
      status: 'open',
      responses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  async getTicket(ticketRef: string): Promise<SupportTicket | undefined> {
    return Array.from(this.tickets.values()).find(t => t.ticketRef === ticketRef);
  }

  async addResponse(ticketId: string, agent: string, message: string): Promise<SupportTicket | undefined> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return undefined;

    ticket.responses.push({
      agent,
      message,
      timestamp: new Date().toISOString()
    });
    ticket.status = 'in_progress';
    ticket.updatedAt = new Date().toISOString();

    this.tickets.set(ticketId, ticket);
    return ticket;
  }

  async resolveTicket(ticketId: string, resolution: string): Promise<SupportTicket | undefined> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return undefined;

    ticket.status = 'resolved';
    ticket.responses.push({
      agent: 'System',
      message: `Ticket resolved: ${resolution}`,
      timestamp: new Date().toISOString()
    });
    ticket.updatedAt = new Date().toISOString();
    ticket.resolvedAt = new Date().toISOString();

    this.tickets.set(ticketId, ticket);
    return ticket;
  }

  async searchFAQ(query: string): Promise<{ faqs: FAQ[]; answer: string }> {
    const lowerQuery = query.toLowerCase();
    const relevantFAQs = this.faqs
      .filter(faq =>
        faq.question.toLowerCase().includes(lowerQuery) ||
        faq.answer.toLowerCase().includes(lowerQuery) ||
        faq.keywords.some(k => lowerQuery.includes(k))
      )
      .sort((a, b) => b.helpful - a.helpful);

    if (relevantFAQs.length > 0) {
      return {
        faqs: relevantFAQs.slice(0, 5),
        answer: relevantFAQs[0].answer
      };
    }

    return {
      faqs: [],
      answer: "I couldn't find a specific answer to your question. Would you like me to create a support ticket for you?"
    };
  }

  async getFAQsByCategory(category: string): Promise<FAQ[]> {
    return this.faqs.filter(f => f.category === category);
  }

  async escalateTicket(ticketId: string, reason: string): Promise<SupportTicket | undefined> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return undefined;

    ticket.priority = ticket.priority === 'high' ? 'urgent' : 'high';
    ticket.responses.push({
      agent: 'System',
      message: `Ticket escalated: ${reason}`,
      timestamp: new Date().toISOString()
    });
    ticket.updatedAt = new Date().toISOString();

    this.tickets.set(ticketId, ticket);
    return ticket;
  }

  async getOpenTickets(assignee?: string): Promise<SupportTicket[]> {
    let tickets = Array.from(this.tickets.values())
      .filter(t => t.status === 'open' || t.status === 'pending' || t.status === 'in_progress');

    if (assignee) {
      tickets = tickets.filter(t => t.assignedTo === assignee);
    }

    return tickets.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  async getStats(): Promise<{
    open: number;
    pending: number;
    resolved: number;
    avgResponseTime: string;
    avgResolutionTime: string;
  }> {
    const tickets = Array.from(this.tickets.values());
    return {
      open: tickets.filter(t => t.status === 'open').length,
      pending: tickets.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
      avgResponseTime: '2.5 hours',
      avgResolutionTime: '1.2 days'
    };
  }
}

export default SupportAI;
