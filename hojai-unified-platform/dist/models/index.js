import mongoose, { Schema } from 'mongoose';
const MessageSchema = new Schema({
    messageId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    channel: { type: String, required: true },
    direction: { type: String, enum: ['inbound', 'outbound', 'internal'], required: true },
    type: { type: String, required: true },
    from: {
        id: { type: String, required: true },
        name: { type: String, required: true },
        phone: String,
        email: String
    },
    to: {
        id: { type: String, required: true },
        name: { type: String, required: true },
        phone: String,
        email: String
    },
    content: {
        text: String,
        mediaUrl: String,
        mediaType: String,
        caption: String,
        buttons: [{
                id: String,
                title: String
            }]
    },
    status: { type: String, enum: ['pending', 'sent', 'delivered', 'read', 'failed'], default: 'pending' },
    metadata: { type: Map, of: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'unified_messages' });
MessageSchema.index({ tenantId: 1, channel: 1, timestamp: -1 });
MessageSchema.index({ 'from.id': 1, timestamp: -1 });
export const MessageModel = mongoose.model('Message', MessageSchema);
const ConversationSchema = new Schema({
    conversationId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    channel: { type: String, required: true },
    state: { type: String, enum: ['active', 'queued', 'assigned', 'resolved', 'closed'], default: 'active', index: true },
    customer: {
        id: { type: String, required: true },
        name: { type: String, required: true },
        phone: String,
        email: String,
        avatar: String,
        tier: { type: String, default: 'standard' }
    },
    assignedAgentId: String,
    assignedAgentName: String,
    team: String,
    aiHandled: { type: Boolean, default: false },
    aiConfidence: Number,
    unresolvedIntents: [String],
    lastMessage: String,
    lastMessageAt: Date,
    messageCount: { type: Number, default: 0 },
    tags: [String],
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    cartId: String,
    orderId: String,
    firstResponseTime: Number,
    avgResponseTime: Number,
    resolutionTime: Number
}, { timestamps: true, collection: 'unified_conversations' });
ConversationSchema.index({ tenantId: 1, state: 1 });
ConversationSchema.index({ assignedAgentId: 1, state: 1 });
ConversationSchema.index({ tenantId: 1, lastMessageAt: -1 });
export const ConversationModel = mongoose.model('Conversation', ConversationSchema);
const AgentSchema = new Schema({
    agentId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    avatar: String,
    role: { type: String, enum: ['agent', 'supervisor', 'admin'], default: 'agent' },
    status: { type: String, enum: ['online', 'busy', 'away', 'offline'], default: 'offline', index: true },
    skills: [String],
    languages: [String],
    maxConcurrentChats: { type: Number, default: 5 },
    channels: [{ type: String }],
    stats: {
        totalConversations: { type: Number, default: 0 },
        resolvedToday: { type: Number, default: 0 },
        avgResponseTime: { type: Number, default: 0 },
        avgResolutionTime: { type: Number, default: 0 },
        csat: Number,
        lastActiveAt: Date
    }
}, { timestamps: true, collection: 'unified_agents' });
AgentSchema.index({ tenantId: 1, status: 1 });
export const AgentModel = mongoose.model('Agent', AgentSchema);
const CartSchema = new Schema({
    cartId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    customer: {
        id: { type: String, required: true },
        name: { type: String, required: true },
        phone: { type: String, required: true }
    },
    items: [{
            productId: String,
            name: String,
            price: Number,
            quantity: { type: Number, default: 1 },
            imageUrl: String,
            variant: String
        }],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, enum: ['active', 'checkout', 'completed', 'abandoned'], default: 'active' }
}, { timestamps: true, collection: 'unified_carts' });
CartSchema.index({ tenantId: 1, 'customer.id': 1 });
CartSchema.index({ sessionId: 1, status: 1 });
export const CartModel = mongoose.model('Cart', CartSchema);
const OrderSchema = new Schema({
    orderId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true },
    customer: {
        id: { type: String, required: true },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: String
    },
    items: [{
            productId: String,
            name: String,
            price: Number,
            quantity: Number,
            total: Number
        }],
    subtotal: Number,
    tax: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    payment: {
        method: { type: String, enum: ['upi', 'card', 'wallet', 'cod'] },
        status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'] },
        transactionId: String
    },
    delivery: {
        status: { type: String, enum: ['pending', 'confirmed', 'dispatched', 'delivered', 'failed'] },
        estimatedTime: Date,
        actualTime: Date
    },
    channel: { type: String, required: true },
    conversationId: String,
    status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled'], default: 'pending' }
}, { timestamps: true, collection: 'unified_orders' });
OrderSchema.index({ tenantId: 1, 'customer.id': 1 });
OrderSchema.index({ tenantId: 1, status: 1 });
export const OrderModel = mongoose.model('Order', OrderSchema);
const CampaignSchema = new Schema({
    campaignId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    channel: { type: String, required: true },
    type: { type: String, enum: ['marketing', 'transactional', 'promotional', 'welcome', 'abandoned_cart'], required: true },
    content: {
        templateId: String,
        subject: String,
        text: { type: String, required: true },
        mediaUrl: String,
        buttons: [{
                id: String,
                title: String,
                url: String
            }]
    },
    segmentIds: [String],
    targetFilters: { type: Map, of: Schema.Types.Mixed },
    estimatedReach: Number,
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    status: { type: String, enum: ['draft', 'scheduled', 'sending', 'completed', 'paused', 'cancelled'], default: 'draft' },
    abTest: {
        enabled: { type: Boolean, default: false },
        variantB: String,
        variantBRate: { type: Number, default: 50 }
    },
    stats: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 },
        converted: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        unsubscribed: { type: Number, default: 0 }
    }
}, { timestamps: true, collection: 'unified_campaigns' });
CampaignSchema.index({ tenantId: 1, status: 1 });
export const CampaignModel = mongoose.model('Campaign', CampaignSchema);
const TemplateSchema = new Schema({
    templateId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    channel: { type: String, required: true },
    category: { type: String, required: true },
    content: {
        body: { type: String, required: true },
        header: String,
        footer: String,
        buttons: [{
                id: String,
                type: String,
                title: String
            }],
        variables: [String]
    },
    whatsappCategory: String,
    whatsappTemplateId: String,
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    usageCount: { type: Number, default: 0 },
    lastUsedAt: Date
}, { timestamps: true, collection: 'unified_templates' });
TemplateSchema.index({ tenantId: 1, channel: 1, status: 1 });
export const TemplateModel = mongoose.model('Template', TemplateSchema);
//# sourceMappingURL=index.js.map