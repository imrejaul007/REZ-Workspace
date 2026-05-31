import mongoose, { Schema } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { WorkflowStatus, StepType } from '../types/index.js';
const WorkflowSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    status: { type: String, enum: Object.values(WorkflowStatus), default: WorkflowStatus.DRAFT },
    trigger: {
        type: { type: String, required: true },
        config: { type: Map, of: Schema.Types.Mixed }
    },
    steps: [{
            id: String,
            type: { type: String, enum: Object.values(StepType) },
            name: String,
            config: { type: Map, of: Schema.Types.Mixed },
            next: String,
            onError: String
        }],
    variables: { type: Map, of: Schema.Types.Mixed },
    stats: {
        totalRuns: { type: Number, default: 0 },
        successfulRuns: { type: Number, default: 0 },
        failedRuns: { type: Number, default: 0 },
        lastRunAt: Date
    },
    createdBy: String
}, { timestamps: true, collection: 'workflows' });
WorkflowSchema.index({ tenantId: 1, status: 1 });
const WorkflowRunSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    workflowId: { type: String, required: true, index: true },
    status: { type: String, enum: ['running', 'completed', 'failed', 'cancelled'], default: 'running' },
    triggeredBy: String,
    input: { type: Map, of: Schema.Types.Mixed },
    output: { type: Map, of: Schema.Types.Mixed },
    currentStep: String,
    stepResults: [{
            stepId: String,
            stepName: String,
            status: String,
            startedAt: Date,
            completedAt: Date,
            output: { type: Map, of: Schema.Types.Mixed },
            error: String
        }],
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    duration: Number
}, { timestamps: true, collection: 'workflow_runs' });
WorkflowRunSchema.index({ tenantId: 1, workflowId: 1, status: 1 });
export const WorkflowModel = mongoose.model('Workflow', WorkflowSchema);
export const WorkflowRunModel = mongoose.model('WorkflowRun', WorkflowRunSchema);
// ============================================================================
// WORKFLOW SERVICE
// ============================================================================
export class WorkflowService {
    queueEnabled = false;
    constructor() {
        this.initializeQueue();
    }
    async initializeQueue() {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const BullQueue = (await import('bullmq')).Queue;
            const { Redis } = await import('ioredis');
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            const connection = new Redis(redisUrl);
            // Store queue reference for later use
            this._queue = new BullQueue('hojai-workflows', { connection });
            this.queueEnabled = true;
        }
        catch {
            console.log('[WorkflowService] Queue not available, running in standalone mode');
            this.queueEnabled = false;
        }
    }
    async createWorkflow(params) {
        const workflow = new WorkflowModel({
            ...params,
            id: uuid(),
            stats: { totalRuns: 0, successfulRuns: 0, failedRuns: 0 }
        });
        await workflow.save();
        return workflow.toObject();
    }
    async getWorkflow(tenantId, workflowId) {
        const workflow = await WorkflowModel.findOne({ _id: workflowId, tenantId });
        return workflow ? workflow.toObject() : null;
    }
    async listWorkflows(tenantId, status) {
        const filter = { tenantId };
        if (status)
            filter.status = status;
        const workflows = await WorkflowModel.find(filter).sort({ createdAt: -1 });
        return workflows.map(w => w.toObject());
    }
    async updateWorkflow(tenantId, workflowId, updates) {
        const workflow = await WorkflowModel.findOneAndUpdate({ _id: workflowId, tenantId }, { $set: updates }, { new: true });
        return workflow ? workflow.toObject() : null;
    }
    async deleteWorkflow(tenantId, workflowId) {
        await WorkflowModel.deleteOne({ _id: workflowId, tenantId });
    }
    async runWorkflow(tenantId, workflowId, input, triggeredBy) {
        const workflow = await this.getWorkflow(tenantId, workflowId);
        if (!workflow)
            throw new Error('Workflow not found');
        if (workflow.status !== WorkflowStatus.ACTIVE)
            throw new Error('Workflow is not active');
        const run = {
            id: uuid(),
            tenantId,
            workflowId,
            status: 'running',
            triggeredBy,
            input,
            stepResults: [],
            startedAt: new Date()
        };
        const runDoc = new WorkflowRunModel(run);
        await runDoc.save();
        // Update workflow stats
        await WorkflowModel.updateOne({ _id: workflowId }, { $inc: { 'stats.totalRuns': 1 }, $set: { 'stats.lastRunAt': new Date() } });
        // Try to add to queue for async execution
        if (this.queueEnabled) {
            try {
                const queue = this._queue;
                if (queue) {
                    await queue.add('execute', { runId: run.id, workflowId, tenantId, input });
                }
            }
            catch {
                console.log('[WorkflowService] Queue add failed, running synchronously');
            }
        }
        return run;
    }
    async getRun(tenantId, runId) {
        const run = await WorkflowRunModel.findOne({ _id: runId, tenantId });
        return run ? run.toObject() : null;
    }
    async listRuns(tenantId, workflowId, limit = 50) {
        const runs = await WorkflowRunModel.find({ tenantId, workflowId }).sort({ startedAt: -1 }).limit(limit);
        return runs.map(r => r.toObject());
    }
    async cancelRun(tenantId, runId) {
        await WorkflowRunModel.updateOne({ _id: runId, tenantId, status: 'running' }, { $set: { status: 'cancelled', completedAt: new Date() } });
    }
}
export const workflowService = new WorkflowService();
//# sourceMappingURL=workflowService.js.map