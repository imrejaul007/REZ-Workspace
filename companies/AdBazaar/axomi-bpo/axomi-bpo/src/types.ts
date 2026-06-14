import { v4 as uuidv4 } from "uuid";

/**
 * Supported BPO service types offered through the platform.
 */
export enum BpoServiceType {
  /** Structured data entry and digitization */
  DATA_ENTRY = "DATA_ENTRY",
  /** Inbound/outbound customer support operations */
  CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT",
  /** Content review, moderation, and policy enforcement */
  CONTENT_MODERATION = "CONTENT_MODERATION",
  /** Audio/video transcription services */
  TRANSCRIPTION = "TRANSCRIPTION",
  /** Image annotation, labelling, and tagging */
  IMAGE_ANNOTATION = "IMAGE_ANNOTATION",
  /** Research, data gathering, and analysis */
  RESEARCH = "RESEARCH",
}

/**
 * Lifecycle states for a BPO job.
 */
export enum BpoJobStatus {
  /** Job created, awaiting worker assignment */
  PENDING = "PENDING",
  /** Worker assigned, not yet started */
  ASSIGNED = "ASSIGNED",
  /** Worker actively working on the job */
  IN_PROGRESS = "IN_PROGRESS",
  /** Job completed successfully */
  COMPLETED = "COMPLETED",
  /** Job terminated due to an error */
  FAILED = "FAILED",
  /** Job cancelled by client or system */
  CANCELLED = "CANCELLED",
}

/**
 * A single BPO job posted by a client.
 */
export interface BpoJob {
  /** Unique job identifier */
  id: string;
  /** Category of the BPO service */
  type: BpoServiceType;
  /** Client that posted the job */
  clientId: string;
  /** Display name of the client */
  clientName: string;
  /** Human-readable description of the task */
  description: string;
  /** Structured requirements the worker must satisfy */
  requirements: string[];
  /** Current lifecycle status */
  status: BpoJobStatus;
  /** ID of the assigned worker (set when status >= ASSIGNED) */
  assignedTo?: string;
  /** Priority level – lower values indicate higher urgency */
  priority: number;
  /** ISO date string for the expected completion deadline (optional) */
  deadline?: string;
  /** ISO date string of creation */
  createdAt: string;
  /** ISO date string of last update */
  updatedAt: string;
  /** ISO date string of completion (optional) */
  completedAt?: string;
  /** Work output / result returned by the worker (optional) */
  result?: string;
  /** Client rating from 1-5 (optional) */
  rating?: number;
  /** Client feedback text (optional) */
  feedback?: string;
}

/**
 * A worker registered on the BPO platform.
 */
export interface BpoWorker {
  /** Unique worker identifier */
  id: string;
  /** Full name of the worker */
  name: string;
  /** Contact email address */
  email: string;
  /** Skills the worker is proficient in */
  skills: BpoServiceType[];
  /** Total jobs completed successfully */
  completedJobs: number;
  /** Average rating across all completed jobs (1-5) */
  rating: number;
  /** Current availability status */
  status: "ACTIVE" | "BUSY" | "OFFLINE";
  /** ISO date string of registration */
  joinedAt: string;
}

/**
 * Creates a new BpoJob with sensible defaults.
 */
export function createBpoJob(params: {
  type: BpoServiceType;
  clientId: string;
  clientName: string;
  description: string;
  requirements: string[];
  priority: number;
  deadline?: string;
}): BpoJob {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    type: params.type,
    clientId: params.clientId,
    clientName: params.clientName,
    description: params.description,
    requirements: params.requirements,
    status: BpoJobStatus.PENDING,
    priority: params.priority,
    deadline: params.deadline,
    createdAt: now,
    updatedAt: now,
  };
}
