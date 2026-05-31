import mongoose, { Schema } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { ConversationStatus, MessageDirection, MessageType, Source } from '../types/index.js';
// ============================================================================
// MONGOOSE SCHEMAS
// ============================================================================
const ConversationSchema = new Schema({
    id: { type: String, required: true, unique: true, default: uuid },
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, maxlength: 255 },
    userName: { type: String },
    employeeId: { type: String },
    status: {
        type: String,
        enum: Object.values(ConversationStatus),
        default: ConversationStatus.ACTIVE
    },
    source: { type: String, enum: Object.values(Source), default: Source.WEB },
    lastMessage: {
        content: String,
        sender: { type: String, enum: ['user', 'employee', 'system'] },
        timestamp: Date
    },
    context: {
        intent: String,
        entities: { type: Schema.Types.Mixed },
        sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
        language: { type: String, default: 'en' }
    },
    metadata: { type: Schema.Types.Mixed },
    unreadCount: { type: Number, default: 0 },
    assignedAt: Date,
    closedAt: Date
}, { timestamps: true });
// Indexes
ConversationSchema.index({ tenantId: 1, userId: 1, updatedAt: -1 });
ConversationSchema.index({ tenantId: 1, employeeId: 1, status: 1 });
ConversationSchema.index({ tenantId: 1, status: 1, updatedAt: -1 });
const MessageSchema = new Schema({
    id: { type: String, required: true, unique: true, default: uuid },
    tenantId: { type: String, required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    employeeId: { type: String },
    userId: { type: String, required: true, maxlength: 255 },
    direction: {
        type: String,
        enum: Object.values(MessageDirection),
        required: true
    },
    source: { type: String, enum: Object.values(Source), required: true },
    type: { type: String, enum: Object.values(MessageType), default: MessageType.TEXT },
    content: {
        text: String,
        mediaUrl: String,
        mediaCaption: String,
        buttons: [{
                id: String,
                text: String
            }],
        location: {
            latitude: Number,
            longitude: Number,
            name: String
        }
    },
    metadata: { type: Schema.Types.Mixed },
    status: { type: String, enum: ['sent', 'delivered', 'read', 'failed'], default: 'sent' },
    externalId: String,
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });
// Indexes for message queries
MessageSchema.index({ conversationId: 1, timestamp: -1 });
MessageSchema.index({ tenantId: 1, userId: 1, timestamp: -1 });
MessageSchema.index({ externalId: 1 });
let ConversationModel;
let MessageModel;
try {
    ConversationModel = mongoose.model('CommInterfaceConversation');
}
catch {
    ConversationModel = mongoose.model('CommInterfaceConversation', ConversationSchema);
}
try {
    MessageModel = mongoose.model('CommInterfaceMessage');
}
catch {
    MessageModel = mongoose.model('CommInterfaceMessage', MessageSchema);
}
class ConversationManager {
    initialized = false;
    async initialize() {
        if (this.initialized)
            return;
        // Ensure indexes
        await ConversationModel.ensureIndexes();
        await MessageModel.ensureIndexes();
        this.initialized = true;
        console.log('[ConversationManager] Initialized');
    }
    /**
     * Get or create an active conversation for a user
     */
    async getOrCreateConversation(options) {
        // Look for existing active conversation
        const existing = await ConversationModel.findOne({
            tenantId: options.tenantId,
            userId: options.userId,
            status: ConversationStatus.ACTIVE
        }).sort({ updatedAt: -1 });
        if (existing) {
            return existing.toObject();
        }
        // Create new conversation
        const conversation = new ConversationModel({
            ...options,
            id: uuid(),
            status: ConversationStatus.ACTIVE
        });
        await conversation.save();
        return conversation.toObject();
    }
    /**
     * Find conversation by ID
     */
    async findById(id, tenantId) {
        return ConversationModel.findOne({ id, tenantId }).lean();
    }
    /**
     * Find conversation by external ID (e.g., WhatsApp chat ID)
     */
    async findByExternalId(tenantId, externalId) {
        return ConversationModel.findOne({
            tenantId,
            metadata: { externalId }
        }).lean();
    }
    /**
     * List conversations for a user
     */
    async listByUser(tenantId, userId, limit = 20) {
        return ConversationModel.find({ tenantId, userId })
            .sort({ updatedAt: -1 })
            .limit(limit)
            .lean();
    }
    /**
     * List conversations assigned to an employee
     */
    async listByEmployee(tenantId, employeeId, status) {
        const query = { tenantId, employeeId };
        if (status) {
            query.status = status;
        }
        return ConversationModel.find(query)
            .sort({ updatedAt: -1 })
            .lean();
    }
    /**
     * Assign conversation to an employee
     */
    async assignToEmployee(conversationId, tenantId, employeeId) {
        const conversation = await ConversationModel.findOneAndUpdate({ id: conversationId, tenantId }, {
            $set: {
                employeeId,
                assignedAt: new Date()
            }
        }, { new: true }).lean();
        return conversation;
    }
    /**
     * Close a conversation
     */
    async close(conversationId, tenantId) {
        const conversation = await ConversationModel.findOneAndUpdate({ id: conversationId, tenantId }, {
            $set: {
                status: ConversationStatus.CLOSED,
                closedAt: new Date()
            }
        }, { new: true }).lean();
        return conversation;
    }
    /**
     * Update conversation context
     */
    async updateContext(conversationId, tenantId, context) {
        return ConversationModel.findOneAndUpdate({ id: conversationId, tenantId }, { $set: { context } }, { new: true }).lean();
    }
    /**
     * Increment unread count
     */
    async incrementUnread(conversationId, tenantId) {
        await ConversationModel.updateOne({ id: conversationId, tenantId }, { $inc: { unreadCount: 1 } });
    }
    /**
     * Reset unread count
     */
    async resetUnread(conversationId, tenantId) {
        await ConversationModel.updateOne({ id: conversationId, tenantId }, { $set: { unreadCount: 0 } });
    }
    // =========================================================================
    // MESSAGE OPERATIONS
    // =========================================================================
    /**
     * Send a message in a conversation
     */
    async sendMessage(options) {
        // Ensure conversation exists
        let conversation = null;
        if (options.conversationId) {
            conversation = await this.findById(options.conversationId, options.tenantId);
        }
        if (!conversation) {
            conversation = await this.getOrCreateConversation({
                tenantId: options.tenantId,
                userId: options.userId,
                userName: options.userName,
                employeeId: options.employeeId,
                source: options.source
            });
        }
        // Create message
        const message = new MessageModel({
            ...options,
            conversationId: conversation.id,
            id: uuid(),
            timestamp: new Date()
        });
        await message.save();
        // Update conversation last message
        const sender = options.direction === MessageDirection.INBOUND ? 'user' : 'employee';
        await ConversationModel.updateOne({ id: conversation.id }, {
            $set: {
                lastMessage: {
                    content: options.content.text || '[Media]',
                    sender,
                    timestamp: new Date()
                },
                updatedAt: new Date()
            },
            $inc: { unreadCount: options.direction === MessageDirection.OUTBOUND ? 1 : 0 }
        });
        return message.toObject();
    }
    /**
     * Find message by ID
     */
    async findMessageById(id) {
        return MessageModel.findOne({ id }).lean();
    }
    /**
     * Find message by external ID (e.g., WhatsApp message ID)
     */
    async findMessageByExternalId(externalId) {
        return MessageModel.findOne({ externalId }).lean();
    }
    /**
     * Get message history for a conversation
     */
    async getMessageHistory(conversationId, tenantId, limit = 50, before) {
        const query = { conversationId, tenantId };
        if (before) {
            query.timestamp = { $lt: before };
        }
        return MessageModel.find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
    }
    /**
     * Get recent conversation context for AI
     */
    async getConversationContext(conversationId, tenantId, messageCount = 10) {
        const conversation = await this.findById(conversationId, tenantId);
        if (!conversation)
            return null;
        const messages = await this.getMessageHistory(conversationId, tenantId, messageCount);
        return {
            recentMessages: messages.reverse(),
            context: conversation.context || { language: 'en' }
        };
    }
    /**
     * Update message status
     */
    async updateMessageStatus(messageId, status) {
        return MessageModel.findOneAndUpdate({ id: messageId }, { $set: { status } }, { new: true }).lean();
    }
    /**
     * Get unread count for a user
     */
    async getUnreadCount(tenantId, userId) {
        const result = await ConversationModel.aggregate([
            { $match: { tenantId, userId, status: ConversationStatus.ACTIVE } },
            { $group: { _id: null, total: { $sum: '$unreadCount' } } }
        ]);
        return result.length > 0 ? result[0].total : 0;
    }
    /**
     * Mark messages as read
     */
    async markAsRead(conversationId, tenantId) {
        await MessageModel.updateMany({ conversationId, tenantId, status: { $ne: 'read' } }, { $set: { status: 'read' } });
        await this.resetUnread(conversationId, tenantId);
    }
}
export const conversationManager = new ConversationManager();
//# sourceMappingURL=conversationManager.js.map