import { v4 as uuidv4 } from "uuid";

/**
 * Current state of a support ticket.
 */
export enum TicketStatus {
  /** Ticket has been opened but not yet picked up */
  OPEN = "OPEN",
  /** Agent has claimed the ticket and is actively working on it */
  IN_PROGRESS = "IN_PROGRESS",
  /** The issue has been resolved by the agent */
  RESOLVED = "RESOLVED",
  /** Ticket is closed (resolved tickets can be closed manually) */
  CLOSED = "CLOSED",
}

/**
 * Urgency level of a support ticket.
 */
export enum TicketPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

/**
 * A message exchanged within a support ticket thread.
 */
export interface TicketMessage {
  /** Unique message identifier */
  id: string;
  /** ID of the sender (user or agent) */
  senderId: string;
  /** Display name of the sender */
  senderName: string;
  /** Role determining who can see / send this message */
  senderRole: "USER" | "AGENT" | "ADMIN";
  /** Text content of the message */
  content: string;
  /** ISO date string when the message was sent */
  timestamp: string;
  /** Optional list of attachment URLs (not stored or validated here) */
  attachments: string[];
}

/**
 * A help-desk support ticket submitted by an end user.
 */
export interface HelpTicket {
  /** Unique ticket identifier */
  id: string;
  /** ID of the user who opened the ticket */
  userId: string;
  /** Short subject line */
  subject: string;
  /** Detailed description of the issue */
  description: string;
  /** Category for routing (e.g. BILLING, TECHNICAL, ACCOUNT) */
  category: string;
  /** Urgency level */
  priority: TicketPriority;
  /** Current ticket state */
  status: TicketStatus;
  /** ID of the assigned support agent (optional) */
  assignedTo?: string;
  /** Chronological list of messages in the ticket thread */
  messages: TicketMessage[];
  /** ISO date string when the ticket was created */
  createdAt: string;
  /** ISO date string when the ticket was last updated */
  updatedAt: string;
  /** ISO date string when the ticket was resolved (optional) */
  resolvedAt?: string;
  /** ISO date string when the ticket was closed (optional) */
  closedAt?: string;
}

/**
 * A frequently-asked question entry for the self-service knowledge base.
 */
export interface FaqItem {
  /** Unique FAQ entry identifier */
  id: string;
  /** The question text */
  question: string;
  /** The answer text */
  answer: string;
  /** Category this FAQ belongs to */
  category: string;
  /** Tags for search and filtering */
  tags: string[];
  /** Number of times this FAQ has been viewed */
  views: number;
  /** Count of users who marked this as helpful */
  helpful: number;
  /** Count of users who marked this as not helpful */
  notHelpful: number;
}

/**
 * Creates a new HelpTicket with default values.
 */
export function createHelpTicket(params: {
  userId: string;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
}): HelpTicket {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    userId: params.userId,
    subject: params.subject,
    description: params.description,
    category: params.category,
    priority: params.priority,
    status: TicketStatus.OPEN,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates a new TicketMessage.
 */
export function createTicketMessage(params: {
  senderId: string;
  senderName: string;
  senderRole: "USER" | "AGENT" | "ADMIN";
  content: string;
  attachments?: string[];
}): TicketMessage {
  return {
    id: uuidv4(),
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole,
    content: params.content,
    timestamp: new Date().toISOString(),
    attachments: params.attachments ?? [],
  };
}

/**
 * Creates a new FaqItem.
 */
export function createFaqItem(params: {
  question: string;
  answer: string;
  category: string;
  tags: string[];
}): FaqItem {
  return {
    id: uuidv4(),
    question: params.question,
    answer: params.answer,
    category: params.category,
    tags: params.tags,
    views: 0,
    helpful: 0,
    notHelpful: 0,
  };
}
