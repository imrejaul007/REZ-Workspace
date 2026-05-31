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
exports.DLQModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const index_js_1 = require("../types/index.js");
const DLQSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    originalEvent: { type: Map, of: mongoose_1.Schema.Types.Mixed, required: true },
    eventType: { type: String, required: true },
    // Error info
    reason: {
        type: String,
        enum: Object.values(index_js_1.DLQReason),
        required: true
    },
    errorMessage: { type: String, required: true },
    errorStack: String,
    // Retry info
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 5 },
    nextRetryAt: Date,
    // Status
    status: {
        type: String,
        enum: ['pending', 'retrying', 'dead', 'resolved'],
        default: 'pending'
    },
    resolvedAt: Date,
    resolvedBy: String,
    // Timestamps
    failedAt: { type: Date, required: true }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'dlq'
});
// Indexes
DLQSchema.index({ tenantId: 1, status: 1 });
DLQSchema.index({ tenantId: 1, reason: 1 });
DLQSchema.index({ nextRetryAt: 1 }, { expireAfterSeconds: 0 }); // Index for scheduling
exports.DLQModel = mongoose_1.default.model('DLQ', DLQSchema);
//# sourceMappingURL=dlqModel.js.map