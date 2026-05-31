import { z } from 'zod';
export declare enum WorkflowStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    PAUSED = "paused",
    DISABLED = "disabled"
}
export declare enum StepType {
    TRIGGER = "trigger",
    ACTION = "action",
    CONDITION = "condition",
    DELAY = "delay",
    HTTP_REQUEST = "http_request",
    TRANSFORM = "transform",
    NOTIFICATION = "notification"
}
export declare const WorkflowSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof WorkflowStatus>>;
    trigger: z.ZodObject<{
        type: z.ZodString;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        config: Record<string, any>;
    }, {
        type: string;
        config: Record<string, any>;
    }>;
    steps: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodNativeEnum<typeof StepType>;
        name: z.ZodString;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
        next: z.ZodOptional<z.ZodString>;
        onError: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        type: StepType;
        config: Record<string, any>;
        next?: string | undefined;
        onError?: string | undefined;
    }, {
        id: string;
        name: string;
        type: StepType;
        config: Record<string, any>;
        next?: string | undefined;
        onError?: string | undefined;
    }>, "many">;
    variables: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    stats: z.ZodOptional<z.ZodObject<{
        totalRuns: z.ZodDefault<z.ZodNumber>;
        successfulRuns: z.ZodDefault<z.ZodNumber>;
        failedRuns: z.ZodDefault<z.ZodNumber>;
        lastRunAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        lastRunAt?: Date | undefined;
    }, {
        totalRuns?: number | undefined;
        successfulRuns?: number | undefined;
        failedRuns?: number | undefined;
        lastRunAt?: Date | undefined;
    }>>;
    createdBy: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    status: WorkflowStatus;
    tenantId: string;
    trigger: {
        type: string;
        config: Record<string, any>;
    };
    steps: {
        id: string;
        name: string;
        type: StepType;
        config: Record<string, any>;
        next?: string | undefined;
        onError?: string | undefined;
    }[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    stats?: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        lastRunAt?: Date | undefined;
    } | undefined;
    description?: string | undefined;
    variables?: Record<string, any> | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    trigger: {
        type: string;
        config: Record<string, any>;
    };
    steps: {
        id: string;
        name: string;
        type: StepType;
        config: Record<string, any>;
        next?: string | undefined;
        onError?: string | undefined;
    }[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    stats?: {
        totalRuns?: number | undefined;
        successfulRuns?: number | undefined;
        failedRuns?: number | undefined;
        lastRunAt?: Date | undefined;
    } | undefined;
    status?: WorkflowStatus | undefined;
    description?: string | undefined;
    variables?: Record<string, any> | undefined;
}>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export declare const WorkflowRunSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    workflowId: z.ZodString;
    status: z.ZodEnum<["running", "completed", "failed", "cancelled"]>;
    triggeredBy: z.ZodString;
    input: z.ZodRecord<z.ZodString, z.ZodAny>;
    output: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    currentStep: z.ZodOptional<z.ZodString>;
    stepResults: z.ZodOptional<z.ZodArray<z.ZodObject<{
        stepId: z.ZodString;
        stepName: z.ZodString;
        status: z.ZodEnum<["pending", "running", "completed", "failed", "skipped"]>;
        startedAt: z.ZodDate;
        completedAt: z.ZodOptional<z.ZodDate>;
        output: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        error: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "running" | "completed" | "failed" | "pending" | "skipped";
        startedAt: Date;
        stepId: string;
        stepName: string;
        error?: string | undefined;
        output?: Record<string, any> | undefined;
        completedAt?: Date | undefined;
    }, {
        status: "running" | "completed" | "failed" | "pending" | "skipped";
        startedAt: Date;
        stepId: string;
        stepName: string;
        error?: string | undefined;
        output?: Record<string, any> | undefined;
        completedAt?: Date | undefined;
    }>, "many">>;
    startedAt: z.ZodDate;
    completedAt: z.ZodOptional<z.ZodDate>;
    duration: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "running" | "completed" | "failed" | "cancelled";
    tenantId: string;
    workflowId: string;
    input: Record<string, any>;
    startedAt: Date;
    triggeredBy: string;
    duration?: number | undefined;
    output?: Record<string, any> | undefined;
    completedAt?: Date | undefined;
    currentStep?: string | undefined;
    stepResults?: {
        status: "running" | "completed" | "failed" | "pending" | "skipped";
        startedAt: Date;
        stepId: string;
        stepName: string;
        error?: string | undefined;
        output?: Record<string, any> | undefined;
        completedAt?: Date | undefined;
    }[] | undefined;
}, {
    id: string;
    status: "running" | "completed" | "failed" | "cancelled";
    tenantId: string;
    workflowId: string;
    input: Record<string, any>;
    startedAt: Date;
    triggeredBy: string;
    duration?: number | undefined;
    output?: Record<string, any> | undefined;
    completedAt?: Date | undefined;
    currentStep?: string | undefined;
    stepResults?: {
        status: "running" | "completed" | "failed" | "pending" | "skipped";
        startedAt: Date;
        stepId: string;
        stepName: string;
        error?: string | undefined;
        output?: Record<string, any> | undefined;
        completedAt?: Date | undefined;
    }[] | undefined;
}>;
export type WorkflowRun = z.infer<typeof WorkflowRunSchema>;
//# sourceMappingURL=index.d.ts.map