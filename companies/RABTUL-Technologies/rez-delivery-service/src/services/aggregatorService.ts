import axios, { AxiosInstance } from 'axios';
import DeliveryOrder, { IDeliveryOrder } from '../models/DeliveryOrder';
import logger from '../config/logger';

// Aggregator configuration
interface AggregatorConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  webhookSecret?: string;
}

interface SwiggyConfig extends AggregatorConfig {
  storeId: string;
  authorizationToken?: string;
}

interface ZomatoConfig extends AggregatorConfig {
  entityId: string;
  entityType: string;
}

// Aggregator order payload
interface AggregatorOrder {
  orderId: string;
  sourceOrderId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  orderValue: number;
  deliveryFee: number;
  status: string;
  createdAt: string;
}

// Event types for webhooks
type AggregatorEvent =
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'rider.assigned'
  | 'rider.location_updated'
  | 'order.delivered';

// Swiggy response types
interface SwiggyOrderResponse {
  order_id: string;
  orderId?: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: SwiggyItem[];
  order_value: number;
  delivery_fee?: number;
  platform_fee?: number;
  status: string;
}

interface SwiggyItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

// Zomato response types
interface ZomatoOrderResponse {
  order_id: string;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  delivery_location?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items?: ZomatoItem[];
  bill_amount: number;
  delivery_charge?: number;
  platform_fee?: number;
  status: string;
}

interface ZomatoItem {
  item_id: string;
  name: string;
  qty: number;
  price: number;
  notes?: string;
}

// ONDC response types
interface ONDCOrderResponse {
  context?: {
    domain?: string;
    action?: string;
    transaction_id?: string;
  };
  message?: {
    order?: Record<string, unknown>;
    ack?: { status?: string };
  };
}

// Webhook payload types
interface SwiggyWebhookPayload {
  event: AggregatorEvent;
  data?: {
    order_id: string;
    status?: string;
    rider_id?: string;
    [key: string]: unknown;
  };
  order?: {
    order_id: string;
    status?: string;
    rider_id?: string;
    [key: string]: unknown;
  };
}

interface ZomatoWebhookPayload {
  event?: AggregatorEvent;
  data?: { order_id: string; status?: string };
  order?: {
    order_id: string;
    status?: string;
    event?: AggregatorEvent;
    [key: string]: unknown;
  };
}

class AggregatorService {
  // HTTP clients for each aggregator
  private swiggyClient: AxiosInstance | null = null;
  private zomatoClient: AxiosInstance | null = null;
  private ondcClient: AxiosInstance | null = null;

  // Configuration
  private swiggyConfig: SwiggyConfig | null = null;
  private zomatoConfig: ZomatoConfig | null = null;
  private ondcConfig: AggregatorConfig | null = null;

  constructor() {
    this.initializeClients();
  }

  /**
   * Initialize HTTP clients for aggregators
   */
  private initializeClients(): void {
    // Swiggy configuration
    const swiggyBaseUrl = process.env.SWIGGY_API_URL;
    const swiggyApiKey = process.env.SWIGGY_API_KEY;

    if (swiggyBaseUrl) {
      this.swiggyConfig = {
        name: 'swiggy',
        baseUrl: swiggyBaseUrl,
        apiKey: swiggyApiKey,
        storeId: process.env.SWIGGY_STORE_ID || ''
      };

      this.swiggyClient = axios.create({
        baseURL: swiggyBaseUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          ...(swiggyApiKey && { 'Authorization': `Bearer ${swiggyApiKey}` })
        }
      });
    }

    // Zomato configuration
    const zomatoBaseUrl = process.env.ZOMATO_API_URL;
    const zomatoApiKey = process.env.ZOMATO_API_KEY;

