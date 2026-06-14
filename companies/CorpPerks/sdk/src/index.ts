/**
 * CorpPerks SDK
 * Enterprise Benefits Platform SDK
 */

export interface CorpConfig {
  apiBaseUrl: string;
  token?: string;
}

export interface Benefit {
  id: string;
  name: string;
  type: 'meal' | 'travel' | 'wellness' | 'learning' | 'gift';
  amount: number;
  allocated: number;
  used: number;
  remaining: number;
  frequency: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  level: string;
  status: 'enrolled' | 'pending' | 'suspended';
  benefits: string[];
}

export interface Booking {
  bookingId: string;
  property: { name: string; address: string };
  room: { name: string; bedType: string };
  dates: { checkIn: string; checkOut: string; nights: number };
  status: string;
  pricing: { totalAmount: number; currency: string };
}

export interface RewardSummary {
  balance: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  tierColor: string;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
}

export interface Transaction {
  id: string;
  type: 'earn' | 'redeem';
  amount: number;
  source: string;
  description: string;
  createdAt: string;
}

export interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  grandTotal: number;
  status: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'gift' | 'karma' | 'reward';
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  participants: number;
}

/**
 * CorpPerks Client
 */
export class CorpPerksClient {
  private apiBaseUrl: string;
  private token: string;

  constructor(config: CorpConfig) {
    this.apiBaseUrl = config.apiBaseUrl.replace(/\/$/, '');
    this.token = config.token || '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      throw new Error(`CorpPerks API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  // ============ BENEFITS ============

  async getMyBenefits(): Promise<Benefit[]> {
    return this.request('/api/corp/me/benefits');
  }

  async getMyUsage(): Promise<Record<string, { allocated: number; used: number; remaining: number }>> {
    return this.request('/api/corp/me/usage');
  }

  async getAllBenefits(): Promise<Benefit[]> {
    return this.request('/api/corp/benefits');
  }

  // ============ EMPLOYEES ============

  async getEmployees(params?: { status?: string; department?: string }): Promise<Employee[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/api/corp/employees${query}`);
  }

  async getEmployee(id: string): Promise<Employee> {
    return this.request(`/api/corp/employees/${id}`);
  }

  async enrollEmployee(data: Omit<Employee, 'id' | 'status' | 'benefits'>): Promise<Employee> {
    return this.request('/api/corp/employees', { method: 'POST', body: JSON.stringify(data) });
  }

  async allocateBenefits(employeeId: string, benefitIds: string[]): Promise<Employee> {
    return this.request(`/api/corp/employees/${employeeId}/benefits`, {
      method: 'POST',
      body: JSON.stringify({ benefitIds }),
    });
  }

  // ============ HOTELS ============

  async searchHotels(params: { city: string; checkIn: string; checkOut: string; guests?: number }) {
    const query = '?' + new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/api/hotels/search${query}`);
  }

  async getHotel(propertyId: string) {
    return this.request(`/api/hotels/${propertyId}`);
  }

  async checkAvailability(propertyId: string) {
    return this.request(`/api/hotels/${propertyId}/availability`);
  }

  async createBooking(data: {
    propertyId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    guestDetails: { firstName: string; lastName: string; email: string }[];
  }): Promise<Booking> {
    return this.request('/api/hotels/bookings', { method: 'POST', body: JSON.stringify(data) });
  }

  async getMyBookings(): Promise<Booking[]> {
    return this.request('/api/hotels/bookings');
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    return this.request(`/api/hotels/bookings/${bookingId}/cancel`, { method: 'POST' });
  }

  async calculatePrice(data: { propertyId: string; roomId: string; checkIn: string; checkOut: string }) {
    return this.request('/api/hotels/pricing/calculate', { method: 'POST', body: JSON.stringify(data) });
  }

  // ============ REWARDS ============

  async getMyRewards(): Promise<RewardSummary> {
    return this.request('/api/rewards/summary');
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.request('/api/rewards/transactions');
  }

