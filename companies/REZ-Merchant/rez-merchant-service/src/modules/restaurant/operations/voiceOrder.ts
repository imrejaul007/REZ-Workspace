/**
 * ReZ Restaurant OS - Voice Ordering Module
 * Natural language order processing
 */

export interface ParsedOrder {
  items: { name: string; quantity: number; confidence: number }[];
  totalConfidence: number;
  raw: string;
}

export class RestaurantVoiceOrder {
  /**
   * Parse voice command to order items
   */
  parseVoiceCommand(text: string): ParsedOrder {
    const lower = text.toLowerCase();

    // Patterns
    const patterns = [
      /(\d+)\s+(\w+)/g,           // "2 burgers"
      /(\w+)\s+(\d+)/g,           // "burgers 2"
      /order\s+(.+)/i,             // "order a burger"
      /(\w+)\s+please/g            // "burger please"
    ];

    const items: { name: string; quantity: number; confidence: number }[] = [];
    let match;

    for (const pattern of patterns) {
      while ((match = pattern.exec(lower)) !== null) {
        const quantity = parseInt(match[1]) || parseInt(match[2]) || 1;
        const name = (match[1] || match[2]).replace(/please|order/g, '').trim();

        if (name.length > 2) {
          items.push({ name, quantity, confidence: 0.9 });
        }
      }
    }

    return {
      items,
      totalConfidence: items.length > 0 ? 0.85 : 0,
      raw: text
    };
  }

  /**
   * Match items to menu
   */
  async matchToMenu(storeId: string, items: { name: string; quantity: number }[]): Promise<unknown[]> {
    const menu = await this.getMenuItems(storeId);
    const matched: unknown[] = [];

    for (const item of items) {
      const menuItem = menu.find(m =>
        m.name.toLowerCase().includes(item.name) ||
        this.calculateSimilarity(m.name, item.name) > 0.7
      );

      if (menuItem) {
        matched.push({
          ...menuItem,
          quantity: item.quantity
        });
      }
    }

    return matched;
  }

  /**
   * Create order from voice
   */
  async createOrderFromVoice(storeId: string, voiceText: string): Promise<{
    orderId: string;
    items: unknown[];
    total: number;
  }> {
    const parsed = this.parseVoiceCommand(voiceText);
    const items = await this.matchToMenu(storeId, parsed.items);

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const orderId = await this.createOrder(storeId, items, total);

    return { orderId, items, total };
  }

  private calculateSimilarity(a: string, b: string): number {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    if (aLower === bLower) return 1;
    if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.8;

    // Simple Levenshtein approximation
    const longer = aLower.length > bLower.length ? aLower : bLower;
    const shorter = aLower.length > bLower.length ? bLower : aLower;

    if (longer.length === 0) return 1;

    return (longer.length - this.levenshtein(longer, shorter)) / longer.length;
  }

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  private async getMenuItems(storeId: string): Promise<unknown[]> {
    // In production: query database
    return [
      { id: '1', name: 'Burger', price: 199 },
      { id: '2', name: 'Pizza', price: 349 },
      { id: '3', name: 'Pasta', price: 249 },
      { id: '4', name: 'Coffee', price: 99 },
      { id: '5', name: 'Coke', price: 49 }
    ];
  }

  private async createOrder(storeId: string, items: unknown[], total: number): Promise<string> {
    // In production: create in database
    return `ORD-${Date.now()}`;
  }
}

export const restaurantVoiceOrder = new RestaurantVoiceOrder();
