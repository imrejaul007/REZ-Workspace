export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
export const PAYMENT_CURRENCY = 'INR';
export const PAYMENT_DESCRIPTION = 'REZ Merchant Subscription';

// MA-GAP-141: Explicit environment enum — distinguishes unconfigured vs test key
export type PaymentEnvironment = 'live' | 'test' | 'unconfigured';

export function getPaymentEnvironment(): PaymentEnvironment {
  if (!RAZORPAY_KEY_ID) return 'unconfigured';
  if (RAZORPAY_KEY_ID.startsWith('rzp_live_')) return 'live';
  if (RAZORPAY_KEY_ID.startsWith('rzp_test_')) return 'test';
  return 'unconfigured';
}

export function isLiveMode(): boolean {
  return getPaymentEnvironment() === 'live';
}

export function getPaymentMode(): 'live' | 'test' {
  const env = getPaymentEnvironment();
  return env === 'live' ? 'live' : 'test';
}
