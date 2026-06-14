// @ts-nocheck
import { Platform } from 'react-native';
import apiClient, { ApiResponse } from './apiClient';

/**
 * Razorpay Payment Gateway API Service
 */

export interface RazorpayConfig {
  keyId: string;
  currency: string;
  checkout: {
    name: string;
    description: string;
    image: string;
    theme: {
      color: string;
    };
  };
  isTestMode: boolean;
}

export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, unknown>;
}

export interface RazorpayPaymentVerificationResponse {
  verified: boolean;
  paymentId: string;
  orderId: string;
  paymentMethod: string;
  amount: number;
  status: string;
  transactionId: string;
  /** Raw Razorpay signature — attached client-side for payment recovery persistence (OG-D008). */
  signature?: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, unknown>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Declare Razorpay on window for TypeScript
declare global {
  interface Window {
    Razorpay;
  }
}

/**
 * Load Razorpay checkout script dynamically (Web only)
 * For native platforms, use react-native-razorpay SDK instead
 */
export async function loadRazorpayScript(): Promise<boolean> {
  // Guard: Only available on web platform
  if (Platform.OS !== 'web' || typeof document === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  return new Promise((resolve) => {
    // Check if already loaded
    if ((window as unknown).Razorpay) {
      resolve(true);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

export const razorpayApi = {
  /**
   * Get Razorpay configuration
   */
  async getConfig(): Promise<ApiResponse<RazorpayConfig>> {
    return apiClient.get<RazorpayConfig>('/razorpay/config');
  },

  /**
   * Create a Razorpay order
   */
  async createOrder(data: {
    amount: number;
    orderId?: string;
    notes?: Record<string, unknown>;
  }): Promise<ApiResponse<RazorpayOrderResponse>> {
    // CA-PAY-005 FIX: Validate amount before API call
    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error(`Invalid payment amount: ${data.amount}. Amount must be a positive number.`);
    }
    return apiClient.post<RazorpayOrderResponse>('/razorpay/create-order', data);
  },

  /**
   * Verify Razorpay payment
   */
  async verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderData?;
  }): Promise<ApiResponse<RazorpayPaymentVerificationResponse>> {
    return apiClient.post<RazorpayPaymentVerificationResponse>('/razorpay/verify-payment', data);
  },

  /**
   * Open Razorpay checkout
   * C11: On native (iOS/Android) use react-native-razorpay SDK.
   * On web use the dynamically-loaded checkout.js script.
   */
  async openCheckout(options: RazorpayCheckoutOptions): Promise<void> {
    if (Platform.OS !== 'web') {
      // Native path — react-native-razorpay SDK
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const RazorpayCheckout = require('react-native-razorpay').default;
      return new Promise<void>((resolve, reject) => {
        RazorpayCheckout.open({
          key: options.key,
          amount: options.amount,
          currency: options.currency,
          name: options.name,
          description: options.description,
          image: options.image,
          order_id: options.order_id,
          prefill: options.prefill,
          notes: options.notes,
          theme: options.theme,
        })
          .then((response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            options.handler(response);
            resolve();
          })
          .catch((error: { code: number; description: string }) => {
            if (error.description === 'Payment cancelled by user' || error.code === 0) {
              options.modal?.ondismiss?.();
            } else {
              reject(new Error(error.description || 'Payment failed'));
            }
            resolve(); // always resolve — errors are surfaced via handler/ondismiss
          });
      });
    }

    // Web path — dynamically-loaded checkout.js
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay checkout script');
    }
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  },

  /**
   * Request refund
   */
  async requestRefund(data: {
    paymentId: string;
    amount?: number;
    notes?: Record<string, unknown>;
  }): Promise<ApiResponse<Record<string, unknown>>> {
    return apiClient.post<Record<string, unknown>>('/razorpay/refund', data);
  },
};

/**
 * Helper function to create Razorpay payment
 * This wraps the entire flow: create order → open checkout → verify payment
 */
export async function createRazorpayPayment(config: {
  amount: number;
  orderId?: string;
  notes?: Record<string, unknown>;
  userInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  onSuccess: (response: RazorpayPaymentVerificationResponse) => void;
  onError: (error: Error) => void;
}): Promise<void> {
  try {
    // Step 1: Get Razorpay config
    const configResponse = await razorpayApi.getConfig();
    if (!configResponse.success || !configResponse.data) {
      throw new Error('Failed to get Razorpay configuration');
    }
    const razorpayConfig = configResponse.data;

    // Step 2: Create Razorpay order
    const orderResponse = await razorpayApi.createOrder({
      amount: config.amount,
      orderId: config.orderId,
      notes: config.notes,
    });

    if (!orderResponse.success || !orderResponse.data) {
      throw new Error(orderResponse.message || 'Failed to create Razorpay order');
    }
    const razorpayOrder = orderResponse.data;
    // Step 3: Open Razorpay checkout
    await razorpayApi.openCheckout({
      key: razorpayConfig.keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: razorpayConfig.checkout.name,
      description: razorpayConfig.checkout.description,
      image: razorpayConfig.checkout.image,
      order_id: razorpayOrder.razorpayOrderId,
      prefill: {
        name: config.userInfo?.name,
        email: config.userInfo?.email,
        contact: config.userInfo?.phone,
      },
      notes: config.notes,
      theme: {
        color: razorpayConfig.checkout.theme.color,
      },
      handler: async (response: RazorpaySuccessResponse) => {
        // Step 4: Verify payment on backend
        try {
          // If card payment was used, try to auto-apply card offer
          // Note: Razorpay doesn't expose card number, but we can check payment method
          // The offer should already be applied via CardOffersSection before payment
          
          const verifyResponse = await razorpayApi.verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderData: config.notes,
          });

          if (!verifyResponse.success || !verifyResponse.data) {
            throw new Error(verifyResponse.message || 'Payment verification failed');
          }
          // OG-D008 FIX: Attach the raw Razorpay signature so the caller can
          // persist it for payment recovery if the app is killed before order creation.
          verifyResponse.data.signature = response.razorpay_signature;
          config.onSuccess(verifyResponse.data);
        } catch (error) {
          config.onError(error instanceof Error ? error : new Error('Payment verification failed'));
        }
      },
      modal: {
        ondismiss: () => {
          config.onError(new Error('Payment cancelled by user'));
        },
      },
    });

  } catch (error) {
    config.onError(error instanceof Error ? error : new Error('Payment failed'));
  }
}

