import { v4 as uuidv4 } from 'uuid';
import { Basket, BasketItem, BasketStatus, Discount, ItemDiscount } from '../schemas/basket.schema';

export class BasketModel {
  static createBasket(data: { shopperId: string; storeId?: string; sessionId?: string; currency?: string }): Basket {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return {
      id: uuidv4(),
      shopperId: data.shopperId,
      storeId: data.storeId,
      sessionId: data.sessionId,
      status: 'active',
      items: [],
      subtotal: 0,
      discounts: [],
      discountTotal: 0,
      tax: 0,
      total: 0,
      currency: data.currency || 'USD',
      createdAt: now,
      updatedAt: now,
      expiresAt,
    };
  }

  static addItem(basket: Basket, item: Omit<BasketItem, 'id' | 'totalPrice'>): Basket {
    const existingIndex = basket.items.findIndex(i => i.productId === item.productId);

    let newItems: BasketItem[];
    if (existingIndex >= 0) {
      newItems = basket.items.map((existing, idx) => {
        if (idx === existingIndex) {
          return {
            ...existing,
            quantity: existing.quantity + item.quantity,
            totalPrice: (existing.quantity + item.quantity) * existing.unitPrice,
          };
        }
        return existing;
      });
    } else {
      const newItem: BasketItem = {
        id: uuidv4(),
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      };
      newItems = [...basket.items, newItem];
    }

    return this.recalculateTotals({
      ...basket,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  }

  static updateItemQuantity(basket: Basket, productId: string, quantity: number): Basket {
    if (quantity === 0) {
      return this.removeItem(basket, productId);
    }

    const newItems = basket.items.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity,
          totalPrice: quantity * item.unitPrice,
        };
      }
      return item;
    });

    return this.recalculateTotals({
      ...basket,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  }

  static removeItem(basket: Basket, productId: string): Basket {
    const newItems = basket.items.filter(item => item.productId !== productId);
    return this.recalculateTotals({
      ...basket,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  }

  static applyItemDiscount(basket: Basket, productId: string, discount: Omit<ItemDiscount, 'description'>): Basket {
    const newItems = basket.items.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          discount: {
            ...discount,
            description: discount.description || this.getDiscountDescription(discount),
          },
        };
      }
      return item;
    });

    return this.recalculateTotals({
      ...basket,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  }

  static applyBasketDiscount(basket: Basket, discount: Omit<Discount, 'id' | 'appliedAt'>): Basket {
    const newDiscount: Discount = {
      id: uuidv4(),
      ...discount,
      appliedAt: new Date().toISOString(),
    };

    return this.recalculateTotals({
      ...basket,
      discounts: [...basket.discounts, newDiscount],
      updatedAt: new Date().toISOString(),
    });
  }

  static removeDiscount(basket: Basket, discountId: string): Basket {
    return this.recalculateTotals({
      ...basket,
      discounts: basket.discounts.filter(d => d.id !== discountId),
      updatedAt: new Date().toISOString(),
    });
  }

  static recalculateTotals(basket: Basket): Basket {
    const subtotal = basket.items.reduce((sum, item) => sum + item.totalPrice, 0);

    let itemDiscountTotal = 0;
    basket.items.forEach(item => {
      if (item.discount) {
        if (item.discount.type === 'percentage') {
          itemDiscountTotal += item.totalPrice * (item.discount.value / 100);
        } else if (item.discount.type === 'fixed') {
          itemDiscountTotal += item.discount.value * item.quantity;
        }
      }
    });

    const basketDiscountTotal = basket.discounts.reduce((sum, discount) => {
      if (discount.type === 'percentage') {
        return sum + subtotal * (discount.value / 100);
      } else if (discount.type === 'fixed') {
        return sum + discount.value;
      } else if (discount.type === 'shipping') {
        return sum + discount.value;
      }
      return sum;
    }, 0);

    const discountTotal = itemDiscountTotal + basketDiscountTotal;
    const taxableAmount = subtotal - itemDiscountTotal;
    const tax = taxableAmount * 0.08;
    const total = subtotal - discountTotal + tax;

    return {
      ...basket,
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(Math.max(0, total) * 100) / 100,
    };
  }

  static updateStatus(basket: Basket, status: BasketStatus): Basket {
    const updates: Partial<Basket> = { status, updatedAt: new Date().toISOString() };

    if (status === 'abandoned') {
      updates.abandonedAt = new Date().toISOString();
    } else if (status === 'converted') {
      updates.convertedAt = new Date().toISOString();
    }

    return { ...basket, ...updates };
  }

  static save(basket: Basket): Basket {
    return {
      ...basket,
      status: 'saved',
      updatedAt: new Date().toISOString(),
    };
  }

  static restore(basket: Basket): Basket {
    return {
      ...basket,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
  }

  static expire(basket: Basket): Basket {
    return {
      ...basket,
      status: 'expired',
      updatedAt: new Date().toISOString(),
    };
  }

  static getDiscountDescription(discount: ItemDiscount): string {
    switch (discount.type) {
      case 'percentage':
        return `${discount.value}% off`;
      case 'fixed':
        return `$${discount.value} off`;
      case 'bundle':
        return `Bundle discount`;
      default:
        return 'Discount applied';
    }
  }

  static calculateSavings(basket: Basket): number {
    const originalTotal = basket.subtotal + basket.tax;
    return Math.round((originalTotal - basket.total) * 100) / 100;
  }

  static getItemCount(basket: Basket): number {
    return basket.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  static getUniqueItemCount(basket: Basket): number {
    return basket.items.length;
  }

  static isEmpty(basket: Basket): boolean {
    return basket.items.length === 0;
  }

  static validateBasket(basket: Basket): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (basket.items.length === 0) {
      errors.push('Basket is empty');
    }

    if (basket.total < 0) {
      errors.push('Basket total cannot be negative');
    }

    basket.items.forEach(item => {
      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for product ${item.productId}`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Invalid price for product ${item.productId}`);
      }
    });

    return { valid: errors.length === 0, errors };
  }
}