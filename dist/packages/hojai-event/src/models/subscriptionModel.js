import mongoose, { Schema } from 'mongoose';
import { SubscriptionProtocol } from '../types/index.js';
const SubscriptionSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    // Event filters
    eventTypes: [{ type: String }],
    eventCategories: [{ type: String }],
    userId: { type: String },
    // Destination
    protocol: {
        type: String,
        enum: Object.values(SubscriptionProtocol),
        required: true
    },
    endpoint: { type: String, required: true },
    // Auth
    auth: {
        type: { type: String },
        token: String,
        apiKey: String,
        username: String,
        password: String
    },
    // Configuration
    enabled: { type: Boolean, default: true },
    retryOnFailure: { type: Boolean, default: true },
    maxRetries: { type: Number, default: 3 },
    retryDelayMs: { type: Number, default: 1000 },
    // Filtering
    filter: { type: Map, of: Schema.Types.Mixed },
    // Stats
    lastTriggeredAt: Date,
    triggerCount: { type: Number, default: 0 }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'subscriptions'
});
// Indexes
SubscriptionSchema.index({ tenantId: 1, enabled: 1 });
SubscriptionSchema.index({ tenantId: 1, eventTypes: 1 });
export const SubscriptionModel = mongoose.model('Subscription', SubscriptionSchema);
//# sourceMappingURL=subscriptionModel.js.map