    if (zomatoBaseUrl) {
      this.zomatoConfig = {
        name: 'zomato',
        baseUrl: zomatoBaseUrl,
        apiKey: zomatoApiKey,
        entityId: process.env.ZOMATO_ENTITY_ID || '',
        entityType: 'store'
      };

      this.zomatoClient = axios.create({
        baseURL: zomatoBaseUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'user-key': zomatoApiKey
        }
      });
    }

    // ONDC configuration
    const ondcBaseUrl = process.env.ONDC_API_URL;

    if (ondcBaseUrl) {
      this.ondcConfig = {
        name: 'ondc',
        baseUrl: ondcBaseUrl,
        apiKey: process.env.ONDC_API_KEY
      };

      this.ondcClient = axios.create({
        baseURL: ondcBaseUrl,
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // ==================== SWIGGY INTEGRATION ====================

  /**
   * Sync order to Swiggy
   */
  async syncOrderToSwiggy(order: IDeliveryOrder): Promise<boolean> {
    if (!this.swiggyClient || !this.swiggyConfig) {
      logger.warn('Swiggy client not configured');
      return false;
    }

    try {
      const payload = this.transformOrderForSwiggy(order);

      const response = await this.swiggyClient.post('/orders', payload);

      logger.info('Order synced to Swiggy', {
        orderId: order.orderId,
        swiggyOrderId: response.data.orderId
      });

      return true;
    } catch (error) {
      logger.error('Failed to sync order to Swiggy', {
        orderId: order.orderId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Transform order to Swiggy format
   */
  private transformOrderForSwiggy(order: IDeliveryOrder): Record<string, unknown> {
    const address = order.customer.address;
    const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.postalCode}`;

    return {
      order_id: order.sourceOrderId || order.orderId,
      store_id: this.swiggyConfig?.storeId,
      customer_name: order.customer.name,
      customer_phone: order.customer.phone,
      delivery_address: fullAddress,
      items: order.items.map(item => ({
        id: item.itemId,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      order_value: order.totalAmount,
      delivery_fee: order.deliveryFee,
      status: this.transformStatus(order.status),
      order_time: order.createdAt.toISOString()
    };
  }

  /**
   * Transform Swiggy order to internal format
   */
  private transformSwiggyOrder(swiggyData: SwiggyOrderResponse, merchantId: string): Partial<IDeliveryOrder> {
    return {
      source: 'swiggy',
      sourceOrderId: swiggyData.order_id || swiggyData.orderId,
      merchantId,
      customer: {
        name: swiggyData.customer_name,
        phone: swiggyData.customer_phone,
        address: this.parseSwiggyAddress(swiggyData.delivery_address)
      },
      items: swiggyData.items.map((item: SwiggyItem) => ({
        itemId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      status: this.transformStatusFromAggregator('swiggy', swiggyData.status),
      totalAmount: swiggyData.order_value,
      deliveryFee: swiggyData.delivery_fee || 0,
      platformFee: swiggyData.platform_fee || 0
    };
  }

  /**
   * Parse Swiggy address string
   */
  private parseSwiggyAddress(addressString: string): IDeliveryOrder['customer']['address'] {
    const parts = addressString.split(',').map(s => s.trim());
    return {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts[2]?.split(' ')[0] || '',
      postalCode: parts[2]?.split(' ').slice(1).join(' ') || '',
      country: 'India'
    };
  }

  // ==================== ZOMATO INTEGRATION ====================

  /**
   * Sync order to Zomato
   */
  async syncOrderToZomato(order: IDeliveryOrder): Promise<boolean> {
    if (!this.zomatoClient || !this.zomatoConfig) {
      logger.warn('Zomato client not configured');
      return false;
    }

    try {
      const payload = this.transformOrderForZomato(order);

      const response = await this.zomatoClient.post('/orders', payload);

      logger.info('Order synced to Zomato', {
        orderId: order.orderId,
        zomatoOrderId: response.data.orderId
      });

      return true;
    } catch (error) {
      logger.error('Failed to sync order to Zomato', {
        orderId: order.orderId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Transform order to Zomato format
   */
  private transformOrderForZomato(order: IDeliveryOrder): Record<string, unknown> {
    const address = order.customer.address;

    return {
      order_id: order.sourceOrderId || order.orderId,
      entity_id: this.zomatoConfig?.entityId,
      entity_type: this.zomatoConfig?.entityType,
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email
      },
      delivery_location: {
        address: address.street,
        city: address.city,
        state: address.state,
        pincode: address.postalCode
      },
      items: order.items.map(item => ({
        item_id: item.itemId,
        name: item.name,
        qty: item.quantity,
        price: item.price,
        notes: item.notes
      })),
      bill_amount: order.totalAmount,
      delivery_charge: order.deliveryFee,
      order_time: order.createdAt.toISOString()
    };
  }

  /**
   * Transform Zomato order to internal format
   */
  private transformZomatoOrder(zomatoData: ZomatoOrderResponse, merchantId: string): Partial<IDeliveryOrder> {
    return {
      source: 'zomato',
      sourceOrderId: zomatoData.order_id,
      merchantId,
      customer: {
        name: zomatoData.customer?.name || '',
        phone: zomatoData.customer?.phone || '',
        address: {
          street: zomatoData.delivery_location?.address || '',
          city: zomatoData.delivery_location?.city || '',
          state: zomatoData.delivery_location?.state || '',
          postalCode: zomatoData.delivery_location?.pincode || '',
          country: 'India'
        }
      },
      items: zomatoData.items?.map((item: ZomatoItem) => ({
        itemId: item.item_id,
        name: item.name,
        quantity: item.qty,
        price: item.price,
        notes: item.notes
      })) || [],
      status: this.transformStatusFromAggregator('zomato', zomatoData.status),
      totalAmount: zomatoData.bill_amount,
      deliveryFee: zomatoData.delivery_charge || 0
    };
  }

  // ==================== ONDC INTEGRATION ====================

  /**
   * Sync order to ONDC
   */
  async syncOrderToONDC(order: IDeliveryOrder): Promise<boolean> {
    if (!this.ondcClient) {
      logger.warn('ONDC client not configured');
      return false;
    }

    try {
      const payload = this.transformOrderForONDC(order);

      const response = await this.ondcClient.post('/orders', payload);

      logger.info('Order synced to ONDC', {
        orderId: order.orderId,
        ondcOrderId: response.data.id
      });

      return true;
    } catch (error) {
      logger.error('Failed to sync order to ONDC', {
        orderId: order.orderId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Transform order to ONDC B2B format
   */
  private transformOrderForONDC(order: IDeliveryOrder): Record<string, unknown> {
    return {
      context: {
        domain: 'delivery',
        action: 'on_order',
        transaction_id: order.orderId,
        bpp_id: process.env.ONDC_BPP_ID,
        bpp_uri: process.env.ONDC_BPP_URI
      },
      message: {
        order: {
          id: order.orderId,
          state: this.transformStatus(order.status),
          items: order.items.map(item => ({
            id: item.itemId,
            descriptor: {
              name: item.name
            },
            quantity: {
              count: item.quantity
            },
            price: {
              currency: 'INR',
              value: item.price.toString()
            }
          })),
          fulfillments: [
            {
              id: 'F1',
              type: 'Delivery',
              customer: {
                person: {
                  name: order.customer.name
                },
                contact: {
                  phone: order.customer.phone
                },
                person: {
                  address: this.formatONDCAddress(order.customer.address)
                }
              }
            }
          ],
          quote: {
            price: {
              currency: 'INR',
              value: order.totalAmount.toString()
            },
            breakup: [
              {
                title: 'Items',
                price: {
                  currency: 'INR',
                  value: order.items.reduce((sum, i) => sum + i.price * i.quantity, 0).toString()
                }
              },
              {
                title: 'Delivery Fee',
                price: {
                  currency: 'INR',
                  value: order.deliveryFee.toString()
                }
              }
            ]
          },
          payment: {
            type: 'POST-FULFILLMENT',
            collected_by: 'BAP'
          }
        }
      }
    };
  }

  /**
   * Format address for ONDC
   */
  private formatONDCAddress(address: IDeliveryOrder['customer']['address']): unknown {
    return {
      door: address.street,
      city: address.city,
      state: address.state,
      country: 'India',
      area_code: address.postalCode
    };
  }

  // ==================== UNIFIED AGGREGATOR METHODS ====================

  /**
   * Sync order to appropriate aggregator based on source
   */
  async syncOrderToAggregator(order: IDeliveryOrder): Promise<boolean> {
    switch (order.source) {
      case 'swiggy':
        return this.syncOrderToSwiggy(order);
      case 'zomato':
        return this.syncOrderToZomato(order);
      default:
        logger.warn('Unknown source for sync', { source: order.source });
        return false;
    }
  }

  /**
   * Sync status update to aggregator
   */
  async syncStatusToAggregator(order: IDeliveryOrder): Promise<boolean> {
    if (!order.sourceOrderId) {
      logger.warn('No sourceOrderId for status sync', { orderId: order.orderId });
      return false;
    }

    switch (order.source) {
      case 'swiggy':
        return this.syncStatusToSwiggy(order);
      case 'zomato':
        return this.syncStatusToZomato(order);
      default:
        return false;
    }
  }

  /**
   * Sync status to Swiggy
   */
  private async syncStatusToSwiggy(order: IDeliveryOrder): Promise<boolean> {
    if (!this.swiggyClient) return false;

    try {
      await this.swiggyClient.patch(`/orders/${order.sourceOrderId}`, {
        status: this.transformStatus(order.status)
      });
      return true;
    } catch (error) {
      logger.error('Failed to sync status to Swiggy', { error: error.message });
      return false;
    }
  }

  /**
   * Sync status to Zomato
   */
  private async syncStatusToZomato(order: IDeliveryOrder): Promise<boolean> {
    if (!this.zomatoClient) return false;

    try {
      await this.zomatoClient.put(`/orders/${order.sourceOrderId}`, {
        status: this.transformStatus(order.status)
      });
      return true;
    } catch (error) {
      logger.error('Failed to sync status to Zomato', { error: error.message });
      return false;
    }
  }

  /**
   * Sync cancellation to aggregator
   */
  async syncCancellationToAggregator(order: IDeliveryOrder): Promise<boolean> {
    if (!order.sourceOrderId) return false;

    switch (order.source) {
      case 'swiggy':
        return this.syncCancellationToSwiggy(order);
      case 'zomato':
        return this.syncCancellationToZomato(order);
      default:
        return false;
    }
  }

  private async syncCancellationToSwiggy(order: IDeliveryOrder): Promise<boolean> {
    if (!this.swiggyClient) return false;

    try {
      await this.swiggyClient.post(`/orders/${order.sourceOrderId}/cancel`, {
        reason: 'Customer requested cancellation'
      });
      return true;
    } catch (error) {
      logger.error('Failed to cancel order on Swiggy', { error: error.message });
      return false;
    }
  }

  private async syncCancellationToZomato(order: IDeliveryOrder): Promise<boolean> {
    if (!this.zomatoClient) return false;

    try {
      await this.zomatoClient.post(`/orders/${order.sourceOrderId}/cancel`, {
        cancellation_reason: 'Customer requested cancellation'
      });
      return true;
    } catch (error) {
      logger.error('Failed to cancel order on Zomato', { error: error.message });
      return false;
    }
  }

  /**
   * Fetch order from aggregator
   */
  async fetchOrderFromAggregator(order: IDeliveryOrder): Promise<IDeliveryOrder | null> {
    if (!order.sourceOrderId) return null;

    try {
      switch (order.source) {
        case 'swiggy':
          return this.fetchOrderFromSwiggy(order);
        case 'zomato':
          return this.fetchOrderFromZomato(order);
        default:
          return null;
      }
    } catch (error) {
      logger.error('Failed to fetch order from aggregator', { error: error.message });
      return null;
    }
  }

  private async fetchOrderFromSwiggy(order: IDeliveryOrder): Promise<IDeliveryOrder | null> {
    if (!this.swiggyClient || !order.sourceOrderId) return null;

    try {
      const response = await this.swiggyClient.get(`/orders/${order.sourceOrderId}`);
      const swiggyData = response.data;

      const updates = this.transformSwiggyOrder(swiggyData, order.merchantId);

      Object.assign(order, updates);
      return order;
    } catch (error) {
      logger.error('Failed to fetch from Swiggy', { error: error.message });
      return null;
    }
  }

  private async fetchOrderFromZomato(order: IDeliveryOrder): Promise<IDeliveryOrder | null> {
    if (!this.zomatoClient || !order.sourceOrderId) return null;

    try {
      const response = await this.zomatoClient.get(`/orders/${order.sourceOrderId}`);
      const zomatoData = response.data;

      const updates = this.transformZomatoOrder(zomatoData, order.merchantId);

      Object.assign(order, updates);
      return order;
    } catch (error) {
      logger.error('Failed to fetch from Zomato', { error: error.message });
      return null;
    }
  }

  // ==================== STATUS TRANSFORMATIONS ====================

  /**
   * Transform internal status to aggregator-specific status
   */
  private transformStatus(status: IDeliveryOrder['status']): string {
    const statusMap: Record<string, Record<string, string>> = {
      swiggy: {
        pending: 'RECEIVED',
        confirmed: 'CONFIRMED',
        preparing: 'PREPARING',
        ready: 'READY_FOR_PICKUP',
        picked_up: 'PICKED_UP',
        delivered: 'DELIVERED',
        cancelled: 'CANCELLED'
      },
      zomato: {
        pending: 'placed',
        confirmed: 'confirmed',
        preparing: 'prepared',
        ready: 'ready_to_dispatch',
        picked_up: 'picked_up',
        delivered: 'delivered',
        cancelled: 'cancelled'
      }
    };

    return statusMap.swiggy?.[status] || status;
  }

  /**
   * Transform aggregator-specific status to internal status
   */
  transformStatusFromAggregator(
    aggregator: 'swiggy' | 'zomato',
    externalStatus: string
  ): IDeliveryOrder['status'] {
    const statusMap: Record<string, Record<string, IDeliveryOrder['status']>> = {
      swiggy: {
        RECEIVED: 'pending',
        CONFIRMED: 'confirmed',
        PREPARING: 'preparing',
        READY_FOR_PICKUP: 'ready',
        PICKED_UP: 'picked_up',
        DELIVERED: 'delivered',
        CANCELLED: 'cancelled'
      },
      zomato: {
        placed: 'pending',
        confirmed: 'confirmed',
        prepared: 'preparing',
        ready_to_dispatch: 'ready',
        picked_up: 'picked_up',
        delivered: 'delivered',
        cancelled: 'cancelled'
      }
    };

    return statusMap[aggregator]?.[externalStatus] || 'pending';
  }

  // ==================== WEBHOOK HANDLERS ====================

  /**
   * Handle incoming webhook from Swiggy
   */
  async handleSwiggyWebhook(payload: SwiggyWebhookPayload): Promise<{
    success: boolean;
    orderId?: string;
    event?: AggregatorEvent;
  }> {
    try {
      const event = payload.event as AggregatorEvent;
      const orderData = payload.data || payload.order;

      if (!orderData?.order_id) {
        return { success: false };
      }

      const order = await DeliveryOrder.findOne({
        source: 'swiggy',
        sourceOrderId: orderData.order_id
      });

      if (!order) {
        logger.warn('Swiggy webhook: Order not found', { orderId: orderData.order_id });
        return { success: false };
      }

      switch (event) {
        case 'order.updated':
          order.status = this.transformStatusFromAggregator('swiggy', orderData.status);
          await order.save();
          break;

        case 'order.cancelled':
          order.status = 'cancelled';
          await order.save();
          break;

        case 'rider.assigned':
          // Handle rider assignment
          logger.info('Rider assigned via Swiggy webhook', {
            orderId: order.orderId,
            riderId: orderData.rider_id
          });
          break;
      }

      return { success: true, orderId: order.orderId, event };
    } catch (error) {
      logger.error('Swiggy webhook processing failed', { error: error.message });
      return { success: false };
    }
  }

  /**
   * Handle incoming webhook from Zomato
   */
  async handleZomatoWebhook(payload: ZomatoWebhookPayload): Promise<{
    success: boolean;
    orderId?: string;
    event?: AggregatorEvent;
  }> {
    try {
      const event = payload.event || payload.order?.event;
      const orderData = payload.data || payload.order;

      if (!orderData?.order_id) {
        return { success: false };
      }

      const order = await DeliveryOrder.findOne({
        source: 'zomato',
        sourceOrderId: orderData.order_id
      });

      if (!order) {
        logger.warn('Zomato webhook: Order not found', { orderId: orderData.order_id });
        return { success: false };
      }

      switch (event) {
        case 'order.updated':
          order.status = this.transformStatusFromAggregator('zomato', orderData.status);
          await order.save();
          break;

        case 'order.cancelled':
          order.status = 'cancelled';
          await order.save();
          break;
      }

      return { success: true, orderId: order.orderId, event };
    } catch (error) {
      logger.error('Zomato webhook processing failed', { error: error.message });
      return { success: false };
    }
  }

  /**
   * Handle ONDC webhook/ACK
   */
  async handleONDCWebhook(payload: ONDCOrderResponse): Promise<{
    success: boolean;
    orderId?: string;
  }> {
    try {
      const context = payload.context;
      const message = payload.message;

      if (!context?.transaction_id) {
        return { success: false };
      }

      const order = await DeliveryOrder.findOne({ orderId: context.transaction_id });

      if (!order) {
        logger.warn('ONDC webhook: Order not found', { transactionId: context.transaction_id });
        return { success: false };
      }

      // Handle different ONDC actions
      if (message?.ack?.status === 'ACK') {
        logger.info('ONDC ACK received', { orderId: order.orderId });
      }

      return { success: true, orderId: order.orderId };
    } catch (error) {
      logger.error('ONDC webhook processing failed', { error: error.message });
      return { success: false };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    aggregator: 'swiggy' | 'zomato' | 'ondc',
    payload: string,
    signature: string
  ): boolean {
    // In production, implement proper signature verification
    // using HMAC-SHA256 or similar
    const secret = aggregator === 'swiggy'
      ? process.env.SWIGGY_WEBHOOK_SECRET
      : aggregator === 'zomato'
      ? process.env.ZOMATO_WEBHOOK_SECRET
      : process.env.ONDC_WEBHOOK_SECRET;

    if (!secret) {
      logger.warn(`No webhook secret configured for ${aggregator}`);
      return true; // Allow in development
    }

    // Implement signature verification here
    // const expectedSignature = crypto
    //   .createHmac('sha256', secret)
    //   .update(payload)
    //   .digest('hex');

    return true; // Placeholder
  }
}

export default new AggregatorService();
