import express from 'express';
import mongoose from 'mongoose';
import { trustService } from './services/trustService.js';
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 4518;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-trust';
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'hojai-trust' }));
// Trust scores
app.get('/api/trust/:entityType/:entityId', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const score = await trustService.getScore({
        tenantId,
        entityType: req.params.entityType,
        entityId: req.params.entityId
    });
    res.json({ success: true, data: score });
});
app.post('/api/trust/:entityType/:entityId/calculate', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const score = await trustService.calculateScore({
        tenantId,
        entityType: req.params.entityType,
        entityId: req.params.entityId
    });
    res.json({ success: true, data: score });
});
app.get('/api/trust/top-merchants', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const merchants = await trustService.getTopMerchants(tenantId, parseInt(req.query.limit) || 10);
    res.json({ success: true, data: merchants });
});
// Reviews
app.post('/api/reviews', async (req, res) => {
    const review = await trustService.createReview(req.body);
    res.status(201).json({ success: true, data: review });
});
app.get('/api/reviews/:entityId', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const reviews = await trustService.getReviews({
        tenantId,
        entityId: req.params.entityId,
        limit: parseInt(req.query.limit) || 20
    });
    res.json({ success: true, data: reviews });
});
// Verifications
app.post('/api/verifications', async (req, res) => {
    const verification = await trustService.addVerification(req.body);
    res.status(201).json({ success: true, data: verification });
});
// Trust graph
app.get('/api/trust/:entityId/connections', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const connections = await trustService.getConnections({
        tenantId,
        entityId: req.params.entityId,
        relationship: req.query.relationship
    });
    res.json({ success: true, data: connections });
});
app.post('/api/trust/edges', async (req, res) => {
    const edge = await trustService.addEdge(req.body);
    res.status(201).json({ success: true, data: edge });
});
async function start() {
    await mongoose.connect(MONGODB_URI);
    app.listen(PORT, () => console.log(`[Hojai Trust] Running on port ${PORT}`));
}
start().catch(console.error);
export default app;
//# sourceMappingURL=index.js.map