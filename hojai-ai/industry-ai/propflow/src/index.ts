/**
 * PROPFLOW - Real Estate AI Operating System
 * Main Entry Point
 */

// Re-export server for direct usage
export { default } from './server';
export { default as app } from './server';

// Re-export models
export * from './models';

// Re-export schemas
export * from './schemas';

// Re-export agents
export * from './agents';

// Re-export config
export * from './config';
export { logger } from './config/logger';

// Re-export middleware
export * from './middleware';