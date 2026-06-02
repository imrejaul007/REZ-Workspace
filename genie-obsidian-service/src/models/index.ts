/**
 * GENIE Obsidian Service - Models
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IObsidianVault extends Document {
  name: string;
  path: string;
  linked_user_id?: string;
  linked_at?: Date;
  last_sync?: Date;
  settings: {
    sync_daily_notes: boolean;
    sync_todos: boolean;
    sync_calendar: boolean;
    sync_tags: string[];
    exclude_folders: string[];
    sync_direction: 'bidirectional' | 'to_genie' | 'from_genie';
  };
  tenant_id: string;
}

const ObsidianVaultSchema = new Schema<IObsidianVault>({
  name: { type: String, required: true },
  path: { type: String, required: true },
  linked_user_id: { type: String, index: true },
  linked_at: { type: Date },
  last_sync: { type: Date },
  settings: {
    sync_daily_notes: { type: Boolean, default: true },
    sync_todos: { type: Boolean, default: true },
    sync_calendar: { type: Boolean, default: false },
    sync_tags: [{ type: String }],
    exclude_folders: { type: [String], default: ['.obsidian', '.trash'] },
    sync_direction: { type: String, enum: ['bidirectional', 'to_genie', 'from_genie'], default: 'to_genie' },
  },
  tenant_id: { type: String, required: true, index: true },
}, { timestamps: true });

ObsidianVaultSchema.index({ tenant_id: 1, linked_user_id: 1 });

export const ObsidianVault = mongoose.model<IObsidianVault>('ObsidianVault', ObsidianVaultSchema);

export interface IObsidianNote extends Document {
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

const ObsidianNoteSchema = new Schema<IObsidianNote>({
  vault_id: { type: String, required: true, index: true },
  path: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  frontmatter: { type: Schema.Types.Mixed },
  tags: [{ type: String }],
  links: [{ type: String }],
  backlinks: [{ type: String }],
  created: { type: Date, required: true },
  modified: { type: Date, required: true },
  tenant_id: { type: String, required: true, index: true },
}, { timestamps: true });

ObsidianNoteSchema.index({ tenant_id: 1, vault_id: 1, path: 1 }, { unique: true });
ObsidianNoteSchema.index({ tenant_id: 1, tags: 1 });

export const ObsidianNote = mongoose.model<IObsidianNote>('ObsidianNote', ObsidianNoteSchema);
