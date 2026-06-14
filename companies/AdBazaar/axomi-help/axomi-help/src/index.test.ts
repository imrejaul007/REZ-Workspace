import { describe, it, expect, beforeEach } from "@jest/globals";

import { TicketPriority, TicketStatus } from "./types.js";
import { HelpService } from "./services/helpService.js";

describe("HelpService", () => {
  let service: HelpService;

  beforeEach(() => {
    service = new HelpService();
  });

  // ── Ticket creation ────────────────────────────────────────────────

  describe("createTicket", () => {
    it("should create a ticket with OPEN status", () => {
      const ticket = service.createTicket(
        "user-001",
        "Cannot login",
        "I am unable to log into my account after resetting password.",
        "ACCOUNT",
        TicketPriority.HIGH,
      );

      expect(ticket.id).toBeDefined();
      expect(ticket.status).toBe(TicketStatus.OPEN);
      expect(ticket.userId).toBe("user-001");
      expect(ticket.subject).toBe("Cannot login");
      expect(ticket.description).toContain("resetting password");
      expect(ticket.category).toBe("ACCOUNT");
      expect(ticket.priority).toBe(TicketPriority.HIGH);
      expect(ticket.messages).toHaveLength(0);
      expect(ticket.createdAt).toBeDefined();
      expect(ticket.updatedAt).toBeDefined();
    });
  });

  // ── Ticket retrieval ───────────────────────────────────────────────

  describe("getTicket", () => {
    it("should return null for non-existent ticket", () => {
      expect(service.getTicket("does-not-exist")).toBeNull();
    });

    it("should return the created ticket", () => {
      const created = service.createTicket(
        "user-001",
        "Billing question",
        "Can you explain the charge on my invoice?",
        "BILLING",
        TicketPriority.MEDIUM,
      );

      const found = service.getTicket(created.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });
  });

  describe("getTicketsByUser", () => {
    it("should return all tickets for a given user", () => {
      service.createTicket("user-001", "Issue A", "Desc A", "TECH", TicketPriority.LOW);
      service.createTicket("user-001", "Issue B", "Desc B", "BILLING", TicketPriority.MEDIUM);
      service.createTicket("user-002", "Issue C", "Desc C", "TECH", TicketPriority.HIGH);

      const u1 = service.getTicketsByUser("user-001");
      expect(u1).toHaveLength(2);

      const u2 = service.getTicketsByUser("user-002");
      expect(u2).toHaveLength(1);
    });
  });

  describe("getOpenTickets", () => {
    it("should return only OPEN tickets", () => {
      const t1 = service.createTicket("u1", "Issue 1", "Desc", "TECH", TicketPriority.LOW);
      service.createTicket("u2", "Issue 2", "Desc", "TECH", TicketPriority.MEDIUM);

      // Assign and resolve one ticket.
      service.assignTicket(t1.id, "agent-001");
      service.resolveTicket(t1.id);

      const open = service.getOpenTickets();
      expect(open).toHaveLength(1);
      expect(open[0].subject).toBe("Issue 2");
    });
  });

  // ── Ticket lifecycle ───────────────────────────────────────────────

  describe("assignTicket", () => {
    it("should assign an open ticket to an agent and set status to IN_PROGRESS", () => {
      const ticket = service.createTicket("u1", "Help", "Desc", "TECH", TicketPriority.HIGH);

      const updated = service.assignTicket(ticket.id, "agent-001");

      expect(updated.status).toBe(TicketStatus.IN_PROGRESS);
      expect(updated.assignedTo).toBe("agent-001");
    });

    it("should throw when ticket is not open", () => {
      const ticket = service.createTicket("u1", "Help", "Desc", "TECH", TicketPriority.LOW);
      service.assignTicket(ticket.id, "agent-001");

      expect(() => service.assignTicket(ticket.id, "agent-002")).toThrow("not open");
    });
  });

  describe("addMessage", () => {
    it("should append a message to the ticket thread", () => {
      const ticket = service.createTicket("u1", "Help", "Desc", "TECH", TicketPriority.LOW);

      const updated = service.addMessage(ticket.id, "user-001", "John Doe", "USER", "Any update?");

      expect(updated.messages).toHaveLength(1);
      expect(updated.messages[0].content).toBe("Any update?");
      expect(updated.messages[0].senderRole).toBe("USER");
      expect(updated.messages[0].timestamp).toBeDefined();
    });

    it("should throw for non-existent ticket", () => {
      expect(() =>
        service.addMessage("fake", "user-001", "Jane", "USER", "Hello"),
      ).toThrow("not found");
    });
  });

  describe("resolveTicket", () => {
    it("should mark a ticket as resolved with resolvedAt timestamp", () => {
      const ticket = service.createTicket("u1", "Help", "Desc", "TECH", TicketPriority.LOW);

      const resolved = service.resolveTicket(ticket.id);

      expect(resolved.status).toBe(TicketStatus.RESOLVED);
      expect(resolved.resolvedAt).toBeDefined();
    });
  });

  describe("closeTicket", () => {
    it("should close a resolved ticket with closedAt timestamp", () => {
      const ticket = service.createTicket("u1", "Help", "Desc", "TECH", TicketPriority.LOW);
      service.resolveTicket(ticket.id);

      const closed = service.closeTicket(ticket.id);

      expect(closed.status).toBe(TicketStatus.CLOSED);
      expect(closed.closedAt).toBeDefined();
    });
  });

  // ── FAQ ────────────────────────────────────────────────────────────

  describe("createFaq", () => {
    it("should create an FAQ entry with zero views", () => {
      const item = service.createFaq(
        "How do I reset my password?",
        "Click 'Forgot Password' on the login page and follow the email instructions.",
        "ACCOUNT",
        ["password", "reset", "login"],
      );

      expect(item.id).toBeDefined();
      expect(item.question).toContain("reset");
      expect(item.views).toBe(0);
      expect(item.helpful).toBe(0);
      expect(item.notHelpful).toBe(0);
    });
  });

  describe("searchFaq", () => {
    beforeEach(() => {
      service.createFaq(
        "How do I reset my password?",
        "Click 'Forgot Password' on the login page.",
        "ACCOUNT",
        ["password", "reset"],
      );
      service.createFaq(
        "How do I update my email?",
        "Go to Settings > Account > Email.",
        "ACCOUNT",
        ["email", "settings"],
      );
      service.createFaq(
        "What payment methods do you accept?",
        "We accept Visa, Mastercard, and PayPal.",
        "BILLING",
        ["payment", "billing"],
      );
    });

    it("should return all items for empty query", () => {
      const results = service.searchFaq("");
      expect(results).toHaveLength(3);
    });

    it("should match against question text", () => {
      const results = service.searchFaq("password");
      expect(results).toHaveLength(1);
      expect(results[0].question).toContain("password");
    });

    it("should match against tags", () => {
      const results = service.searchFaq("billing");
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe("BILLING");
    });

    it("should match multiple terms (AND logic)", () => {
      const results = service.searchFaq("reset password");
      expect(results).toHaveLength(1);
    });
  });

  describe("getFaqByCategory", () => {
    beforeEach(() => {
      service.createFaq("Q1", "A1", "BILLING", []);
      service.createFaq("Q2", "A2", "BILLING", []);
      service.createFaq("Q3", "A3", "TECHNICAL", []);
    });

    it("should return only items in the specified category (case-insensitive)", () => {
      const results = service.getFaqByCategory("BILLING");
      expect(results).toHaveLength(2);

      const tech = service.getFaqByCategory("technical");
      expect(tech).toHaveLength(1);
    });

    it("should return empty array for unknown category", () => {
      expect(service.getFaqByCategory("NONEXISTENT")).toHaveLength(0);
    });
  });

  describe("incrementFaqViews", () => {
    it("should increment the view counter", () => {
      const item = service.createFaq("Q", "A", "CAT", []);

      service.incrementFaqViews(item.id);
      service.incrementFaqViews(item.id);
      service.incrementFaqViews(item.id);

      const found = service.searchFaq("").find((i) => i.id === item.id);
      expect(found!.views).toBe(3);
    });
  });

  describe("rateHelpfulness", () => {
    it("should not throw when called", () => {
      expect(() => service.rateHelpfulness("some-id", true)).not.toThrow();
      expect(() => service.rateHelpfulness("some-id", false)).not.toThrow();
    });
  });
});