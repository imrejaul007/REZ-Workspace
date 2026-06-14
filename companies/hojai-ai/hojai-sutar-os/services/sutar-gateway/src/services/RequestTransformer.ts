// ============================================================================
// SUTAR Gateway - Request Transformer
// Transform requests and responses based on rules
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import type {
  TransformRule,
  TransformConfig,
  ApiResponse,
} from '../types/index.js';

export interface TransformContext {
  requestId: string;
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[]>;
  body: unknown;
  metadata: Record<string, unknown>;
}

export interface TransformResult {
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  path?: string;
  removeHeaders?: string[];
}

export class RequestTransformer {
  private rules: Map<string, TransformRule> = new Map();
  private listeners: Set<(event: TransformEvent) => void> = new Set();

  constructor() {
    this.initializeDefaultRules();
  }

  // ---------------------------------------------------------------------------
  // Default Rules
  // ---------------------------------------------------------------------------

  private initializeDefaultRules(): void {
    // Add common headers for all requests
    this.addRule({
      id: 'default-headers',
      name: 'Add Default Headers',
      matchPath: '/**',
      requestTransform: {
        headers: {
          'X-Gateway-Version': '1.0.0',
          'X-Forwarded-Proto': 'https',
        },
      },
      enabled: true,
      priority: 0,
    });

    // Remove sensitive headers
    this.addRule({
      id: 'remove-sensitive-headers',
      name: 'Remove Sensitive Headers',
      matchPath: '/**',
      requestTransform: {
        removeFields: ['x-api-key', 'authorization'],
      },
      enabled: true,
      priority: 100,
    });
  }

  // ---------------------------------------------------------------------------
  // Rule Management
  // ---------------------------------------------------------------------------

  addRule(rule: TransformRule): ApiResponse<TransformRule> {
    if (this.rules.has(rule.id)) {
      return this.errorResponse('Rule with this ID already exists');
    }

    this.rules.set(rule.id, rule);
    this.sortRules();

    this.emit({
      type: 'rule_added',
      ruleId: rule.id,
      timestamp: new Date().toISOString(),
    });

    return this.successResponse(rule, 'Rule added successfully');
  }

