/**
 * Talent Platform Models
 * Shared talent infrastructure for REZ ecosystem
 */

import mongoose, { Schema, Document } from 'mongoose';

// ─── Enums ──────────────────────────────────────────────────────────────────

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance',
}

export enum WorkLocation {
  ONSITE = 'onsite',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}

export enum ApplicationStatus {
  APPLIED = 'applied',
  SCREENING = 'screening',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  HIRED = 'hired',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
}

export enum JobSource {
  INSIGHT_CAMPUS = 'insight_campus',
  HR_APP = 'hr_app',
  RESTOPAPA = 'restopapa',
  CORPPERKS = 'corpperks',
}

// ─── Job Posting Schema ─────────────────────────────────────────────────────

export interface IJobPosting extends Document {
  // Job details
  title: string;
  description: string;
  requirements: string[];
  skills: string[];

  // Type & Location
  type: JobType;
  location: {
    city: string;
    state: string;
    country: string;
    remote: boolean;
    hybrid: boolean;
  };

  // Compensation
  salary: {
    min: number;
    max: number;
    currency: string;
    period: 'monthly' | 'yearly';
    negotiable: boolean;
  };

  // Employer
  employer: {
    id: string;
    name: string;
    logo?: string;
    type: 'company' | 'restaurant' | 'startup';
    size?: string;
    industry?: string;
    verified: boolean;
  };

  // Benefits
  benefits: string[];

  // Meta
  source: JobSource;
  status: JobStatus;
  views: number;
  applications: number;

  // Dates
  postedAt: Date;
  expiresAt: Date;
  startDate?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const JobPostingSchema = new Schema<IJobPosting>(
  {
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    skills: [{ type: String, index: true }],

    type: { type: String, enum: Object.values(JobType), required: true },
    location: {
      city: { type: String, index: true },
      state: { type: String },
      country: { type: String, default: 'India' },
      remote: { type: Boolean, default: false, index: true },
      hybrid: { type: Boolean, default: false },
    },

    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'INR' },
      period: { type: String, enum: ['monthly', 'yearly'], default: 'yearly' },
      negotiable: { type: Boolean, default: true },
    },

    employer: {
      id: { type: String, required: true, index: true },
      name: { type: String, required: true },
      logo: String,
      type: { type: String, enum: ['company', 'restaurant', 'startup'], default: 'company' },
      size: String,
      industry: String,
      verified: { type: Boolean, default: false },
    },

    benefits: [{ type: String }],

    source: { type: String, enum: Object.values(JobSource), required: true },
    status: { type: String, enum: Object.values(JobStatus), default: JobStatus.DRAFT, index: true },
    views: { type: Number, default: 0 },
    applications: { type: Number, default: 0 },

    postedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    startDate: Date,
  },
  { timestamps: true }
);

// Text search index
JobPostingSchema.index({ title: 'text', description: 'text', skills: 'text' });

// ─── Application Schema ─────────────────────────────────────────────────────

export interface IApplication extends Document {
  // Links
  jobId: string;
  candidateId: string; // User ID
  employerId: string;

  // Status
  status: ApplicationStatus;
  stage: number;

  // Resume & Cover
  resume?: {
    fileUrl: string;
    parsed: boolean;
  };
  coverLetter?: string;

  // Matching
  resumeScore?: number;
  skillMatchScore?: number;
  overallScore?: number;

  // Timeline
  appliedAt: Date;
  statusHistory: {
    status: ApplicationStatus;
    changedAt: Date;
    changedBy: string;
    notes?: string;
  }[];

  // Feedback
  employerNotes?: string;
  candidateNotes?: string;
  rating?: number;

  // Interview
  interviews: {
    scheduledAt: Date;
    type: 'phone' | 'video' | 'onsite';
    status: 'scheduled' | 'completed' | 'cancelled';
    feedback?: string;
  }[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: { type: String, required: true, index: true },
    candidateId: { type: String, required: true, index: true },
    employerId: { type: String, required: true, index: true },

    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.APPLIED,
      index: true
    },
    stage: { type: Number, default: 0 },

    resume: {
      fileUrl: String,
      parsed: { type: Boolean, default: false },
    },
    coverLetter: String,

    resumeScore: Number,
    skillMatchScore: Number,
    overallScore: Number,

    appliedAt: { type: Date, default: Date.now },
    statusHistory: [{
      status: String,
      changedAt: { type: Date, default: Date.now },
      changedBy: String,
      notes: String,
    }],

    employerNotes: String,
    candidateNotes: String,
    rating: Number,

    interviews: [{
      scheduledAt: Date,
      type: { type: String, enum: ['phone', 'video', 'onsite'] },
      status: { type: String, enum: ['scheduled', 'completed', 'cancelled'] },
      feedback: String,
    }],
  },
  { timestamps: true }
);

// Compound indexes
ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
ApplicationSchema.index({ employerId: 1, status: 1 });
ApplicationSchema.index({ candidateId: 1, status: 1 });

// ─── ATS Pipeline Schema ─────────────────────────────────────────────────────

export interface IATSPipeline extends Document {
  employerId: string;
  name: string;
  isDefault: boolean;

  stages: {
    name: string;
    order: number;
    color: string;
    automations?: {
      type: 'email' | 'reminder' | 'score';
      config: any;
    }[];
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const ATSPipelineSchema = new Schema<IATSPipeline>(
  {
    employerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    stages: [{
      name: { type: String, required: true },
      order: { type: Number, required: true },
      color: { type: String, default: '#3B82F6' },
      automations: [{
        type: { type: String, enum: ['email', 'reminder', 'score'] },
        config: Schema.Types.Mixed,
      }],
    }],
  },
  { timestamps: true }
);

// ─── Employer Profile Schema ─────────────────────────────────────────────────

export interface IEmployerProfile extends Document {
  userId: string; // REZ Profile userId

  // Company info
  company: {
    name: string;
    logo?: string;
    website?: string;
    description?: string;
    industry: string;
    size: string;
    founded?: number;
    headquarters: string;
  };

  // Verification
  verified: boolean;
  verifiedAt?: Date;
  verificationDocuments: {
    type: string;
    url: string;
    uploadedAt: Date;
  }[];

  // Stats
  stats: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    hires: number;
    rating: number;
    reviewCount: number;
  };

  // Settings
  settings: {
    autoRejectAfterDays?: number;
    sendEmailNotifications: boolean;
    defaultPipeline: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const EmployerProfileSchema = new Schema<IEmployerProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },

    company: {
      name: { type: String, required: true },
      logo: String,
      website: String,
      description: String,
      industry: { type: String, required: true },
      size: { type: String, required: true },
      founded: Number,
      headquarters: { type: String, required: true },
    },

    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verificationDocuments: [{
      type: String,
      url: String,
      uploadedAt: Date,
    }],

    stats: {
      totalJobs: { type: Number, default: 0 },
      activeJobs: { type: Number, default: 0 },
      totalApplications: { type: Number, default: 0 },
      hires: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },

    settings: {
      autoRejectAfterDays: Number,
      sendEmailNotifications: { type: Boolean, default: true },
      defaultPipeline: String,
    },
  },
  { timestamps: true }
);

// ─── Export Models ───────────────────────────────────────────────────────────

export const JobPosting = mongoose.model<IJobPosting>('JobPosting', JobPostingSchema);
export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
export const ATSPipeline = mongoose.model<IATSPipeline>('ATSPipeline', ATSPipelineSchema);
export const EmployerProfile = mongoose.model<IEmployerProfile>('EmployerProfile', EmployerProfileSchema);
