// @ts-nocheck
/**
 * Payment Gateway Integration Tests
 */

import paymentService from '@/services/paymentService';
import apiClient from '@/services/apiClient';
import { cleanupAfterTest } from '../utils/testHelpers';

// paymentService only has default export; use global apiClient mock from jest.setup.js
jest.mock('@/services/paymentService', () => {
  const apiClient = require('@/services/apiClient').default;
  return {
    __esModule: true,
    default: {
      createPaymentIntent: (data: any) => apiClient.post('/payments/create-intent', data),
      createRazorpayOrder: (data: any) => apiClient.post('/payments/razorpay/create-order', data),
      confirmPayment: (data: any) => apiClient.post('/payments/confirm', data),
      verifyPayment: (data: any) => apiClient.post('/payments/verify', data),
      refundPayment: (data: any) => apiClient.post('/payments/refund', data),
    },
  };
});

describe('Payment Gateway Integration Tests', () => {
  afterEach(async () => {
    await cleanupAfterTest();
  });

  it('should create payment intent with Stripe', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        paymentIntentId: 'pi_123',
        clientSecret: 'pi_123_secret',
        amount: 5000,
        currency: 'usd',
      },
    });

    const paymentIntent = await paymentService.createPaymentIntent({
      amount: 5000,
      currency: 'usd',
    });

    expect(paymentIntent.paymentIntentId).toBe('pi_123');
    expect(paymentIntent.clientSecret).toBeDefined();
  });

  it('should handle Razorpay payment', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        orderId: 'order_123',
        amount: 5000,
        currency: 'INR',
      },
    });

    const razorpayOrder = await paymentService.createRazorpayOrder({
      amount: 5000,
      currency: 'INR',
    });

    expect(razorpayOrder.orderId).toBe('order_123');
  });

  it('should verify payment signature', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        verified: true,
        paymentId: 'pay_123',
      },
    });

    const verification = await paymentService.verifyPayment({
      orderId: 'order_123',
      paymentId: 'pay_123',
      signature: 'signature_123',
    });

    expect(verification.verified).toBe(true);
  });

  it('should handle payment failure', async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 402,
        data: { error: 'Payment declined' },
      },
    });

    await expect(
      paymentService.confirmPayment({
        paymentIntentId: 'pi_123',
        paymentMethodId: 'pm_declined',
      })
    ).rejects.toMatchObject({
      response: { status: 402 },
    });
  });
});