  updateRule(ruleId: string, updates: Partial<TransformRule>): ApiResponse<TransformRule> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return this.errorResponse('Rule not found');
    }

    const updated = { ...rule, ...updates, id: ruleId };
    this.rules.set(ruleId, updated);
    this.sortRules();

    return this.successResponse(updated, 'Rule updated successfully');
  }

  removeRule(ruleId: string): ApiResponse<{ ruleId: string }> {
    if (!this.rules.has(ruleId)) {
      return this.errorResponse('Rule not found');
    }

    this.rules.delete(ruleId);
    return this.successResponse({ ruleId }, 'Rule removed successfully');
  }

  getRule(ruleId: string): ApiResponse<TransformRule | null> {
    const rule = this.rules.get(ruleId);
    return this.successResponse(rule ?? null);
  }

  listRules(): ApiResponse<TransformRule[]> {
    const rules = Array.from(this.rules.values()).sort((a, b) => a.priority - b.priority);
    return this.successResponse(rules);
  }

  // ---------------------------------------------------------------------------
  // Request Transformation
  // ---------------------------------------------------------------------------

  transformRequest(context: TransformContext): TransformResult {
    const result: TransformResult = {
      headers: {},
      query: {},
      removeHeaders: [],
    };

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (!this.matchesPath(rule.matchPath, context.path)) continue;
      if (rule.matchMethods && !rule.matchMethods.includes(context.method)) continue;

      const transform = rule.requestTransform;
      if (!transform) continue;

      // Apply header transformations
      if (transform.headers) {
        for (const [key, value] of Object.entries(transform.headers)) {
          result.headers![key] = value;
        }
      }

      // Apply query parameter transformations
      if (transform.queryParams) {
        for (const [key, value] of Object.entries(transform.queryParams)) {
          result.query![key] = value;
        }
      }

      // Apply body field mappings
      if (transform.bodyMapping && context.body && typeof context.body === 'object') {
        const body = context.body as Record<string, unknown>;
        for (const [from, to] of Object.entries(transform.bodyMapping)) {
          if (body[from] !== undefined) {
            if (!result.body) {
              result.body = { ...body };
            }
            (result.body as Record<string, unknown>)[to] = body[from];
            delete (result.body as Record<string, unknown>)[from];
          }
        }
      }

      // Remove specified fields
      if (transform.removeFields) {
        result.removeHeaders!.push(...transform.removeFields);
      }

      // Add fields
      if (transform.addFields) {
        if (!result.body) {
          result.body = Array.isArray(context.body) ? [...context.body] : { ...(context.body ?? {}) };
        }
        for (const [key, value] of Object.entries(transform.addFields)) {
          (result.body as Record<string, unknown>)[key] = value;
        }
      }
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Response Transformation
  // ---------------------------------------------------------------------------

  transformResponse(
    context: TransformContext,
    responseBody: unknown,
    responseHeaders: Record<string, string>
  ): { body: unknown; headers: Record<string, string> } {
    const result: { body: unknown; headers: Record<string, string> } = {
      body: responseBody,
      headers: { ...responseHeaders },
    };

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (!this.matchesPath(rule.matchPath, context.path)) continue;
      if (rule.matchMethods && !rule.matchMethods.includes(context.method)) continue;

      const transform = rule.responseTransform;
      if (!transform) continue;

      // Apply header transformations
      if (transform.headers) {
        for (const [key, value] of Object.entries(transform.headers)) {
          result.headers[key] = value;
        }
      }

      // Apply query parameter transformations
      if (transform.queryParams) {
        for (const [key, value] of Object.entries(transform.queryParams)) {
          result.headers[`X-Query-${key}`] = value;
        }
      }

      // Apply body field mappings
      if (transform.bodyMapping && result.body && typeof result.body === 'object') {
        const body = result.body as Record<string, unknown>;
        for (const [from, to] of Object.entries(transform.bodyMapping)) {
          if (body[from] !== undefined) {
            body[to] = body[from];
            delete body[from];
          }
        }
      }

      // Remove specified fields
      if (transform.removeFields && result.body && typeof result.body === 'object') {
        const body = result.body as Record<string, unknown>;
        for (const field of transform.removeFields) {
          delete body[field];
        }
      }

      // Add fields
      if (transform.addFields && result.body && typeof result.body === 'object') {
        for (const [key, value] of Object.entries(transform.addFields)) {
          (result.body as Record<string, unknown>)[key] = value;
        }
      }
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Path Matching
  // ---------------------------------------------------------------------------

  private matchesPath(pattern: string, path: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '{{DOUBLE_STAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/\{\{DOUBLE_STAR\}\}/g, '.*')
      .replace(/\?/g, '.');

    try {
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(path);
    } catch {
      return pattern === path;
    }
  }

  // ---------------------------------------------------------------------------
  // Batch Operations
  // ---------------------------------------------------------------------------

  enableRule(ruleId: string): ApiResponse<TransformRule> {
    return this.updateRule(ruleId, { enabled: true });
  }

  disableRule(ruleId: string): ApiResponse<TransformRule> {
    return this.updateRule(ruleId, { enabled: false });
  }

  clearRules(): ApiResponse<{ cleared: number }> {
    const count = this.rules.size;
    this.rules.clear();
    return this.successResponse({ cleared: count }, `Cleared ${count} rules`);
  }

  importRules(rules: TransformRule[]): ApiResponse<{ imported: number }> {
    let imported = 0;
    for (const rule of rules) {
      if (!this.rules.has(rule.id)) {
        this.rules.set(rule.id, rule);
        imported++;
      }
    }
    this.sortRules();
    return this.successResponse({ imported }, `Imported ${imported} rules`);
  }

  exportRules(): ApiResponse<TransformRule[]> {
    return this.successResponse(Array.from(this.rules.values()));
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private sortRules(): void {
    // Rules are sorted by priority when retrieved
  }

  private successResponse<T>(data: T, message?: string): ApiResponse<T> {
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  private errorResponse<T>(error: string): ApiResponse<T> {
    return { success: false, error, timestamp: new Date().toISOString() };
  }

  private emit(event: TransformEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[Transformer] Event listener error:', error);
      }
    }
  }

  onEvent(listener: (event: TransformEvent) => void): void {
    this.listeners.add(listener);
  }

  offEvent(listener: (event: TransformEvent) => void): void {
    this.listeners.delete(listener);
  }

  getStats(): {
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    byPriority: Record<number, number>;
  } {
    let enabled = 0;
    let disabled = 0;
    const byPriority: Record<number, number> = {};

    for (const rule of this.rules.values()) {
      if (rule.enabled) enabled++;
      else disabled++;

      const priorityBucket = Math.floor(rule.priority / 10) * 10;
      byPriority[priorityBucket] = (byPriority[priorityBucket] ?? 0) + 1;
    }

    return {
      totalRules: this.rules.size,
      enabledRules: enabled,
      disabledRules: disabled,
      byPriority,
    };
  }
}

// ============================================================================
// Types and Singleton
// ============================================================================

export interface TransformEvent {
  type: 'rule_added' | 'rule_updated' | 'rule_removed' | 'transformed';
  ruleId?: string;
  timestamp: string;
}

export const requestTransformer = new RequestTransformer();
