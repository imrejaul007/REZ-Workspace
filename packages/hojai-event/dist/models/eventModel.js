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
exports.EventModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const index_js_1 = require("../types/index.js");
const EventSchema = new mongoose_1.Schema({
    // Namespace for tenant isolation
    namespace: { type: String, required: true, index: true },
    // Event identification
    type: { type: String, required: true, index: true },
    category: {
        type: String,
        enum: Object.values(index_js_1.EventCategory),
        required: true,
        index: true
    },
    name: { type: String, required: true },
    // Who/What
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    entityType: { type: String },
    entityId: { type: String, index: true },
    // When
    timestamp: { type: Date, required: true, index: true },
    // Where
    source: { type: String },
    sessionId: { type: String },
    channel: { type: String },
    // Location
    location: {
        latitude: Number,
        longitude: Number,
        city: String,
        country: String
    },
    // Event data
    properties: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    metrics: { type: Map, of: Number },
    // Context
    context: {
        userAgent: String,
        ip: String,
        deviceType: String,
        browser: String,
        os: String,
        referrer: String
    },
    // Derived
    derivedFrom: String,
    // Processing
    processed: { type: Boolean, default: false },
    processedAt: Date,
    version: { type: String, default: '1.0' }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'events'
});
// Compound indexes for common queries
EventSchema.index({ namespace: 1, type: 1, timestamp: -1 });
EventSchema.index({ namespace: 1, userId: 1, timestamp: -1 });
EventSchema.index({ namespace: 1, entityType: 1, entityId: 1, timestamp: -1 });
EventSchema.index({ namespace: 1, category: 1, timestamp: -1 });
// TTL index - auto-delete events after 2 years
EventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });
exports.EventModel = mongoose_1.default.model('Event', EventSchema);
//# sourceMappingURL=eventModel.js.map