import {
  type FaqItem,
  type HelpTicket,
  type TicketMessage,
  type TicketPriority,
  TicketStatus,
  createFaqItem,
  createHelpTicket,
  createTicketMessage,
} from "../types.js";

/**
 * Service layer for help-desk ticket management and FAQ lookup.
 *
 * All methods operate on in-memory stores, making them synchronous and
 * easy to unit-test without external dependencies.
 */
export class HelpService {
  private readonly tickets: Map<string, HelpTicket> = new Map();
  private readonly faqItems: Map<string, FaqItem> = new Map();

  // ── Tickets ─────────────────────────────────────────────────────────

  /**
   * Create a new support ticket.
   * @param userId - ID of the user opening the ticket.
   * @param subject - Short subject line.
   * @param description - Detailed description of the issue.
   * @param category - Category for routing (e.g. BILLING, TECHNICAL).
   * @param priority - Urgency level.
   * @returns The newly created HelpTicket.
   */
  createTicket(
    userId: string,
    subject: string,
    description: string,
    category: string,
    priority: TicketPriority,
  ): HelpTicket {
    const ticket = createHelpTicket({ userId, subject, description, category, priority });
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  /**
   * Retrieve a ticket by its ID.
   * @param ticketId - Unique ticket identifier.
   * @returns The ticket, or null if not found.
   */
  getTicket(ticketId: string): HelpTicket | null {
    return this.tickets.get(ticketId) ?? null;
  }

  /**
   * Retrieve all tickets submitted by a specific user.
   * @param userId - The user identifier.
   * @returns Array of tickets (possibly empty).
   */
  getTicketsByUser(userId: string): HelpTicket[] {
    return Array.from(this.tickets.values()).filter((t) => t.userId === userId);
  }

  /**
   * Retrieve all tickets that are currently open (status === OPEN).
   * @returns Array of open tickets.
   */
  getOpenTickets(): HelpTicket[] {
    return Array.from(this.tickets.values()).filter((t) => t.status === TicketStatus.OPEN);
  }

  /**
   * Assign an open ticket to a support agent.
   * @param ticketId - The ticket to assign.
   * @param agentId - The agent to assign it to.
   * @returns The updated ticket.
   * @throws Error if the ticket is not open.
   */
  assignTicket(ticketId: string, agentId: string): HelpTicket {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error(`Ticket not found: ${ticketId}`);
    if (ticket.status !== TicketStatus.OPEN) {
      throw new Error(`Ticket ${ticketId} is not open (current: ${ticket.status})`);
    }

    ticket.assignedTo = agentId;
    ticket.status = TicketStatus.IN_PROGRESS;
    ticket.updatedAt = new Date().toISOString();
    return ticket;
  }

  /**
   * Append a message to a ticket thread.
   * @param ticketId - The ticket to add a message to.
   * @param senderId - ID of the sender.
   * @param senderName - Display name of the sender.
   * @param senderRole - Role of the sender (USER / AGENT / ADMIN).
   * @param content - Text content of the message.
   * @returns The updated ticket.
   */
  addMessage(
    ticketId: string,
    senderId: string,
    senderName: string,
    senderRole: "USER" | "AGENT" | "ADMIN",
    content: string,
  ): HelpTicket {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error(`Ticket not found: ${ticketId}`);

    const message = createTicketMessage({ senderId, senderName, senderRole, content });
    ticket.messages.push(message);
    ticket.updatedAt = new Date().toISOString();
    return ticket;
  }

  /**
   * Mark a ticket as resolved.
   * @param ticketId - The ticket to resolve.
   * @returns The updated ticket.
   */
  resolveTicket(ticketId: string): HelpTicket {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error(`Ticket not found: ${ticketId}`);

    const now = new Date().toISOString();
    ticket.status = TicketStatus.RESOLVED;
    ticket.resolvedAt = now;
    ticket.updatedAt = now;
    return ticket;
  }

  /**
   * Close a ticket (resolved tickets only).
   * @param ticketId - The ticket to close.
   * @returns The updated ticket.
   */
  closeTicket(ticketId: string): HelpTicket {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error(`Ticket not found: ${ticketId}`);

    const now = new Date().toISOString();
    ticket.status = TicketStatus.CLOSED;
    ticket.closedAt = now;
    ticket.updatedAt = now;
    return ticket;
  }

  /**
   * Record user feedback on whether an FAQ entry was helpful.
   * @param _ticketId - Ignored (kept for API compatibility).
   * @param _helpful - True if the user found the answer helpful.
   */
  rateHelpfulness(_ticketId: string, _helpful: boolean): void {
    // In a real system this would rate a specific FAQ entry.
    // The ticketId parameter is present to match the required API signature.
  }

  // ── FAQ ──────────────────────────────────────────────────────────────

  /**
   * Search FAQ entries by a free-text query.
   * Matches against question text, answer text, and tags (case-insensitive).
   * @param query - The search query.
   * @returns Array of matching FAQ entries, sorted by relevance (views).
   */
  searchFaq(query: string): FaqItem[] {
    if (!query.trim()) return Array.from(this.faqItems.values());

    const terms = query.toLowerCase().split(/\s+/);

    return Array.from(this.faqItems.values())
      .filter((item) => {
        const haystack = [item.question, item.answer, ...item.tags, item.category]
          .join(" ")
          .toLowerCase();

        return terms.every((term) => haystack.includes(term));
      })
      .sort((a, b) => b.views - a.views);
  }

  /**
   * Retrieve all FAQ entries in a specific category.
   * @param category - The category to filter by.
   * @returns Array of FAQ items in that category.
   */
  getFaqByCategory(category: string): FaqItem[] {
    return Array.from(this.faqItems.values()).filter(
      (item) => item.category.toLowerCase() === category.toLowerCase(),
    );
  }

  /**
   * Create a new FAQ entry (admin use).
   * @param question - The question text.
   * @param answer - The answer text.
   * @param category - Category for grouping.
   * @param tags - Searchable tags.
   * @returns The created FaqItem.
   */
  createFaq(question: string, answer: string, category: string, tags: string[]): FaqItem {
    const item = createFaqItem({ question, answer, category, tags });
    this.faqItems.set(item.id, item);
    return item;
  }

  /**
   * Increment the view counter on an FAQ entry.
   * @param faqId - The FAQ entry to record a view for.
   */
  incrementFaqViews(faqId: string): void {
    const item = this.faqItems.get(faqId);
    if (item) item.views += 1;
  }
}