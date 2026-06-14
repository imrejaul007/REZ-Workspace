/**
 * REZ Service SDK
 * Unified client library to connect ALL services in the REZ/HOJAI ecosystem
 *
 * Usage:
 * ```typescript
 * import { createSDK } from '@rez/service-sdk';
 *
 * const sdk = createSDK({
 *   authToken: 'your-auth-token',
 *   internalToken: 'internal-service-token'
 * });
 *
 * // Call any service
 * await sdk.hojai.getEntity('ENT-123');
 * await sdk.rabtul.sendSMS({ to: '919876543210', message: 'Hello' });
 * ```
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================
// TYPES
// ============================================

export interface SDKConfig {
  authToken?: string;
  internalToken: string;
  timeout?: number;
  retries?: number;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

// ============================================
// HTTP CLIENT
// ============================================

class HTTPClient {
  private client: AxiosInstance;
  private internalToken: string;

  constructor(baseURL: string, internalToken: string, timeout = 30000) {
    this.internalToken = internalToken;
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': internalToken,
      },
    });
  }

  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async get<T>(path: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(path, { params });
    return response.data;
  }

  async post<T>(path: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(path, data);
    return response.data;
  }

  async patch<T>(path: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(path, data);
    return response.data;
  }

  async put<T>(path: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(path, data);
    return response.data;
  }

  async delete<T>(path: string): Promise<T> {
    const response = await this.client.delete<T>(path);
    return response.data;
  }
}

// ============================================
// SERVICE CLIENTS
// ============================================

// HOJAI Relationship OS
class HOJAIClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  // Entity Management
  async getEntity(entityId: string) {
    return this.http.get(`/api/entities/${entityId}`);
  }

  async searchEntities(query: string) {
    return this.http.get('/api/entities', { search: query });
  }

  async createEntity(data: any) {
    return this.http.post('/api/entities', data);
  }

  async updateEntity(entityId: string, data: any) {
    return this.http.patch(`/api/entities/${entityId}`, data);
  }

  // Interactions
  async logInteraction(entityId: string, interaction: any) {
    return this.http.post('/api/interactions', { entityId, ...interaction });
  }

  async getInteractions(entityId: string) {
    return this.http.get(`/api/interactions/${entityId}`);
  }

  // AI Command
  async command(command: string) {
    return this.http.post('/ai/command', { command });
  }

  // AI Tasks
  async createTask(task: any) {
    return this.http.post('/api/tasks', task);
  }

  async getTasks(filters?: any) {
    return this.http.get('/api/tasks', filters);
  }

  // Dashboard
  async getDashboard() {
    return this.http.get('/api/analytics/dashboard');
  }

  async getCommandCenter() {
    return this.http.get('/api/command-center');
  }

  // Relationships
  async createRelationship(data: any) {
    return this.http.post('/api/relationships', data);
  }

  async getRelationships(entityId: string) {
    return this.http.get(`/api/relationships/${entityId}`);
  }

  // Metrics
  async recordMetric(metric: any) {
    return this.http.post('/api/metrics', metric);
  }

  // Knowledge Base
  async searchKnowledge(query: string) {
    return this.http.get('/api/knowledge', { search: query });
  }

  async addKnowledge(doc: any) {
    return this.http.post('/api/knowledge', doc);
  }
}

// RABTUL Auth Service
class AuthClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async sendOTP(phone: string) {
    return this.http.post('/api/v1/auth/send-otp', { phone });
  }

  async verifyOTP(phone: string, otp: string) {
    return this.http.post('/api/v1/auth/verify-otp', { phone, otp });
  }

  async validateToken(token: string) {
    return this.http.get('/api/auth/validate', {}, {
      headers: { Authorization: `Bearer ${token}` }
    } as any);
  }

  async refreshToken(refreshToken: string) {
    return this.http.post('/api/auth/refresh', { refreshToken });
  }

  async logout(token: string) {
    return this.http.post('/api/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    } as any);
  }
}

// RABTUL Notifications Service
class NotificationsClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async sendSMS(to: string, message: string, options?: any) {
    return this.http.post('/api/sms/send', { to, message, ...options });
  }

  async sendEmail(to: string, subject: string, body: string) {
    return this.http.post('/api/email/send', { to, subject, body });
  }

  async sendPush(deviceToken: string, title: string, body: string, data?: any) {
    return this.http.post('/api/push/send', { deviceToken, title, body, data });
  }

  async sendWhatsApp(to: string, template: string, variables?: Record<string, string>) {
    return this.http.post('/api/whatsapp/send', { to, template, variables });
  }

  async sendBulkSMS(recipients: string[], message: string) {
    return this.http.post('/api/sms/bulk', { recipients, message });
  }
}

// RABTUL Payment Service
class PaymentClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async createOrder(amount: number, currency: string = 'INR', metadata?: any) {
    return this.http.post('/api/v1/orders', { amount, currency, metadata });
  }

  async verifyPayment(orderId: string) {
    return this.http.get(`/api/v1/orders/${orderId}/verify`);
  }

  async refund(paymentId: string, amount?: number) {
    return this.http.post('/api/v1/refunds', { paymentId, amount });
  }
}

// REZ Intelligence Service
class IntelligenceClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async getCustomer360(customerId: string) {
    return this.http.get(`/api/v1/internal/customers/${customerId}`);
  }

  async getPredictions(customerId: string) {
    return this.http.get(`/api/v1/internal/customers/${customerId}/predictions`);
  }

  async getIntent(customerId: string) {
    return this.http.get(`/api/v1/internal/customers/${customerId}/intent`);
  }

  async getEngagement(customerId: string) {
    return this.http.get(`/api/v1/internal/customers/${customerId}/engagement`);
  }

  async getDashboard() {
    return this.http.get('/api/v1/internal/dashboard/overview');
  }

  async getSegments() {
    return this.http.get('/api/v1/internal/segments');
  }
}

// WhatsApp Service (REZ Merchant)
class WhatsAppClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async sendMessage(to: string, body: string) {
    return this.http.post('/api/messages/send', { to, body });
  }

  async sendTemplate(to: string, templateName: string, variables: Record<string, string>) {
    return this.http.post('/api/messages/send', { to, templateName, templateVariables: variables });
  }

  async sendBulk(recipients: { phone: string; template?: string; variables?: Record<string, string> }[]) {
    return this.http.post('/api/messages/send/bulk', { recipients });
  }

  async getTemplates() {
    return this.http.get('/api/templates');
  }

  async getAnalytics(from?: string, to?: string) {
    return this.http.get('/api/analytics', { from, to });
  }

  async getConversations() {
    return this.http.get('/api/conversations');
  }
}

// REZ Restaurant CRM
class RestaurantCRMClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async createCustomer(data: any) {
    return this.http.post('/api/customers', data);
  }

  async getCustomer(customerId: string) {
    return this.http.get(`/api/customers/${customerId}`);
  }

  async searchCustomers(query: string) {
    return this.http.get('/api/customers/', { search: query });
  }

  async createCampaign(campaign: any) {
    return this.http.post('/api/campaigns', campaign);
  }

  async executeCampaign(campaignId: string) {
    return this.http.post(`/api/campaigns/${campaignId}/execute`, {});
  }

  async getCampaignStats(campaignId: string) {
    return this.http.get(`/api/campaigns/${campaignId}/stats`);
  }
}

// REZ Salon CRM
class SalonCRMClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async createCustomer(data: any) {
    return this.http.post('/api/customers', data);
  }

  async getCustomer(customerId: string) {
    return this.http.get(`/api/customers/${customerId}`);
  }

  async recordVisit(customerId: string, data: any) {
    return this.http.post(`/api/customers/${customerId}/visits`, data);
  }

  async getCustomerStats(customerId: string) {
    return this.http.get(`/api/customers/${customerId}/stats`);
  }

  async getLTV(customerId: string) {
    return this.http.get(`/api/customers/${customerId}/ltv`);
  }

  async searchCustomers(query: string) {
    return this.http.get('/api/customers/search', { query });
  }
}

// REZ Booking Engine
class BookingClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async searchAvailability(params: any) {
    return this.http.get('/api/search', params);
  }

  async createBooking(booking: any) {
    return this.http.post('/api/bookings', booking);
  }

  async getBooking(bookingId: string) {
    return this.http.get(`/api/bookings/${bookingId}`);
  }

  async updateBookingStatus(bookingId: string, status: string) {
    return this.http.patch(`/api/bookings/${bookingId}/status`, { status });
  }

  async getBookings(filters?: any) {
    return this.http.get('/api/bookings', filters);
  }
}

// REZ POS
class POSClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async createOrder(order: any) {
    return this.http.post('/api/orders', order);
  }

  async processPayment(orderId: string, payment: any) {
    return this.http.post(`/api/orders/${orderId}/pay`, payment);
  }

  async getOrders(filters?: any) {
    return this.http.get('/api/orders', filters);
  }

  async getProducts(merchantId: string) {
    return this.http.get('/api/products', { merchantId });
  }

  async updateStock(productId: string, adjustment: number) {
    return this.http.patch(`/api/products/${productId}/stock`, { adjustment });
  }

  async getDashboard(merchantId: string) {
    return this.http.get('/api/analytics/dashboard', { merchantId });
  }
}

// REZ Gift Card
class GiftCardClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async issue(amount: number, merchantId: string, options?: any) {
    return this.http.post('/api/gift-cards', { amount, merchantId, ...options });
  }

  async validate(cardNumber: string) {
    return this.http.post('/api/gift-cards/validate', { cardNumber });
  }

  async redeem(cardNumber: string, amount: number, merchantId: string) {
    return this.http.post('/api/gift-cards/redeem', { cardNumber, amount, merchantId });
  }

  async get(cardId: string) {
    return this.http.get(`/api/gift-cards/${cardId}`);
  }
}

// WAITRON (Restaurant AI)
class WaitronClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async createOrder(order: any) {
    return this.http.post('/api/orders', order);
  }

  async getOrders(filters?: any) {
    return this.http.get('/api/orders', filters);
  }

  async createReservation(reservation: any) {
    return this.http.post('/api/reservations', reservation);
  }

  async getMenu(restaurantId: string) {
    return this.http.get(`/api/menu/${restaurantId}`);
  }

  // AI endpoints
  async aiOrder(customerPhone: string, items: any[], orderType: string) {
    return this.http.post('/api/ai/waiter/order', { customerPhone, items, orderType });
  }

  async aiRecommend(restaurantId: string) {
    return this.http.get(`/api/ai/waiter/recommend/${restaurantId}`);
  }
}

// STAYBOT (Hotel AI)
class StaybotClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async checkInGuest(guest: any) {
    return this.http.post('/api/guests', guest);
  }

  async checkoutGuest(guestId: string) {
    return this.http.patch(`/api/guests/${guestId}/checkout`, {});
  }

  async getGuests(filters?: any) {
    return this.http.get('/api/guests', filters);
  }

  async logComplaint(complaint: any) {
    return this.http.post('/api/complaints', complaint);
  }

  async getRooms(hotelId: string, status?: string) {
    return this.http.get('/api/rooms', { hotelId, status });
  }
}

// CARECODE (Healthcare AI)
class CarecodeClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async registerPatient(patient: any) {
    return this.http.post('/api/patients', patient);
  }

  async getPatient(patientId: string) {
    return this.http.get(`/api/patients/${patientId}`);
  }

  async searchPatients(query: string) {
    return this.http.get('/api/patients', { search: query });
  }

  async createAppointment(appointment: any) {
    return this.http.post('/api/appointments', appointment);
  }

  async getAppointments(filters?: any) {
    return this.http.get('/api/appointments', filters);
  }

  async recordVitals(patientId: string, vitals: any) {
    return this.http.post('/api/vitals', { patientId, ...vitals });
  }

  // AI endpoints
  async aiIntake(patient: any) {
    return this.http.post('/api/ai/care/intake', patient);
  }

  async aiDiagnosis(symptoms: string[]) {
    return this.http.post('/api/ai/diagnosis/analyze', { symptoms });
  }
}

// FITMIND (Fitness AI)
class FitmindClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async registerMember(member: any) {
    return this.http.post('/api/members', member);
  }

  async getMember(memberId: string) {
    return this.http.get(`/api/members/${memberId}`);
  }

  async recordAttendance(data: any) {
    return this.http.post('/api/attendance', data);
  }

  async getSchedule(memberId: string) {
    return this.http.get(`/api/schedule/${memberId}`);
  }

  async getAnalytics(memberId: string) {
    return this.http.get(`/api/analytics/${memberId}`);
  }
}

// TEAMMIND (HR AI)
class TeammindClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async createEmployee(employee: any) {
    return this.http.post('/api/employees', employee);
  }

  async getEmployee(employeeId: string) {
    return this.http.get(`/api/employees/${employeeId}`);
  }

  async updateEmployee(employeeId: string, data: any) {
    return this.http.patch(`/api/employees/${employeeId}`, data);
  }

  async getLeaveRequests(filters?: any) {
    return this.http.get('/api/leaves', filters);
  }

  async approveLeave(leaveId: string) {
    return this.http.patch(`/api/leaves/${leaveId}/approve`, {});
  }
}

// GLAMAI (Salon AI)
class GlamaiClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async registerCustomer(customer: any) {
    return this.http.post('/api/customers', customer);
  }

  async bookAppointment(appointment: any) {
    return this.http.post('/api/appointments', appointment);
  }

  async getAppointments(filters?: any) {
    return this.http.get('/api/appointments', filters);
  }

  async getServices(merchantId: string) {
    return this.http.get('/api/services', { merchantId });
  }

  async sendCampaign(campaign: any) {
    return this.http.post('/api/ai/campaign/send', campaign);
  }
}

// FLEETIQ (Fleet AI)
class FleetiqClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async addVehicle(vehicle: any) {
    return this.http.post('/api/vehicles', vehicle);
  }

  async addDriver(driver: any) {
    return this.http.post('/api/drivers', driver);
  }

  async createTrip(trip: any) {
    return this.http.post('/api/trips', trip);
  }

  async updateTripStatus(tripId: string, status: string) {
    return this.http.patch(`/api/trips/${tripId}/status`, { status });
  }

  async updateVehicleLocation(vehicleId: string, location: any) {
    return this.http.patch(`/api/vehicles/${vehicleId}/location`, location);
  }

  // AI endpoints
  async optimizeDispatch(trip: any) {
    return this.http.post('/api/ai/dispatch/optimize', trip);
  }

  async getFleetAnalytics() {
    return this.http.get('/api/analytics/dashboard');
  }
}

// NEIGHBORAI (Society AI)
class NeighboraiClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async addResident(resident: any) {
    return this.http.post('/api/residents', resident);
  }

  async visitorCheckIn(visitor: any) {
    return this.http.post('/api/visitors/checkin', visitor);
  }

  async visitorCheckOut(visitorId: string) {
    return this.http.post(`/api/visitors/${visitorId}/checkout`, {});
  }

  async raiseComplaint(complaint: any) {
    return this.http.post('/api/complaints', complaint);
  }

  async generateMaintenance(flatNumber: string) {
    return this.http.post('/api/maintenance/generate', { flatNumber });
  }
}

// SHOPFLOW (Retail AI - 12 Agents)
class ShopflowClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  // Basic operations
  async addProduct(product: any) {
    return this.http.post('/api/products', product);
  }

  async createSale(sale: any) {
    return this.http.post('/api/sales', sale);
  }

  async processCheckout(items: any[], paymentMethod: string) {
    return this.http.post('/api/pos/sale', { items, paymentMethod });
  }

  async updateStock(productId: string, adjustment: number) {
    return this.http.patch(`/api/products/${productId}/stock`, { adjustment });
  }

  // Inventory Agent
  async checkLowStock(storeId: string) {
    return this.http.post('/api/ai/inventory/check', { storeId });
  }

  async autoReorder(storeId: string) {
    return this.http.post('/api/ai/inventory/reorder', { storeId });
  }

  // Customer Agent
  async getCustomer360(customerId: string) {
    return this.http.post('/api/ai/customer/query', { customerId, query: 'profile' });
  }

  async getCustomerSegments() {
    return this.http.post('/api/ai/customer/query', { query: 'segments' });
  }

  async predictChurn(customerId: string) {
    return this.http.post('/api/ai/customer/query', { customerId, query: 'churn_risk' });
  }

  // Loyalty Agent
  async getLoyaltyInfo(customerId: string) {
    return this.http.post('/api/ai/loyalty/points', { customerId });
  }

  async redeemPoints(customerId: string, points: number) {
    return this.http.post('/api/ai/loyalty/redeem', { customerId, points });
  }

  async getTierProgress(customerId: string) {
    return this.http.post('/api/ai/loyalty/tier', { customerId });
  }

  // Pricing Agent
  async getPricingRecommendation(productId: string, context?: any) {
    return this.http.post('/api/ai/pricing/recommend', { productId, context });
  }

  async getPricingScenarios(productId: string) {
    return this.http.post('/api/ai/pricing/scenarios', { productId });
  }

  async optimizeBundle(productIds: string[], discountPercent: number) {
    return this.http.post('/api/ai/pricing/bundle', { productIds, discountPercent });
  }

  async getMarkdownPrice(productId: string, daysOld: number) {
    return this.http.post('/api/ai/pricing/markdown', { productId, daysOld });
  }

  // Catalog Agent
  async enrichProduct(productId: string) {
    return this.http.post('/api/ai/catalog/enrich', { productId });
  }

  async enrichBatch(productIds: string[]) {
    return this.http.post('/api/ai/catalog/enrich-batch', { productIds });
  }

  async classifyProduct(productId: string) {
    return this.http.post('/api/ai/catalog/classify', { productId });
  }

  async compareProducts(productIds: string[]) {
    return this.http.post('/api/ai/catalog/compare', { productIds });
  }

  async findSimilarProducts(productId: string, limit: number = 5) {
    return this.http.post('/api/ai/catalog/similar', { productId, limit });
  }

  async generateSEO(productId: string) {
    return this.http.post('/api/ai/catalog/seo', { productId });
  }

  // Discovery Agent
  async search(query: string, filters?: any, limit?: number) {
    return this.http.post('/api/ai/discovery/search', { query, filters, limit });
  }

  async getPersonalizedRecommendations(userId: string, limit: number = 10) {
    return this.http.post('/api/ai/discovery/recommend', { userId, limit });
  }

  async getTrending(limit: number = 10, category?: string) {
    return this.http.get('/api/ai/discovery/trending', { limit, category });
  }

  async getFrequentlyBoughtTogether(productId: string, limit: number = 5) {
    return this.http.post('/api/ai/discovery/frequently-bought', { productId, limit });
  }

  async getHomepageFeed(userId?: string, limit: number = 20) {
    return this.http.get('/api/ai/discovery/homepage', { userId, limit });
  }

  // Merchandising Agent
  async createMerchandisingPlan(storeId: string, options: any) {
    return this.http.post('/api/ai/merchandising/plan', { storeId, ...options });
  }

  async generatePlanogram(storeId: string, sectionId: string, options?: any) {
    return this.http.post('/api/ai/merchandising/planogram', { storeId, sectionId, ...options });
  }

  async createDisplay(storeId: string, type: string, position: any, dimensions: any) {
    return this.http.post('/api/ai/merchandising/display', { storeId, type, position, dimensions });
  }

  async createCrossSellRule(triggerProductId: string, triggerCategory: string, recommendedProducts: any[]) {
    return this.http.post('/api/ai/merchandising/cross-sell', { triggerProductId, triggerCategory, recommendedProducts });
  }

  // Supplier Agent
  async createSupplier(supplier: any) {
    return this.http.post('/api/ai/supplier/create', supplier);
  }

  async getSupplier(supplierId: string) {
    return this.http.get(`/api/ai/supplier/${supplierId}`);
  }

  async evaluateSupplierPerformance(supplierId: string, dateRange?: any) {
    return this.http.get(`/api/ai/supplier/${supplierId}/performance`, dateRange);
  }

  async createPurchaseOrder(supplierId: string, items: any[]) {
    return this.http.post('/api/ai/supplier/purchase-order', { supplierId, items });
  }

  async forecastSupply(productIds: string[]) {
    return this.http.post('/api/ai/supplier/forecast', { productIds });
  }

  // Store Agent
  async createStore(store: any) {
    return this.http.post('/api/ai/store/create', store);
  }

  async getStoreMetrics(storeId: string, dateRange?: any) {
    return this.http.get(`/api/ai/store/${storeId}/metrics`, dateRange);
  }

  async createStaff(storeId: string, staff: any) {
    return this.http.post('/api/ai/store/staff', { storeId, ...staff });
  }

  async scheduleShift(staffId: string, date: string, startTime: string, endTime: string, role: string, department?: string) {
    return this.http.post('/api/ai/store/schedule', { staffId, date, startTime, endTime, role, department });
  }

  async generateSchedule(storeId: string, weekStart: string, constraints?: any) {
    return this.http.post('/api/ai/store/schedule/generate', { storeId, weekStart, constraints });
  }

  async getStoreAlerts(storeId: string, severity?: string) {
    return this.http.get(`/api/ai/store/${storeId}/alerts`, { severity });
  }

  // Retail Media Agent
  async createMediaNetwork(name: string, storeIds: string[]) {
    return this.http.post('/api/ai/media/network', { name, storeIds });
  }

  async createMediaCampaign(advertiserId: string, campaign: any) {
    return this.http.post('/api/ai/media/campaign', { advertiserId, ...campaign });
  }

  async activateCampaign(campaignId: string) {
    return this.http.post(`/api/ai/media/campaign/${campaignId}/activate`, {});
  }

  async getMediaInventory(storeIds: string[], dateRange: any) {
    return this.http.get('/api/ai/media/inventory', { storeIds, ...dateRange });
  }

  async getCampaignPerformance(campaignId: string, dateRange?: any) {
    return this.http.get(`/api/ai/media/campaign/${campaignId}/performance`, dateRange);
  }

  async getMediaInsights(category?: string) {
    return this.http.get('/api/ai/media/insights', { category });
  }

  // Marketplace Agent
  async createMarketplace(marketplace: any) {
    return this.http.post('/api/ai/marketplace/create', marketplace);
  }

  async onboardSeller(marketplaceId: string, seller: any) {
    return this.http.post('/api/ai/marketplace/seller/onboard', { marketplaceId, ...seller });
  }

  async listProduct(marketplaceId: string, sellerId: string, product: any) {
    return this.http.post('/api/ai/marketplace/product', { marketplaceId, sellerId, ...product });
  }

  async createMarketplaceOrder(marketplaceId: string, order: any) {
    return this.http.post('/api/ai/marketplace/order', { marketplaceId, ...order });
  }

  async openDispute(orderId: string, type: string, reason: string, amount: number) {
    return this.http.post('/api/ai/marketplace/dispute', { orderId, type, reason, amount });
  }

  async getMarketplaceInsights(marketplaceId: string) {
    return this.http.get(`/api/ai/marketplace/${marketplaceId}/insights`);
  }
}

// LEDGERAI (Accounting AI)
class LedgeraiClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async createAccount(account: any) {
    return this.http.post('/api/accounts', account);
  }

  async recordTransaction(transaction: any) {
    return this.http.post('/api/transactions', transaction);
  }

  async createInvoice(invoice: any) {
    return this.http.post('/api/invoices', invoice);
  }

  async markInvoicePaid(invoiceId: string) {
    return this.http.patch(`/api/invoices/${invoiceId}/pay`, {});
  }

  // AI endpoints
  async analyzeFinances() {
    return this.http.get('/api/ai/cfo/analyze');
  }

  async forecastRevenue() {
    return this.http.get('/api/ai/cfo/forecast');
  }
}

// RABTUL Wallet Service
class WalletClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async getBalance(userId: string) {
    return this.http.get(`/api/v1/wallet/${userId}/balance`);
  }

  async credit(userId: string, amount: number, reason: string) {
    return this.http.post('/api/v1/wallet/credit', { userId, amount, reason });
  }

  async debit(userId: string, amount: number, reason: string) {
    return this.http.post('/api/v1/wallet/debit', { userId, amount, reason });
  }

  async transfer(fromUserId: string, toUserId: string, amount: number) {
    return this.http.post('/api/v1/wallet/transfer', { fromUserId, toUserId, amount });
  }

  async getTransactions(userId: string, filters?: any) {
    return this.http.get(`/api/v1/wallet/${userId}/transactions`, filters);
  }
}

// RABTUL Catalog Service
class CatalogClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async searchProducts(query: string, filters?: any) {
    return this.http.get('/api/v1/products/search', { query, ...filters });
  }

  async getProduct(productId: string) {
    return this.http.get(`/api/v1/products/${productId}`);
  }

  async createProduct(product: any) {
    return this.http.post('/api/v1/products', product);
  }

  async updateProduct(productId: string, data: any) {
    return this.http.patch(`/api/v1/products/${productId}`, data);
  }

  async getCategories() {
    return this.http.get('/api/v1/categories');
  }
}

// RABTUL Order Service
class OrderClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async createOrder(order: any) {
    return this.http.post('/api/v1/orders', order);
  }

  async getOrder(orderId: string) {
    return this.http.get(`/api/v1/orders/${orderId}`);
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.http.patch(`/api/v1/orders/${orderId}/status`, { status });
  }

  async getOrders(userId: string, filters?: any) {
    return this.http.get(`/api/v1/orders/user/${userId}`, filters);
  }

  async cancelOrder(orderId: string) {
    return this.http.post(`/api/v1/orders/${orderId}/cancel`, {});
  }
}

// RABTUL Inventory Service
class InventoryClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async getStock(productId: string) {
    return this.http.get(`/api/v1/inventory/${productId}/stock`);
  }

  async updateStock(productId: string, adjustment: number, reason: string) {
    return this.http.patch(`/api/v1/inventory/${productId}/stock`, { adjustment, reason });
  }

  async getLowStockAlerts(merchantId: string) {
    return this.http.get('/api/v1/inventory/alerts/low-stock', { merchantId });
  }

  async transferStock(fromWarehouse: string, toWarehouse: string, items: any[]) {
    return this.http.post('/api/v1/inventory/transfer', { fromWarehouse, toWarehouse, items });
  }
}

// REZ HR OS Service
class HROSClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async createEmployee(employee: any) {
    return this.http.post('/api/v1/employees', employee);
  }

  async getEmployee(employeeId: string) {
    return this.http.get(`/api/v1/employees/${employeeId}`);
  }

  async checkIn(employeeId: string, location?: any) {
    return this.http.post('/api/v1/attendance/checkin', { employeeId, location });
  }

  async checkOut(employeeId: string) {
    return this.http.post('/api/v1/attendance/checkout', { employeeId });
  }

  async applyLeave(employeeId: string, leave: any) {
    return this.http.post('/api/v1/leave/apply', { employeeId, ...leave });
  }

  async runPayroll(companyId: string, month: string) {
    return this.http.post('/api/v1/payroll/run', { companyId, month });
  }

  async getPaySlip(employeeId: string, month: string) {
    return this.http.get(`/api/v1/payroll/slip/${employeeId}/${month}`);
  }
}

// REZ Real Estate OS Service
class RealEstateOSClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async addProperty(property: any) {
    return this.http.post('/api/v1/properties', property);
  }

  async getProperty(propertyId: string) {
    return this.http.get(`/api/v1/properties/${propertyId}`);
  }

  async searchProperties(filters: any) {
    return this.http.get('/api/v1/properties/search', filters);
  }

  async addLead(lead: any) {
    return this.http.post('/api/v1/leads', lead);
  }

  async scheduleSiteVisit(visit: any) {
    return this.http.post('/api/v1/site-visits', visit);
  }

  async updateDealStage(dealId: string, stage: string) {
    return this.http.patch(`/api/v1/deals/${dealId}/stage`, { stage });
  }

  async createAgreement(dealId: string, agreement: any) {
    return this.http.post(`/api/v1/deals/${dealId}/agreement`, agreement);
  }
}

// REZ Manufacturing OS Service
class ManufacturingOSClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async createBOM(bom: any) {
    return this.http.post('/api/v1/bom', bom);
  }

  async getBOM(bomId: string) {
    return this.http.get(`/api/v1/bom/${bomId}`);
  }

  async createWorkOrder(order: any) {
    return this.http.post('/api/v1/work-orders', order);
  }

  async updateWorkOrderStatus(orderId: string, status: string) {
    return this.http.patch(`/api/v1/work-orders/${orderId}/status`, { status });
  }

  async recordQC(qcData: any) {
    return this.http.post('/api/v1/quality-control', qcData);
  }

  async getMachineStatus(machineId: string) {
    return this.http.get(`/api/v1/machines/${machineId}/status`);
  }

  async scheduleMaintenance(machineId: string, maintenance: any) {
    return this.http.post(`/api/v1/machines/${machineId}/maintenance`, maintenance);
  }
}

// AdBazaar Creator Marketplace Service
class CreatorMarketplaceClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async registerCreator(creator: any) {
    return this.http.post('/api/v1/creators/register', creator);
  }

  async getCreator(creatorId: string) {
    return this.http.get(`/api/v1/creators/${creatorId}`);
  }

  async searchCreators(filters: any) {
    return this.http.get('/api/v1/creators/search', filters);
  }

  async createCampaign(campaign: any) {
    return this.http.post('/api/v1/campaigns', campaign);
  }

  async inviteCreator(campaignId: string, creatorId: string) {
    return this.http.post(`/api/v1/campaigns/${campaignId}/invite`, { creatorId });
  }

  async submitContent(content: any) {
    return this.http.post('/api/v1/content/submit', content);
  }

  async approveContent(contentId: string) {
    return this.http.patch(`/api/v1/content/${contentId}/approve`, {});
  }

  async releasePayment(paymentId: string) {
    return this.http.post(`/api/v1/payments/release`, { paymentId });
  }

  async getCreatorEarnings(creatorId: string) {
    return this.http.get(`/api/v1/payments/earnings/${creatorId}`);
  }
}

// AXOM Rendez Service
class RendezClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async createEvent(event: any) {
    return this.http.post('/api/v1/events', event);
  }

  async getEvent(eventId: string) {
    return this.http.get(`/api/v1/events/${eventId}`);
  }

  async searchEvents(filters: any) {
    return this.http.get('/api/v1/events/search', filters);
  }

  async rsvp(eventId: string, userId: string, status: 'yes' | 'no' | 'maybe') {
    return this.http.post(`/api/v1/events/${eventId}/rsvp`, { userId, status });
  }

  async createGroup(group: any) {
    return this.http.post('/api/v1/groups', group);
  }

  async joinGroup(groupId: string, userId: string) {
    return this.http.post(`/api/v1/groups/${groupId}/join`, { userId });
  }

  async createMeetup(meetup: any) {
    return this.http.post('/api/v1/meetups', meetup);
  }

  async getNearbyEvents(lat: number, lng: number, radius: number) {
    return this.http.get('/api/v1/events/nearby', { lat, lng, radius });
  }
}

// PROPFLOW (Real Estate AI)
class PropflowClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async addProperty(property: any) {
    return this.http.post('/api/properties', property);
  }

  async addLead(lead: any) {
    return this.http.post('/api/leads', lead);
  }

  async scheduleSiteVisit(visit: any) {
    return this.http.post('/api/visits', visit);
  }

  async updateDealStage(dealId: string, stage: string) {
    return this.http.patch(`/api/deals/${dealId}/stage`, { stage });
  }

  // AI endpoints
  async matchProperty(requirements: any) {
    return this.http.post('/api/ai/property/match', requirements);
  }

  async qualifyLead(lead: any) {
    return this.http.post('/api/ai/lead/qualify', lead);
  }
}

// ============================================
// REZ-MART (Quick Commerce)
// ============================================

class REZMartClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  // Driver management
  async createDriver(driver: any) {
    return this.http.post('/api/drivers', driver);
  }

  async getDriver(driverId: string) {
    return this.http.get(`/api/drivers/${driverId}`);
  }

  async updateDriverStatus(driverId: string, status: string) {
    return this.http.patch(`/api/drivers/${driverId}/status`, { status });
  }

  async updateDriverLocation(driverId: string, location: any) {
    return this.http.patch(`/api/drivers/${driverId}/location`, location);
  }

  async findNearbyDrivers(lat: number, lng: number, radius?: number) {
    return this.http.get('/api/drivers/nearby/search', { lat, lng, radius });
  }

  // Tracking
  async getTracking(orderId: string) {
    return this.http.get(`/api/tracking/order/${orderId}/latest`);
  }

  async getTrackingHistory(orderId: string) {
    return this.http.get(`/api/tracking/order/${orderId}`);
  }

  async updateTrackingLocation(orderId: string, location: any) {
    return this.http.patch(`/api/tracking/order/${orderId}/location`, location);
  }

  // Store management
  async createStore(store: any) {
    return this.http.post('/api/stores', store);
  }

  async getStore(storeId: string) {
    return this.http.get(`/api/stores/${storeId}`);
  }

  async updateStore(storeId: string, data: any) {
    return this.http.patch(`/api/stores/${storeId}`, data);
  }

  async getStoresByOwner(ownerId: string) {
    return this.http.get(`/api/stores/owner/${ownerId}`);
  }

  // Delivery
  async createDelivery(delivery: any) {
    return this.http.post('/api/deliveries', delivery);
  }

  async assignDriver(deliveryId: string, driverId: string) {
    return this.http.patch(`/api/deliveries/${deliveryId}/assign`, { driverId });
  }

  async completeDelivery(deliveryId: string, rating?: number) {
    return this.http.patch(`/api/deliveries/${deliveryId}/deliver`, { rating });
  }

  // Offers
  async createOffer(offer: any) {
    return this.http.post('/api/offers', offer);
  }

  async validateOffer(code: string, orderValue: number) {
    return this.http.post('/api/offers/validate', { code, orderValue });
  }

  // Subscriptions
  async createSubscription(subscription: any) {
    return this.http.post('/api/subscriptions', subscription);
  }

  async getSubscription(subscriptionId: string) {
    return this.http.get(`/api/subscriptions/${subscriptionId}`);
  }

  async pauseSubscription(subscriptionId: string) {
    return this.http.patch(`/api/subscriptions/${subscriptionId}/pause`, {});
  }

  async cancelSubscription(subscriptionId: string) {
    return this.http.patch(`/api/subscriptions/${subscriptionId}/cancel`, {});
  }

  // Analytics
  async getOverviewStats() {
    return this.http.get('/api/analytics/stats/overview');
  }

  async getStoreStats(storeId: string) {
    return this.http.get(`/api/analytics/stats/store/${storeId}`);
  }

  async trackEvent(event: any) {
    return this.http.post('/api/analytics/events', event);
  }
}

// ============================================
// GROCERYIQ (Grocery AI)
// ============================================

class GroceryIQClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  // Inventory
  async getInventory(filters?: any) {
    return this.http.get('/api/inventory', filters);
  }

  async getProduct(sku: string) {
    return this.http.get(`/api/inventory/${sku}`);
  }

  async addProduct(product: any) {
    return this.http.post('/api/inventory', product);
  }

  async updateProduct(sku: string, data: any) {
    return this.http.put(`/api/inventory/${sku}`, data);
  }

  async adjustStock(sku: string, adjustment: number, reason: string) {
    return this.http.post('/api/inventory/adjust', { sku, adjustment, reason });
  }

  async getLowStock() {
    return this.http.get('/api/inventory/low-stock');
  }

  async getExpiring(days?: number) {
    return this.http.get('/api/inventory/expiring', { days });
  }

  // Suppliers
  async getSuppliers() {
    return this.http.get('/api/suppliers');
  }

  async addSupplier(supplier: any) {
    return this.http.post('/api/suppliers', supplier);
  }

  // Purchase Orders
  async createPurchaseOrder(supplierId: string, items: any[]) {
    return this.http.post('/api/purchase-orders', { supplierId, items });
  }

  async getPurchaseOrders(status?: string) {
    return this.http.get('/api/purchase-orders', { status });
  }

  async receiveOrder(orderId: string) {
    return this.http.put(`/api/purchase-orders/${orderId}/receive`, {});
  }

  // Demand Forecasting
  async getDemandForecast(sku: string, horizon: string) {
    return this.http.get('/api/demand/forecast', { sku, horizon });
  }

  async getSeasonality() {
    return this.http.get('/api/demand/seasonality');
  }

  // Pricing
  async getPriceRecommendation(sku: string, cost: number, competitorPrices?: number[]) {
    return this.http.get('/api/pricing/recommend', { sku, cost, competitorPrices });
  }

  // Basket Analysis
  async analyzeBasket(items: string[]) {
    return this.http.post('/api/basket/analyze', { items });
  }

  // Analytics
  async getOverview() {
    return this.http.get('/api/analytics/overview');
  }

  async getTrends(period?: string) {
    return this.http.get('/api/analytics/trends', { period });
  }
}

// ============================================
// RETAIL KNOWLEDGE GRAPH (4300)
// ============================================

class RetailKnowledgeGraphClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  // Nodes
  async createNode(node: any) {
    return this.http.post('/api/nodes', node);
  }

  async getNode(id: string) {
    return this.http.get(`/api/nodes/${id}`);
  }

  async searchNodes(type: string, properties: any) {
    return this.http.post('/api/nodes/search', { type, properties });
  }

  async updateNode(id: string, data: any) {
    return this.http.put(`/api/nodes/${id}`, data);
  }

  // Edges
  async createEdge(edge: any) {
    return this.http.post('/api/edges', edge);
  }

  async getEdge(id: string) {
    return this.http.get(`/api/edges/${id}`);
  }

  async getNeighbors(nodeId: string, edgeType?: string) {
    return this.http.get(`/api/nodes/${nodeId}/neighbors`, { type: edgeType });
  }

  // Graph queries
  async findPath(sourceId: string, targetId: string, depth?: number) {
    return this.http.get(`/api/graph/path/${sourceId}/${targetId}`, { depth });
  }

  async getRecommendations(nodeId: string, limit?: number) {
    return this.http.get(`/api/recommendations/${nodeId}`, { limit });
  }

  // Retail-specific
  async getCustomer360(customerId: string) {
    return this.http.get(`/api/retail/customer/${customerId}/360`);
  }

  async getProductInsights(productId: string) {
    return this.http.get(`/api/retail/product/${productId}/insights`);
  }

  async getStats() {
    return this.http.get('/api/stats');
  }
}

// ============================================
// REZ-MERCHANT RETAIL SERVICES (4100-4105)
// ============================================

class RetailServiceClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  // Products
  async getProducts(filters?: any) {
    return this.http.get('/api/products', filters);
  }

  async getProduct(id: string) {
    return this.http.get(`/api/products/${id}`);
  }

  async createProduct(product: any) {
    return this.http.post('/api/products', product);
  }

  async updateProduct(id: string, data: any) {
    return this.http.put(`/api/products/${id}`, data);
  }

  async deleteProduct(id: string) {
    return this.http.delete(`/api/products/${id}`);
  }

  // Categories
  async getCategories() {
    return this.http.get('/api/categories');
  }

  async createCategory(category: any) {
    return this.http.post('/api/categories', category);
  }

  // Stores
  async getStores(filters?: any) {
    return this.http.get('/api/stores', filters);
  }

  async getStore(id: string) {
    return this.http.get(`/api/stores/${id}`);
  }

  async createStore(store: any) {
    return this.http.post('/api/stores', store);
  }

  // Employees
  async getEmployees(filters?: any) {
    return this.http.get('/api/employees', filters);
  }

  async createEmployee(employee: any) {
    return this.http.post('/api/employees', employee);
  }

  // Suppliers
  async getSuppliers() {
    return this.http.get('/api/suppliers');
  }

  async createSupplier(supplier: any) {
    return this.http.post('/api/suppliers', supplier);
  }
}

class RetailCRMClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async getCustomers(filters?: any) {
    return this.http.get('/api/customers', filters);
  }

  async getCustomer(id: string) {
    return this.http.get(`/api/customers/${id}`);
  }

  async createCustomer(customer: any) {
    return this.http.post('/api/customers', customer);
  }

  async updateCustomer(id: string, data: any) {
    return this.http.put(`/api/customers/${id}`, data);
  }

  async getInteractions(customerId: string) {
    return this.http.get(`/api/customers/${customerId}/interactions`);
  }

  async addInteraction(customerId: string, interaction: any) {
    return this.http.post(`/api/customers/${customerId}/interactions`, interaction);
  }

  async getSegments() {
    return this.http.get('/api/segments');
  }

  async getVIPCustomers() {
    return this.http.get('/api/customers/segments/vip');
  }

  async getAtRiskCustomers() {
    return this.http.get('/api/customers/segments/at_risk');
  }
}

class RetailLoyaltyClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async getPrograms() {
    return this.http.get('/api/programs');
  }

  async getProgram(id: string) {
    return this.http.get(`/api/programs/${id}`);
  }

  async createProgram(program: any) {
    return this.http.post('/api/programs', program);
  }

  async getAccounts(customerId?: string) {
    return this.http.get('/api/accounts', { customerId });
  }

  async getAccount(id: string) {
    return this.http.get(`/api/accounts/${id}`);
  }

  async getPoints(customerId: string) {
    return this.http.get(`/api/accounts/customer/${customerId}/points`);
  }

  async earnPoints(customerId: string, points: number, source: string) {
    return this.http.post('/api/points/earn', { customerId, points, source });
  }

  async redeemPoints(customerId: string, points: number, rewardId: string) {
    return this.http.post('/api/points/redeem', { customerId, points, rewardId });
  }

  async getRewards(programId: string) {
    return this.http.get(`/api/programs/${programId}/rewards`);
  }

  async getTierProgress(customerId: string) {
    return this.http.get(`/api/accounts/customer/${customerId}/tier`);
  }
}

class RetailInventoryClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async getItems(filters?: any) {
    return this.http.get('/api/items', filters);
  }

  async getItem(id: string) {
    return this.http.get(`/api/items/${id}`);
  }

  async createItem(item: any) {
    return this.http.post('/api/items', item);
  }

  async adjustStock(id: string, adjustment: number, reason: string) {
    return this.http.post(`/api/items/${id}/adjust`, { adjustment, reason });
  }

  async getLowStock() {
    return this.http.get('/api/items/low-stock');
  }

  async getExpiring(days?: number) {
    return this.http.get('/api/items/expiring', { days });
  }

  async transferStock(fromWarehouse: string, toWarehouse: string, items: any[]) {
    return this.http.post('/api/transfers', { fromWarehouse, toWarehouse, items });
  }

  async getWarehouses() {
    return this.http.get('/api/warehouses');
  }

  async createWarehouse(warehouse: any) {
    return this.http.post('/api/warehouses', warehouse);
  }

  async getSuppliers() {
    return this.http.get('/api/suppliers');
  }

  async createPurchaseOrder(supplierId: string, items: any[]) {
    return this.http.post('/api/purchase-orders', { supplierId, items });
  }

  async receiveOrder(orderId: string) {
    return this.http.put(`/api/purchase-orders/${orderId}/receive`, {});
  }
}

class RetailPOSClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async startSession(employeeId: string, storeId: string) {
    return this.http.post('/api/sessions/start', { employeeId, storeId });
  }

  async endSession(sessionId: string) {
    return this.http.post(`/api/sessions/${sessionId}/end`, {});
  }

  async getCart(sessionId: string) {
    return this.http.get(`/api/cart/${sessionId}`);
  }

  async addToCart(sessionId: string, item: any) {
    return this.http.post(`/api/cart/${sessionId}/items`, item);
  }

  async updateCartItem(sessionId: string, itemId: string, quantity: number) {
    return this.http.patch(`/api/cart/${sessionId}/items/${itemId}`, { quantity });
  }

  async removeFromCart(sessionId: string, itemId: string) {
    return this.http.delete(`/api/cart/${sessionId}/items/${itemId}`);
  }

  async applyDiscount(sessionId: string, discount: any) {
    return this.http.post(`/api/cart/${sessionId}/discount`, discount);
  }

  async applyLoyalty(sessionId: string, customerId: string, points: number) {
    return this.http.post(`/api/cart/${sessionId}/loyalty`, { customerId, points });
  }

  async checkout(sessionId: string, payment: any) {
    return this.http.post(`/api/checkout/${sessionId}`, payment);
  }

  async getTransaction(id: string) {
    return this.http.get(`/api/transactions/${id}`);
  }

  async refund(transactionId: string, items?: any[]) {
    return this.http.post(`/api/transactions/${transactionId}/refund`, { items });
  }

  async getReceipt(transactionId: string) {
    return this.http.get(`/api/transactions/${transactionId}/receipt`);
  }

  async startShift(employeeId: string) {
    return this.http.post('/api/shifts/start', { employeeId });
  }

  async endShift(shiftId: string) {
    return this.http.post(`/api/shifts/${shiftId}/end`, {});
  }

  async getCashSummary(shiftId: string) {
    return this.http.get(`/api/shifts/${shiftId}/cash-summary`);
  }
}

class RetailAnalyticsClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  async getOverview() {
    return this.http.get('/api/dashboard/overview');
  }

  async getSalesDashboard() {
    return this.http.get('/api/dashboard/sales');
  }

  async getInventoryDashboard() {
    return this.http.get('/api/dashboard/inventory');
  }

  async getCustomerDashboard() {
    return this.http.get('/api/dashboard/customers');
  }

  async getSalesReport(filters?: any) {
    return this.http.get('/api/reports/sales', filters);
  }

  async getInventoryReport(filters?: any) {
    return this.http.get('/api/reports/inventory', filters);
  }

  async getCustomerReport(filters?: any) {
    return this.http.get('/api/reports/customers', filters);
  }

  async getLoyaltyReport(filters?: any) {
    return this.http.get('/api/reports/loyalty', filters);
  }

  async getMetric(metric: string, period?: string) {
    return this.http.get('/api/metrics/' + metric, { period });
  }

  async forecastDemand(productId: string, horizon: string) {
    return this.http.post('/api/forecasts/demand', { productId, horizon });
  }
}

// ============================================
// AdBazaar SSP (Supply Side Platform)
// ============================================

class SSPClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  // Screen management
  async createScreen(screen: any) {
    return this.http.post('/api/screens', screen);
  }

  async getScreen(screenId: string) {
    return this.http.get(`/api/screens/${screenId}`);
  }

  async updateScreen(screenId: string, data: any) {
    return this.http.patch(`/api/screens/${screenId}`, data);
  }

  async getScreensByLocation(locationId: string) {
    return this.http.get(`/api/screens/location/${locationId}`);
  }

  async getScreensByType(type: string) {
    return this.http.get(`/api/screens/type/${type}`);
  }

  async checkAvailability(screenId: string, date: string, duration: number) {
    return this.http.get(`/api/screens/${screenId}/availability`, { date, duration });
  }

  // Inventory
  async createInventorySlot(slot: any) {
    return this.http.post('/api/inventory', slot);
  }

  async searchAvailableSlots(params: any) {
    return this.http.get('/api/inventory/available', params);
  }

  async bookSlot(slotId: string, advertiserId: string) {
    return this.http.patch(`/api/inventory/${slotId}/book`, { advertiserId });
  }

  async releaseSlot(slotId: string) {
    return this.http.patch(`/api/inventory/${slotId}/release`, {});
  }

  async createInventoryBatch(slots: any[]) {
    return this.http.post('/api/inventory/batch', { slots });
  }

  // Bidding
  async placeBid(bid: any) {
    return this.http.post('/api/bidding/bid', bid);
  }

  async getBid(bidId: string) {
    return this.http.get(`/api/bidding/${bidId}`);
  }

  async getAuctionBids(auctionId: string) {
    return this.http.get(`/api/bidding/auction/${auctionId}`);
  }

  async getAuctionResult(auctionId: string) {
    return this.http.get(`/api/bidding/auction/${auctionId}/result`);
  }

  async getAdvertiserBids(advertiserId: string) {
    return this.http.get(`/api/bidding/advertiser/${advertiserId}`);
  }

  async cancelBid(bidId: string) {
    return this.http.delete(`/api/bidding/${bidId}`);
  }

  // Revenue
  async recordRevenue(revenue: any) {
    return this.http.post('/api/revenue', revenue);
  }

  async getRevenueByScreen(screenId: string) {
    return this.http.get(`/api/revenue/screen/${screenId}`);
  }

  async getRevenueByAdvertiser(advertiserId: string) {
    return this.http.get(`/api/revenue/advertiser/${advertiserId}`);
  }

  async getRevenueOverview() {
    return this.http.get('/api/revenue/stats/overview');
  }

  async getDailyRevenue(date?: string) {
    return this.http.get('/api/revenue/stats/daily', { date });
  }

  async getMonthlyRevenue(month?: string) {
    return this.http.get('/api/revenue/stats/monthly', { month });
  }

  // Analytics
  async trackEvent(event: any) {
    return this.http.post('/api/analytics/events', event);
  }

  async trackEventsBatch(events: any[]) {
    return this.http.post('/api/analytics/events/batch', { events });
  }

  async getAnalyticsOverview() {
    return this.http.get('/api/analytics/stats/overview');
  }

  async getScreenAnalytics(screenId: string) {
    return this.http.get(`/api/analytics/stats/screen/${screenId}`);
  }

  async getCampaignAnalytics(campaignId: string) {
    return this.http.get(`/api/analytics/stats/campaign/${campaignId}`);
  }

  async getImpressionStats(period?: string) {
    return this.http.get('/api/analytics/stats/impressions/daily', { period });
  }
}

// ============================================
// MAIN SDK
// ============================================

export interface REZSDK {
  hojai: HOJAIClient;
  auth: AuthClient;
  notifications: NotificationsClient;
  payments: PaymentClient;
  wallet: WalletClient;
  catalog: CatalogClient;
  orders: OrderClient;
  inventory: InventoryClient;
  intelligence: IntelligenceClient;
  whatsapp: WhatsAppClient;
  restaurantCrm: RestaurantCRMClient;
  salonCrm: SalonCRMClient;
  booking: BookingClient;
  pos: POSClient;
  giftCard: GiftCardClient;
  waitron: WaitronClient;
  staybot: StaybotClient;
  carecode: CarecodeClient;
  fitmind: FitmindClient;
  teammind: TeammindClient;
  glamai: GlamaiClient;
  fleetiq: FleetiqClient;
  neighborai: NeighboraiClient;
  shopflow: ShopflowClient;
  ledgerai: LedgeraiClient;
  propflow: PropflowClient;
  hrOS: HROSClient;
  realEstateOS: RealEstateOSClient;
  manufacturingOS: ManufacturingOSClient;
  creatorMarketplace: CreatorMarketplaceClient;
  rendez: RendezClient;
  mart: REZMartClient;
  ssp: SSPClient;
  // Retail Ecosystem
  groceryIQ: GroceryIQClient;
  retailKnowledgeGraph: RetailKnowledgeGraphClient;
  retail: RetailServiceClient;
  retailCRM: RetailCRMClient;
  retailLoyalty: RetailLoyaltyClient;
  retailInventory: RetailInventoryClient;
  retailPOS: RetailPOSClient;
  retailAnalytics: RetailAnalyticsClient;
}

export function createSDK(config: SDKConfig): REZSDK {
  const internalToken = config.internalToken;

  // Service URLs
  const urls = {
    hojai: process.env.HOJAI_URL || 'http://localhost:4630',
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
    notifications: process.env.NOTIFICATIONS_URL || 'http://localhost:4011',
    payments: process.env.PAYMENTS_URL || 'http://localhost:4001',
    wallet: process.env.WALLET_URL || 'http://localhost:4004',
    catalog: process.env.CATALOG_URL || 'http://localhost:4005',
    orders: process.env.ORDERS_URL || 'http://localhost:4006',
    inventory: process.env.INVENTORY_URL || 'http://localhost:4008',
    intelligence: process.env.INTELLIGENCE_URL || 'http://localhost:4100',
    whatsapp: process.env.WHATSAPP_URL || 'http://localhost:4014',
    restaurantCrm: process.env.RESTAURANT_CRM_URL || 'http://localhost:4007',
    salonCrm: process.env.SALON_CRM_URL || 'http://localhost:4004',
    booking: process.env.BOOKING_URL || 'http://localhost:4042',
    pos: process.env.POS_URL || 'http://localhost:3100',
    giftCard: process.env.GIFT_CARD_URL || 'http://localhost:4047',
    waitron: process.env.WAITRON_URL || 'http://localhost:4820',
    staybot: process.env.STAYBOT_URL || 'http://localhost:4840',
    carecode: process.env.CARECODE_URL || 'http://localhost:4102',
    fitmind: process.env.FITMIND_URL || 'http://localhost:4801',
    teammind: process.env.TEAMMIND_URL || 'http://localhost:4803',
    glamai: process.env.GLAMAI_URL || 'http://localhost:4860',
    fleetiq: process.env.FLEETIQ_URL || 'http://localhost:4814',
    neighborai: process.env.NEIGHBORAI_URL || 'http://localhost:4806',
    shopflow: process.env.SHOPFLOW_URL || 'http://localhost:4830',
    ledgerai: process.env.LEDGERAI_URL || 'http://localhost:4815',
    propflow: process.env.PROPFLOW_URL || 'http://localhost:4807',
    hrOS: process.env.HR_OS_URL || 'http://localhost:4940',
    realEstateOS: process.env.REAL_ESTATE_OS_URL || 'http://localhost:4800',
    manufacturingOS: process.env.MANUFACTURING_OS_URL || 'http://localhost:4850',
    creatorMarketplace: process.env.CREATOR_MARKETPLACE_URL || 'http://localhost:5200',
    rendez: process.env.RENDEZ_URL || 'http://localhost:5100',
    // REZ-Mart
    mart: process.env.MART_URL || 'http://localhost:4100',
    // AdBazaar SSP
    ssp: process.env.SSP_URL || 'http://localhost:4520',
    // Retail Ecosystem
    groceryIQ: process.env.GROCERYIQ_URL || 'http://localhost:4131',
    retailKnowledgeGraph: process.env.RETAIL_KG_URL || 'http://localhost:4300',
    retail: process.env.RETAIL_SERVICE_URL || 'http://localhost:4100',
    retailCRM: process.env.RETAIL_CRM_URL || 'http://localhost:4101',
    retailLoyalty: process.env.RETAIL_LOYALTY_URL || 'http://localhost:4102',
    retailInventory: process.env.RETAIL_INVENTORY_URL || 'http://localhost:4103',
    retailPOS: process.env.RETAIL_POS_URL || 'http://localhost:4104',
    retailAnalytics: process.env.RETAIL_ANALYTICS_URL || 'http://localhost:4105',
  };

  // Create HTTP clients for each service
  const httpClients: Record<string, HTTPClient> = {};
  for (const [name, url] of Object.entries(urls)) {
    httpClients[name] = new HTTPClient(url, internalToken);
  }

  // Set auth token if provided
  if (config.authToken) {
    httpClients.hojai.setAuthToken(config.authToken);
  }

  return {
    // HOJAI Platform
    hojai: new HOJAIClient(httpClients.hojai),

    // RABTUL Core
    auth: new AuthClient(httpClients.auth),
    notifications: new NotificationsClient(httpClients.notifications),
    payments: new PaymentClient(httpClients.payments),
    wallet: new WalletClient(httpClients.wallet),
    catalog: new CatalogClient(httpClients.catalog),
    orders: new OrderClient(httpClients.orders),
    inventory: new InventoryClient(httpClients.inventory),

    // REZ Intelligence
    intelligence: new IntelligenceClient(httpClients.intelligence),

    // REZ Merchant Services
    whatsapp: new WhatsAppClient(httpClients.whatsapp),
    restaurantCrm: new RestaurantCRMClient(httpClients.restaurantCrm),
    salonCrm: new SalonCRMClient(httpClients.salonCrm),
    booking: new BookingClient(httpClients.booking),
    pos: new POSClient(httpClients.pos),
    giftCard: new GiftCardClient(httpClients.giftCard),

    // HOJAI Industry AI
    waitron: new WaitronClient(httpClients.waitron),
    staybot: new StaybotClient(httpClients.staybot),
    carecode: new CarecodeClient(httpClients.carecode),
    fitmind: new FitmindClient(httpClients.fitmind),
    teammind: new TeammindClient(httpClients.teammind),
    glamai: new GlamaiClient(httpClients.glamai),
    fleetiq: new FleetiqClient(httpClients.fleetiq),
    neighborai: new NeighboraiClient(httpClients.neighborai),
    shopflow: new ShopflowClient(httpClients.shopflow),
    ledgerai: new LedgeraiClient(httpClients.ledgerai),
    propflow: new PropflowClient(httpClients.propflow),

    // REZ Merchant OS (New Vertical Services)
    hrOS: new HROSClient(httpClients.hrOS),
    realEstateOS: new RealEstateOSClient(httpClients.realEstateOS),
    manufacturingOS: new ManufacturingOSClient(httpClients.manufacturingOS),

    // AdBazaar Creator Marketplace
    creatorMarketplace: new CreatorMarketplaceClient(httpClients.creatorMarketplace),

    // AXOM Rendez
    rendez: new RendezClient(httpClients.rendez),

    // REZ-Mart (Quick Commerce)
    mart: new REZMartClient(httpClients.mart),

    // AdBazaar SSP (Supply Side Platform)
    ssp: new SSPClient(httpClients.ssp),

    // Retail Ecosystem
    groceryIQ: new GroceryIQClient(httpClients.groceryIQ),
    retailKnowledgeGraph: new RetailKnowledgeGraphClient(httpClients.retailKnowledgeGraph),
    retail: new RetailServiceClient(httpClients.retail),
    retailCRM: new RetailCRMClient(httpClients.retailCRM),
    retailLoyalty: new RetailLoyaltyClient(httpClients.retailLoyalty),
    retailInventory: new RetailInventoryClient(httpClients.retailInventory),
    retailPOS: new RetailPOSClient(httpClients.retailPOS),
    retailAnalytics: new RetailAnalyticsClient(httpClients.retailAnalytics),
  };
}

export default { createSDK };
