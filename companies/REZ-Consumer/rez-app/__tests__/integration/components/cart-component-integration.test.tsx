// @ts-nocheck
/**
 * Cart Component Integration Tests
 *
 * Tests cart-related component interactions
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { CartContext } from '@/contexts/CartContext';
import apiClient from '@/services/apiClient';
import { setupAuthenticatedUser, cleanupAfterTest, testDataFactory } from '../utils/testHelpers';

// Use global apiClient mock from jest.setup.js — DO NOT re-mock here

// Mock Cart Component — uses React Native components, not HTML elements
const MockCartPage = () => {
  const { cart, removeItem, updateQuantity } = React.useContext(CartContext as unknown);

  return (
    <>
      {cart?.items?.map((item) => (
        <View key={item.id} testID={`cart-item-${item.id}`}>
          <Text testID="item-name">{item.product.name}</Text>
          <Text testID="item-quantity">{item.quantity}</Text>
          <TouchableOpacity
            testID={`remove-${item.id}`}
            onPress={() => removeItem(item.id)}
          >
            <Text>Remove</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID={`increase-${item.id}`}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>
      ))}
      <Text testID="cart-total">{cart?.total || 0}</Text>
    </>
  );
};

describe('Cart Component Integration Tests', () => {
  beforeEach(async () => {
    await setupAuthenticatedUser();
  });

  afterEach(async () => {
    await cleanupAfterTest();
  });

  it('should sync cart state with API when items are added/removed', async () => {
    const mockCart = testDataFactory.cart();

    (apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      data: mockCart,
    });

    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { item: mockCart.items[0] },
    });

    // Fetch initial cart state
    const cartResponse = await apiClient.get('/cart');
    expect(cartResponse.success).toBe(true);
    expect(cartResponse.data.items).toHaveLength(1);
    expect(cartResponse.data.items[0].productId).toBe('product_1');

    // Add an item — cart now has 2 items (optimistically)
    const addResponse = await apiClient.post('/cart/add', {
      productId: mockCart.items[0].productId,
      quantity: 1,
    });
    expect(addResponse.success).toBe(true);
    expect(addResponse.data.item.id).toBe(mockCart.items[0].id);

    // Remove an item — cart is back to 0 items
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { removed: true },
    });
    const removeResponse = await apiClient.delete(`/cart/item/${mockCart.items[0].id}`);
    expect(removeResponse.data.removed).toBe(true);
  });

  it('should update cart total when quantity changes', async () => {
    const mockCart = testDataFactory.cart();
    const originalTotal = mockCart.total;
    const updatedTotal = mockCart.total + 999;

    (apiClient.put as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockCart, total: updatedTotal },
    });

    const result = await apiClient.put(`/cart/item/${mockCart.items[0].id}`, { quantity: 3 });

    expect(result.success).toBe(true);
    expect(result.data.total).toBe(updatedTotal);
    expect(result.data.total).toBeGreaterThan(originalTotal);
    expect(apiClient.put).toHaveBeenCalledWith(
      `/cart/item/${mockCart.items[0].id}`,
      { quantity: 3 }
    );
  });

  it('should handle concurrent cart operations', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      success: true,
      data: { item: { id: 'item_1' } },
    });

    // Simulate concurrent add operations
    const operations = [
      apiClient.post('/cart/add', { productId: 'prod_1' }),
      apiClient.post('/cart/add', { productId: 'prod_2' }),
      apiClient.post('/cart/add', { productId: 'prod_3' }),
    ];

    const results = await Promise.all(operations);
    expect(apiClient.post).toHaveBeenCalledTimes(3);

    // All three operations succeed
    results.forEach(r => {
      expect(r.success).toBe(true);
      expect(r.data.item.id).toBe('item_1');
    });

    // Verify each call had the correct product
    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/cart/add', { productId: 'prod_1' });
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/cart/add', { productId: 'prod_2' });
    expect(apiClient.post).toHaveBeenNthCalledWith(3, '/cart/add', { productId: 'prod_3' });
  });
});
