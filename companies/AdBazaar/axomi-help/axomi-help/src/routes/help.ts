import { Router, type Response } from "express";

import {
  type FaqItem,
  type HelpTicket,
  TicketPriority,
  TicketStatus,
} from "../types.js";
import { HelpService } from "../services/helpService.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { z } from "zod";

const service = new HelpService();

// ── Zod schemas ────────────────────────────────────────────────────────

const createTicketSchema = z.object({
  userId: z.string().uuid(),
  subject: z.string().min(1).max(200),
  description: z.string().min(1),
  category: z.string().min(1),
  priority: z.nativeEnum(TicketPriority),
});

const addMessageSchema = z.object({
  senderId: z.string(),
  senderName: z.string().min(1),
  senderRole: z.enum(["USER", "AGENT", "ADMIN"]),
  content: z.string().min(1),
  attachments: z.array(z.string().url()).optional(),
});

const createFaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

const rateHelpfulnessSchema = z.object({
  helpful: z.boolean(),
});

// ── Helpers ───────────────────────────────────────────────────────────

type JsonResponse = Response<Record<string, unknown>, Record<string, unknown>>;

function sendTicket(res: JsonResponse, ticket: HelpTicket) {
  res.status(200).json({ status: "ok", data: ticket });
}

function sendFaq(res: JsonResponse, item: FaqItem) {
  res.status(200).json({ status: "ok", data: item });
}

function sendArray<T>(res: JsonResponse, items: T[]) {
  res.status(200).json({ status: "ok", data: items, count: items.length });
}

// ── Routes ─────────────────────────────────────────────────────────────

export const helpRoutes: Router = Router();

// ── Tickets ────────────────────────────────────────────────────────────

/**
 * @route   POST /api/help/tickets
 * @desc    Create a new support ticket.
 * @access  Public (authenticate in production)
 */
helpRoutes.post(
  "/tickets",
  validateRequest(createTicketSchema),
  (req, res) => {
    const body = req.validatedBody as z.infer<typeof createTicketSchema>;
    const ticket = service.createTicket(
      body.userId,
      body.subject,
      body.description,
      body.category,
      body.priority,
    );
    sendTicket(res, ticket);
  },
);

/**
 * @route   GET /api/help/tickets/:id
 * @desc    Get a single ticket by ID.
 * @access  Public
 */
helpRoutes.get("/tickets/:id", (req, res) => {
  const ticket = service.getTicket(req.params.id);
  if (!ticket) {
    return res.status(404).json({ status: "error", message: "Ticket not found" });
  }
  sendTicket(res, ticket);
});

/**
 * @route   GET /api/help/tickets/user/:userId
 * @desc    Get all tickets submitted by a specific user.
 * @access  Public
 */
helpRoutes.get("/tickets/user/:userId", (req, res) => {
  const tickets = service.getTicketsByUser(req.params.userId);
  sendArray(res, tickets);
});

/**
 * @route   GET /api/help/tickets/open
 * @desc    Get all currently open tickets.
 * @access  Public
 */
helpRoutes.get("/tickets/open", (_req, res) => {
  const tickets = service.getOpenTickets();
  sendArray(res, tickets);
});

/**
 * @route   POST /api/help/tickets/:id/assign
 * @desc    Assign a ticket to a support agent.
 * @access  Public
 */
helpRoutes.post("/tickets/:id/assign", (req, res) => {
  const { agentId } = req.body as { agentId: string };
  if (!agentId) {
    return res.status(400).json({ status: "error", message: "agentId is required" });
  }
  try {
    const ticket = service.assignTicket(req.params.id, agentId);
    sendTicket(res, ticket);
  } catch (err) {
    res.status(400).json({ status: "error", message: (err as Error).message });
  }
});

/**
 * @route   POST /api/help/tickets/:id/messages
 * @desc    Add a message to a ticket thread.
 * @access  Public
 */
helpRoutes.post(
  "/tickets/:id/messages",
  validateRequest(addMessageSchema),
  (req, res) => {
    const body = req.validatedBody as z.infer<typeof addMessageSchema>;
    try {
      const ticket = service.addMessage(
        req.params.id,
        body.senderId,
        body.senderName,
        body.senderRole,
        body.content,
      );
      sendTicket(res, ticket);
    } catch (err) {
      res.status(400).json({ status: "error", message: (err as Error).message });
    }
  },
);

/**
 * @route   POST /api/help/tickets/:id/resolve
 * @desc    Mark a ticket as resolved.
 * @access  Public
 */
helpRoutes.post("/tickets/:id/resolve", (req, res) => {
  try {
    const ticket = service.resolveTicket(req.params.id);
    sendTicket(res, ticket);
  } catch (err) {
    res.status(400).json({ status: "error", message: (err as Error).message });
  }
});

/**
 * @route   POST /api/help/tickets/:id/close
 * @desc    Close a resolved ticket.
 * @access  Public
 */
helpRoutes.post("/tickets/:id/close", (req, res) => {
  try {
    const ticket = service.closeTicket(req.params.id);
    sendTicket(res, ticket);
  } catch (err) {
    res.status(400).json({ status: "error", message: (err as Error).message });
  }
});

/**
 * @route   POST /api/help/tickets/:id/rate
 * @desc    Record whether an FAQ / ticket was helpful.
 * @access  Public
 */
helpRoutes.post(
  "/tickets/:id/rate",
  validateRequest(rateHelpfulnessSchema),
  (req, res) => {
    const body = req.validatedBody as z.infer<typeof rateHelpfulnessSchema>;
    service.rateHelpfulness(req.params.id, body.helpful);
    res.status(200).json({ status: "ok", message: "Feedback recorded" });
  },
);

// ── FAQ ─────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/help/faq/search
 * @query   q - Free-text search query.
 * @desc    Search FAQ entries by query string.
 * @access  Public
 */
helpRoutes.get("/faq/search", (req, res) => {
  const query = (req.query.q as string) ?? "";
  const results = service.searchFaq(query);
  sendArray(res, results);
});

/**
 * @route   GET /api/help/faq/category/:category
 * @desc    Get all FAQ entries in a category.
 * @access  Public
 */
helpRoutes.get("/faq/category/:category", (req, res) => {
  const results = service.getFaqByCategory(req.params.category);
  sendArray(res, results);
});

/**
 * @route   POST /api/help/faq
 * @desc    Create a new FAQ entry.
 * @access  Public (admin in production)
 */
helpRoutes.post(
  "/faq",
  validateRequest(createFaqSchema),
  (req, res) => {
    const body = req.validatedBody as z.infer<typeof createFaqSchema>;
    const item = service.createFaq(body.question, body.answer, body.category, body.tags);
    sendFaq(res, item);
  },
);

/**
 * @route   POST /api/help/faq/:id/views
 * @desc    Increment the view counter for an FAQ entry.
 * @access  Public
 */
helpRoutes.post("/faq/:id/views", (req, res) => {
  service.incrementFaqViews(req.params.id);
  res.status(200).json({ status: "ok" });
});