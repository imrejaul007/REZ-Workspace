/**
 * Voice Ordering Service
 * Enables voice commands for kitchen and customers
 */

export interface VoiceCommand {
  type: 'order' | 'status' | 'menu' | 'help';
  parsed;
  confidence: number;
}

/**
 * Parse voice text into structured commands
 */
export function parseVoiceCommand(text: string): VoiceCommand {
  const lower = text.toLowerCase();

  // Order patterns
  const orderPatterns = [
    /(\d+)\s*(.+?)(?:for|to|the)\s*(\w+)/i,
    /order\s+(.+)/i,
    /(\d+)\s+(.+?)\s+please/i
  ];

  for (const pattern of orderPatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: 'order',
        parsed: { quantity: parseInt(match[1]) || 1, item: match[2]?.trim() },
        confidence: 0.9
      };
    }
  }

  // Status patterns
  if (/order\s*status|where.*order|track/i.test(text)) {
    return { type: 'status', parsed: {}, confidence: 0.95 };
  }

  // Menu patterns
  if (/menu|show.*items|what.*have/i.test(text)) {
    return { type: 'menu', parsed: {}, confidence: 0.9 };
  }

  // Help
  if (/help|commands|what.*can.*do/i.test(text)) {
    return { type: 'help', parsed: {}, confidence: 1.0 };
  }

  return { type: 'order', parsed: { raw: text }, confidence: 0.5 };
}

/**
 * Text-to-speech for kitchen announcements
 */
export function announceOrder(items: { name: string; quantity: number }[]): string {
  const itemList = items.map(i => `${i.quantity} ${i.name}`).join(', ');
  return `New order: ${itemList}`;
}

/**
 * Announce order ready
 */
export function announceReady(orderId: string): string {
  return `Order ${orderId} is ready for pickup`;
}

/**
 * Announce kitchen alerts
 */
export function announceAlert(type: 'rush' | 'slow' | 'expiry'): string {
  switch (type) {
    case 'rush': return 'Rush hour alert. Prepare for high volume';
    case 'slow': return 'Order volume is low';
    case 'expiry': return 'Alert: Item expiring soon';
  }
}

/**
 * Voice commands for kitchen
 */
export class KitchenVoice {
  announceNewOrder(order): string {
    return announceOrder(order.items);
  }

  announceReady(orderId: string): string {
    return announceReady(orderId);
  }

  announceDelay(table: string): string {
    return `Attention: Delay for table ${table}`;
  }

  announceClear(): string {
    return 'All orders complete. Kitchen clear';
  }
}

export const kitchenVoice = new KitchenVoice();
