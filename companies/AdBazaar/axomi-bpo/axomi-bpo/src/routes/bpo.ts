import { Router, type Response } from "express";

import {
  BpoJobStatus,
  BpoServiceType,
  type BpoJob,
  type BpoWorker,
} from "../types.js";
import { BpoService } from "../services/bpoService.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { z } from "zod";

const service = new BpoService();

// ── Zod schemas ────────────────────────────────────────────────────────

const createJobSchema = z.object({
  type: z.nativeEnum(BpoServiceType),
  clientId: z.string().uuid(),
  clientName: z.string().min(1),
  description: z.string().min(1),
  requirements: z.array(z.string()).min(1),
  priority: z.coerce.number().int().min(1),
  deadline: z.string().datetime().optional(),
});

const rateJobSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  feedback: z.string().optional(),
});

const registerWorkerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  skills: z.array(z.nativeEnum(BpoServiceType)).min(1),
});

// ── Helpers ───────────────────────────────────────────────────────────

type JsonResponse = Response<Record<string, unknown>, Record<string, unknown>>;

function sendJob(res: JsonResponse, job: BpoJob) {
  res.status(200).json({ status: "ok", data: job });
}

function sendWorker(res: JsonResponse, worker: BpoWorker) {
  res.status(200).json({ status: "ok", data: worker });
}

function sendArray<T>(res: JsonResponse, items: T[]) {
  res.status(200).json({ status: "ok", data: items, count: items.length });
}

// ── Routes ─────────────────────────────────────────────────────────────

export const bpoRoutes: Router = Router();

/**
 * @route   POST /api/bpo/jobs
 * @desc    Create a new BPO job.
 * @access  Public (authenticate in production)
 */
bpoRoutes.post(
  "/jobs",
  validateRequest(createJobSchema),
  (req, res) => {
    const body = req.validatedBody as z.infer<typeof createJobSchema>;
    const job = service.createJob(
      body.type,
      body.clientId,
      body.clientName,
      body.description,
      body.requirements,
      body.priority,
      body.deadline,
    );
    sendJob(res, job);
  },
);

/**
 * @route   GET /api/bpo/jobs/:id
 * @desc    Get a single job by ID.
 * @access  Public
 */
bpoRoutes.get("/jobs/:id", (req, res) => {
  const job = service.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ status: "error", message: "Job not found" });
  }
  sendJob(res, job);
});

/**
 * @route   GET /api/bpo/jobs/client/:clientId
 * @desc    Get all jobs for a specific client.
 * @access  Public
 */
bpoRoutes.get("/jobs/client/:clientId", (req, res) => {
  const jobs = service.getJobsByClient(req.params.clientId);
  sendArray(res, jobs);
});

/**
 * @route   GET /api/bpo/jobs/status/:status
 * @desc    Get all jobs matching a given status.
 * @access  Public
 */
bpoRoutes.get("/jobs/status/:status", (req, res) => {
  const status = req.params.status.toUpperCase() as BpoJobStatus;
  if (!Object.values(BpoJobStatus).includes(status)) {
    return res.status(400).json({ status: "error", message: `Invalid status: ${status}` });
  }
  const jobs = service.getJobsByStatus(status);
  sendArray(res, jobs);
});

/**
 * @route   POST /api/bpo/jobs/:id/assign
 * @desc    Assign a job to a worker.
 * @access  Public
 */
bpoRoutes.post("/jobs/:id/assign", (req, res) => {
  const { workerId } = req.body as { workerId: string };
  if (!workerId) {
    return res.status(400).json({ status: "error", message: "workerId is required" });
  }
  try {
    const job = service.assignJob(req.params.id, workerId);
    sendJob(res, job);
  } catch (err) {
    res.status(400).json({ status: "error", message: (err as Error).message });
  }
});

/**
 * @route   POST /api/bpo/jobs/:id/complete
 * @desc    Mark a job as completed with a result.
 * @access  Public
 */
bpoRoutes.post("/jobs/:id/complete", (req, res) => {
  const { result } = req.body as { result: string };
  if (!result) {
    return res.status(400).json({ status: "error", message: "result is required" });
  }
  try {
    const job = service.completeJob(req.params.id, result);
    sendJob(res, job);
  } catch (err) {
    res.status(400).json({ status: "error", message: (err as Error).message });
  }
});

/**
 * @route   POST /api/bpo/jobs/:id/cancel
 * @desc    Cancel a pending or assigned job.
 * @access  Public
 */
bpoRoutes.post("/jobs/:id/cancel", (req, res) => {
  const cancelled = service.cancelJob(req.params.id);
  if (!cancelled) {
    return res.status(404).json({ status: "error", message: "Job not found or cannot be cancelled" });
  }
  res.status(200).json({ status: "ok", message: "Job cancelled successfully" });
});

/**
 * @route   POST /api/bpo/jobs/:id/rate
 * @desc    Rate a completed job and update worker rating.
 * @access  Public
 */
bpoRoutes.post(
  "/jobs/:id/rate",
  validateRequest(rateJobSchema),
  (req, res) => {
    const body = req.validatedBody as z.infer<typeof rateJobSchema>;
    try {
      const job = service.rateJob(req.params.id, body.rating, body.feedback);
      sendJob(res, job);
    } catch (err) {
      res.status(400).json({ status: "error", message: (err as Error).message });
    }
  },
);

/**
 * @route   POST /api/bpo/workers
 * @desc    Register a new worker.
 * @access  Public
 */
bpoRoutes.post(
  "/workers",
  validateRequest(registerWorkerSchema),
  (req, res) => {
    const body = req.validatedBody as z.infer<typeof registerWorkerSchema>;
    try {
      const worker = service.registerWorker(body.name, body.email, body.skills);
      sendWorker(res, worker);
    } catch (err) {
      res.status(409).json({ status: "error", message: (err as Error).message });
    }
  },
);

/**
 * @route   GET /api/bpo/workers/:id
 * @desc    Get a single worker by ID.
 * @access  Public
 */
bpoRoutes.get("/workers/:id", (req, res) => {
  const worker = service.getWorker(req.params.id);
  if (!worker) {
    return res.status(404).json({ status: "error", message: "Worker not found" });
  }
  sendWorker(res, worker);
});

/**
 * @route   GET /api/bpo/workers/available
 * @desc    Get all available workers, optionally filtered by skill.
 * @query   skill - Optional BPO service type to filter by.
 * @access  Public
 */
bpoRoutes.get("/workers/available", (req, res) => {
  const skill = req.query.skill as BpoServiceType | undefined;
  const workers = service.getAvailableWorkers(skill);
  sendArray(res, workers);
});
