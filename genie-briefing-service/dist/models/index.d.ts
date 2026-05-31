/**
 * GENIE Briefing Service - MongoDB Models
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Mongoose models for briefing storage
 */
import { Document, Model } from 'mongoose';
import { BriefingType, BriefingSection } from '../types.js';
/**
 * Briefing Schema
 */
export interface IBriefingDocument extends Document {
    id: string;
    user_id: string;
    type: BriefingType;
    date: string;
    sections: BriefingSection[];
    summary: string;
    created_at: Date;
    updated_at: Date;
}
declare let BriefingModel: Model<IBriefingDocument>;
export { BriefingModel };
export default BriefingModel;
//# sourceMappingURL=index.d.ts.map