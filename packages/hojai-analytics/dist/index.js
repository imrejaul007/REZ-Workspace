"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const attributionService_js_1 = require("./services/attributionService.js");
const index_js_1 = require("./types/index.js");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT || 4580;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-analytics';
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'hojai-analytics' }));
// Attribution
app.post('/api/attribution/events', async (req, res) => {
    const event = await attributionService_js_1.analyticsService.trackAttributionEvent(req.body);
    res.status(201).json({ success: true, data: event });
});
app.post('/api/attribution/conversions', async (req, res) => {
    const conversion = await attributionService_js_1.analyticsService.trackConversion(req.body);
    res.status(201).json({ success: true, data: conversion });
});
app.get('/api/attribution', async (req, res) => {
    const { tenantId, model, startDate, endDate, userId } = req.query;
    const results = await attributionService_js_1.analyticsService.getAttribution({
        tenantId: tenantId,
        model: model || index_js_1.AttributionModel.LAST_TOUCH,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId: userId
    });
    res.json({ success: true, data: results });
});
// Experiments
app.post('/api/experiments', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const experiment = await attributionService_js_1.analyticsService.createExperiment({ ...req.body, tenantId });
    res.status(201).json({ success: true, data: experiment });
});
app.get('/api/experiments', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const experiments = await mongoose_1.default.model('Experiment').find({ tenantId }).sort({ createdAt: -1 });
    res.json({ success: true, data: experiments });
});
app.post('/api/experiments/:id/assign', async (req, res) => {
    const { userId } = req.body;
    const variant = await attributionService_js_1.analyticsService.assignVariant(req.params.id, userId);
    res.json({ success: true, data: variant });
});
app.post('/api/experiments/:id/convert', async (req, res) => {
    const { userId, value } = req.body;
    await attributionService_js_1.analyticsService.recordConversion(req.params.id, userId, value);
    res.json({ success: true });
});
app.post('/api/experiments/:id/analyze', async (req, res) => {
    const results = await attributionService_js_1.analyticsService.analyzeExperiment(req.params.id);
    res.json({ success: true, data: results });
});
// Audiences
app.post('/api/audiences', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const audience = await attributionService_js_1.analyticsService.createAudience({ ...req.body, tenantId });
    res.status(201).json({ success: true, data: audience });
});
app.get('/api/audiences', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const audiences = await attributionService_js_1.analyticsService.listAudiences(tenantId);
    res.json({ success: true, data: audiences });
});
// Reports
app.post('/api/reports', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const report = await attributionService_js_1.analyticsService.createReport({ ...req.body, tenantId });
    res.status(201).json({ success: true, data: report });
});
app.get('/api/reports', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const reports = await attributionService_js_1.analyticsService.listReports(tenantId);
    res.json({ success: true, data: reports });
});
async function start() {
    await mongoose_1.default.connect(MONGODB_URI);
    app.listen(PORT, () => console.log(`[Hojai Analytics] Running on port ${PORT}`));
}
start().catch(console.error);
exports.default = app;
