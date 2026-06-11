/**
 * AI Waiter - Restaurant Order Taking Agent
 * Part of WAITRON - Restaurant AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  prepTime: number;
  isVeg: boolean;
  tags: string[];
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  specialRequests?: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: { menuItemId: string; name: string; quantity: number; price: number }[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  createdAt: string;
  specialRequests?: string;
}

export interface RecommendationRequest {
  preferences?: string[];
  budget?: number;
  occasion?: string;
  dietaryRestrictions?: string[];
}

export class AIWaiter {
  private menu: MenuItem[] = [];

  constructor(menu: MenuItem[] = []) {
    this.menu = menu;
  }

  /**
   * Take a food order from a table
   */
  async takeOrder(
    tableNumber: number,
    items: OrderItem[],
    specialRequests?: string
  ): Promise<{ order: Order; message: string }> {
    const orderItems = items.map(item => {
      const menuItem = this.menu.find(m => m.id === item.menuItemId);
      return {
        menuItemId: item.menuItemId,
        name: menuItem?.name || 'Unknown',
        quantity: item.quantity,
        price: menuItem?.price || 0,
        specialRequests: item.specialRequests
      };
    });

    const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order: Order = {
      id: uuidv4(),
      tableNumber,
      items: orderItems,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
      specialRequests
    };

    const message = this.generateOrderConfirmation(order, tableNumber);

    return { order, message };
  }

  /**
   * Generate personalized recommendations
   */
  async getRecommendations(request: RecommendationRequest): Promise<{ recommendations: MenuItem[]; message: string }> {
    let filtered = [...this.menu];

    // Filter by dietary restrictions
    if (request.dietaryRestrictions?.includes('vegetarian')) {
      filtered = filtered.filter(m => m.isVeg);
    }

    // Filter by budget
    if (request.budget) {
      filtered = filtered.filter(m => m.price <= request.budget!);
    }

    // Score and sort by relevance
    const scored = filtered.map(item => ({
      ...item,
      score: this.calculateScore(item, request)
    })).sort((a, b) => b.score - a.score);

    const topRecommendations = scored.slice(0, 6);
    const message = this.generateRecommendationMessage(topRecommendations, request);

    return { recommendations: topRecommendations, message };
  }

  /**
   * Answer customer questions about menu
   */
  async answerQuestion(question: string): Promise<{ answer: string; relatedItems?: MenuItem[] }> {
    const lowerQ = question.toLowerCase();

    // Veg options
    if (lowerQ.includes('veg') || lowerQ.includes('vegetarian')) {
      const vegItems = this.menu.filter(m => m.isVeg);
      return {
        answer: `We have ${vegItems.length} vegetarian options including: ${vegItems.slice(0, 3).map(m => m.name).join(', ')}.`,
        relatedItems: vegItems.slice(0, 5)
      };
    }

    // Popular items
    if (lowerQ.includes('popular') || lowerQ.includes('best')) {
      const popular = this.menu.filter(m => m.tags.includes('popular'));
      return {
        answer: `Our most popular dishes are: ${popular.map(m => m.name).join(', ')}.`,
        relatedItems: popular
      };
    }

    // Price range
    if (lowerQ.includes('cheap') || lowerQ.includes('budget')) {
      const affordable = this.menu.filter(m => m.price < 200).sort((a, b) => a.price - b.price);
      return {
        answer: `Great budget options under ₹200: ${affordable.map(m => `${m.name} (₹${m.price})`).join(', ')}.`,
        relatedItems: affordable
      };
    }

    // Default response
    return {
      answer: "I'd be happy to help! You can ask about vegetarian options, popular dishes, or budget-friendly meals."
    };
  }

  /**
   * Handle special requests
   */
  async handleSpecialRequest(request: string): Promise<{ canFulfill: boolean; message: string }> {
    const lower = request.toLowerCase();

    // Easy requests
    const easyRequests = ['no onion', 'no garlic', 'less spicy', 'extra sauce', 'no ice'];
    for (const easy of easyRequests) {
      if (lower.includes(easy)) {
        return {
          canFulfill: true,
          message: `Sure! I'll make sure your order is prepared ${request}.`
        };
      }
    }

    // Complex requests - needs kitchen approval
    const complexRequests = ['allergy', 'custom', 'special ingredient'];
    for (const complex of complexRequests) {
      if (lower.includes(complex)) {
        return {
          canFulfill: true,
          message: `I understand you have a ${complex}. I'll communicate this to the kitchen to ensure your meal is prepared safely.`
        };
      }
    }

    return {
      canFulfill: true,
      message: `Got it! I'll pass along your request: "${request}"`
    };
  }

  private calculateScore(item: MenuItem, request: RecommendationRequest): number {
    let score = 50;

    // Popular items get boost
    if (item.tags.includes('popular')) score += 20;
    if (item.tags.includes('signature')) score += 15;
    if (item.tags.includes('bestseller')) score += 15;

    // Preference match
    if (request.preferences?.includes('veg') && item.isVeg) score += 15;
    if (request.preferences?.includes('non-veg') && !item.isVeg) score += 15;

    // Occasion match
    if (request.occasion === 'special' && item.tags.includes('signature')) score += 20;

    // Budget fit
    if (request.budget && item.price <= request.budget! * 0.7) score += 10;

    return Math.min(score, 100);
  }

  private generateOrderConfirmation(order: Order, tableNumber: number): string {
    const vegCount = order.items.filter(i => this.menu.find(m => m.name === i.name)?.isVeg).length;
    const nonVegCount = order.items.length - vegCount;

    let message = `Order confirmed for Table ${tableNumber}! `;
    message += `${vegCount} vegetarian and ${nonVegCount} non-vegetarian items. `;
    message += `Total: ₹${order.total}.`;

    if (order.specialRequests) {
      message += ` Note: ${order.specialRequests}`;
    }

    return message;
  }

  private generateRecommendationMessage(items: MenuItem[], request: RecommendationRequest): string {
    if (items.length === 0) {
      return "I couldn't find any items matching your criteria. Would you like to see our full menu?";
    }

    let message = "Based on your preferences";
    if (request.preferences?.length) message += ` (${request.preferences.join(', ')})`;
    if (request.occasion) message += ` for ${request.occasion}`;
    message += ", I recommend: ";

    return message + items.slice(0, 3).map(m => m.name).join(', ');
  }
}

export default AIWaiter;
