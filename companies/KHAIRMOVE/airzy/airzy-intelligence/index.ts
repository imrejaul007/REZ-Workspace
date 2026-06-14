/**
 * Airzy Intelligence - Integration Layer
 *
 * This module integrates the @hojai/airzy-intelligence package
 * into the Airzy flight service ecosystem.
 *
 * Package Location: ../../../../product-intelligence/airzy-intelligence/
 */

import { createAirzyIntelligence, AirzyIntelligence } from '../../../../product-intelligence/airzy-intelligence/dist/index.js';

let intelligenceInstance: AirzyIntelligence | null = null;

export async function initializeAirzyIntelligence(config?: {
  apiKey?: string;
  baseUrl?: string;
}): Promise<AirzyIntelligence> {
  if (intelligenceInstance) {
    return intelligenceInstance;
  }

  intelligenceInstance = createAirzyIntelligence(config);
  await intelligenceInstance.initialize();

  console.log('✅ Airzy Intelligence initialized');
  return intelligenceInstance;
}

export function getAirzyIntelligence(): AirzyIntelligence {
  if (!intelligenceInstance) {
    throw new Error('Airzy Intelligence not initialized. Call initializeAirzyIntelligence() first.');
  }
  return intelligenceInstance;
}

export async function shutdownAirzyIntelligence(): Promise<void> {
  if (intelligenceInstance) {
    await intelligenceInstance.shutdown();
    intelligenceInstance = null;
  }
}

// Re-export for convenience
export { AirzyIntelligence } from '../../../../product-intelligence/airzy-intelligence/dist/index.js';
