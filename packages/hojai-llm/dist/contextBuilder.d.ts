/**
 * Hojai LLM Adapter - Context Builder
 *
 * Builds rich context from employee data for LLM prompts
 */
import { EmployeeContext, ChatMessage } from './types/index.js';
export interface ContextBuilderOptions {
    maxHistoryMessages?: number;
    maxMemoryItems?: number;
    includeSystemPrompt?: boolean;
    language?: string;
}
export interface BuiltContext {
    systemPrompt: string;
    messages: ChatMessage[];
    estimatedTokens: number;
}
/**
 * Builds context from employee data for LLM requests
 */
export declare class ContextBuilder {
    private options;
    private readonly logger;
    constructor(options?: ContextBuilderOptions, logger?: Console);
    /**
     * Build complete context for a chat request
     */
    build(employee: EmployeeContext, conversation: ChatMessage[]): BuiltContext;
    /**
     * Build system prompt for an employee
     */
    buildSystemPrompt(employee: EmployeeContext): string;
    /**
     * Build memory context messages
     */
    buildMemoryMessages(employee: EmployeeContext): ChatMessage[];
    /**
     * Build context for a specific task
     */
    buildTaskContext(employee: EmployeeContext, taskType: string, taskData: Record<string, unknown>): BuiltContext;
    /**
     * Truncate conversation to fit token limit
     */
    truncateToFit(messages: ChatMessage[], maxTokens: number, systemPromptTokens?: number): ChatMessage[];
    /**
     * Estimate token count for text
     */
    estimateTokens(text: string): number;
    /**
     * Build context for document analysis
     */
    buildDocumentContext(employee: EmployeeContext, documentType: string, documentContent: string): BuiltContext;
    /**
     * Build context for query analysis
     */
    buildAnalysisContext(employee: EmployeeContext, query: string): BuiltContext;
}
/**
 * Build context for sales employee
 */
export declare function buildSalesContext(employee: EmployeeContext, conversation: ChatMessage[]): BuiltContext;
/**
 * Build context for support employee
 */
export declare function buildSupportContext(employee: EmployeeContext, conversation: ChatMessage[], ticketInfo?: {
    ticketId: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
}): BuiltContext;
/**
 * Build context for analyst employee
 */
export declare function buildAnalystContext(employee: EmployeeContext, query: string, dataContext?: {
    metrics?: string[];
    timeframe?: string;
    comparisonPeriod?: string;
}): BuiltContext;
export declare function createContextBuilder(options?: ContextBuilderOptions, logger?: Console): ContextBuilder;
//# sourceMappingURL=contextBuilder.d.ts.map