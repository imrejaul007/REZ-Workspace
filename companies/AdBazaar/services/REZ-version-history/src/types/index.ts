import { z } from 'zod';

// Content Types
export interface ContentItem {
  id: string;
  tenantId: string;
  entityType: EntityType;
  entityId: string;
  title: string;
  currentContent: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type EntityType = 'post' | 'page' | 'template' | 'campaign' | 'custom';

// Version Types
export interface ContentVersion {
  id: string;
  contentItemId: string;
  tenantId: string;
  versionNumber: number;
  content: string;
  title: string;
  changeType: ChangeType;
  changes: ContentChange[];
  createdBy: string;
  createdAt: Date;
  message?: string;
}

export type ChangeType = 'create' | 'update' | 'delete' | 'restore';

export interface ContentChange {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: unknown;
  newValue?: unknown;
}

// Diff Types
export interface VersionDiff {
  fromVersion: number;
  toVersion: number;
  changes: ContentChange[];
  summary: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

// Collaboration Types
export interface Collaborator {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface CollaborationEvent {
  id: string;
  contentItemId: string;
  tenantId: string;
  userId: string;
  collaborator: Collaborator;
  action: CollaborationAction;
  versionId?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export type CollaborationAction =
  | 'created'
  | 'edited'
  | 'restored'
  | 'commented'
  | 'approved'
  | 'rejected';

// Audit Log Types
export interface AuditLogEntry {
  id: string;
  contentItemId: string;
  tenantId: string;
  userId: string;
  action: AuditAction;
  versionId?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

export type AuditAction =
  | 'version_created'
  | 'version_restored'
  | 'version_compared'
  | 'content_accessed'
  | 'content_exported'
  | 'collaborator_added'
  | 'collaborator_removed';

// Tag Types
export interface VersionTag {
  id: string;
  contentItemId: string;
  versionId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
}

// Zod Schemas
export const CreateContentSchema = z.object({
  entityType: z.enum(['post', 'page', 'template', 'campaign', 'custom']),
  entityId: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateContentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  message: z.string().max(500).optional(),
});

export const CreateVersionSchema = z.object({
  content: z.string(),
  title: z.string().min(1).max(200).optional(),
  changeType: z.enum(['create', 'update', 'delete']).default('update'),
  message: z.string().max(500).optional(),
});

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
});

export const AddCollaboratorSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().url().optional(),
});

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
