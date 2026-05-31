import axios, { AxiosInstance } from 'axios';

// ============ TYPES ============

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  variant?: string;
}

export interface Cart {
  cartId: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'active' | 'checkout' | 'completed' | 'abandoned';
}

export interface Order {
  orderId: string;
  orderNumber: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  payment: {
    method: 'upi' | 'card' | 'wallet' | 'cod';
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    transactionId?: string;
  };
  status: 'pending' | 'confirmed' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled';
  delivery?: {
    address?: string;
    estimatedTime?: Date;
  };
}

export interface Conversation {
  conversationId: string;
  channel: 'whatsapp' | 'instagram' | 'sms' | 'email';
  state: 'active' | 'queued' | 'assigned' | 'resolved' | 'closed';
  customer: Customer;
  lastMessage?: string;
  lastMessageAt?: Date;
  messageCount: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface Message {
  id: string;
  content: {
    text?: string;
    mediaUrl?: string;
    mediaType?: string;
  };
  direction: 'inbound' | 'outbound';
  timestamp: Date;
}

export interface Campaign {
  campaignId: string;
  name: string;
  channel: string;
  type: 'marketing' | 'transactional' | 'promotional' | 'welcome' | 'abandoned_cart';
  content: {
    text: string;
    mediaUrl?: string;
  };
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'cancelled';
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

export interface Analytics {
  overview: {
    totalConversations: number;
    activeConversations: number;
    resolvedConversations: number;
    avgResponseTime: number;
  };
  commerce: {
    ordersCreated: number;
    ordersCompleted: number;
    revenue: number;
    cartAbandonmentRate: number;
  };
  campaigns: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

// ============ HOJAI UNIFIED SDK ============

export class HojaiUnifiedSDK {
  private client: AxiosInstance;
  private tenantId: string;

  constructor(config: {
    baseUrl: string;
    tenantId: string;
    apiKey?: string;
  }) {
    this.tenantId = config.tenantId;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': config.tenantId,
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });
  }

  // ============ CART ============

  /**
   * Create a new cart
   */
  async createCart(data: {
    sessionId: string;
    customer: Customer;
    items: CartItem[];
  }): Promise<Cart> {
    const response = await this.client.post('/api/cart', data);
    return response.data.data;
  }

  /**
   * Get cart by ID
   */
  async getCart(cartId: string): Promise<Cart | null> {
    const response = await this.client.get(`/api/cart/${cartId}`);
    return response.data.data || null;
  }

  /**
   * Add item to cart
   */
  async addToCart(cartId: string, item: CartItem): Promise<Cart> {
    const response = await this.client.post(`/api/cart/${cartId}/items`, item);
    return response.data.data;
  }

  /**
   * Update item quantity
   */
  async updateCartItem(cartId: string, productId: string, quantity: number): Promise<Cart> {
    const response = await this.client.patch(`/api/cart/${cartId}/items/${productId}`, { quantity });
    return response.data.data;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(cartId: string, productId: string): Promise<Cart> {
    const response = await this.client.delete(`/api/cart/${cartId}/items/${productId}`);
    return response.data.data;
  }

  // ============ CHECKOUT ============

  /**
   * Checkout cart and create order
   */
  async checkout(cartId: string, options: {
    deliveryAddress?: string;
    paymentMethod: 'upi' | 'card' | 'wallet' | 'cod';
  }): Promise<Order> {
    const response = await this.client.post(`/api/cart/${cartId}/checkout`, options);
    return response.data.data;
  }

  /**
   * Get payment link for order
   */
  async initiatePayment(orderId: string, customerPhone: string): Promise<{
    order: Order;
    paymentLink?: string;
  }> {
    const response = await this.client.post(`/api/orders/${orderId}/pay`, {
      customerPhone
    });
    return response.data.data;
  }

  /**
   * Get order status
   */
  async getOrder(orderId: string): Promise<Order> {
    const response = await this.client.get(`/api/orders/${orderId}`);
    return response.data.data;
  }

  /**
   * Get customer's orders
   */
  async getCustomerOrders(customerId: string): Promise<Order[]> {
    const response = await this.client.get('/api/orders', {
      params: { customerId }
    });
    return response.data.data || [];
  }

  // ============ MESSAGES ============

  /**
   * Send message
   */
  async sendMessage(data: {
    channel: 'whatsapp' | 'instagram' | 'sms' | 'email';
    to: Customer;
    type: 'text' | 'image' | 'buttons' | 'template';
    content: {
      text?: string;
      mediaUrl?: string;
      caption?: string;
      header?: string;
      buttons?: Array<{ id: string; title: string }>;
    };
  }): Promise<Message> {
    const response = await this.client.post('/api/messages/send', {
      channel: data.channel,
      to: data.to,
      type: data.type,
      content: data.content
    });
    return response.data.data;
  }

  /**
   * Send WhatsApp template
   */
  async sendTemplate(to: Customer, templateId: string, variables?: Record<string, string>): Promise<Message> {
    return this.sendMessage({
      channel: 'whatsapp',
      to,
      type: 'template',
      content: { text: templateId, ...variables }
    });
  }

  // ============ CONVERSATIONS ============

  /**
   * Get conversations
   */
  async getConversations(options?: {
    state?: Conversation['state'];
    channel?: Conversation['channel'];
    limit?: number;
    offset?: number;
  }): Promise<{ conversations: Conversation[]; total: number }> {
    const response = await this.client.get('/api/conversations', { params: options });
    return response.data.data;
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const response = await this.client.get(`/api/conversations/${conversationId}/messages`);
    return response.data.data || [];
  }

  /**
   * Assign conversation to agent
   */
  async assignConversation(conversationId: string, agentId: string, agentName: string): Promise<void> {
    await this.client.post(`/api/conversations/${conversationId}/assign`, {
      agentId,
      agentName
    });
  }

  /**
   * Resolve conversation
   */
  async resolveConversation(conversationId: string): Promise<void> {
    await this.client.post(`/api/conversations/${conversationId}/resolve`);
  }

  // ============ CAMPAIGNS ============

  /**
   * Create campaign
   */
  async createCampaign(data: {
    name: string;
    channel: Campaign['channel'];
    type: Campaign['type'];
    content: { text: string; mediaUrl?: string };
    segmentIds?: string[];
    scheduledAt?: Date;
  }): Promise<Campaign> {
    const response = await this.client.post('/api/campaigns', data);
    return response.data.data;
  }

  /**
   * Start campaign
   */
  async startCampaign(campaignId: string): Promise<void> {
    await this.client.post(`/api/campaigns/${campaignId}/start`);
  }

  /**
   * Get campaign status
   */
  async getCampaign(campaignId: string): Promise<Campaign> {
    const response = await this.client.get(`/api/campaigns/${campaignId}`);
    return response.data.data;
  }

  // ============ ANALYTICS ============

  /**
   * Get analytics
   */
  async getAnalytics(): Promise<Analytics> {
    const response = await this.client.get('/api/analytics');
    return response.data.data;
  }

  // ============ CHANNELS ============

  /**
   * Get available channels
   */
  async getChannels(): Promise<Array<{
    id: string;
    name: string;
    icon: string;
    status: 'active' | 'coming_soon';
  }>> {
    const response = await this.client.get('/api/channels');
    return response.data.data;
  }

  // ============ HEALTH ============

  /**
   * Check if service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }
}

// ============ DEFAULT EXPORT ============

export default HojaiUnifiedSDK;
export { HojaiUnifiedSDK as Client };
