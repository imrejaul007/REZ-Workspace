import mongoose from 'mongoose';
import { Workflow, WorkflowRun, WorkflowStatus } from '../types/index.js';
interface WorkflowDocument extends Workflow {
}
interface WorkflowRunDocument extends WorkflowRun {
}
export declare const WorkflowModel: mongoose.Model<WorkflowDocument, {}, {}, {}, mongoose.Document<unknown, {}, WorkflowDocument, {}, {}> & WorkflowDocument & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
export declare const WorkflowRunModel: mongoose.Model<WorkflowRunDocument, {}, {}, {}, mongoose.Document<unknown, {}, WorkflowRunDocument, {}, {}> & WorkflowRunDocument & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
export declare class WorkflowService {
    private queueEnabled;
    constructor();
    private initializeQueue;
    createWorkflow(params: Omit<Workflow, 'id' | 'stats' | 'createdAt' | 'updatedAt'>): Promise<Workflow>;
    getWorkflow(tenantId: string, workflowId: string): Promise<Workflow | null>;
    listWorkflows(tenantId: string, status?: WorkflowStatus): Promise<Workflow[]>;
    updateWorkflow(tenantId: string, workflowId: string, updates: Partial<Workflow>): Promise<Workflow | null>;
    deleteWorkflow(tenantId: string, workflowId: string): Promise<void>;
    runWorkflow(tenantId: string, workflowId: string, input: Record<string, unknown>, triggeredBy: string): Promise<WorkflowRun>;
    getRun(tenantId: string, runId: string): Promise<WorkflowRun | null>;
    listRuns(tenantId: string, workflowId: string, limit?: number): Promise<WorkflowRun[]>;
    cancelRun(tenantId: string, runId: string): Promise<void>;
}
export declare const workflowService: WorkflowService;
export {};
//# sourceMappingURL=workflowService.d.ts.map