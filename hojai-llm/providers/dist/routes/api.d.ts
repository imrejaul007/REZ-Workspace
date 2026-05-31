/**
 * HOJAI LLM Providers - API Routes
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: API endpoints for LLM provider service
 */
import { Router } from 'express';
import type { LLMRouter } from '../types/index.js';
export interface APIRouterDeps {
    router: LLMRouter;
}
/**
 * Create API routes
 */
export declare function createAPIRouter(deps: APIRouterDeps): Router;
//# sourceMappingURL=api.d.ts.map