  async getCatalog(category?: string) {
    const query = category ? `?category=${category}` : '';
    return this.request(`/api/rewards/catalog${query}`);
  }

  async redeemReward(itemId: string) {
    return this.request('/api/rewards/redeem', { method: 'POST', body: JSON.stringify({ itemId }) });
  }

  async getTiers() {
    return this.request('/api/rewards/tiers');
  }

  // Admin methods
  async awardCoins(employeeId: string, points: number, reason: string) {
    return this.request('/api/rewards/award', {
      method: 'POST',
      body: JSON.stringify({ employeeId, points, reason }),
    });
  }

  async bulkAward(awards: { employeeId: string; points: number; reason: string }[]) {
    return this.request('/api/rewards/bulk-award', { method: 'POST', body: JSON.stringify({ awards }) });
  }

  // ============ CAMPAIGNS ============

  async getCampaigns(params?: { type?: string; status?: string }): Promise<Campaign[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/api/campaigns${query}`);
  }

  async getCampaign(id: string): Promise<Campaign> {
    return this.request(`/api/campaigns/${id}`);
  }

  async createCampaign(data: Partial<Campaign>): Promise<Campaign> {
    return this.request('/api/campaigns', { method: 'POST', body: JSON.stringify(data) });
  }

  async launchCampaign(id: string): Promise<Campaign> {
    return this.request(`/api/campaigns/${id}/launch`, { method: 'POST' });
  }

  async getCampaignAnalytics(id: string) {
    return this.request(`/api/campaigns/${id}/analytics`);
  }

  // ============ GST ============

  async calculateGST(amount: number, gstRate: number = 18) {
    return this.request('/api/gst/calculate', { method: 'POST', body: JSON.stringify({ amount, gstRate }) });
  }

  async checkITCEligibility(companyGstIn: string, vendorGstIn: string, invoiceAmount: number) {
    return this.request('/api/gst/itc-check', {
      method: 'POST',
      body: JSON.stringify({ companyGstIn, vendorGstIn, invoiceAmount }),
    });
  }

  async getInvoices(params?: { status?: string; from?: string; to?: string }): Promise<Invoice[]> {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return this.request(`/api/gst/invoices${query}`);
  }

  async createInvoice(data: {
    companyName: string;
    gstIn: string;
    items: { name: string; quantity: number; amount: number }[];
    billingAddress: string;
    shippingAddress: string;
  }): Promise<Invoice> {
    return this.request('/api/gst/invoices', { method: 'POST', body: JSON.stringify(data) });
  }

  async generateGSTR1(period: string) {
    return this.request('/api/gst/reports/gstr1', { method: 'POST', body: JSON.stringify({ period }) });
  }

  // ============ INTEGRATIONS ============

  async getIntegrationHealth() {
    return this.request('/api/integrations/health');
  }

  async connectProvider(provider: string, credentials: Record<string, string>) {
    return this.request(`/api/integrations/${provider}/connect`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async disconnectProvider(provider: string) {
    return this.request(`/api/integrations/${provider}/disconnect`, { method: 'POST' });
  }

  // ============ HRIS ============

  async getHRISProviders() {
    return this.request('/api/hris/providers');
  }

  async syncHRIS(provider: string) {
    return this.request('/api/hris/sync', { method: 'POST', body: JSON.stringify({ provider }) });
  }

  async getHRISEmployees(params?: { department?: string; status?: string }) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/api/hris/employees${query}`);
  }

  async autoEnroll(provider: string, defaultBenefits: string[]) {
    return this.request('/api/hris/auto-enroll', {
      method: 'POST',
      body: JSON.stringify({ provider, defaultBenefits }),
    });
  }
}

// ============ REACT HOOKS ============

export function createCorpPerks(config: CorpConfig) {
  return new CorpPerksClient(config);
}

export default CorpPerksClient;


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sdk',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
