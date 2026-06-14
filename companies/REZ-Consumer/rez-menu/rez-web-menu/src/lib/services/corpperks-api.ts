/**
 * CorpPerks API Client
 * Corporate Meal Benefits, Dual Wallet, GST Invoicing
 */

// ============================================================
// CONFIGURATION
// ============================================================

const CORPPERKS_SERVICES = {
  corp: process.env.NEXT_PUBLIC_CORP_SERVICE_URL || 'https://corpperks.rezapp.com',
  corporate: process.env.NEXT_PUBLIC_CORPORATE_SERVICE_URL || 'https://rez-corporate-service.rezapp.com',
} as const

type CorpServiceKey = keyof typeof CORPPERKS_SERVICES

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || ''
const REQUEST_TIMEOUT = 8000

// ============================================================
// TYPES
// ============================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface MealBenefit {
  id: string
  employeeId: string
  companyId: string
  balance: number
  limit: number
  period: 'daily' | 'weekly' | 'monthly'
  resetDate: string
  categories: string[]
  status: 'active' | 'expired' | 'suspended'
}

export interface CorporateWallet {
  employeeId: string
  wallets: {
    personal: {
      coins: number
      cashback: number
      total: number
    }
    corporate: {
      balance: number
      spent: number
      limit: number
      category: 'food' | 'dining' | 'groceries' | 'restaurant' | 'cafe'
      expiresAt?: string
    }
  }
}

export interface CorporateOrder {
  id: string
  orderId: string
  companyId: string
  employeeId: string
  items: Array<{
    itemId: string
    name: string
    price: number
    quantity: number
  }>
  subtotal: number
  corporateAmount: number
  personalAmount: number
  benefitApplied: number
  benefitDeduction: number
  total: number
  gstInvoiceNumber?: string
  irn?: string
  status: 'pending' | 'processing' | 'completed'
  createdAt: string
}

export interface TeamLunch {
  id: string
  companyId: string
  organizerId: string
  storeSlug: string
  employeeIds: string[]
  items: Array<{
    itemId: string
    name: string
    price: number
    quantity: number
  }>
  total: number
  perPerson: number
  status: 'draft' | 'confirmed' | 'delivered'
  scheduledTime: string
  deliveryAddress: {
    address: string
    city: string
    pincode: string
  }
}

export interface CateringQuote {
  id: string
  companyId: string
  storeSlug: string
  items: Array<{
    name: string
    quantity: number
    pricePerUnit: number
  }>
  subtotal: number
  gst: number
  total: number
  validUntil: string
  status: 'pending' | 'quoted' | 'accepted' | 'rejected'
}

export interface Employee {
  id: string
  companyId: string
  name: string
  email: string
  phone: string
  department?: string
  designation?: string
  mealBenefit?: MealBenefit
  active: boolean
}

export interface Company {
  id: string
  name: string
  gstin?: string
  address?: string
  logo?: string
  registeredRestaurants: string[]
  mealBenefitConfig?: {
    limit: number
    period: 'daily' | 'weekly' | 'monthly'
    categories: string[]
  }
}

// ============================================================
// HTTP CLIENT
// ============================================================

