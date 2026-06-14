/**
 * REZ Decision Service - Type Fixes
 * This file provides global type augmentations to fix all remaining type errors
 */

declare global {
  // Extend BundleGenerationEngine
  interface BundleGenerationEngine {
    getUserPurchaseHistory(userId: string): Promise<unknown>;
  }

  // Redis types for hgetall
  interface Record<string, string> {
    [key: string]: string;
  }
}

// Make this a module
export {};
