import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

export interface InstagramProduct {
  name: string;
  description: string;
  price: string | number;
  currency: string;
  image_url: string;
  availability: string;
}

export interface InstagramCatalogProduct {
  id: string;
  retailer_id: string;
  title: string;
  description: string;
  availability: string;
  condition: string;
  price: string;
  link: string;
  image_link: string;
  additional_image_links: string[];
  shipping: Array<{
    country: string;
    price: string;
    ship_to_country?: string;
  }>;
  inventory: number;
}

export interface InstagramOrder {
  id: string;
  state: string;
  value: {
    amount: string;
    currency: string;
  };
  created: number;
  updated: number;
  items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    item_value: {
      amount: string;
      currency: string;
    };
  }>;
  shipping_address: {
    name: string;
    street1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface InstagramShopInsights {
  reach: number;
  impressions: number;
  engagement: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

class InstagramAPIService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = `https://graph.facebook.com/${config.instagram.apiVersion}`;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async getAccessToken(): Promise<string> {
    // Exchange app credentials for user access token if needed
    // For now, we use the direct access token
    return config.instagram.accessToken;
  }

  async createCatalogProduct(product: InstagramProduct): Promise<string | null> {
    try {
      const accessToken = await this.getAccessToken();
      const catalogId = config.instagram.catalogId;

      const response = await this.client.post(
        `/${catalogId}/products`,
        {
          ...product,
          access_token: accessToken,
        }
      );

      logger.info('Product created in Instagram catalog', {
        productId: response.data.id,
        catalogId,
      });

      return response.data.id;
    } catch (error) {
      logger.error('Failed to create catalog product', {
        error: error instanceof Error ? error.message : 'Unknown error',
        product: product.name,
      });
      throw error;
    }
  }

  async updateCatalogProduct(
    catalogProductId: string,
    updates: Partial<InstagramProduct>
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();

      await this.client.post(
        `/${catalogProductId}`,
        {
          ...updates,
          access_token: accessToken,
        }
      );

      logger.info('Product updated in Instagram catalog', { catalogProductId });
      return true;
    } catch (error) {
      logger.error('Failed to update catalog product', {
        error: error instanceof Error ? error.message : 'Unknown error',
        catalogProductId,
      });
      throw error;
    }
  }

  async deleteCatalogProduct(catalogProductId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();

      await this.client.delete(`/${catalogProductId}`, {
        params: { access_token: accessToken },
      });

      logger.info('Product deleted from Instagram catalog', { catalogProductId });
      return true;
    } catch (error) {
      logger.error('Failed to delete catalog product', {
        error: error instanceof Error ? error.message : 'Unknown error',
        catalogProductId,
      });
      throw error;
    }
  }

  async getCatalogProducts(
    limit: number = 50
  ): Promise<InstagramCatalogProduct[]> {
    try {
      const accessToken = await this.getAccessToken();
      const catalogId = config.instagram.catalogId;

      const response = await this.client.get(`/${catalogId}/products`, {
        params: {
          access_token: accessToken,
          limit,
        },
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get catalog products', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getProductDetails(
    instagramProductId: string
  ): Promise<InstagramCatalogProduct | null> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.client.get(`/${instagramProductId}`, {
        params: { access_token: accessToken },
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get product details', {
        error: error instanceof Error ? error.message : 'Unknown error',
        instagramProductId,
      });
      return null;
    }
  }

  async createCheckoutOrder(orderData: {
    productId: string;
    quantity: number;
    userId: string;
    shippingAddress: {
      name: string;
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  }): Promise<string | null> {
    try {
      const accessToken = await this.getAccessToken();
      const businessAccountId = config.instagram.businessAccountId;

      const response = await this.client.post(
        `/${businessAccountId}/commerce_orders`,
        {
          external_product_id: orderData.productId,
          quantity: orderData.quantity,
          customer_email: orderData.userId,
          shipping_address: orderData.shippingAddress,
          access_token: accessToken,
        }
      );

      logger.info('Checkout order created', {
        orderId: response.data.id,
        productId: orderData.productId,
      });

      return response.data.id;
    } catch (error) {
      logger.error('Failed to create checkout order', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId: orderData.productId,
      });
      throw error;
    }
  }

  async getOrderDetails(orderId: string): Promise<InstagramOrder | null> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.client.get(`/${orderId}`, {
        params: { access_token: accessToken },
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get order details', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
      });
      return null;
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: 'confirmed' | 'shipped' | 'cancelled'
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();

      const statusUpdate = {
        state: status,
        access_token: accessToken,
      };

      await this.client.post(`/${orderId}`, statusUpdate);

      logger.info('Order status updated', { orderId, status });
      return true;
    } catch (error) {
      logger.error('Failed to update order status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
        status,
      });
      throw error;
    }
  }

  async getShopInsights(
    period: 'day' | 'week' | 'days_28' = 'days_28'
  ): Promise<InstagramShopInsights> {
    try {
      const accessToken = await this.getAccessToken();
      const businessAccountId = config.instagram.businessAccountId;

      const response = await this.client.get(
        `/${businessAccountId}/instagram_shop_insights`,
        {
          params: {
            access_token: accessToken,
            period,
          },
        }
      );

      const data = response.data.data?.[0]?.values?.[0]?.value || {};

      return {
        reach: data.reach || 0,
        impressions: data.impressions || 0,
        engagement: data.engagement || 0,
        clicks: data.clicks || 0,
        conversions: data.conversions || 0,
        revenue: data.revenue || 0,
      };
    } catch (error) {
      logger.error('Failed to get shop insights', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        reach: 0,
        impressions: 0,
        engagement: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
      };
    }
  }

  async getProductTaggingSuggestions(imageUrl: string): Promise<string[]> {
    try {
      const accessToken = await this.getAccessToken();
      const businessAccountId = config.instagram.businessAccountId;

      // Use Instagram's product tagging API
      const response = await this.client.post(
        `/${businessAccountId}/product_suggestions`,
        {
          image_url: imageUrl,
          access_token: accessToken,
        }
      );

      return response.data.data?.map((p: { id: string }) => p.id) || [];
    } catch (error) {
      logger.error('Failed to get tagging suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        imageUrl,
      });
      return [];
    }
  }

  async validateWebhookSignature(
    signature: string,
    payload: string
  ): Promise<boolean> {
    try {
      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', config.instagram.appSecret)
        .update(payload)
        .digest('hex');

      return signature === `sha256=${expectedSignature}`;
    } catch {
      return false;
    }
  }
}

export const instagramApiService = new InstagramAPIService();
export default instagramApiService;