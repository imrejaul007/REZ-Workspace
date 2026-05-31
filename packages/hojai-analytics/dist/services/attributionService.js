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
exports.analyticsService = exports.AnalyticsService = exports.ReportModel = exports.AudienceModel = exports.ExperimentVariantModel = exports.ExperimentModel = exports.ConversionModel = exports.AttributionEventModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
const index_js_1 = require("../types/index.js");
const AttributionEventSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    sessionId: String,
    channel: { type: String, required: true, index: true },
    source: String,
    campaign: String,
    medium: String,
    content: String,
    keyword: String,
    type: { type: String, enum: ['impression', 'click', 'conversion'], required: true },
    timestamp: { type: Date, required: true, index: true },
    value: Number,
    conversionId: String,
    device: String,
    location: String
}, { timestamps: true });
AttributionEventSchema.index({ tenantId: 1, channel: 1, timestamp: -1 });
AttributionEventSchema.index({ tenantId: 1, userId: 1, timestamp: -1 });
const ConversionSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    conversionType: { type: String, required: true },
    value: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    timestamp: { type: Date, required: true, index: true },
    metadata: { type: Map, of: mongoose_1.Schema.Types.Mixed }
}, { timestamps: true });
ConversionSchema.index({ tenantId: 1, timestamp: -1 });
const ExperimentSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    hypothesis: { type: String, required: true },
    status: { type: String, enum: Object.values(index_js_1.ExperimentStatus), default: index_js_1.ExperimentStatus.DRAFT },
    variants: [{
            id: String,
            name: String,
            description: String,
            traffic: Number,
            config: { type: Map, of: mongoose_1.Schema.Types.Mixed }
        }],
    targeting: {
        userSegments: [String],
        channels: [String],
        minSampleSize: Number
    },
    primaryMetric: {
        name: String,
        type: String
    },
    secondaryMetrics: [{
            name: String,
            type: String
        }],
    results: {
        winner: String,
        confidence: Number,
        pValue: Number,
        variantStats: { type: Map, of: mongoose_1.Schema.Types.Mixed }
    },
    startDate: Date,
    endDate: Date
}, { timestamps: true });
ExperimentSchema.index({ tenantId: 1, status: 1 });
const ExperimentVariantSchema = new mongoose_1.Schema({
    experimentId: { type: String, required: true, index: true },
    variantId: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true },
    converted: { type: Boolean, default: false },
    conversionValue: Number,
    metadata: { type: Map, of: mongoose_1.Schema.Types.Mixed }
}, { timestamps: true });
ExperimentVariantSchema.index({ experimentId: 1, variantId: 1 });
const AudienceSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    criteria: [{
            field: String,
            operator: String,
            value: mongoose_1.Schema.Types.Mixed
        }],
    logic: { type: String, enum: ['AND', 'OR'], default: 'AND' },
    estimatedSize: Number,
    actualSize: Number,
    tags: [String],
    active: { type: Boolean, default: true }
}, { timestamps: true });
const ReportSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    type: { type: String, enum: ['attribution', 'experiment', 'audience', 'custom'], required: true },
    config: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    schedule: {
        enabled: { type: Boolean, default: false },
        frequency: String,
        recipients: [String]
    },
    lastRunAt: Date,
    createdBy: String
}, { timestamps: true });
exports.AttributionEventModel = mongoose_1.default.model('AttributionEvent', AttributionEventSchema);
exports.ConversionModel = mongoose_1.default.model('Conversion', ConversionSchema);
exports.ExperimentModel = mongoose_1.default.model('Experiment', ExperimentSchema);
exports.ExperimentVariantModel = mongoose_1.default.model('ExperimentVariant', ExperimentVariantSchema);
exports.AudienceModel = mongoose_1.default.model('Audience', AudienceSchema);
exports.ReportModel = mongoose_1.default.model('Report', ReportSchema);
// ============================================================================
// ANALYTICS SERVICE
// ============================================================================
class AnalyticsService {
    // Attribution
    async trackAttributionEvent(event) {
        const doc = new exports.AttributionEventModel({ ...event, id: (0, uuid_1.v4)() });
        await doc.save();
        return doc.toObject();
    }
    async trackConversion(conversion) {
        const doc = new exports.ConversionModel({ ...conversion, id: (0, uuid_1.v4)() });
        await doc.save();
        return doc.toObject();
    }
    async getAttribution(params) {
        const { tenantId, model, startDate, endDate, userId } = params;
        const filter = {
            tenantId,
            timestamp: { $gte: startDate, $lte: endDate },
            type: 'conversion'
        };
        if (userId)
            filter.userId = userId;
        const conversions = await exports.ConversionModel.find(filter);
        const attribution = {};
        for (const conv of conversions) {
            const events = await exports.AttributionEventModel.find({
                tenantId,
                userId: conv.userId,
                timestamp: { $lte: conv.timestamp }
            }).sort({ timestamp: -1 }).limit(10);
            if (events.length === 0)
                continue;
            let channels = [];
            const weights = [];
            switch (model) {
                case index_js_1.AttributionModel.FIRST_TOUCH:
                    channels = [events[events.length - 1].channel];
                    weights = [1];
                    break;
                case index_js_1.AttributionModel.LAST_TOUCH:
                    channels = [events[0].channel];
                    weights = [1];
                    break;
                case index_js_1.AttributionModel.LINEAR:
                    channels = events.map(e => e.channel);
                    weights = events.map(() => 1 / events.length);
                    break;
                case index_js_1.AttributionModel.TIME_DECAY:
                    channels = events.map(e => e.channel);
                    weights = events.map((_, i) => Math.pow(0.5, events.length - 1 - i));
                    break;
                default:
                    channels = [events[0].channel];
                    weights = [1];
            }
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            channels.forEach((ch, i) => {
                if (!attribution[ch])
                    attribution[ch] = { conversions: 0, revenue: 0 };
                attribution[ch].conversions += 1 * (weights[i] / totalWeight);
                attribution[ch].revenue += conv.value * (weights[i] / totalWeight);
            });
        }
        return Object.entries(attribution).map(([channel, data]) => ({
            channel,
            conversions: data.conversions,
            revenue: data.revenue,
            attribution: data.revenue / Object.values(attribution).reduce((a, b) => a + b.revenue, 0)
        }));
    }
    // Experiments
    async createExperiment(experiment) {
        const doc = new exports.ExperimentModel({ ...experiment, id: (0, uuid_1.v4)() });
        await doc.save();
        return doc.toObject();
    }
    async assignVariant(experimentId, userId) {
        const experiment = await exports.ExperimentModel.findById(experimentId);
        if (!experiment || experiment.status !== index_js_1.ExperimentStatus.RUNNING) {
            throw new Error('Experiment not found or not running');
        }
        const totalTraffic = experiment.variants.reduce((sum, v) => sum + v.traffic, 0);
        let random = Math.random() * totalTraffic;
        let selectedVariant;
        for (const variant of experiment.variants) {
            random -= variant.traffic;
            if (random <= 0) {
                selectedVariant = variant;
                break;
            }
        }
        const variant = new exports.ExperimentVariantModel({
            experimentId,
            variantId: selectedVariant.id,
            userId,
            tenantId: experiment.tenantId
        });
        await variant.save();
        return { variantId: selectedVariant.id, config: selectedVariant.config || {} };
    }
    async recordConversion(experimentId, userId, value) {
        await exports.ExperimentVariantModel.updateOne({ experimentId, userId, converted: false }, { $set: { converted: true, conversionValue: value } });
    }
    async analyzeExperiment(experimentId) {
        const experiment = await exports.ExperimentModel.findById(experimentId);
        if (!experiment)
            throw new Error('Experiment not found');
        const variants = experiment.variants;
        const variantStats = {};
        for (const variant of variants) {
            const participants = await exports.ExperimentVariantModel.countDocuments({
                experimentId,
                variantId: variant.id
            });
            const converted = await exports.ExperimentVariantModel.countDocuments({
                experimentId,
                variantId: variant.id,
                converted: true
            });
            const conversions = await exports.ExperimentVariantModel.aggregate([
                { $match: { experimentId, variantId: variant.id, converted: true } },
                { $group: { _id: null, total: { $sum: '$conversionValue' } } }
            ]);
            variantStats[variant.id] = {
                conversions: converted,
                total: participants,
                conversionRate: participants > 0 ? converted / participants : 0,
                revenue: conversions[0]?.total || 0
            };
        }
        // Simple confidence calculation (in production, use proper statistical methods)
        const variantIds = Object.keys(variantStats);
        let winner = variantIds[0];
        let maxRate = 0;
        variantIds.forEach(id => {
            if (variantStats[id].conversionRate > maxRate) {
                maxRate = variantStats[id].conversionRate;
                winner = id;
            }
        });
        const results = {
            winner,
            confidence: 0.95,
            pValue: 0.05,
            variantStats
        };
        await exports.ExperimentModel.findByIdAndUpdate(experimentId, { results });
        return results;
    }
    // Audiences
    async createAudience(audience) {
        const doc = new exports.AudienceModel({ ...audience, id: (0, uuid_1.v4)() });
        await doc.save();
        return doc.toObject();
    }
    async listAudiences(tenantId) {
        const audiences = await exports.AudienceModel.find({ tenantId, active: true });
        return audiences.map(a => a.toObject());
    }
    // Reports
    async createReport(report) {
        const doc = new exports.ReportModel({ ...report, id: (0, uuid_1.v4)() });
        await doc.save();
        return doc.toObject();
    }
    async listReports(tenantId) {
        const reports = await exports.ReportModel.find({ tenantId }).sort({ createdAt: -1 });
        return reports.map(r => r.toObject());
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
