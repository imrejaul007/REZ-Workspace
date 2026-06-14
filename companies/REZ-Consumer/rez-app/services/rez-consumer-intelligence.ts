/**
 * REZ Consumer Intelligence - Standalone
 *
 * Local intelligence layer for REZ Consumer app.
 * Works independently and emits signals to parent intelligence when available.
 */

export interface Signal {
  type: 'user_action' | 'system_event' | 'business_event' | 'analytics';
  source: string;
  name: string;
  payload: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: Date;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export class RezConsumerIntelligence {
  private signals: Signal[] = [];
  private memory: Map<string, unknown> = new Map();
  private userProfiles: Map<string, any> = new Map();
  private emitToParent?: (signal: Signal) => Promise<void>;

  constructor(config?: { emitToParent?: (signal: Signal) => Promise<void> }) {
    this.emitToParent = config?.emitToParent;
  }

  async initialize(): Promise<void> {
    console.log('Initializing REZ Consumer Intelligence...');
    this.memory.set('initialized', true);
    this.memory.set('startTime', new Date());
  }

  async emitSignal(signal: Omit<Signal, 'timestamp'>): Promise<void> {
    const fullSignal: Signal = { ...signal, timestamp: new Date() };
    this.signals.push(fullSignal);
    this.processSignal(fullSignal);

    if (this.emitToParent) {
      try {
        await this.emitToParent(fullSignal);
      } catch (e) {
        console.warn('Failed to emit to parent:', e);
      }
    }
  }

  private processSignal(signal: Signal): void {
    // Track user activity
    if (signal.userId) {
      const profile = this.userProfiles.get(signal.userId) || { signals: [], preferences: {} };
      profile.signals.push(signal);
      profile.lastActivity = new Date();
      this.userProfiles.set(signal.userId, profile);
    }

    // Update global metrics
    switch (signal.name) {
      case 'order_placed':
        this.updateOrderMetrics(signal.payload);
        break;
      case 'cart_abandoned':
        this.updateCartMetrics(signal.payload);
        break;
      case 'product_viewed':
        this.updateViewMetrics(signal.payload);
        break;
    }
  }

  private updateOrderMetrics(payload: Record<string, unknown>): void {
    const orders = (this.memory.get('recentOrders') as any[]) || [];
    orders.unshift({ ...payload, timestamp: new Date() });
    this.memory.set('recentOrders', orders.slice(0, 100));
    this.memory.set('totalOrders', (this.memory.get('totalOrders') as number || 0) + 1);
  }

  private updateCartMetrics(payload: Record<string, unknown>): void {
    const abandoned = (this.memory.get('abandonedCarts') as any[]) || [];
    abandoned.push({ ...payload, timestamp: new Date() });
    this.memory.set('abandonedCarts', abandoned.slice(0, 100));
  }

  private updateViewMetrics(payload: Record<string, unknown>): void {
    const views = (this.memory.get('productViews') as any[]) || [];
    views.push({ ...payload, timestamp: new Date() });
    this.memory.set('productViews', views.slice(0, 500));
  }

  getStats() {
    return {
      status: 'active',
      totalSignals: this.signals.length,
      userProfiles: this.userProfiles.size,
      initialized: this.memory.get('initialized') === true,
    };
  }

  async shutdown(): Promise<void> {
    this.signals = [];
    this.memory.clear();
    this.userProfiles.clear();
  }
}

// Singleton instance
let intel: RezConsumerIntelligence | null = null;

export async function initializeRezConsumerIntelligence(config?: {
  userId?: string;
  emitToParent?: (signal: Signal) => Promise<void>;
}): Promise<RezConsumerIntelligence> {
  if (intel) return intel;

  intel = new RezConsumerIntelligence(config);
  await intel.initialize();
  return intel;
}

export function getRezConsumerIntelligence(): RezConsumerIntelligence | null {
  return intel;
}

// ============================================
// HOOKS
// ============================================

export async function onOrderPlaced(params: {
  orderId: string;
  userId: string;
  items: Array<{ productId: string; name: string; quantity: number; price: number }>;
  total: number;
  paymentMethod: string;
  deliveryType: string;
}): Promise<void> {
  if (!intel) return;
  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'order_placed',
    payload: params,
    priority: 'high',
    userId: params.userId,
  });
}

export async function onOrderDelivered(params: {
  orderId: string;
  userId: string;
  deliveredAt: Date;
}): Promise<void> {
  if (!intel) return;
  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'order_delivered',
    payload: params,
    priority: 'medium',
    userId: params.userId,
  });
}

export async function onOrderCancelled(params: {
  orderId: string;
  userId: string;
  reason: string;
}): Promise<void> {
  if (!intel) return;
  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'order_cancelled',
    payload: params,
    priority: 'medium',
    userId: params.userId,
  });
}

export async function onCartAbandoned(params: {
  userId: string;
  cartId: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
}): Promise<void> {
  if (!intel) return;
  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'cart_abandoned',
    payload: params,
    priority: 'low',
    userId: params.userId,
  });
}

export async function onAddedToCart(params: {
  userId: string;
  productId: string;
  quantity: number;
}): Promise<void> {
  if (!intel) return;
  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'added_to_cart',
    payload: params,
    priority: 'low',
    userId: params.userId,
  });
}

export async function onProductViewed(params: {
  userId?: string;
  productId: string;
  category: string;
  source: 'search' | 'browse' | 'recommendation' | 'ad';
}): Promise<void> {
  if (!intel) return;
  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'product_viewed',
    payload: params,
    priority: 'low',
    userId: params.userId,
  });
}

export async function onReviewPosted(params: {
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
}): Promise<void> {
  if (!intel) return;
  await intel.emitSignal({
    type: 'user_action',
    source: 'rez-app',
    name: 'review_posted',
    payload: params,
    priority: 'medium',
    userId: params.userId,
  });
}

export function getRezAppStats() {
  if (!intel) return { status: 'not_initialized' };
  return intel.getStats();
}
