/**
 * Intent Capture Service
 *
 * Captures user intent signals for the ReZ intent graph.
 * @see https://github.com/imrejaul007/rez-intent-graph
 */

import { logger } from './logger'

export interface IntentPayload {
  userId?: string
  intent?: string
  source?: 'ad' | 'listing' | 'search' | 'browse'
  eventType?: string
  intentKey?: string
  properties?: Record<string, unknown>
  metadata?: Record<string, unknown>
  timestamp?: number
}

export interface IntentCaptureResult {
  success: boolean
  intentId?: string
  error?: string
}

/**
 * Capture user intent signal
 */
export async function captureIntent(
  payload: IntentPayload
): Promise<IntentCaptureResult> {
  try {
    // Capture intent for the ReZ intent graph
    const intentId = `intent_${Date.now()}`
    
    // Log intent capture (non-sensitive data only)
    logger.info('Intent captured', {
      intentId,
      source: payload.source,
      eventType: payload.eventType,
      intentKey: payload.intentKey,
    })
    
    return { success: true, intentId }
  } catch (error) {
    logger.error('Failed to capture intent', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
