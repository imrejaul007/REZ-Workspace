/**
 * REZ Consumer App - CorpPerks Services
 * Corporate Meal Benefits, Dual Wallet, GST Invoicing
 */

// =============================================================================
// Environment Configuration
// =============================================================================

const CORP_SERVICE = process.env.EXPO_PUBLIC_CORP_SERVICE || 'https://corpperks.rezapp.com';

// =============================================================================
// HTTP Client
// =============================================================================

async function fetchCorp<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(`${CORP_SERVICE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// =============================================================================
// Meal Benefit Service
// =============================================================================

export const MealBenefitService = {
  async getBalance(employeeId: string) {
    return fetchCorp(`/api/corp/benefits/meal/balance/${employeeId}`);
  },

  async validate(
    employeeId: string,
    data: { amount: number; category: string; storeSlug: string }
  ) {
    return fetchCorp('/api/corp/benefits/meal/validate', {
      method: 'POST',
      body: JSON.stringify({ employeeId, ...data }),
    });
  },

  async redeem(
    employeeId: string,
    data: { orderId: string; amount: number; category: string; storeSlug: string }
  ) {
    return fetchCorp('/api/corp/benefits/meal/redeem', {
      method: 'POST',
      body: JSON.stringify({ employeeId, ...data }),
    });
  },

  async getHistory(
    employeeId: string,
    pagination?: { page?: number; limit?: number }
  ) {
    let url = `/api/corp/benefits/meal/history/${employeeId}`;
    if (pagination) {
      url += `?page=${pagination.page || 1}&limit=${pagination.limit || 20}`;
    }
    return fetchCorp(url);
  },
};

// =============================================================================
// Corporate Order Service
// =============================================================================

export const CorporateOrderService = {
  async createDiningOrder(
    data: {
      storeSlug: string;
      items: Array<{ productId: string; quantity: number }>;
      deliveryAddress: { address: string; city: string; pincode: string };
    },
    token: string
  ) {
    return fetchCorp('/api/corp/dining/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async createTeamLunch(
    data: {
      storeSlug: string;
      items: Array<{ productId: string; quantity: number }>;
      employeeIds: string[];
      scheduledTime: string;
      deliveryAddress: { address: string; city: string; pincode: string };
    },
    token: string
  ) {
    return fetchCorp('/api/corp/dining/team-lunch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async getCateringQuote(
    data: {
      storeSlug: string;
      items: Array<{ name: string; quantity: number }>;
      eventDate: string;
      deliveryAddress: { address: string; city: string; pincode: string };
    }
  ) {
    return fetchCorp('/api/corp/catering/quote', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getOrders(token: string, pagination?: { page?: number; limit?: number }) {
    let url = '/api/corp/orders';
    if (pagination) {
      url += `?page=${pagination.page || 1}&limit=${pagination.limit || 20}`;
    }
    return fetchCorp(url, { headers: { Authorization: `Bearer ${token}` } });
  },

  async getInvoice(corporateOrderId: string, token: string) {
    return fetchCorp(`/api/corp/orders/${corporateOrderId}/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// =============================================================================
// Corporate Wallet Service
// =============================================================================

export const CorporateWalletService = {
  async getBalance(employeeId: string) {
    return fetchCorp(`/api/corp/wallet/balance/${employeeId}`);
  },

  async deduct(
    employeeId: string,
    data: {
      amount: number;
      category: 'food' | 'dining' | 'groceries' | 'restaurant' | 'cafe';
      referenceId: string;
    }
  ) {
    return fetchCorp('/api/corp/wallet/deduct', {
      method: 'POST',
      body: JSON.stringify({ employeeId, ...data }),
    });
  },

  async getTransactions(
    employeeId: string,
    walletType: 'personal' | 'corporate' | 'all' = 'all'
  ) {
    return fetchCorp(`/api/corp/wallet/transactions/${employeeId}?type=${walletType}`);
  },
};

// =============================================================================
// Restaurant Partner Service
// =============================================================================

export const RestaurantPartnerService = {
  async partnerRequest(data: {
    storeSlug: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    categories: string[];
  }) {
    return fetchCorp('/api/corp/restaurants/partner-request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPartnerStatus(storeSlug: string) {
    return fetchCorp(`/api/corp/restaurants/partner/${storeSlug}/status`);
  },

  async getMerchantOrders(
    storeSlug: string,
    pagination?: { page?: number; limit?: number }
  ) {
    let url = `/api/corp/merchants/orders?storeSlug=${storeSlug}`;
    if (pagination) {
      url += `&page=${pagination.page || 1}&limit=${pagination.limit || 20}`;
    }
    return fetchCorp(url);
  },
};

// =============================================================================
// Exports
// =============================================================================

export const CorpPerks = {
  mealBenefit: MealBenefitService,
  corporateOrder: CorporateOrderService,
  wallet: CorporateWalletService,
  restaurant: RestaurantPartnerService,
};

export default CorpPerks;
