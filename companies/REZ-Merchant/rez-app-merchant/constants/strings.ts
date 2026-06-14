/**
 * Centralized UI Strings — Merchant App
 *
 * TS-L1: All user-visible strings should live here to document the intent for
 * Phase 2 internationalization. This is NOT a full i18n solution — it is a
 * flat constants object that centralizes the most common UI strings so that
 * future `react-i18next` extraction has a single source to migrate from.
 *
 * USAGE:
 *   import { Strings } from '@/constants/strings';
 *   <Text>{Strings.common.loading}</Text>
 *
 * i18n: Replace this file with react-i18next locale files.
 * See TS-L1 in docs/Bugs/15-TYPESCRIPT-UI.md for tracking.
 */

export const Strings = {
  common: {
    // Loading states - specific and contextual
    loading: 'Just a moment...',
    pleaseWait: 'Please wait...',
    processingData: 'Processing your data...',
    savingChanges: 'Saving your changes...',
    updatingData: 'Updating...',

    // Generic
    error: 'Oops! Something went wrong',
    errorRetry: 'This usually resolves on its own. Please try again.',
    retry: 'Try Again',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    search: 'Search',
    filter: 'Filter',
    refresh: 'Refresh',
    noData: 'No data available',
    noResults: 'No results found',
  },

  // Contextual loading messages
  loading: {
    dashboard: 'Loading your dashboard...',
    orders: 'Fetching your orders...',
    products: 'Loading your products...',
    customers: 'Loading customers...',
    wallet: 'Loading your wallet...',
    transactions: 'Loading transactions...',
    analytics: 'Preparing your analytics...',
    reports: 'Generating reports...',
    storeSettings: 'Loading store settings...',
    team: 'Loading your team...',
    messages: 'Loading messages...',
    notifications: 'Loading notifications...',
  },

  auth: {
    login: 'Log In',
    logout: 'Log Out',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    sessionExpired: 'Your session has expired. Please log in again.',
    unauthorized: 'You are not authorized to perform this action.',
  },

  errors: {
    // Network errors - reassuring language
    networkError: 'Connection problem. Please check your internet connection.',
    networkRetry: 'Check your connection and try again.',
    timeout: 'Taking too long. Please try again.',

    // Server errors
    serverError: 'Server is busy. Please try again in a few moments.',
    serverRetry: 'Try again in a few minutes.',

    // Not found
    notFound: 'This information is no longer available.',
    pageNotFound: 'This page is no longer available.',

    // Validation
    validationFailed: 'Please check the form and try again.',
    invalidInput: 'Please check your input and try again.',

    // Generic - no blame language
    unknownError: 'Something unexpected happened. Please try again.',
    genericRetry: 'This usually resolves on its own. Please try again.',

    // Actions with retry
    saveFailed: 'Your changes weren\'t saved. Please try again.',
    deleteFailed: 'Item couldn\'t be deleted. Please try again.',
    updateFailed: 'Update couldn\'t be saved. Please try again.',
  },

  // Payment-specific errors
  payment: {
    title: 'Payment issue',
    message: 'Your payment couldn\'t be processed. Please try again.',
    cardDeclined: 'Card was declined. Please try a different card.',
    insufficientFunds: 'Insufficient funds. Please try a different payment method.',
    gatewayError: 'Payment service is temporarily unavailable. Please try again.',
    processingError: 'Payment processing failed. Please try again.',
  },

  // Wallet-specific errors
  wallet: {
    title: 'Wallet unavailable',
    message: 'We couldn\'t load your wallet. Please try again.',
    withdrawalFailed: 'Withdrawal request failed. Please try again.',
    insufficientBalance: 'Insufficient balance for this withdrawal.',
    bankUpdateFailed: 'Bank details couldn\'t be updated. Please try again.',
    withdrawalLimit: 'Amount exceeds your withdrawal limit.',
    minWithdrawal: 'Minimum withdrawal amount is required.',
  },
  orders: {
    newOrder: 'New Order',
    orderReceived: 'Order received',
    preparing: 'Preparing',
    ready: 'Ready for pickup',
    completed: 'Completed',
    cancelled: 'Cancelled',
    noOrders: 'No orders yet',
  },
  pos: {
    addToCart: 'Add to Cart',
    removeItem: 'Remove Item',
    clearCart: 'Clear Cart',
    checkout: 'Checkout',
    payNow: 'Pay Now',
    splitBill: 'Split Bill',
    applyDiscount: 'Apply Discount',
    totalAmount: 'Total Amount',
    subtotal: 'Subtotal',
    tax: 'Tax',
    tip: 'Tip',
  },
  wallet: {
    balance: 'Balance',
    addFunds: 'Add Funds',
    withdraw: 'Withdraw',
    transfer: 'Transfer',
    transactionHistory: 'Transaction History',
    insufficientFunds: 'Insufficient funds',
  },
  store: {
    open: 'Open',
    closed: 'Closed',
    openStore: 'Open Store',
    closeStore: 'Close Store',
    settings: 'Store Settings',
  },
} as const;

export type StringKey = keyof typeof Strings;
