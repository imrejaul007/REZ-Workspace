// @ts-nocheck
/**
 * User-Friendly Error Messages — Consumer App
 *
 * These messages are designed to be:
 * - Clear about what happened
 * - Reassuring (no blame on user)
 * - Actionable (tell user what to do next)
 * - Not alarming (don't use words like "failed", "error", "crash")
 */

export const ERROR_MESSAGES = {
  // Generic errors
  generic: {
    title: 'Oops! Something went wrong',
    message: 'This usually resolves on its own. Please try again.',
    retry: 'Try Again',
  },

  // Network errors
  network: {
    title: 'Connection problem',
    message: 'Please check your internet connection and try again.',
    retry: 'Retry',
  },
  timeout: {
    title: 'Taking too long',
    message: 'The server is taking longer than expected. Please try again.',
    retry: 'Retry',
  },

  // Payment errors
  payment: {
    title: 'Payment couldn\'t be completed',
    message: 'Your card wasn\'t charged. Please try again or use a different payment method.',
    retry: 'Try Again',
    cardDeclined: 'Your card was declined. Please try a different card or payment method.',
    insufficientFunds: 'Insufficient funds in your account. Please try a different payment method.',
    expiredCard: 'Your card has expired. Please try a different card.',
    invalidOtp: 'The OTP you entered is incorrect. Please check and try again.',
    gatewayError: 'Payment gateway is temporarily unavailable. Please try again in a few minutes.',
  },

  // Order errors
  order: {
    title: 'Order couldn\'t be placed',
    message: 'Your cart is still saved. Please try again.',
    retry: 'Try Again',
    storeUnavailable: 'This store is currently not accepting orders. Please try again later.',
    itemUnavailable: 'One or more items in your cart are no longer available.',
    minimumOrder: 'Your order doesn\'t meet the minimum order amount for this store.',
    outOfDeliveryArea: 'Sorry, we don\'t deliver to your location yet.',
  },

  // Location errors
  location: {
    title: 'Location access needed',
    message: 'Please enable location access to find stores near you.',
    settings: 'Open Settings',
  },
  locationDenied: 'Location access was denied. Please enable it in Settings to see nearby stores.',

  // Store errors
  store: {
    title: 'Store details unavailable',
    message: 'We couldn\'t load the store information. Please try again.',
    retry: 'Try Again',
    notFound: 'This store is no longer available.',
  },

  // Search errors
  search: {
    title: 'Search failed',
    message: 'We couldn\'t complete your search. Please try again.',
    retry: 'Try Again',
    noResults: 'No stores match your search. Try different keywords or browse categories.',
  },

  // Wallet errors
  wallet: {
    title: 'Wallet unavailable',
    message: 'We couldn\'t load your wallet. Please try again.',
    retry: 'Try Again',
    insufficientBalance: 'Insufficient balance in your wallet.',
    withdrawalError: 'Withdrawal request couldn\'t be processed. Please try again.',
  },

  // Reviews errors
  review: {
    title: 'Review couldn\'t be submitted',
    message: 'Your review wasn\'t saved. Please try again.',
    retry: 'Try Again',
  },

  // Authentication errors
  auth: {
    title: 'Session expired',
    message: 'Please log in again to continue.',
    login: 'Log In',
    sessionExpired: 'Your session has expired. Please log in again to continue.',
  },

  // Cart errors
  cart: {
    title: 'Cart update failed',
    message: 'We couldn\'t update your cart. Please try again.',
    retry: 'Try Again',
    itemOutOfStock: 'This item is currently out of stock.',
    quantityLimit: 'Maximum quantity limit reached for this item.',
  },

  // Image/Upload errors
  upload: {
    title: 'Upload failed',
    message: 'Your image wasn\'t uploaded. Please try again.',
    retry: 'Try Again',
    tooLarge: 'Image is too large. Please choose a smaller image.',
    invalidFormat: 'Invalid image format. Please use JPG, PNG, or HEIC.',
  },
} as const;

// Contextual loading messages for better UX
export const LOADING_MESSAGES = {
  // General
  default: 'Loading...',
  pleaseWait: 'Please wait...',

  // Store-related
  findingRestaurants: 'Finding restaurants near you...',
  loadingStores: 'Loading nearby stores...',
  loadingStoreDetails: 'Loading store details...',
  loadingMenu: 'Loading delicious options...',

  // Payment-related
  processingPayment: 'Processing payment securely...',
  verifyingPayment: 'Verifying your payment...',
  settingUpPayment: 'Setting up payment...',

  // Order-related
  placingOrder: 'Placing your order...',
  checkingAvailability: 'Checking availability...',
  confirmingOrder: 'Confirming your order...',

  // Wallet-related
  loadingWallet: 'Loading your wallet...',
  addingCoins: 'Adding your coins...',
  redeemingCoins: 'Adding your reward...',
  checkingBalance: 'Checking your balance...',

  // Profile-related
  loadingProfile: 'Loading your profile...',
  savingProfile: 'Saving your changes...',

  // Reviews
  submittingReview: 'Submitting your review...',
  loadingReviews: 'Loading reviews...',

  // Search
  searching: 'Searching...',
  findingResults: 'Finding results...',

  // Location
  gettingLocation: 'Getting your location...',
  findingNearby: 'Finding nearby options...',

  // Media
  uploadingImage: 'Uploading image...',
  processingImage: 'Processing image...',

  // General operations
  pleaseWait: 'Please wait...',
  almostDone: 'Almost done...',
  justAMoment: 'Just a moment...',
} as const;

// Pull-to-refresh messages
export const PULL_TO_REFRESH_MESSAGES = {
  pulling: 'Pull to refresh...',
  refreshing: 'Refreshing...',
  success: 'Updated!',
} as const;

// Empty state messages
export const EMPTY_STATE_MESSAGES = {
  noOrders: {
    title: 'No orders yet',
    message: 'Your order history will appear here.',
  },
  noNotifications: {
    title: 'All caught up!',
    message: 'You\'ll see notifications here.',
  },
  noFavorites: {
    title: 'No favorites yet',
    message: 'Save your favorite stores to see them here.',
  },
  noResults: {
    title: 'No results found',
    message: 'Try different keywords or browse categories.',
  },
  noTransactions: {
    title: 'No transactions',
    message: 'Your transaction history will appear here.',
  },
  noReviews: {
    title: 'No reviews yet',
    message: 'Be the first to review!',
  },
} as const;

export type ErrorKey = keyof typeof ERROR_MESSAGES;
export type LoadingMessageKey = keyof typeof LOADING_MESSAGES;
