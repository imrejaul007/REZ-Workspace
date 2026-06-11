/**
 * Merchant OS Connector
 * Connects PROPFLOW to Merchant OS (REZ or Standalone)
 * Real Estate Property Management
 */

export interface MerchantOSConfig {
  baseUrl: string;
  apiKey: string;
  type: 'rez' | 'standalone';
}

export interface PropertyRecord {
  id: string;
  name: string;
  type: 'apartment' | 'villa' | 'plot' | 'commercial' | 'industrial';
  address: string;
  city: string;
  state: string;
  pincode: string;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  status: 'available' | 'sold' | 'rented' | 'reserved';
  ownerId?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  budget: { min: number; max: number };
  preferredLocations: string[];
  propertyType: string;
  purpose: 'buy' | 'rent' | 'invest';
  status: 'active' | 'inactive' | 'closed';
}

export interface SiteVisitRequest {
  id: string;
  propertyId: string;
  customerId: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

export interface LeadRecord {
  id: string;
  customerId: string;
  propertyId?: string;
  source: 'website' | 'referral' | 'social' | 'walk-in' | 'campaign';
  status: 'new' | 'contacted' | 'qualified' | 'visiting' | 'negotiating' | 'closed';
  followUpDate?: string;
  notes?: string;
}

export class MerchantOSConnector {
  private config: MerchantOSConfig;

  constructor(config: MerchantOSConfig) {
    this.config = config;
  }

  /**
   * Get property by ID
   */
  async getProperty(propertyId: string): Promise<PropertyRecord | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/properties/${propertyId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to get property');
      return null;
    }
  }

  /**
   * Get all properties with filters
   */
  async getProperties(filters?: {
    city?: string;
    type?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<PropertyRecord[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.city) params.append('city', filters.city);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());

      const response = await fetch(
        `${this.config.baseUrl}/api/properties?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.properties || [];
    } catch {
      return [];
    }
  }

  /**
   * Create or update property
   */
  async upsertProperty(property: Omit<PropertyRecord, 'id'>): Promise<PropertyRecord | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/properties`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(property)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to upsert property');
      return null;
    }
  }

  /**
   * Update property status
   */
  async updatePropertyStatus(
    propertyId: string,
    status: 'available' | 'sold' | 'rented' | 'reserved'
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/properties/${propertyId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get customer by phone
   */
  async getCustomerByPhone(phone: string): Promise<CustomerProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/customers/phone/${phone}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to get customer by phone');
      return null;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId: string): Promise<CustomerProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/customers/${customerId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to get customer by ID');
      return null;
    }
  }

  /**
   * Create or update customer
   */
  async upsertCustomer(customer: Omit<CustomerProfile, 'id'>): Promise<CustomerProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/customers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(customer)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to upsert customer');
      return null;
    }
  }

  /**
   * Schedule site visit
   */
  async scheduleSiteVisit(visit: Omit<SiteVisitRequest, 'id' | 'status'>): Promise<SiteVisitRequest | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/site-visits`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(visit)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to schedule site visit');
      return null;
    }
  }

  /**
   * Get site visits
   */
  async getSiteVisits(propertyId?: string, customerId?: string): Promise<SiteVisitRequest[]> {
    try {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (customerId) params.append('customerId', customerId);

      const response = await fetch(
        `${this.config.baseUrl}/api/site-visits?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.visits || [];
    } catch {
      return [];
    }
  }

  /**
   * Update site visit status
   */
  async updateSiteVisitStatus(
    visitId: string,
    status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/site-visits/${visitId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Create lead
   */
  async createLead(lead: Omit<LeadRecord, 'id'>): Promise<LeadRecord | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/leads`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(lead)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to create lead');
      return null;
    }
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(
    leadId: string,
    status: LeadRecord['status'],
    notes?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/leads/${leadId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status, notes })
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get leads
   */
  async getLeads(status?: string): Promise<LeadRecord[]> {
    try {
      const url = status
        ? `${this.config.baseUrl}/api/leads?status=${status}`
        : `${this.config.baseUrl}/api/leads`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.leads || [];
    } catch {
      return [];
    }
  }

  /**
   * Create transaction/booking
   */
  async createTransaction(transaction: {
    propertyId: string;
    customerId: string;
    type: 'sale' | 'rent' | 'booking';
    amount: number;
    paymentMethod: string;
  }): Promise<{ transactionId: string; status: string } | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/transactions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transaction)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to create transaction');
      return null;
    }
  }

  /**
   * Check connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }
}

export default MerchantOSConnector;