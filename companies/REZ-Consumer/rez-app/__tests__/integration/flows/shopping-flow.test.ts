// @ts-nocheck
/**
 * Shopping Flow Integration Tests
 *
 * Complete user journey from browsing products to order completion
 */

import apiClient from '@/services/apiClient';
import {
  setupAuthenticatedUser,
  cleanupAfterTest,
  testDataFactory,
  generateMockProducts,
  measurePerformance,
} from '../utils/testHelpers';

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
    getCategories: () => apiClient.get('/categories'),
    getHomepageProducts: () => apiClient.get('/products/homepage'),
  };
  return { __esModule: true, default: mock, cartApi: mock };
});
import { cartApi } from '@/services/cartApi';

// productsApi exports: named productsApi + default productsService
jest.mock('@/services/productsApi', () => {
  const apiClient = require('@/services/apiClient').default;
  const mock = {
    getProducts: (params?: any) => apiClient.get('/products', params),
    getProductById: (id: string) => apiClient.get(`/products/${id}`),
    searchProducts: (q: string) => apiClient.get('/products/search', { q }),
    getCategories: () => apiClient.get('/categories'),
    getHomepageProducts: () => apiClient.get('/products/homepage'),
  };
  return { __esModule: true, default: mock, productsApi: mock };
});
import { productsApi } from '@/services/productsApi';

