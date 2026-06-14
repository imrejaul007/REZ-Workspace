// @ts-nocheck
/**
 * Order Service Configuration
 *
 * Environment variables:
 * - ORDER_SERVICE_URL: Base URL for the order service (e.g., http://localhost:3006)
 * - ADS_ORDER_SERVICE_TOKEN: Internal service token for authenticating with order service
 * - REPORTING_USE_ESTIMATED_REVENUE: Set to 'false' to fetch actual revenue from order service
 * - ORDER_SERVICE_TIMEOUT_MS: Timeout for order service calls (default: 5000)
 */

export interface OrderServiceConfig {
  baseUrl: string;
  token: string;
  timeoutMs: number;
  useEstimatedRevenue: boolean;
}

/**
 * Parse internal service tokens from JSON format
 * Supports: INTERNAL_SERVICE_TOKENS_JSON={"ads-service":"token"} or single ADS_ORDER_SERVICE_TOKEN
 */
function parseInternalServiceTokens(): string {
  // First try: direct ADS_ORDER_SERVICE_TOKEN
  if (process.env.ADS_ORDER_SERVICE_TOKEN) {
    return process.env.ADS_ORDER_SERVICE_TOKEN;
  }

  // Second try: JSON map format (INTERNAL_SERVICE_TOKENS_JSON)
  const tokensJson = process.env.INTERNAL_SERVICE_TOKENS_JSON;
  if (tokensJson) {
    try {
      const tokens = JSON.parse(tokensJson);
      // Try specific ads-service key first, then fall back to any available token
      return tokens['ads-service'] || tokens['ads'] || Object.values(tokens)[0] as string;
    } catch {
      // Invalid JSON, ignore
    }
  }

  return '';
}

export function getOrderServiceConfig(): OrderServiceConfig {
  const baseUrl = process.env.ORDER_SERVICE_URL?.replace(/\/$/, '') || '';
  const token = parseInternalServiceTokens();
  const timeoutMs = parseInt(process.env.ORDER_SERVICE_TIMEOUT_MS || '5000', 10);
  const useEstimatedRevenue = process.env.REPORTING_USE_ESTIMATED_REVENUE !== 'false';

  return {
    baseUrl,
    token,
    timeoutMs,
    useEstimatedRevenue,
  };
}

/**
 * Validate order service configuration
 * Returns null if configuration is valid, or an error message if not
 */
export function validateOrderServiceConfig(): string | null {
  const config = getOrderServiceConfig();

  if (!config.baseUrl) {
    return 'ORDER_SERVICE_URL is not configured';
  }

  if (!config.token) {
    return 'No order service token configured (ADS_ORDER_SERVICE_TOKEN or INTERNAL_SERVICE_TOKENS_JSON)';
  }

  return null;
}
