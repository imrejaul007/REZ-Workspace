/**
 * Merchant OS Connector
 * Connects the CRM to the central Merchant OS system
 */

export interface MerchantCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  createdAt: Date;
}

export interface MerchantTransaction {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  product: string;
  industry: string;
  timestamp: Date;
}

export interface MerchantOSConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

export class MerchantOSConnector {
  private config: MerchantOSConfig;
  private baseUrl: string;

  constructor(config?: Partial<MerchantOSConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || process.env.MERCHANT_OS_URL || 'http://localhost:4000',
      apiKey: config?.apiKey || process.env.MERCHANT_OS_API_KEY || '',
      timeout: config?.timeout || 30000
    };
    this.baseUrl = this.config.baseUrl;
  }

  /**
   * Fetch customer by ID from Merchant OS
   */
  async getCustomer(customerId: string): Promise<MerchantCustomer | null> {
    try {
      // Simulated - in production would call actual API
      return {
        id: customerId,
        name: `Customer ${customerId}`,
        email: `customer${customerId}@example.com`,
        phone: '+1234567890',
        source: 'merchant-os',
        createdAt: new Date()
      };
    } catch (error) {
      console.error(`MerchantOS: Failed to get customer ${customerId}`, error);
      return null;
    }
  }

  /**
   * Fetch all customers from Merchant OS
   */
  async getAllCustomers(): Promise<MerchantCustomer[]> {
    try {
      // Simulated - would fetch from actual Merchant OS
      return [];
    } catch (error) {
      console.error('MerchantOS: Failed to get all customers', error);
      return [];
    }
  }

  /**
   * Create or update customer in Merchant OS
   */
  async upsertCustomer(customer: Partial<MerchantCustomer>): Promise<MerchantCustomer | null> {
    try {
      const id = customer.id || `cust_${Date.now()}`;
      return {
        id,
        name: customer.name || 'Unknown',
        email: customer.email || '',
        phone: customer.phone || '',
        source: customer.source || 'crm',
        createdAt: customer.createdAt || new Date()
      };
    } catch (error) {
      console.error('MerchantOS: Failed to upsert customer', error);
      return null;
    }
  }

  /**
   * Fetch transactions for a customer
   */
  async getCustomerTransactions(customerId: string): Promise<MerchantTransaction[]> {
    try {
      // Simulated - would fetch from actual Merchant OS
      return [];
    } catch (error) {
      console.error(`MerchantOS: Failed to get transactions for ${customerId}`, error);
      return [];
    }
  }

  /**
   * Record a new transaction
   */
  async recordTransaction(transaction: Omit<MerchantTransaction, 'id'>): Promise<MerchantTransaction | null> {
    try {
      return {
        id: `txn_${Date.now()}`,
        ...transaction
      };
    } catch (error) {
      console.error('MerchantOS: Failed to record transaction', error);
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simulated health check
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const merchantOS = new MerchantOSConnector();