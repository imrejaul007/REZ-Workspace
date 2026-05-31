"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const index_js_1 = require("../types/index.js");
const SubscriptionSchema = new mongoose_1.Schema({
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
        enum: Object.values(index_js_1.SubscriptionProtocol),
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
    filter: { type: Map, of: mongoose_1.Schema.Types.Mixed },
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
exports.SubscriptionModel = mongoose_1.default.model('Subscription', SubscriptionSchema);
//# sourceMappingURL=subscriptionModel.js.map