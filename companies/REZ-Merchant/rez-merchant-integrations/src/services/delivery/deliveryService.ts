import axios, { AxiosInstance } from 'axios';

export interface DeliveryOrder {
  orderId: string;
  merchantId: string;
  pickupAddress: {
    name: string;
    phone: string;
    address: string;
    lat: number;
    lng: number;
  };
  deliveryAddress: {
    name: string;
    phone: string;
    address: string;
    lat: number;
    lng: number;
  };
  items: string;
  orderValue: number;
  scheduledTime?: Date;
}

export interface DeliveryQuote {
  partnerId: string;
  partnerName: string;
  vehicleType: string;
  estimatedTime: number; // minutes
  price: number;
  currency: string;
}

export interface DeliveryBooking {
  bookingId: string;
  partnerId: string;
  partnerName: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  driverName?: string;
  driverPhone?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
}

export class DeliveryPartnerService {
  private dunzoClient: AxiosInstance;
  private shadowfaxClient: AxiosInstance;
  private dunzoApiKey: string;
  private shadowfaxApiKey: string;

  constructor() {
    this.dunzoApiKey = process.env.DUNZO_API_KEY || '';
    this.shadowfaxApiKey = process.env.SHADOWFAX_API_KEY || '';

    this.dunzoClient = axios.create({
      baseURL: 'https://api.dunzo.com/api/v1',
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.dunzoApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    this.shadowfaxClient = axios.create({
      baseURL: 'https://api.shadowfax.in/v1',
      timeout: 30000,
      headers: {
        'Authorization': `Token ${this.shadowfaxApiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getDeliveryQuotes(order: DeliveryOrder): Promise<DeliveryQuote[]> {
    const quotes: DeliveryQuote[] = [];

    // Get Dunzo quotes
    try {
      const dunzoQuotes = await this.getDunzoQuotes(order);
      quotes.push(...dunzoQuotes);
    } catch (error) {
      console.error('Failed to get Dunzo quotes', error);
    }

    // Get Shadowfax quotes
    try {
      const shadowfaxQuotes = await this.getShadowfaxQuotes(order);
      quotes.push(...shadowfaxQuotes);
    } catch (error) {
      console.error('Failed to get Shadowfax quotes', error);
    }

    // Sort by price
    return quotes.sort((a, b) => a.price - b.price);
  }

  async bookDelivery(params: {
    order: DeliveryOrder;
    partnerId: 'dunzo' | 'shadowfax';
    quoteId: string;
  }): Promise<DeliveryBooking> {
    switch (params.partnerId) {
      case 'dunzo':
        return this.bookDunzoDelivery(params.order, params.quoteId);
      case 'shadowfax':
        return this.bookShadowfaxDelivery(params.order, params.quoteId);
      default:
        throw new Error(`Unknown partner: ${params.partnerId}`);
    }
  }

  async trackDelivery(bookingId: string, partnerId: 'dunzo' | 'shadowfax'): Promise<{
    status: string;
    driverLocation?: { lat: number; lng: number };
    estimatedArrival?: Date;
  }> {
    switch (partnerId) {
      case 'dunzo':
        return this.trackDunzoDelivery(bookingId);
      case 'shadowfax':
        return this.trackShadowfaxDelivery(bookingId);
      default:
        throw new Error(`Unknown partner: ${partnerId}`);
    }
  }

  async cancelDelivery(bookingId: string, partnerId: 'dunzo' | 'shadowfax'): Promise<void> {
    switch (partnerId) {
      case 'dunzo':
        await this.cancelDunzoDelivery(bookingId);
        break;
      case 'shadowfax':
        await this.cancelShadowfaxDelivery(bookingId);
        break;
    }
  }

  async getDriverLocation(bookingId: string, partnerId: 'dunzo' | 'shadowfax'): Promise<{
    lat: number;
    lng: number;
    heading: number;
  }> {
    switch (partnerId) {
      case 'dunzo': {
        const response = await this.dunzoClient.get(`/tasks/${bookingId}/location`);
        return response.data;
      }
      case 'shadowfax': {
        const response = await this.shadowfaxClient.get(`/orders/${bookingId}/track`);
        return {
          lat: response.data.driver.lat,
          lng: response.data.driver.lng,
          heading: response.data.driver.heading || 0
        };
      }
      default:
        throw new Error(`Unknown partner: ${partnerId}`);
    }
  }

  private async getDunzoQuotes(order: DeliveryOrder): Promise<DeliveryQuote[]> {
    try {
      const response = await this.dunzoClient.post('/quotes', {
        pickup_address: {
          address: order.pickupAddress.address,
          lat: order.pickupAddress.lat,
          lng: order.pickupAddress.lng
        },
        drop_address: {
          address: order.deliveryAddress.address,
          lat: order.deliveryAddress.lat,
          lng: order.deliveryAddress.lng
        },
        category: 'delivery',
        item_count: order.items.split(',').length
      });

      return (response.data.quotes || []).map((quote) => ({
        partnerId: 'dunzo',
        partnerName: 'Dunzo',
        vehicleType: quote.vehicle_type || 'bike',
        estimatedTime: quote.eta?.duration || 30,
        price: quote.charges?.total || quote.charges?.delivery_fee,
        currency: 'INR'
      }));
    } catch (error) {
      console.error('Dunzo quotes failed', error);
      return [];
    }
  }

  private async getShadowfaxQuotes(order: DeliveryOrder): Promise<DeliveryQuote[]> {
    try {
      const response = await this.shadowfaxClient.post('/orders/price', {
        pickup: {
          name: order.pickupAddress.name,
          phone: order.pickupAddress.phone,
          address: order.pickupAddress.address,
          lat: order.pickupAddress.lat,
          lng: order.pickupAddress.lng
        },
        drop: {
          name: order.deliveryAddress.name,
          phone: order.deliveryAddress.phone,
          address: order.deliveryAddress.address,
          lat: order.deliveryAddress.lat,
          lng: order.deliveryAddress.lng
        },
        order_value: order.orderValue
      });

      return (response.data.pricing || []).map((price) => ({
        partnerId: 'shadowfax',
        partnerName: 'Shadowfax',
        vehicleType: price.vehicle_type || 'bike',
        estimatedTime: price.eta || 35,
        price: price.charge || price.delivery_charge,
        currency: 'INR'
      }));
    } catch (error) {
      console.error('Shadowfax quotes failed', error);
      return [];
    }
  }

  private async bookDunzoDelivery(order: DeliveryOrder, quoteId: string): Promise<DeliveryBooking> {
    const response = await this.dunzoClient.post('/tasks', {
      quote_id: quoteId,
      pickup_address: {
        contact_name: order.pickupAddress.name,
        contact_phone: order.pickupAddress.phone,
        address: order.pickupAddress.address,
        lat: order.pickupAddress.lat,
        lng: order.pickupAddress.lng
      },
      drop_address: {
        contact_name: order.deliveryAddress.name,
        contact_phone: order.deliveryAddress.phone,
        address: order.deliveryAddress.address,
        lat: order.deliveryAddress.lat,
        lng: order.deliveryAddress.lng
      },
      order_id: order.orderId,
      callback_url: `${process.env.DELIVERY_CALLBACK_URL || 'https://rez-merchant-integrations.onrender.com'}/api/delivery/webhook/dunzo`
    });

    return {
      bookingId: response.data.task_id,
      partnerId: 'dunzo',
      partnerName: 'Dunzo',
      status: 'assigned'
    };
  }

  private async bookShadowfaxDelivery(order: DeliveryOrder, quoteId: string): Promise<DeliveryBooking> {
    const response = await this.shadowfaxClient.post('/orders', {
      quote_id: quoteId,
      pickup: {
        name: order.pickupAddress.name,
        phone: order.pickupAddress.phone,
        address: order.pickupAddress.address,
        lat: order.pickupAddress.lat,
        lng: order.pickupAddress.lng
      },
      drop: {
        name: order.deliveryAddress.name,
        phone: order.deliveryAddress.phone,
        address: order.deliveryAddress.address,
        lat: order.deliveryAddress.lat,
        lng: order.deliveryAddress.lng
      },
      order_id: order.orderId,
      webhook_url: `${process.env.DELIVERY_CALLBACK_URL || 'https://rez-merchant-integrations.onrender.com'}/api/delivery/webhook/shadowfax`
    });

    return {
      bookingId: response.data.order_id,
      partnerId: 'shadowfax',
      partnerName: 'Shadowfax',
      status: 'assigned'
    };
  }

  private async trackDunzoDelivery(bookingId: string): Promise<unknown> {
    const response = await this.dunzoClient.get(`/tasks/${bookingId}/status`);
    return {
      status: response.data.status,
      driverLocation: response.data.driver_location,
      estimatedArrival: response.data.eta
    };
  }

  private async trackShadowfaxDelivery(bookingId: string): Promise<unknown> {
    const response = await this.shadowfaxClient.get(`/orders/${bookingId}/status`);
    return {
      status: response.data.status,
      driverLocation: response.data.driver_location,
      estimatedArrival: response.data.eta
    };
  }

  private async cancelDunzoDelivery(bookingId: string): Promise<void> {
    await this.dunzoClient.post(`/tasks/${bookingId}/cancel`);
  }

  private async cancelShadowfaxDelivery(bookingId: string): Promise<void> {
    await this.shadowfaxClient.post(`/orders/${bookingId}/cancel`);
  }
}

export const deliveryPartnerService = new DeliveryPartnerService();
