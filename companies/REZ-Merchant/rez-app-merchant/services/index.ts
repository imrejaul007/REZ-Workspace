// API Services
export { apiClient } from './api/index';
export { authService } from './api/auth';
export { dashboardService } from './api/dashboard';
export { ordersService } from './api/orders';
export { cashbackService } from './api/cashback';
export { productsService } from './api/products';
export { catalogService } from './api/catalogService';
export { uploadsService } from './api/uploads';
export { socketService } from './api/socket';
export { documentsService } from './api/documents';
export { socialMediaService } from './api/socialMedia';
export { walletService } from './api/wallet';
export { coinsService } from './api/coins';
export { dealRedemptionsService } from './api/dealRedemptions';
export { storeVisitsService } from './api/storeVisits';
export {
  loyaltyService,
  useLoyaltySettings,
  useLoyaltyMembers,
  usePunchCards,
  useMemberStats,
  useLoyaltyProgram,
  useTierManagement,
  type LoyaltySettings,
  type LoyaltyMember,
  type PunchCard,
  type LoyaltyTier,
  type LoyaltyProgram,
  type MemberStats,
  type StreakData,
  type Badge,
  type RedeemRequest,
  type RedeemResponse,
} from './loyalty';

// Real Order Service (connects to https://rez-order-service.onrender.com)
export { orderService } from '../src/services/orderService';
export type { LiveOrder, OrderItem, OrderCustomer, OrderStatus } from '../src/services/orderService';
export {
  usePunchCardProgress,
  usePunchCardStamp,
  usePunchCardManager,
  usePunchCardHistory,
  formatPunchCardProgress,
  generateStampDisplay,
} from './punchCardService';

// Intent Capture & REZ Mind
export {
  captureIntent,
  track,
  trackMenuViewed,
  trackOrderReceived,
  trackReviewReceived,
  sendOrderToRezMind,
  sendInventoryLowToRezMind,
  sendPaymentToRezMind,
} from './intentCaptureService';

// Storage Service
export { storageService } from './storage';

// Offline Service
export { offlineService } from './offline';

// Re-import for local use
import { authService } from './api/auth';
import { dashboardService } from './api/dashboard';
import { ordersService } from './api/orders';
import { cashbackService } from './api/cashback';
import { productsService } from './api/products';
import { catalogService } from './api/catalogService';
import { uploadsService } from './api/uploads';
import { socketService } from './api/socket';
import { documentsService } from './api/documents';
import { socialMediaService } from './api/socialMedia';
import { walletService } from './api/wallet';
import { coinsService } from './api/coins';
import { dealRedemptionsService } from './api/dealRedemptions';
import { storeVisitsService } from './api/storeVisits';
import { storageService } from './storage';
import { offlineService } from './offline';
import { loyaltyService } from './loyalty';
import { orderService } from '../src/services/orderService';

// API Service Collection
export const apiServices = {
  auth: authService,
  dashboard: dashboardService,
  orders: ordersService,
  cashback: cashbackService,
  products: productsService,
  catalog: catalogService,
  uploads: uploadsService,
  socket: socketService,
  documents: documentsService,
  socialMedia: socialMediaService,
  wallet: walletService,
  coins: coinsService,
  dealRedemptions: dealRedemptionsService,
  storeVisits: storeVisitsService,
  loyalty: loyaltyService,
  order: orderService, // Real order service connected to rez-order-service.onrender.com
};

// Storage utilities
export const storage = storageService;

// Offline utilities
export const offline = offlineService;

// REZ MIND Copilot Service
export { getMerchantInsights, getAIRecommendations, getHealthScore } from './copilotService';
