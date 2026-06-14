import { v4 as uuidv4 } from "uuid";

import {
  type BpoJob,
  BpoJobStatus,
  BpoServiceType,
  type BpoWorker,
  createBpoJob,
} from "../types.js";

/**
 * Service layer for BPO job and worker management.
 *
 * All methods are pure synchronous operations against in-memory stores,
 * making them trivially testable and requiring no external database.
 */
export class BpoService {
  private readonly jobs: Map<string, BpoJob> = new Map();
  private readonly workers: Map<string, BpoWorker> = new Map();

  // ── Jobs ──────────────────────────────────────────────────────────────

  /**
   * Create a new BPO job.
   * @param type - The BPO service category.
   * @param clientId - Unique identifier of the posting client.
   * @param clientName - Display name of the client.
   * @param description - Free-text description of the task.
   * @param requirements - Structured requirements the worker must meet.
   * @param priority - Numeric priority (lower = more urgent).
   * @param deadline - Optional ISO date string for the expected completion.
   * @returns The newly created BpoJob.
   */
  createJob(
    type: BpoServiceType,
    clientId: string,
    clientName: string,
    description: string,
    requirements: string[],
    priority: number,
    deadline?: string,
  ): BpoJob {
    const job = createBpoJob({ type, clientId, clientName, description, requirements, priority, deadline });
    this.jobs.set(job.id, job);
    return job;
  }

  /**
   * Retrieve a job by its ID.
   * @param jobId - The unique job identifier.
   * @returns The job, or null if not found.
   */
  getJob(jobId: string): BpoJob | null {
    return this.jobs.get(jobId) ?? null;
  }

  /**
   * Retrieve all jobs posted by a specific client.
   * @param clientId - The client identifier.
   * @returns Array of jobs (possibly empty).
   */
  getJobsByClient(clientId: string): BpoJob[] {
    return Array.from(this.jobs.values()).filter((j) => j.clientId === clientId);
  }

  /**
   * Retrieve all jobs matching a given status.
   * @param status - The job status to filter by.
   * @returns Array of jobs with the specified status.
   */
  getJobsByStatus(status: BpoJobStatus): BpoJob[] {
    return Array.from(this.jobs.values()).filter((j) => j.status === status);
  }

  /**
   * Assign a job to a worker.
   * Validates that the job is still pending and the worker exists.
   * @param jobId - The job to assign.
   * @param workerId - The worker to assign it to.
   * @returns The updated job.
   * @throws Error if the job is not pending or the worker is not found.
   */
  assignJob(jobId: string, workerId: string): BpoJob {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    if (job.status !== BpoJobStatus.PENDING) {
      throw new Error(`Job ${jobId} is not pending (current: ${job.status})`);
    }
    const worker = this.workers.get(workerId);
    if (!worker) throw new Error(`Worker not found: ${workerId}`);

    job.status = BpoJobStatus.ASSIGNED;
    job.assignedTo = workerId;
    job.updatedAt = new Date().toISOString();
    worker.status = "BUSY";
    return job;
  }

  /**
   * Mark a job as completed with the worker's result.
   * @param jobId - The job to complete.
   * @param result - The work output delivered by the worker.
   * @returns The updated job.
   * @throws Error if the job is not assigned/in-progress or not found.
   */
  completeJob(jobId: string, result: string): BpoJob {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    if (job.status !== BpoJobStatus.ASSIGNED && job.status !== BpoJobStatus.IN_PROGRESS) {
      throw new Error(`Job ${jobId} cannot be completed (current: ${job.status})`);
    }

    const now = new Date().toISOString();
    job.status = BpoJobStatus.COMPLETED;
    job.result = result;
    job.completedAt = now;
    job.updatedAt = now;

    if (job.assignedTo) {
      const worker = this.workers.get(job.assignedTo);
      if (worker) {
        worker.status = "ACTIVE";
        worker.completedJobs += 1;
      }
    }

    return job;
  }

  /**
   * Cancel a pending or assigned job.
   * @param jobId - The job to cancel.
   * @returns True if the job was cancelled, false if not found.
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    if (job.status === BpoJobStatus.COMPLETED || job.status === BpoJobStatus.CANCELLED) {
      return false;
    }

    const now = new Date().toISOString();
    job.status = BpoJobStatus.CANCELLED;
    job.updatedAt = now;

    if (job.assignedTo) {
      const worker = this.workers.get(job.assignedTo);
      if (worker) worker.status = "ACTIVE";
    }

    return true;
  }

  /**
   * Rate a completed job and update the worker's average rating.
   * @param jobId - The completed job to rate.
   * @param rating - Numeric rating from 1 to 5.
   * @param feedback - Optional textual feedback from the client.
   * @returns The updated job.
   * @throws Error if the job is not completed or rating is out of range.
   */
  rateJob(jobId: string, rating: number, feedback?: string): BpoJob {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    if (job.status !== BpoJobStatus.COMPLETED) {
      throw new Error(`Job ${jobId} is not completed (current: ${job.status})`);
    }
    if (rating < 1 || rating > 5) {
      throw new Error(`Rating must be between 1 and 5, got ${rating}`);
    }

    job.rating = rating;
    job.feedback = feedback;
    job.updatedAt = new Date().toISOString();

    if (job.assignedTo) {
      const worker = this.workers.get(job.assignedTo);
      if (worker) {
        const totalRating = worker.rating * (worker.completedJobs - 1) + rating;
        worker.rating = Math.round((totalRating / worker.completedJobs) * 100) / 100;
      }
    }

    return job;
  }

  // ── Workers ───────────────────────────────────────────────────────────

  /**
   * Register a new worker on the platform.
   * @param name - Full name of the worker.
   * @param email - Contact email (must be unique).
   * @param skills - Array of BPO service types the worker can handle.
   * @returns The newly registered BpoWorker.
   * @throws Error if a worker with the same email already exists.
   */
  registerWorker(name: string, email: string, skills: BpoServiceType[]): BpoWorker {
    const existing = Array.from(this.workers.values()).find((w) => w.email === email);
    if (existing) throw new Error(`Worker with email ${email} already exists`);

    const worker: BpoWorker = {
      id: uuidv4(),
      name,
      email,
      skills,
      completedJobs: 0,
      rating: 0,
      status: "ACTIVE",
      joinedAt: new Date().toISOString(),
    };
    this.workers.set(worker.id, worker);
    return worker;
  }

  /**
   * Retrieve all workers who are currently available (status === ACTIVE).
   * Optionally filter to workers who possess a specific skill.
   * @param skill - Optional skill filter.
   * @returns Array of available workers.
   */
  getAvailableWorkers(skill?: BpoServiceType): BpoWorker[] {
    return Array.from(this.workers.values()).filter((w) => {
      if (w.status !== "ACTIVE") return false;
      if (skill && !w.skills.includes(skill)) return false;
      return true;
    });
  }

  /**
   * Retrieve a single worker by ID.
   * @param workerId - The worker identifier.
   * @returns The worker, or null if not found.
   */
  getWorker(workerId: string): BpoWorker | null {
    return this.workers.get(workerId) ?? null;
  }
}