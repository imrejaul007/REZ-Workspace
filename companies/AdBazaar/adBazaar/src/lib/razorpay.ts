/**
 * RABTUL Payment Service Client
 *
 * MIGRATED: This module now uses RABTUL Payment Service (rez-payment-service)
 * instead of direct Razorpay SDK calls.
 *
 * RABTUL Service: rez-payment-service (Port 4001)
 * See: https://github.com/imrejaul007/RABTUL-Technologies/tree/main/rez-payment-service
 *
 * Migration completed:
 * - Removed Razorpay SDK dependency
 * - Using INTERNAL_SERVICE_TOKEN for service-to-service auth
 * - Calls RABTUL endpoints instead of Razorpay directly
 * - Backward compatible function signatures
 */

import logger from '@/lib/logger'

// RABTUL Payment Service configuration
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL ?? 'http://localhost:4001'
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN ?? ''

/**
 * Get the RABTUL Payment Service auth headers
 */
function getAuthHeaders(): HeadersInit {
  if (!INTERNAL_SERVICE_TOKEN) {
    throw new Error('INTERNAL_SERVICE_TOKEN must be set for service-to-service calls')
  }
  return {
    'Content-Type': 'application/json',
    'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
  }
}

/**
 * Make authenticated request to RABTUL Payment Service
 */
async function paymentServiceRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PAYMENT_SERVICE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    logger.error(`[razorpay] Payment service request failed: ${response.status} ${errorText}`)
    throw new Error(`Payment service request failed: ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// MIGRATED FUNCTIONS - Same signatures, new implementation
// ============================================================================

/**
 * Create a new Razorpay order via RABTUL Payment Service
 *
 * @deprecated Use createRazorpayOrder instead
 */
export async function createOrder(params: {
  amount: number
  currency: string
  receipt?: string
  notes?: Record<string, string>
}): Promise<{
  id: string
  amount: number
  currency: string
  status: string
  receipt: string | null
}> {
  logger.info('[razorpay] Creating order via RABTUL Payment Service')

  const result = await paymentServiceRequest<{
    orderId: string
    amount: number
    currency: string
    status: string
    receipt: string | null
  }>('/api/payments/razorpay/create-order', {
    method: 'POST',
    body: JSON.stringify(params),
  })

  return {
    id: result.orderId,
    amount: result.amount,
    currency: result.currency,
    status: result.status,
    receipt: result.receipt,
  }
}

/**
 * Fetch payment details from RABTUL Payment Service
 *
 * This replaces direct Razorpay API calls.
 * AB-C5 FIX: Prevents "pay ₹1 for ₹50,000 booking" attacks
 * by fetching the actual payment amount from RABTUL service.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<{
  amount: number
  currency: string
  status: string
  order_id: string
} | null> {
  try {
    logger.info(`[razorpay] Fetching payment ${paymentId} via RABTUL Payment Service`)

    const payment = await paymentServiceRequest<{
      amount: number
      currency: string
      status: string
      order_id: string
    }>(`/api/payments/razorpay/payment/${paymentId}`)

    return {
      amount: Number(payment.amount),
      currency: String(payment.currency),
      status: String(payment.status),
      order_id: String(payment.order_id),
    }
  } catch (error) {
    logger.error('[razorpay] Failed to fetch payment via RABTUL:', error)
    return null
  }
}

/**
 * Verify payment signature via RABTUL Payment Service
 *
 * The RABTUL Payment Service handles signature verification
 * using server-side secret key comparison.
 * https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/#verify-payment-signature
 */
export async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  try {
    logger.info(`[razorpay] Verifying signature via RABTUL Payment Service`)

    const result = await paymentServiceRequest<{ valid: boolean }>(
      '/api/payments/razorpay/verify-signature',
      {
        method: 'POST',
        body: JSON.stringify({ orderId, paymentId, signature }),
      }
    )

    if (!result.valid) {
      logger.warn('[razorpay] Signature verification failed via RABTUL')
    }

    return result.valid
  } catch (error) {
    logger.error('[razorpay] Signature verification error:', error)
    return false
  }
}

/**
 * Process webhook from Razorpay via RABTUL Payment Service
 *
 * RABTUL handles webhook signature verification and deduplication.
 */
export async function processWebhook(payload: unknown): Promise<{
  success: boolean
  paymentId?: string
  status?: string
}> {
  try {
    logger.info('[razorpay] Processing webhook via RABTUL Payment Service')

    const result = await paymentServiceRequest<{
      success: boolean
      paymentId?: string
      status?: string
    }>('/api/payments/razorpay/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return result
  } catch (error) {
    logger.error('[razorpay] Webhook processing error:', error)
    return { success: false }
  }
}

// ============================================================================
// DEPRECATED - Kept for backward compatibility during migration
// ============================================================================

/**
 * @deprecated Use RABTUL Payment Service directly
 * This function returns a placeholder key ID - actual payments use RABTUL
 */
export const RAZORPAY_KEY_ID = 'rzp_migrated_to_rabtul'

/**
 * @deprecated Razorpay instance is no longer used
 * Kept for backward compatibility during migration
 */
export function getRazorpay(): never {
  throw new Error(
    'Razorpay SDK has been migrated to RABTUL Payment Service. ' +
    'Use createOrder() and fetchRazorpayPayment() instead.'
  )
}
