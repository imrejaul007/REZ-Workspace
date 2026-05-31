import mongoose, { Schema } from 'mongoose';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
const MerchantSchema = new Schema({
    tenantId: { type: String, required: true, index: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    businessType: { type: String, required: true },
    description: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    // WhatsApp
    whatsappNumber: String,
    whatsappPhoneId: String,
    whatsappAccessToken: String,
    // AI
    persona: { type: String, default: 'Friendly assistant' },
    greeting: { type: String, default: 'Hello! How can I help you today?' },
    businessHours: {
        open: { type: String, default: '09:00' },
        close: { type: String, default: '21:00' }
    },
    language: { type: String, default: 'en' },
    // Features
    features: {
        ordering: { type: Boolean, default: true },
        booking: { type: Boolean, default: true },
        payments: { type: Boolean, default: false },
        feedback: { type: Boolean, default: true }
    },
    // Subscription
    plan: {
        type: String,
        enum: ['trial', 'starter', 'professional', 'enterprise'],
        default: 'trial'
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'inactive'],
        default: 'active'
    },
    subscriptionEndsAt: Date,
    // API
    apiKey: { type: String, unique: true },
    webhookSecret: { type: String },
    // Stats
    stats: {
        totalConversations: { type: Number, default: 0 },
        totalMessages: { type: Number, default: 0 },
        totalOrders: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 }
    }
}, { timestamps: true });
MerchantSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
MerchantSchema.set('toJSON', { virtuals: true });
MerchantSchema.set('toObject', { virtuals: true });
export const MerchantModel = mongoose.model('Merchant', MerchantSchema);
const KnowledgeBaseSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    merchantId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    keywords: [String],
    intents: [String],
    confidence: { type: Number, default: 0.9 },
    usageCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
}, { timestamps: true });
KnowledgeBaseSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
KnowledgeBaseSchema.set('toJSON', { virtuals: true });
KnowledgeBaseSchema.set('toObject', { virtuals: true });
KnowledgeBaseSchema.index({ merchantId: 1, active: 1 });
KnowledgeBaseSchema.index({ merchantId: 1, keywords: 1 });
export const KnowledgeBaseModel = mongoose.model('KnowledgeBaseItem', KnowledgeBaseSchema);
// ============================================================================
// MERCHANT SERVICE
// ============================================================================
export class MerchantService {
    /**
     * Generate secure API key
     */
    generateApiKey() {
        return `hojai_${crypto.randomBytes(32).toString('hex')}`;
    }
    /**
     * Generate webhook secret
     */
    generateWebhookSecret() {
        return crypto.randomBytes(32).toString('hex');
    }
    /**
     * Create new merchant
     */
    async createMerchant(params) {
        const tenantId = uuid();
        const merchant = new MerchantModel({
            tenantId,
            ...params,
            apiKey: this.generateApiKey(),
            webhookSecret: this.generateWebhookSecret(),
            subscriptionEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
        });
        await merchant.save();
        return merchant.toObject();
    }
    /**
     * Get merchant by tenant ID
     */
    async getMerchantByTenantId(tenantId) {
        const merchant = await MerchantModel.findOne({ tenantId });
        return merchant ? merchant.toObject() : null;
    }
    /**
     * Get merchant by API key
     */
    async getMerchantByApiKey(apiKey) {
        const merchant = await MerchantModel.findOne({ apiKey });
        return merchant ? merchant.toObject() : null;
    }
    /**
     * Update merchant
     */
    async updateMerchant(tenantId, updates) {
        const merchant = await MerchantModel.findOneAndUpdate({ tenantId }, { $set: updates }, { new: true });
        return merchant ? merchant.toObject() : null;
    }
    /**
     * Get knowledge base for merchant
     */
    async getKnowledgeBase(merchantId) {
        const items = await KnowledgeBaseModel.find({
            merchantId,
            active: true
        });
        return items.map(i => i.toObject());
    }
    /**
     * Add knowledge base item
     */
    async addKnowledgeItem(params) {
        const item = new KnowledgeBaseModel(params);
        await item.save();
        return item.toObject();
    }
    /**
     * Update knowledge base item
     */
    async updateKnowledgeItem(id, tenantId, updates) {
        const item = await KnowledgeBaseModel.findOneAndUpdate({ _id: id, tenantId }, { $set: updates }, { new: true });
        return item ? item.toObject() : null;
    }
    /**
     * Delete knowledge base item
     */
    async deleteKnowledgeItem(id, tenantId) {
        const result = await KnowledgeBaseModel.deleteOne({ _id: id, tenantId });
        return result.deletedCount > 0;
    }
    /**
     * Search knowledge base
     */
    async searchKnowledge(merchantId, query) {
        const items = await KnowledgeBaseModel.find({
            merchantId,
            active: true,
            $or: [
                { question: { $regex: query, $options: 'i' } },
                { answer: { $regex: query, $options: 'i' } },
                { keywords: { $in: query.toLowerCase().split(' ') } }
            ]
        });
        return items.map(i => i.toObject());
    }
    /**
     * Increment usage count
     */
    async incrementUsage(id) {
        await KnowledgeBaseModel.updateOne({ _id: id }, { $inc: { usageCount: 1 } });
    }
    /**
     * Get merchant stats
     */
    async getStats(tenantId) {
        const merchant = await MerchantModel.findOne({ tenantId }).select('stats');
        return merchant?.stats;
    }
    /**
     * Update stats
     */
    async updateStats(tenantId, stats) {
        await MerchantModel.updateOne({ tenantId }, { $inc: stats });
    }
    /**
     * Validate API key
     */
    async validateApiKey(apiKey) {
        return this.getMerchantByApiKey(apiKey);
    }
}
export const merchantService = new MerchantService();
//# sourceMappingURL=merchantService.js.map