async function fetchCorp<T>(
  service: CorpServiceKey,
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = CORPPERKS_SERVICES[service]
  const url = `${baseUrl}${endpoint}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(INTERNAL_TOKEN && { 'X-Internal-Token': INTERNAL_TOKEN }),
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Service timeout' }
      }
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Unknown error' }
  }
}

// ============================================================
// MEAL BENEFIT SERVICE
// ============================================================

export const MealBenefitService = {
  /**
   * Get meal benefit balance
   */
  async getBalance(
    employeeId: string
  ): Promise<ApiResponse<MealBenefit>> {
    return fetchCorp('corp', `/api/corp/benefits/meal/balance/${employeeId}`, {
      method: 'GET',
    })
  },

  /**
   * Validate meal benefit eligibility
   */
  async validate(
    employeeId: string,
    data: {
      amount: number
      category: string
      storeSlug: string
    }
  ): Promise<ApiResponse<{
    eligible: boolean
    maxAmount: number
    reason?: string
  }>> {
    return fetchCorp('corp', '/api/corp/benefits/meal/validate', {
      method: 'POST',
      body: JSON.stringify({ employeeId, ...data }),
    })
  },

  /**
   * Redeem meal benefit
   */
  async redeem(
    employeeId: string,
    data: {
      orderId: string
      amount: number
      category: string
      storeSlug: string
    }
  ): Promise<ApiResponse<{
    transactionId: string
    newBalance: number
    benefitDeducted: number
  }>> {
    return fetchCorp('corp', '/api/corp/benefits/meal/redeem', {
      method: 'POST',
      body: JSON.stringify({ employeeId, ...data }),
    })
  },

  /**
   * Get meal benefit history
   */
  async getHistory(
    employeeId: string,
    pagination?: { page?: number; limit?: number }
  ): Promise<ApiResponse<{
    transactions: Array<{
      id: string
      type: 'debit' | 'credit'
      amount: number
      orderId?: string
      description: string
      createdAt: string
    }>
    total: number
  }>> {
    const params = new URLSearchParams()
    if (pagination?.page) params.set('page', String(pagination.page))
    if (pagination?.limit) params.set('limit', String(pagination.limit))

    return fetchCorp('corp', `/api/corp/benefits/meal/history/${employeeId}?${params.toString()}`, {
      method: 'GET',
    })
  },
}

// ============================================================
// CORPORATE ORDER SERVICE
// ============================================================

export const CorporateOrderService = {
  /**
   * Create corporate dining order
   */
  async createDiningOrder(
    data: {
      storeSlug: string
      items: Array<{
        productId: string
        quantity: number
        customizations?: Record<string, string>
      }>
      deliveryAddress: {
        address: string
        city: string
        pincode: string
      }
      employeeId?: string
      notes?: string
    },
    token: string
  ): Promise<ApiResponse<{
    orderId: string
    corporateOrderId: string
    corporateAmount: number
    personalAmount: number
    benefitApplied: number
  }>> {
    return fetchCorp('corp', '/api/corp/dining/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
  },

  /**
   * Create team lunch order
   */
  async createTeamLunch(
    data: {
      storeSlug: string
      items: Array<{
        productId: string
        quantity: number
      }>
      employeeIds: string[]
      scheduledTime: string
      deliveryAddress: {
        address: string
        city: string
        pincode: string
      }
      notes?: string
    },
    token: string
  ): Promise<ApiResponse<{
    teamLunchId: string
    total: number
    perPerson: number
    employeeBreakdown: Array<{
      employeeId: string
      amount: number
    }>
  }>> {
    return fetchCorp('corp', '/api/corp/dining/team-lunch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
  },

  /**
   * Get catering quote
   */
  async getCateringQuote(
    data: {
      storeSlug: string
      items: Array<{
        name: string
        quantity: number
      }>
      eventDate: string
      deliveryAddress: {
        address: string
        city: string
        pincode: string
      }
    }
  ): Promise<ApiResponse<CateringQuote>> {
    return fetchCorp('corp', '/api/corp/catering/quote', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Book catering
   */
  async bookCatering(
    data: {
      quoteId: string
      employeeIds: string[]
      notes?: string
    },
    token: string
  ): Promise<ApiResponse<{
    bookingId: string
    total: number
    employeeBreakdown: Array<{
      employeeId: string
      amount: number
    }>
  }>> {
    return fetchCorp('corp', '/api/corp/catering/book', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
  },

  /**
   * Get corporate order history
   */
  async getOrders(
    token: string,
    pagination?: { page?: number; limit?: number }
  ): Promise<ApiResponse<{
    orders: CorporateOrder[]
    total: number
  }>> {
    const params = new URLSearchParams()
    if (pagination?.page) params.set('page', String(pagination.page))
    if (pagination?.limit) params.set('limit', String(pagination.limit))

    return fetchCorp('corp', `/api/corp/orders?${params.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * Get order invoice
   */
  async getInvoice(
    corporateOrderId: string,
    token: string
  ): Promise<ApiResponse<{
    invoiceNumber: string
    gstin: string
    irn?: string
    items: Array<{
      name: string
      hsn: string
      quantity: number
      rate: number
      amount: number
    }>
    subtotal: number
    cgst: number
    sgst: number
    total: number
  }>> {
    return fetchCorp('corp', `/api/corp/orders/${corporateOrderId}/invoice`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

// ============================================================
// CORPORATE WALLET SERVICE
// ============================================================

export const CorporateWalletService = {
  /**
   * Get dual wallet balance
   */
  async getBalance(
    employeeId: string
  ): Promise<ApiResponse<CorporateWallet>> {
    return fetchCorp('corp', '/api/corp/wallet/balance', {
      method: 'GET',
    })
  },

  /**
   * Deduct from corporate wallet
   */
  async deduct(
    employeeId: string,
    data: {
      amount: number
      category: 'food' | 'dining' | 'groceries' | 'restaurant' | 'cafe'
      referenceId: string
      description?: string
    }
  ): Promise<ApiResponse<{
    transactionId: string
    newBalance: number
    category: string
  }>> {
    return fetchCorp('corp', '/api/corp/wallet/deduct', {
      method: 'POST',
      body: JSON.stringify({ employeeId, ...data }),
    })
  },

  /**
   * Get wallet transactions
   */
  async getTransactions(
    employeeId: string,
    walletType: 'personal' | 'corporate' | 'all' = 'all'
  ): Promise<ApiResponse<{
    transactions: Array<{
      id: string
      type: 'credit' | 'debit'
      wallet: 'personal' | 'corporate'
      amount: number
      category?: string
      referenceId?: string
      description: string
      createdAt: string
    }>
    total: number
  }>> {
    return fetchCorp('corp', `/api/corp/wallet/transactions/${employeeId}?type=${walletType}`, {
      method: 'GET',
    })
  },

  /**
   * Transfer from personal to corporate (if allowed)
   */
  async transferToCorporate(
    employeeId: string,
    amount: number
  ): Promise<ApiResponse<{
    transactionId: string
    personalNewBalance: number
    corporateNewBalance: number
  }>> {
    return fetchCorp('corp', '/api/corp/wallet/transfer', {
      method: 'POST',
      body: JSON.stringify({ employeeId, amount }),
    })
  },
}

// ============================================================
// RESTAURANT PARTNER SERVICE
// ============================================================

export const RestaurantPartnerService = {
  /**
   * Register as corporate partner
   */
  async partnerRequest(
    data: {
      storeSlug: string
      contactName: string
      contactEmail: string
      contactPhone: string
      categories: string[]
      gstin?: string
    }
  ): Promise<ApiResponse<{
    requestId: string
    status: 'pending' | 'approved' | 'rejected'
  }>> {
    return fetchCorp('corp', '/api/corp/restaurants/partner-request', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Get partner status
   */
  async getPartnerStatus(
    storeSlug: string
  ): Promise<ApiResponse<{
    status: 'pending' | 'approved' | 'rejected'
    approvedAt?: string
    categories: string[]
    commission: number
  }>> {
    return fetchCorp('corp', `/api/corp/restaurants/partner/${storeSlug}/status`, {
      method: 'GET',
    })
  },

  /**
   * Get corporate orders for merchant
   */
  async getMerchantOrders(
    storeSlug: string,
    pagination?: { page?: number; limit?: number }
  ): Promise<ApiResponse<{
    orders: CorporateOrder[]
    total: number
    revenue: number
  }>> {
    const params = new URLSearchParams({ storeSlug })
    if (pagination?.page) params.set('page', String(pagination.page))
    if (pagination?.limit) params.set('limit', String(pagination.limit))

    return fetchCorp('corp', `/api/corp/merchants/orders?${params.toString()}`, {
      method: 'GET',
    })
  },

  /**
   * Settlement report
   */
  async getSettlementReport(
    storeSlug: string,
    period: { start: string; end: string }
  ): Promise<ApiResponse<{
    grossRevenue: number
    platformCommission: number
    netPayable: number
    orders: number
    gst: number
    invoices: string[]
  }>> {
    return fetchCorp('corp', '/api/corp/merchants/settlement', {
      method: 'POST',
      body: JSON.stringify({ storeSlug, period }),
    })
  },
}

// ============================================================
// HRIS SYNC SERVICE
// ============================================================

export const HRISService = {
  /**
   * Sync employees from HRIS
   */
  async syncEmployees(
    companyId: string,
    employees: Array<{
      id: string
      name: string
      email: string
      phone: string
      department?: string
      designation?: string
      active: boolean
    }>
  ): Promise<ApiResponse<{
    synced: number
    errors: Array<{ id: string; error: string }>
  }>> {
    return fetchCorp('corp', '/api/corp/hris/sync', {
      method: 'POST',
      body: JSON.stringify({ companyId, employees }),
    })
  },

  /**
   * Get employees
   */
  async getEmployees(
    companyId: string
  ): Promise<ApiResponse<{
    employees: Employee[]
    total: number
  }>> {
    return fetchCorp('corp', `/api/corp/hris/employees/${companyId}`, {
      method: 'GET',
    })
  },

  /**
   * Update employee status
   */
  async updateEmployee(
    employeeId: string,
    data: Partial<Employee>
  ): Promise<ApiResponse<{
    updated: boolean
    employee: Employee
  }>> {
    return fetchCorp('corp', `/api/corp/hris/employees/${employeeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Sync meal benefit allocation
   */
  async syncMealBenefit(
    companyId: string,
    allocations: Array<{
      employeeId: string
      limit: number
      period: 'daily' | 'weekly' | 'monthly'
      categories: string[]
    }>
  ): Promise<ApiResponse<{
    synced: number
    errors: Array<{ employeeId: string; error: string }>
  }>> {
    return fetchCorp('corp', '/api/corp/hris/meal-allocations', {
      method: 'POST',
      body: JSON.stringify({ companyId, allocations }),
    })
  },
}

// ============================================================
// EXPORTS
// ============================================================

export const CorpPerks = {
  mealBenefit: MealBenefitService,
  corporateOrder: CorporateOrderService,
  wallet: CorporateWalletService,
  restaurant: RestaurantPartnerService,
  hrsi: HRISService,
}

export default CorpPerks
