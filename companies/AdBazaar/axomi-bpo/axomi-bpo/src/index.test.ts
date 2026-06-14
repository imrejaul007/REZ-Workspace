import { describe, it, expect, beforeEach } from "@jest/globals";

import { BpoJobStatus, BpoServiceType } from "./types.js";
import { BpoService } from "./services/bpoService.js";

describe("BpoService", () => {
  let service: BpoService;

  beforeEach(() => {
    service = new BpoService();
  });

  // ── Job creation ────────────────────────────────────────────────────

  describe("createJob", () => {
    it("should create a job with PENDING status and auto-generated ID", () => {
      const job = service.createJob(
        BpoServiceType.DATA_ENTRY,
        "client-001",
        "Acme Corp",
        "Enter 1000 invoices into spreadsheet",
        ["Excel proficiency", "Attention to detail"],
        2,
      );

      expect(job.id).toBeDefined();
      expect(job.id.length).toBeGreaterThan(0);
      expect(job.status).toBe(BpoJobStatus.PENDING);
      expect(job.type).toBe(BpoServiceType.DATA_ENTRY);
      expect(job.clientId).toBe("client-001");
      expect(job.clientName).toBe("Acme Corp");
      expect(job.description).toBe("Enter 1000 invoices into spreadsheet");
      expect(job.requirements).toHaveLength(2);
      expect(job.priority).toBe(2);
      expect(job.createdAt).toBeDefined();
      expect(job.updatedAt).toBeDefined();
    });

    it("should set an optional deadline when provided", () => {
      const deadline = "2026-12-31T23:59:59.000Z";
      const job = service.createJob(
        BpoServiceType.TRANSCRIPTION,
        "client-001",
        "MediaCo",
        "Transcribe 50 hours of podcast audio",
        ["English fluency", "Fast typing"],
        1,
        deadline,
      );

      expect(job.deadline).toBe(deadline);
    });
  });

  // ── Job retrieval ───────────────────────────────────────────────────

  describe("getJob", () => {
    it("should return null for a non-existent job", () => {
      expect(service.getJob("does-not-exist")).toBeNull();
    });

    it("should return the created job", () => {
      const created = service.createJob(
        BpoServiceType.CONTENT_MODERATION,
        "client-002",
        "SocialApp",
        "Review flagged posts",
        ["Knowledge of community guidelines"],
        3,
      );

      const found = service.getJob(created.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });
  });

  describe("getJobsByClient", () => {
    it("should return all jobs for a given client", () => {
      service.createJob(BpoServiceType.DATA_ENTRY, "client-001", "Acme", "Task 1", ["x"], 1);
      service.createJob(BpoServiceType.TRANSCRIPTION, "client-001", "Acme", "Task 2", ["y"], 2);
      service.createJob(BpoServiceType.RESEARCH, "client-002", "Beta", "Task 3", ["z"], 1);

      const client1Jobs = service.getJobsByClient("client-001");
      expect(client1Jobs).toHaveLength(2);

      const client2Jobs = service.getJobsByClient("client-002");
      expect(client2Jobs).toHaveLength(1);
    });
  });

  describe("getJobsByStatus", () => {
    it("should filter jobs by status", () => {
      const j1 = service.createJob(BpoServiceType.DATA_ENTRY, "c1", "C", "D1", [], 1);
      service.createJob(BpoServiceType.DATA_ENTRY, "c2", "C", "D2", [], 1);

      // Cancel one job.
      service.cancelJob(j1.id);

      const pending = service.getJobsByStatus(BpoJobStatus.PENDING);
      const cancelled = service.getJobsByStatus(BpoJobStatus.CANCELLED);

      expect(pending).toHaveLength(1);
      expect(cancelled).toHaveLength(1);
    });
  });

  // ── Worker registration ──────────────────────────────────────────────

  describe("registerWorker", () => {
    it("should register a worker with ACTIVE status", () => {
      const worker = service.registerWorker(
        "Alice Smith",
        "alice@example.com",
        [BpoServiceType.DATA_ENTRY, BpoServiceType.TRANSCRIPTION],
      );

      expect(worker.id).toBeDefined();
      expect(worker.name).toBe("Alice Smith");
      expect(worker.email).toBe("alice@example.com");
      expect(worker.skills).toContain(BpoServiceType.DATA_ENTRY);
      expect(worker.status).toBe("ACTIVE");
      expect(worker.completedJobs).toBe(0);
      expect(worker.rating).toBe(0);
    });

    it("should throw when email is already registered", () => {
      service.registerWorker("Bob", "dup@example.com", [BpoServiceType.DATA_ENTRY]);

      expect(() =>
        service.registerWorker("Carol", "dup@example.com", [BpoServiceType.RESEARCH]),
      ).toThrow("already exists");
    });
  });

  describe("getWorker", () => {
    it("should return null for unknown worker", () => {
      expect(service.getWorker("unknown")).toBeNull();
    });
  });

  describe("getAvailableWorkers", () => {
    it("should return only ACTIVE workers", () => {
      const w1 = service.registerWorker("Alice", "alice@example.com", [BpoServiceType.DATA_ENTRY]);
      service.registerWorker("Bob", "bob@example.com", [BpoServiceType.CUSTOMER_SUPPORT]);

      // Assign a job to Alice so she becomes BUSY.
      const job = service.createJob(BpoServiceType.DATA_ENTRY, "c1", "C", "D", [], 1);
      service.assignJob(job.id, w1.id);

      const available = service.getAvailableWorkers();
      expect(available).toHaveLength(1);
      expect(available[0].name).toBe("Bob");
    });

    it("should filter by skill when provided", () => {
      service.registerWorker("Alice", "alice@example.com", [BpoServiceType.DATA_ENTRY]);
      service.registerWorker("Bob", "bob@example.com", [BpoServiceType.CUSTOMER_SUPPORT]);

      const transcriptionWorkers = service.getAvailableWorkers(BpoServiceType.TRANSCRIPTION);
      expect(transcriptionWorkers).toHaveLength(0);

      const dataWorkers = service.getAvailableWorkers(BpoServiceType.DATA_ENTRY);
      expect(dataWorkers).toHaveLength(1);
    });
  });

  // ── Job lifecycle ───────────────────────────────────────────────────

  describe("assignJob", () => {
    it("should assign a pending job to a worker and update status to ASSIGNED", () => {
      const worker = service.registerWorker("Alice", "alice@example.com", [BpoServiceType.DATA_ENTRY]);
      const job = service.createJob(BpoServiceType.DATA_ENTRY, "c1", "C", "D", [], 1);

      const updated = service.assignJob(job.id, worker.id);

      expect(updated.status).toBe(BpoJobStatus.ASSIGNED);
      expect(updated.assignedTo).toBe(worker.id);
      expect(updated.updatedAt).toBeDefined();
    });

    it("should throw when job is not pending", () => {
      const worker = service.registerWorker("Alice", "alice@example.com", [BpoServiceType.DATA_ENTRY]);
      const job = service.createJob(BpoServiceType.DATA_ENTRY, "c1", "C", "D", [], 1);
      service.assignJob(job.id, worker.id);

      expect(() => service.assignJob(job.id, worker.id)).toThrow("not pending");
    });

    it("should throw for non-existent job", () => {
      expect(() => service.assignJob("fake-job", "fake-worker")).toThrow("not found");
    });
  });

  describe("completeJob", () => {
    it("should mark a job as COMPLETED with the result", () => {
      const worker = service.registerWorker("Alice", "alice@example.com", [BpoServiceType.TRANSCRIPTION]);
      const job = service.createJob(BpoServiceType.TRANSCRIPTION, "c1", "C", "D", [], 1);
      service.assignJob(job.id, worker.id);

      const completed = service.completeJob(job.id, "Transcription completed: 50 pages");

      expect(completed.status).toBe(BpoJobStatus.COMPLETED);
      expect(completed.result).toBe("Transcription completed: 50 pages");
      expect(completed.completedAt).toBeDefined();
    });

    it("should throw when job is still PENDING", () => {
      const job = service.createJob(BpoServiceType.RESEARCH, "c1", "C", "D", [], 1);

      expect(() => service.completeJob(job.id, "Done")).toThrow("cannot be completed");
    });
  });

  describe("cancelJob", () => {
    it("should cancel a pending job and return true", () => {
      const job = service.createJob(BpoServiceType.RESEARCH, "c1", "C", "D", [], 1);

      const result = service.cancelJob(job.id);

      expect(result).toBe(true);
      const cancelled = service.getJob(job.id);
      expect(cancelled!.status).toBe(BpoJobStatus.CANCELLED);
    });

    it("should return false for a completed job", () => {
      const worker = service.registerWorker("Alice", "alice@example.com", [BpoServiceType.DATA_ENTRY]);
      const job = service.createJob(BpoServiceType.DATA_ENTRY, "c1", "C", "D", [], 1);
      service.assignJob(job.id, worker.id);
      service.completeJob(job.id, "Done");

      expect(service.cancelJob(job.id)).toBe(false);
    });

    it("should return false for non-existent job", () => {
      expect(service.cancelJob("fake")).toBe(false);
    });
  });

  describe("rateJob", () => {
    it("should set rating and feedback on a completed job", () => {
      const worker = service.registerWorker("Alice", "alice@example.com", [BpoServiceType.DATA_ENTRY]);
      const job = service.createJob(BpoServiceType.DATA_ENTRY, "c1", "C", "D", [], 1);
      service.assignJob(job.id, worker.id);
      service.completeJob(job.id, "Done");

      const rated = service.rateJob(job.id, 5, "Excellent work!");

      expect(rated.rating).toBe(5);
      expect(rated.feedback).toBe("Excellent work!");
    });

    it("should throw for rating out of range", () => {
      const worker = service.registerWorker("Alice", "alice@example.com", [BpoServiceType.DATA_ENTRY]);
      const job = service.createJob(BpoServiceType.DATA_ENTRY, "c1", "C", "D", [], 1);
      service.assignJob(job.id, worker.id);
      service.completeJob(job.id, "Done");

      expect(() => service.rateJob(job.id, 0)).toThrow("between 1 and 5");
      expect(() => service.rateJob(job.id, 6)).toThrow("between 1 and 5");
    });

    it("should update worker rating after rating a job", () => {
      const worker = service.registerWorker("Bob", "bob@example.com", [BpoServiceType.TRANSCRIPTION]);
      const job = service.createJob(BpoServiceType.TRANSCRIPTION, "c1", "C", "D", [], 1);
      service.assignJob(job.id, worker.id);
      service.completeJob(job.id, "Done");
      service.rateJob(job.id, 4, "Good job");

      const updated = service.getWorker(worker.id);
      expect(updated!.rating).toBe(4);
    });
  });
});
