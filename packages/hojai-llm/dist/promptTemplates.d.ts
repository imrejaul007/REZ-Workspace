/**
 * Hojai LLM Adapter - Prompt Templates
 *
 * Provides structured prompt templates for different employee types and tasks
 */
import { EmployeeRole, EmployeeCapability, EmployeeKnowledge } from './types/index.js';
interface BaseTemplateParams {
    name: string;
    tone?: 'formal' | 'casual' | 'friendly' | 'professional';
    language?: string;
    timezone?: string;
}
interface SalesTemplateParams extends BaseTemplateParams {
    capabilities: EmployeeCapability[];
    knowledge: EmployeeKnowledge[];
}
interface TaskTemplateParams extends BaseTemplateParams {
    role?: EmployeeRole;
    taskData?: Record<string, unknown>;
}
/**
 * Template for document analysis
 */
export declare function documentAnalysis(params: {
    name: string;
    role: EmployeeRole;
    documentType: string;
    tone?: 'formal' | 'casual' | 'friendly' | 'professional';
}): string;
/**
 * Template for query analysis
 */
export declare function queryAnalysis(params: {
    name: string;
    role: EmployeeRole;
}): string;
/**
 * Template for analyst tasks
 */
export declare function analyst(params: {
    name: string;
    dataContext?: {
        metrics?: string[];
        timeframe?: string;
        comparisonPeriod?: string;
    };
}): string;
/**
 * Get prompt template for a specific role
 */
export declare function getForRole(role: EmployeeRole): (params: SalesTemplateParams) => string;
/**
 * Get prompt template for a specific task
 */
export declare function getForTask(taskType: string): (params: TaskTemplateParams) => string;
export declare const promptTemplates: {
    getForRole: typeof getForRole;
    getForTask: typeof getForTask;
    documentAnalysis: typeof documentAnalysis;
    queryAnalysis: typeof queryAnalysis;
    analyst: typeof analyst;
};
export {};
//# sourceMappingURL=promptTemplates.d.ts.map