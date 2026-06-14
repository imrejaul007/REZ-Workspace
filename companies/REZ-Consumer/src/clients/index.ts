/**
 * REZ-Consumer Service Clients
 *
 * Modular client architecture for all service integrations.
 *
 * USAGE:
 *
 * Option 1: Use the unified hub (backward compatible)
 * import { rezConsumerHub } from './hub-client';
 * await rezConsumerHub.authenticateUser(phone);
 *
 * Option 2: Use modular clients (recommended for tree-shaking)
 * import { rabtulServices } from './clients';
 * await rabtulServices.auth.authenticateUser(phone);
 *
 * Option 3: Use specific service
 * import { walletService } from './clients/rabtul.client';
 * await walletService.getBalance(userId);
 */

// Re-export individual modular clients
export { rabtulServices, authService, walletService, paymentService, orderService, bookingService, notificationService } from './rabtul.client';
export {
  hojaiServices,
  genieMemoryService,
  genieRelationService,
  genieBriefingService,
  commerceAIService,
  customerAIService,
  marketingAIService,
  financialAIService,
  voiceOSService,
  voiceAgentsService,
} from './hojai.client';

// Re-export the main hub for backward compatibility
export { REZConsumerHub, rezConsumerHub } from '../hub-client';
