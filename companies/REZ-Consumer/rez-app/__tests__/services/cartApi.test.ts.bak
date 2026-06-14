import * as cartApi from '@/services/cartApi';

jest.mock('@/services/cartApi', () => ({
  getCart: jest.fn(),
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateCartItem: jest.fn(),
  clearCart: jest.fn(),
}));

describe('cartApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get cart items', async () => {
    const cartItems = [
      { id: 'ci-1', productId: 'p1', name: 'Blue Shirt', qty: 2, price: 50 },
      { id: 'ci-2', productId: 'p2', name: 'Pants', qty: 1, price: 80 },
    ];
    (cartApi.getCart as jest.Mock).mockResolvedValue({ items: cartItems, total: 180 });

    const cart = await cartApi.getCart('user-1');
    expect(cart.items).toHaveLength(2);
    expect(cart.total).toBe(180);
    expect(cartApi.getCart).toHaveBeenCalledWith('user-1');
  });

  it('should add item to cart', async () => {
    (cartApi.addToCart as jest.Mock).mockResolvedValue({ success: true, cartTotal: 50 });

    const result = await cartApi.addToCart('user-1', { productId: 'p3', qty: 1 });
    expect(result.success).toBe(true);
    expect(result.cartTotal).toBe(50);
  });

  it('should remove item from cart', async () => {
    (cartApi.removeFromCart as jest.Mock).mockResolvedValue({ success: true });

    const result = await cartApi.removeFromCart('user-1', 'ci-1');
    expect(result.success).toBe(true);
    expect(cartApi.removeFromCart).toHaveBeenCalledWith('user-1', 'ci-1');
  });
});