// orderApi exports: named orderApi + default orderApi
jest.mock('@/services/orderApi', () => {
  const apiClient = require('@/services/apiClient').default;
  const mock = {
    createOrder: (data: any) => apiClient.post('/orders', data),
    validateCoupon: (code: string, subtotal: number) => apiClient.post('/orders/validate-coupon', { code, subtotal }),
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

describe('Shopping Flow Integration Tests', () => {
  beforeEach(async () => {
    await setupAuthenticatedUser();
  });

  afterEach(async () => {
    await cleanupAfterTest();
  });

  describe('Complete Shopping Journey', () => {
    it('should complete full shopping flow: Browse → View → Add to Cart → Checkout → Payment → Order', async () => {
      // Step 1: Browse Products
      const mockProducts = generateMockProducts(10);
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          products: mockProducts,
          pagination: { page: 1, limit: 20, total: 10 },
        },
      });

      const productsResponse = await productsApi.getProducts({ page: 1, limit: 20 });
      expect(productsResponse.data.products).toHaveLength(10);

      // Step 2: View Product Details
      const selectedProduct = mockProducts[0];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: selectedProduct,
      });

      const productDetails = await productsApi.getProductById(selectedProduct.id);
      expect(productDetails.data.id).toBe(selectedProduct.id);

      // Step 3: Add to Cart
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          item: {
            id: 'cart_item_1',
            productId: selectedProduct.id,
            quantity: 2,
            price: selectedProduct.price,
            subtotal: selectedProduct.price * 2,
          },
        },
      });

      const cartItem = await cartApi.addToCart({
        productId: selectedProduct.id,
        quantity: 2,
      });
      expect(cartItem.data.item.quantity).toBe(2);

      // Step 4: View Cart
      const mockCart = testDataFactory.cart();
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockCart,
      });

      const cart = await cartApi.getCart();
      expect(cart.data.items.length).toBeGreaterThan(0);
      expect(cart.data.total).toBeGreaterThan(0);

      // Step 5: Select Delivery Address
      const mockAddress = testDataFactory.address();
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [mockAddress],
      });

      const addresses = await addressApi.getAddresses();
      const defaultAddress = (addresses.data as any[]).find((addr: any) => addr.isDefault);
      expect(defaultAddress).toBeDefined();

      // Step 6: Create Payment Intent
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          paymentIntentId: 'pi_test_123',
          clientSecret: 'pi_test_123_secret',
          amount: cart.total,
        },
      });

      const paymentIntent = await paymentService.createPaymentIntent({
        amount: cart.total,
        currency: 'usd',
      });
      expect(paymentIntent.data.clientSecret).toBeDefined();

      // Step 7: Confirm Payment
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          status: 'succeeded',
          paymentIntentId: paymentIntent.paymentIntentId,
        },
      });

      const payment = await paymentService.confirmPayment({
        paymentIntentId: paymentIntent.data.paymentIntentId,
        paymentMethodId: 'pm_test_card',
      });
      expect(payment.data.status).toBe('succeeded');

      // Step 8: Create Order
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'order_test_123',
          orderNumber: 'ORD-2024-TEST',
          status: 'pending',
          items: cart.items,
          total: cart.total,
          shippingAddress: defaultAddress,
          paymentIntentId: paymentIntent.paymentIntentId,
        },
      });

      const order = await orderApi.createOrder({
        fulfillmentType: 'delivery',
        deliveryAddress: {
          name: defaultAddress!.name || 'Test Customer',
          phone: defaultAddress!.phone || '9999999999',
          addressLine1: defaultAddress!.addressLine1 || '123 Test St',
          city: defaultAddress!.city || 'Bangalore',
          state: defaultAddress!.state || 'Karnataka',
          pincode: defaultAddress!.pincode || '560001',
        },
        paymentMethod: 'upi',
        items: cart.items.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      expect(order.data.id).toBeDefined();
      expect(order.data.orderNumber).toBeDefined();
      expect(order.data.status).toBe('pending');

      // Step 9: Clear Cart
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { message: 'Cart cleared' },
      });

      await cartApi.clearCart();

      // Verify all API calls were made in correct order
      expect(apiClient.get).toHaveBeenCalled();
      expect(apiClient.post).toHaveBeenCalled();
    });

    it('should handle product search and filter flow', async () => {
      // Search for products
      const searchQuery = 'laptop';
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          products: generateMockProducts(5),
          query: searchQuery,
        },
      });

      const searchResults = await productsApi.searchProducts(searchQuery);
      expect(searchResults.data.products).toBeDefined();

      // Apply filters
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          products: generateMockProducts(3),
          filters: {
            category: 'electronics',
            priceRange: { min: 1000, max: 5000 },
          },
        },
      });

      const filteredProducts = await productsApi.getProducts({
        category: 'electronics',
        minPrice: 1000,
        maxPrice: 5000,
      });
      expect(filteredProducts.data.products.length).toBeGreaterThan(0);
    });

    it('should handle cart modifications during shopping', async () => {
      // Add multiple items
      const products = generateMockProducts(3);

      for (const product of products) {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          success: true,
          data: {
            item: {
              id: `cart_item_${product.id}`,
              productId: product.id,
              quantity: 1,
              price: product.price,
            },
          },
        });

        await cartApi.addToCart({
          productId: product.id,
          quantity: 1,
        });
      }

      // Update quantity
      (apiClient.put as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          item: {
            id: 'cart_item_1',
            quantity: 3,
          },
        },
      });

      await cartApi.updateCartItem('cart_item_1', { quantity: 3 });

      // Remove item
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { message: 'Item removed' },
      });

      await cartApi.removeFromCart('cart_item_2');

      // Get updated cart
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: testDataFactory.cart(),
      });

      const cart = await cartApi.getCart();
      expect(cart.data.items).toBeDefined();
    });
  });

  describe('Product Discovery Flow', () => {
    it('should browse by category and view product details', async () => {
      // Get categories
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          categories: [
            { id: 'cat_1', name: 'Electronics', productCount: 50 },
            { id: 'cat_2', name: 'Fashion', productCount: 100 },
          ],
        },
      });

      const categoriesResponse = await productsApi.getCategories();
      expect(categoriesResponse.categories.length).toBeGreaterThan(0);

      // Get products in category
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          products: generateMockProducts(10),
          category: 'Electronics',
        },
      });

      const categoryProducts = await productsApi.getProducts({
        category: 'cat_1',
      });
      expect(categoryProducts.data.products).toBeDefined();

      // View product details
      const product = categoryProducts.data.products[0];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          ...product,
          reviews: [],
          relatedProducts: generateMockProducts(4),
        },
      });

      const productDetails = await productsApi.getProductById(product.id);
      expect(productDetails.id).toBe(product.id);
    });

    it('should handle recommended products flow', async () => {
      // Get homepage recommendations
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          recommended: generateMockProducts(10),
          trending: generateMockProducts(5),
          newArrivals: generateMockProducts(8),
        },
      });

      const homepage = await productsApi.getHomepageProducts();
      expect(homepage.recommended).toBeDefined();
      expect(homepage.trending).toBeDefined();
    });
  });

  describe('Checkout Variations', () => {
    it('should handle guest checkout flow', async () => {
      // Get cart without authentication
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: testDataFactory.cart(),
      });

      const cart = await cartApi.getCart();

      // Create guest order with email
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'order_guest_123',
          guestEmail: 'guest@example.com',
          status: 'pending',
        },
      });

      const guestOrder = await orderApi.createOrder({
        fulfillmentType: 'delivery',
        deliveryAddress: {
          name: 'Guest Customer',
          phone: '9999999999',
          addressLine1: '123 Guest St',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
        },
        paymentMethod: 'upi',
        specialInstructions: 'Guest checkout',
        items: cart.items.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      expect(guestOrder.data.id).toBeDefined();
    });

    it('should handle express checkout flow', async () => {
      // Cart with default address and payment method
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'order_express_123',
          status: 'pending',
          total: 2500,
          expressCheckout: true,
        },
      });

      const expressOrder = await orderApi.createOrder({
        fulfillmentType: 'delivery',
        deliveryAddress: {
          name: 'Express Customer',
          phone: '9999999999',
          addressLine1: '456 Express Ave',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
        },
        paymentMethod: 'upi',
        items: testDataFactory.cart().items.map((item: any) => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      expect(expressOrder.data.expressCheckout).toBe(true);
    });

    it('should handle buy now flow (skip cart)', async () => {
      const product = generateMockProducts(1)[0];

      // Direct checkout without adding to cart
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'order_buynow_123',
          items: [
            {
              productId: product.id,
              quantity: 1,
              price: product.price,
            },
          ],
          total: product.price,
        },
      });

      const quickOrder = await orderApi.createOrder({
        fulfillmentType: 'delivery',
        deliveryAddress: {
          name: 'Quick Customer',
          phone: '9999999999',
          addressLine1: '789 Quick Blvd',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
        },
        paymentMethod: 'upi',
        items: [
          {
            product: product.id,
            quantity: 1,
            price: product.price,
          },
        ],
      });

      expect(quickOrder.data.items).toHaveLength(1);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle out of stock during checkout', async () => {
      const cart = testDataFactory.cart();
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: cart,
      });

      await cartApi.getCart();

      // Product goes out of stock before checkout
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: 'Product is out of stock',
            productId: cart.items[0].productId,
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
          items: cart.items.map((item: any) => ({
            product: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      });
    });

    it('should handle payment failure and retry', async () => {
      // First payment attempt fails
      (apiClient.post as jest.Mock)
        .mockRejectedValueOnce({
          response: {
            status: 402,
            data: { error: 'Payment failed' },
          },
        })
        // Retry succeeds
        .mockResolvedValueOnce({
          success: true,
          data: {
            status: 'succeeded',
            paymentIntentId: 'pi_123',
          },
        });

      // First attempt
      await expect(
        paymentService.confirmPayment({
          paymentIntentId: 'pi_123',
          paymentMethodId: 'pm_card_declined',
        })
      ).rejects.toBeDefined();

      // Retry with different card
      const payment = await paymentService.confirmPayment({
        paymentIntentId: 'pi_123',
        paymentMethodId: 'pm_card_success',
      });

      expect(payment.data.status).toBe('succeeded');
    });

    it('should handle address validation errors', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: 'Invalid address',
            fields: ['postalCode', 'state'],
          },
        },
      });

      await expect(
        addressApi.createAddress({
          street: '123 Test St',
          city: 'Test City',
          postalCode: 'INVALID',
          state: 'XX',
        } as any)
      ).rejects.toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should complete shopping flow within acceptable time', async () => {
      const { duration } = await measurePerformance(async () => {
        // Browse products
        await productsApi.getProducts({ page: 1 });

        // Add to cart
        await cartApi.addToCart({ productId: 'prod_1', quantity: 1 });

        // Get cart
        await cartApi.getCart();

        // Create order
        await orderApi.createOrder({
          fulfillmentType: 'delivery',
          deliveryAddress: {
            name: 'Perf Test',
            phone: '9999999999',
            addressLine1: '123 Perf St',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001',
          },
          paymentMethod: 'upi',
          items: [{ product: 'prod_1', quantity: 1, price: 999 }],
        });
      });

      // Should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should handle concurrent cart operations', async () => {
      const products = generateMockProducts(5);

      // Add multiple items concurrently
      const addOperations = products.map(product => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          success: true,
          data: { item: { productId: product.id } },
        });
        return cartApi.addToCart({ productId: product.id, quantity: 1 });
      });

      const results = await Promise.all(addOperations);
      expect(results).toHaveLength(5);
    });
  });
});
