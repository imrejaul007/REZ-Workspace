/**
 * REZ Ecosystem Integrations - Index
 *
 * This file exports all integration modules for easy importing.
 *
 * Usage:
 * ```typescript
 * import { rezIntelligence } from './integrations/rezIntelligence';
 * import { rabtulPlatform } from './integrations/rabtulPlatform';
 *
 * // Use in your service
 * const intent = await rezIntelligence.predictIntent(userId);
 * const payment = await rabtulPlatform.payment.createOrder(amount, userId);
 * ```
 */

// REZ Intelligence Integrations
export { default as rezIntelligence } from './rezIntelligence';

// RABTUL Platform Integrations
export { default as rabtulPlatform } from './rabtulPlatform';

// Export individual services for convenience
export { authService, paymentService, walletService, analyticsService, notificationService, profileService } from './rabtulPlatform';
