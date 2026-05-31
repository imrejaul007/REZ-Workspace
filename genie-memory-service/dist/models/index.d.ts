/**
 * GENIE Memory Service - MongoDB Models
 * Version: 1.0.0 | Date: May 31, 2026
 * Purpose: Mongoose models for memory storage
 */
import { Document, Model } from 'mongoose';
import { MemoryCategory, ImportanceLevel, EmotionalTone, MemorySource } from '../types.js';
/**
 * Memory Schema
 */
export interface IMemoryDocument extends Document {
    id: string;
    user_id: string;
    content: string;
    summary?: string;
    category: MemoryCategory;
    tags: string[];
    entities: string[];
    importance: ImportanceLevel;
    emotional_tone?: EmotionalTone;
    source: MemorySource;
    context?: string;
    related_memory_ids: string[];
    recall_count: number;
    last_recalled?: Date;
    created_at: Date;
    updated_at: Date;
    expires_at?: Date;
}
declare let MemoryModel: Model<IMemoryDocument>;
export { MemoryModel };
export default MemoryModel;
//# sourceMappingURL=index.d.ts.map