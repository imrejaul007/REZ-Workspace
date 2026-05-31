import express from 'express';
import mongoose from 'mongoose';
import { workflowService } from './services/workflowService.js';
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 4560;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-flow';
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'hojai-flow' }));
// Workflow CRUD
app.post('/api/workflows', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const workflow = await workflowService.createWorkflow({ ...req.body, tenantId });
    res.status(201).json({ success: true, data: workflow });
});
app.get('/api/workflows', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const workflows = await workflowService.listWorkflows(tenantId, req.query.status);
    res.json({ success: true, data: workflows });
});
app.get('/api/workflows/:id', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const workflow = await workflowService.getWorkflow(tenantId, req.params.id);
    if (!workflow)
        return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: workflow });
});
app.patch('/api/workflows/:id', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const workflow = await workflowService.updateWorkflow(tenantId, req.params.id, req.body);
    res.json({ success: true, data: workflow });
});
app.delete('/api/workflows/:id', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    await workflowService.deleteWorkflow(tenantId, req.params.id);
    res.json({ success: true });
});
// Run workflow
app.post('/api/workflows/:id/run', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const triggeredBy = req.headers['x-user-id'] || 'api';
    const run = await workflowService.runWorkflow(tenantId, req.params.id, req.body.input || {}, triggeredBy);
    res.status(201).json({ success: true, data: run });
});
app.get('/api/workflows/:id/runs', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const runs = await workflowService.listRuns(tenantId, req.params.id);
    res.json({ success: true, data: runs });
});
app.get('/api/runs/:id', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const run = await workflowService.getRun(tenantId, req.params.id);
    if (!run)
        return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: run });
});
app.post('/api/runs/:id/cancel', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    await workflowService.cancelRun(tenantId, req.params.id);
    res.json({ success: true });
});
async function start() {
    await mongoose.connect(MONGODB_URI);
    app.listen(PORT, () => console.log(`[Hojai Flow] Running on port ${PORT}`));
}
start().catch(console.error);
export default app;
//# sourceMappingURL=index.js.map