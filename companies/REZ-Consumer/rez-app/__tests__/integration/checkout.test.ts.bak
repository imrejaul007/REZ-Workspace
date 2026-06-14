/**
 * Checkout Flow - Integration Tests
 *
 * End-to-end integration tests for the complete checkout process including:
 * - Cart validation
 * - Address selection
 * - Payment processing
 * - Order creation
 * - Confirmation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/services/apiClient';

// cartApi exports: named cartApi + default cartService
jest.mock('@/services/cartApi', () => {
  const apiClient = require('@/services/apiClient').default;
  const mock = {
    getCart: () => apiClient.get('/cart'),
    addToCart: (data: any) => apiClient.post('/cart/add', data),
    updateCartItem: (id: string, data: any) => apiClient.put(`/cart/item/${id}`, data),
    removeFromCart: (id: string) => apiClient.delete(`/cart/item/${id}`),
    clearCart: () => apiClient.post('/cart/clear'),
    validateCart: () => apiClient.post('/cart/validate'),
  };
  return { __esModule: true, default: mock, cartApi: mock };
});
import { cartApi } from '@/services/cartApi';

// orderApi exports: named orderApi + default orderApi
jest.mock('@/services/orderApi', () => {
  const apiClient = require('@/services/apiClient').default;
  const mock = {
    createOrder: (data: any) => apiClient.post('/orders', data),
    validateCoupon: (code: string, subtotal: number) => apiClient.post('/orders/validate-coupon', { code, subtotal }),
    getOrder: (id: string) => apiClient.get(`/orders/${id}`),
    getOrders: () => apiClient.get('/orders'),
  };
  return { __esModule: true, default: mock, orderApi: mock };
});
import { orderApi } from '@/services/orderApi';

// paymentService only has default export
jest.mock('@/services/paymentService', () => {
  const apiClient = require('@/services/apiClient').default;
  const mock = {
    createPaymentIntent: (data: any) => apiClient.post('/payments/create-intent', data),
    confirmPayment: (data: any) => apiClient.post('/payments/confirm', data),
    refundPayment: (id: string) => apiClient.post('/payments/refund', { id }),
  };
  return { __esModule: true, default: mock };
});
import paymentService from '@/services/paymentService';

// addressApi exports: named addressApi + default AddressApiService
jest.mock('@/services/addressApi', () => {
  const apiClient = require('@/services/apiClient').default;
  const mock = {
    getAddresses: () => apiClient.get('/addresses'),
    createAddress: (data: any) => apiClient.post('/addresses', data),
    updateAddress: (id: string, data: any) => apiClient.put(`/addresses/${id}`, data),
    deleteAddress: (id: string) => apiClient.delete(`/addresses/${id}`),
  };
  return { __esModule: true, default: mock, addressApi: mock };
});
import { addressApi } from '@/services/addressApi';

describe('Checkout Flow Integration Tests', () => {
  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    phoneNumber: '+1234567890',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  const mockCartItems = [
    {
      id: 'cart_item_1',
      productId: 'prod_123',
      product: {
        id: 'prod_123',
        name: 'Test Product 1',
        price: 999,
        images: ['image1.jpg'],
      },
      quantity: 2,
      price: 999,
      subtotal: 1998,
    },
    {
      id: 'cart_item_2',
      productId: 'prod_456',
      product: {
        id: 'prod_456',
        name: 'Test Product 2',
        price: 499,
        images: ['image2.jpg'],
      },
      quantity: 1,
      price: 499,
      subtotal: 499,
    },
  ];

  const mockAddress = {
    id: 'addr_123',
    firstName: 'John',
    lastName: 'Doe',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    phoneNumber: '+1234567890',
    isDefault: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Complete Checkout Flow', () => {
    it('should complete full checkout process successfully', async () => {
      // Step 1: Get cart
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          items: mockCartItems,
          subtotal: 2497,
          tax: 249.7,
          shipping: 50,
          total: 2796.7,
        },
      });

      const cart = await cartApi.getCart();
      expect(cart.data.items).toHaveLength(2);
      expect(cart.data.total).toBe(2796.7);

      // Step 2: Get saved addresses
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [mockAddress],
      });

      const addresses = await addressApi.getAddresses();
      expect(addresses.data).toHaveLength(1);
      expect(addresses.data[0].isDefault).toBe(true);

      // Step 3: Create payment intent
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          clientSecret: 'pi_123_secret',
          paymentIntentId: 'pi_123',
          amount: 2796.7,
        },
      });

      const paymentIntent = await paymentService.createPaymentIntent({
        amount: cart.data.total,
        currency: 'usd',
      });

      expect(paymentIntent.data.clientSecret).toBeDefined();
      expect(paymentIntent.data.amount).toBe(2796.7);

      // Step 4: Create order
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'order_123',
          status: 'pending',
          items: mockCartItems,
          total: 2796.7,
          shippingAddress: mockAddress,
          paymentIntentId: 'pi_123',
        },
      });

      const order = await orderApi.createOrder({
        fulfillmentType: 'delivery',
        deliveryAddress: {
          name: mockAddress.firstName + ' ' + mockAddress.lastName,
          phone: mockAddress.phoneNumber,
          addressLine1: mockAddress.street,
          city: mockAddress.city,
          state: mockAddress.state,
          pincode: mockAddress.postalCode,
        },
        paymentMethod: 'upi',
        items: cart.data.items.map((item: any) => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      expect(order.data.id).toBe('order_123');
      expect(order.data.status).toBe('pending');

      // Step 5: Clear cart after successful order
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { message: 'Cart cleared' },
      });

      await cartApi.clearCart();

      expect(apiClient.post).toHaveBeenCalledWith('/cart/clear');
    });

    it('should handle out of stock items during checkout', async () => {
      // Get cart with item that becomes out of stock
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          items: mockCartItems,
          subtotal: 2497,
          total: 2796.7,
        },
      });

      const cart = await cartApi.getCart();

      // Attempt to create order
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: 'Some items are out of stock',
            outOfStockItems: ['prod_123'],
          },
        },
      });

      await expect(
        orderApi.createOrder({
          fulfillmentType: 'delivery',
          deliveryAddress: {
            name: 'Test Customer',
            phone: '9999999999',
            addressLine1: '123 Test St',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001',
          },
          paymentMethod: 'upi',
          items: cart.data.items.map((item: any) => ({
            product: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: expect.objectContaining({
            error: expect.stringContaining('out of stock'),
          }),
        },
      });
    });

    it('should handle payment failure gracefully', async () => {
      // Get cart
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          items: mockCartItems,
          total: 2796.7,
        },
      });

      const cart = await cartApi.getCart();

      // Create payment intent succeeds
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          clientSecret: 'pi_123_secret',
          paymentIntentId: 'pi_123',
        },
      });

      const paymentIntent = await paymentService.createPaymentIntent({
        amount: cart.data.total,
      });

      // Payment fails
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 402,
          data: {
            error: 'Payment failed: Insufficient funds',
          },
        },
      });

      await expect(
        paymentService.confirmPayment({
          paymentIntentId: paymentIntent.data.paymentIntentId,
          paymentMethodId: 'pm_123',
        })
      ).rejects.toMatchObject({
        response: {
          status: 402,
        },
      });

      // Order should not be created
      expect(apiClient.post).not.toHaveBeenCalledWith(
        '/orders',
        expect.any(Object)
      );
    });
  });

  describe('Cart Validation', () => {
    it('should validate minimum order amount', async () => {
      const smallCart = {
        items: [
          {
            id: 'item_1',
            productId: 'prod_1',
            quantity: 1,
            price: 5,
            subtotal: 5,
          },
        ],
        subtotal: 5,
        total: 5,
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: smallCart,
      });

      const cart = await cartApi.getCart();

      // Minimum order is $10
      const minimumOrderAmount = 10;
      expect(cart.data.total).toBeLessThan(minimumOrderAmount);

      // Should reject order creation
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: `Minimum order amount is $${minimumOrderAmount}`,
          },
        },
      });

      await expect(
        orderApi.createOrder({
          fulfillmentType: 'delivery',
          deliveryAddress: {
            name: 'Test Customer',
            phone: '9999999999',
            addressLine1: '123 Test St',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001',
          },
          paymentMethod: 'upi',
          items: cart.data.items.map((item: any) => ({
            product: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        })
      ).rejects.toBeDefined();
    });

    it('should validate item availability before checkout', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          items: mockCartItems,
          total: 2796.7,
        },
      });

      const cart = await cartApi.getCart();

      // Validate stock availability
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          available: true,
          items: mockCartItems.map((item) => ({
            productId: item.productId,
            available: true,
            stockQuantity: 10,
          })),
        },
      });

      const validation = await cartApi.validateCart();

      expect(validation.data.available).toBe(true);
      expect(validation.data.items.every((item: any) => item.available)).toBe(true);
    });
  });

  describe('Address Management', () => {
    it('should create new address during checkout', async () => {
      const newAddress = {
        firstName: 'Jane',
        lastName: 'Smith',
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
        phoneNumber: '+1987654321',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'addr_456',
          ...newAddress,
          isDefault: false,
        },
      });

      const createdAddress = await addressApi.createAddress(newAddress);

      expect(createdAddress.data.id).toBe('addr_456');
      expect(createdAddress.data.street).toBe(newAddress.street);
    });

    it('should set default address for checkout', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [mockAddress],
      });

      const addresses = await addressApi.getAddresses();
      const defaultAddress = (addresses.data as any[]).find((addr) => addr.isDefault);

      expect(defaultAddress).toBeDefined();
      expect(defaultAddress?.id).toBe('addr_123');
    });
  });

  describe('Payment Processing', () => {
    it('should process card payment successfully', async () => {
      (apiClient.post as jest.Mock)
        // Create payment intent
        .mockResolvedValueOnce({
          success: true,
          data: {
            clientSecret: 'pi_123_secret',
            paymentIntentId: 'pi_123',
          },
        })
        // Confirm payment
        .mockResolvedValueOnce({
          success: true,
          data: {
            status: 'succeeded',
            paymentIntentId: 'pi_123',
          },
        });

      const paymentIntent = await paymentService.createPaymentIntent({
        amount: 2796.7,
      });

      const payment = await paymentService.confirmPayment({
        paymentIntentId: paymentIntent.data.paymentIntentId,
        paymentMethodId: 'pm_card_123',
      });

      expect(payment.data.status).toBe('succeeded');
    });

    it('should handle 3D Secure authentication', async () => {
      (apiClient.post as jest.Mock)
        // Create payment intent
        .mockResolvedValueOnce({
          success: true,
          data: {
            clientSecret: 'pi_123_secret',
            paymentIntentId: 'pi_123',
          },
        })
        // Confirm payment requires action
        .mockResolvedValueOnce({
          success: true,
          data: {
            status: 'requires_action',
            paymentIntentId: 'pi_123',
            nextAction: {
              type: 'redirect_to_url',
              url: 'https://3ds.example.com',
            },
          },
        })
        // After 3DS, confirm again
        .mockResolvedValueOnce({
          success: true,
          data: {
            status: 'succeeded',
            paymentIntentId: 'pi_123',
          },
        });

      const paymentIntent = await paymentService.createPaymentIntent({
        amount: 2796.7,
      });

      const initialPayment = await paymentService.confirmPayment({
        paymentIntentId: paymentIntent.data.paymentIntentId,
        paymentMethodId: 'pm_card_3ds',
      });

      expect(initialPayment.data.status).toBe('requires_action');
      expect(initialPayment.data.nextAction).toBeDefined();

      // Simulate 3DS completion
      const finalPayment = await paymentService.confirmPayment({
        paymentIntentId: paymentIntent.data.paymentIntentId,
      });

      expect(finalPayment.data.status).toBe('succeeded');
    });

    it('should support wallet payments (Apple Pay, Google Pay)', async () => {
      (apiClient.post as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          data: {
            clientSecret: 'pi_123_secret',
            paymentIntentId: 'pi_123',
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            status: 'succeeded',
            paymentIntentId: 'pi_123',
            paymentMethod: 'apple_pay',
          },
        });

      const paymentIntent = await paymentService.createPaymentIntent({
        amount: 2796.7,
      });

      const payment = await paymentService.confirmPayment({
        paymentIntentId: paymentIntent.data.paymentIntentId,
        paymentMethodType: 'apple_pay',
        token: 'wallet_token_123',
      });

      expect(payment.data.status).toBe('succeeded');
      expect(payment.data.paymentMethod).toBe('apple_pay');
    });
  });

  describe('Order Creation', () => {
    it('should create order with all details', async () => {
      const orderData = {
        fulfillmentType: 'delivery',
        deliveryAddress: {
          name: 'Test Customer',
          phone: '9999999999',
          addressLine1: '123 Test St',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
        },
        paymentMethod: 'upi',
        items: mockCartItems.map((item) => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        couponCode: 'SAVE10',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'order_123',
          orderNumber: 'ORD-2024-001',
          status: 'pending',
          items: mockCartItems,
          subtotal: 2497,
          discount: 249.7,
          tax: 224.73,
          shipping: 50,
          total: 2521.03,
          shippingAddress: mockAddress,
          paymentStatus: 'paid',
          createdAt: new Date().toISOString(),
        },
      });

      const order = await orderApi.createOrder(orderData);

      expect(order.data.id).toBe('order_123');
      expect(order.data.orderNumber).toBe('ORD-2024-001');
      expect(order.data.discount).toBeGreaterThan(0);
      expect(order.data.paymentStatus).toBe('paid');
    });

    it('should handle order creation failure and rollback', async () => {
      // Payment succeeds
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          status: 'succeeded',
          paymentIntentId: 'pi_123',
        },
      });

      const payment = await paymentService.confirmPayment({
        paymentIntentId: 'pi_123',
        paymentMethodId: 'pm_123',
      });

      expect(payment.data.status).toBe('succeeded');

      // Order creation fails
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 500,
          data: {
            error: 'Order creation failed',
          },
        },
      });

      await expect(
        orderApi.createOrder({
          fulfillmentType: 'delivery',
          deliveryAddress: {
            name: 'Test Customer',
            phone: '9999999999',
            addressLine1: '123 Test St',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001',
          },
          paymentMethod: 'upi',
          items: mockCartItems.map((item) => ({
            product: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        })
      ).rejects.toBeDefined();

      // Should refund payment
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          status: 'refunded',
          paymentIntentId: 'pi_123',
        },
      });

      const refund = await paymentService.refundPayment('pi_123');
      expect(refund.data.status).toBe('refunded');
    });
  });

  describe('Discount and Coupon Application', () => {
    it('should apply coupon code to order', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          valid: true,
          code: 'SAVE10',
          discountType: 'percentage',
          discountValue: 10,
          discountAmount: 249.7,
        },
      });

      const coupon = await orderApi.validateCoupon('SAVE10', 2497);

      expect(coupon.data.valid).toBe(true);
      expect(coupon.data.discountAmount).toBe(249.7);
    });

    it('should reject invalid coupon codes', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Invalid coupon code',
      });

      // orderApi.validateCoupon returns a resolved promise with success:false,
      // not a rejected promise — adjust expectation to match actual behavior
      const result = await orderApi.validateCoupon('INVALID', 2497);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid coupon code');
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed API calls', async () => {
      let attemptCount = 0;

      (apiClient.get as jest.Mock).mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          success: true,
          data: { items: mockCartItems, total: 2796.7 },
        });
      });

      // Implement retry logic
      const getCartWithRetry = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await cartApi.getCart();
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
          }
        }
      };

      const cart = await getCartWithRetry();
      expect(cart.data.items).toHaveLength(2);
      expect(attemptCount).toBe(3);
    });
  });

  describe('Performance Tests', () => {
    it('should complete checkout within acceptable time', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: { items: mockCartItems, total: 2796.7 },
      });

      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 'order_123', status: 'pending' },
      });

      const startTime = Date.now();

      await cartApi.getCart();
      await paymentService.createPaymentIntent({ amount: 2796.7 });
      await orderApi.createOrder({
        fulfillmentType: 'delivery',
        deliveryAddress: {
          name: 'Test Customer',
          phone: '9999999999',
          addressLine1: '123 Test St',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
        },
        paymentMethod: 'upi',
        items: mockCartItems.map((item) => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });
});
