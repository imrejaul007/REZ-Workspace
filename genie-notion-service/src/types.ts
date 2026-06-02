/**
 * GENIE Notion Service - Type Definitions
 * Version: 1.0.0 | Date: June 1, 2026
 * Purpose: Notion workspace sync for GENIE Personal Intelligence OS
 */

import { z } from 'zod';

export interface NotionWorkspace {
  id: string;
  workspace_name: string;
  workspace_icon?: string;
  linked_user_id?: string;
  linked_at?: Date;
  last_sync?: Date;
  settings: NotionSettings;
  tenant_id: string;
  created_at: Date;
}

export interface NotionSettings {
  sync_databases: boolean;
  sync_pages: boolean;
  sync_comments: boolean;
  filter_databases: string[];
  sync_direction: 'bidirectional' | 'to_genie' | 'from_genie';
}

export interface NotionDatabase {
  id: string;
  workspace_id: string;
  title: string;
  properties: Record<string, any>;
  linked_user_id?: string;
  tenant_id: string;
  last_synced?: Date;
}

export interface NotionPage {
  id: string;
  database_id?: string;
  workspace_id: string;
  title: string;
  content: any[];
  properties: Record<string, any>;
  url: string;
  linked_user_id?: string;
  tenant_id: string;
  created_time: Date;
  last_edited_time: Date;
}

export const NotionSettingsSchema = z.object({
  sync_databases: z.boolean().default(true),
  sync_pages: z.boolean().default(true),
  sync_comments: z.boolean().default(false),
  filter_databases: z.array(z.string()).default([]),
  sync_direction: z.enum(['bidirectional', 'to_genie', 'from_genie']).default('to_genie'),
});

export interface APIResponse<T> { success: boolean; data?: T; error?: { code: string; message: string }; meta: { timestamp: string } }
export interface TenantContext { tenant_id: string; user_id?: string }
declare global { namespace Express { interface Request { tenantContext?: TenantContext; userId?: string } } }
