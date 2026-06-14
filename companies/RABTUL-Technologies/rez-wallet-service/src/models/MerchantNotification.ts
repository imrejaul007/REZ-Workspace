import mongoose from 'mongoose';

/**
 * MerchantNotification model for rez-wallet-service.
 *
 * Writes to the shared 'notifications' collection owned by rezbackend.
 * The `type` enum is the canonical set from rezbackend/src/models/Notification.ts —
 * keeping them in sync prevents Mongoose validation failures on cross-service reads.
 *
 * The `category` enum is the canonical set from the backend Notification model.
 * Wallet-specific categories map as: wallet -> general | payment -> general | orders -> order.
 */

const MerchantNotificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        userType: { type: String, enum: ['merchant', 'user', 'admin'], default: 'merchant' },
        title: { type: String, required: true },
        message: { type: String, required: true },
        // Canonical type enum — matches rezbackend/src/models/Notification.ts
        type: {
            type: String,
            enum: ['info', 'success', 'warning', 'error', 'promotional'],
            default: 'info',
        },
        // Canonical category enum — matches rezbackend/src/models/Notification.ts
        category: {
            type: String,
            enum: [
                'order',
                'earning',
                'general',
                'promotional',
                'social',
                'security',
                'system',
                'reminder',
                'opportunity',
                'progress',
                'loss',
                'achievement',
                'insight',
            ],
            default: 'general',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        read: { type: Boolean, default: false },
        isRead: { type: Boolean, default: false },
        data: mongoose.Schema.Types.Mixed,
        actionUrl: String,
        actionButton: {
            text: String,
            action: { type: String, enum: ['navigate', 'api_call', 'external_link'] },
            target: String,
        },
        source: {
            type: String,
            enum: ['system', 'admin', 'automated', 'campaign'],
            default: 'automated',
        },
        deliveryChannels: [{ type: String, enum: ['push', 'email', 'sms', 'in_app'] }],
        deliveryStatus: {
            inApp: {
                delivered: { type: Boolean, default: true },
                deliveredAt: { type: Date, default: Date.now },
                read: { type: Boolean, default: false },
                readAt: Date,
            },
        },
    },
    { timestamps: true, collection: 'notifications' },
);

MerchantNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
MerchantNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.Notification ||
    mongoose.model('Notification', MerchantNotificationSchema);
