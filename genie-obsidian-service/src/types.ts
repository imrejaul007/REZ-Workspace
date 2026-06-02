/**
 * GENIE Obsidian Service - Type Definitions
 * Version: 1.0.0 | Date: June 1, 2026
 * Purpose: Obsidian vault sync for GENIE Personal Intelligence OS
 */

import { z } from 'zod';

// ============================================================================
// Core Types
// ============================================================================

export interface ObsidianVault {
  id: string;
  name: string;
  path: string;
  linked_user_id?: string;
  linked_at?: Date;
  last_sync?: Date;
  settings: ObsidianSettings;
  tenant_id: string;
  created_at: Date;
  updated_at?: Date;
}

export interface ObsidianSettings {
  sync_daily_notes: boolean;
  sync_todos: boolean;
  sync_calendar: boolean;
  sync_tags: string[];
  exclude_folders: string[];
  sync_direction: 'bidirectional' | 'to_genie' | 'from_genie';
}

export interface ObsidianNote {
  id: string;
  vault_id: string;
  path: string;
  title: string;
  content: string;
  frontmatter?: Record<string, unknown>;
  tags: string[];
  links: string[];
  backlinks: string[];
  created: Date;
  modified: Date;
  tenant_id: string;
}

export interface ObsidianSyncJob {
  id: string;
  vault_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  notes_synced: number;
  errors: string[];
  started_at: Date;
  completed_at?: Date;
  tenant_id: string;
}

// ============================================================================
// Zod Schemas
// ============================================================================

export const ObsidianSettingsSchema = z.object({
  sync_daily_notes: z.boolean().default(true),
  sync_todos: z.boolean().default(true),
  sync_calendar: z.boolean().default(false),
  sync_tags: z.array(z.string()).default([]),
  exclude_folders: z.array(z.string()).default(['.obsidian', '.trash']),
  sync_direction: z.enum(['bidirectional', 'to_genie', 'from_genie']).default('to_genie'),
});

export const CreateVaultSchema = z.object({
  name: z.string().min(1).max(100),
  path: z.string().min(1),
  settings: ObsidianSettingsSchema.optional(),
});

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta: { timestamp: string; requestId: string };
}

export interface TenantContext {
  tenant_id: string;
  user_id?: string;
}

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
      userId?: string;
    }
  }
}
