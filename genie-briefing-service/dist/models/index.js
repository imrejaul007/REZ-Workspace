/**
 * GENIE Briefing Service - MongoDB Models
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Mongoose models for briefing storage
 */
import mongoose, { Schema } from 'mongoose';
// ============================================================================
// Schema Definitions
// ============================================================================
/**
 * Briefing Item Schema
 */
const BriefingItemSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
    },
    completed: { type: Boolean, default: false },
    action_url: { type: String },
}, { _id: false });
/**
 * Briefing Section Schema
 */
const BriefingSectionSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['calendar', 'tasks', 'followups', 'weather', 'insights', 'reminders'],
    },
    title: { type: String, required: true },
    items: [BriefingItemSchema],
}, { _id: false });
const BriefingSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    type: {
        type: String,
        required: true,
        enum: ['morning', 'evening'],
        index: true,
    },
    date: {
        type: String,
        required: true,
        index: true,
    },
    sections: [BriefingSectionSchema],
    summary: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}, {
    timestamps: false,
    collection: 'briefings',
});
// Compound indexes for efficient queries
BriefingSchema.index({ user_id: 1, date: 1 });
BriefingSchema.index({ user_id: 1, type: 1, date: 1 });
BriefingSchema.index({ user_id: 1, created_at: -1 });
// ============================================================================
// Model Export
// ============================================================================
let BriefingModel;
try {
    BriefingModel = mongoose.model('Briefing');
}
catch {
    BriefingModel = mongoose.model('Briefing', BriefingSchema);
}
export { BriefingModel };
export default BriefingModel;
//# sourceMappingURL=index.js.map