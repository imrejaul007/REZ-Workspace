/**
 * REZ Verify QR Dashboard - API Service
 * Complete API client for Verify QR v2.0
 */

// ============================================
// TYPES
// ============================================

// Core Types
export interface Product {
  id?: string;
  serial_number: string;
  brand: string;
  model: string;
  category?: string;
  color?: string;
  storage?: string;
}

export interface Owner {
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  owned_since?: string;
}

// Verification
export interface VerificationResult {
  status: 'AUTHENTIC' | 'INVALID' | 'FLAGGED' | 'SUSPICIOUS';
  serial_number: string;
  brand: string;
  model: string;
  verification_count: number;
  warranty_status: 'active' | 'NOT_ACTIVATED' | 'expired';
  action: 'VIEW_WARRANTY' | 'ACTIVATE_WARRANTY';
  fraud_checks?: FraudCheck[];
  recommendations?: string[];
}

export interface FraudCheck {
  rule: string;
  flag: boolean;
  reason?: string;
}

// Warranty
export interface Warranty {
  warranty_id: string;
  serial_number: string;
  user_id: string;
  product_id?: string;
  brand: string;
  model: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  purchase_date: string;
  warranty_start_date: string;
  warranty_expiry_date: string;
  warranty_status: 'pending' | 'active' | 'expired' | 'claimed';
  ownership_status: 'unowned' | 'owned' | 'transferred';
  activated_at?: string;
}

export interface Claim {
  claim_id: string;
  warranty_id: string;
  serial_number: string;
  customer_name: string;
  customer_phone: string;
  issue_type: 'defective' | 'damaged' | 'not_working' | 'missing_parts' | 'other';
  issue_description: string;
  photos?: string[];
  service_center_id?: string;
  service_center_name?: string;
  resolution_type?: 'repair' | 'replace' | 'refund';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'under_review' | 'inspection_scheduled' | 'approved' | 'rejected' | 'in_repair' | 'replacement_shipped' | 'refund_processed' | 'resolved' | 'closed';
  timeline: TimelineEntry[];
  created_at: string;
  updated_at?: string;
}

export interface TimelineEntry {
  status: string;
  note: string;
  updated_by?: string;
  updated_at: string;
}

// Service Booking
export interface ServiceSlot {
  date: string;
  slots: Slot[];
}

export interface Slot {
  time: string;
  available: boolean;
  booked_by?: string;
  booking_id?: string;
}

export interface ServiceType {
  type: string;
  name: string;
  description: string;
  estimated_cost: number;
  estimated_time: string;
  warranty_covered: boolean;
}

export interface ServiceBooking {
  booking_id: string;
  serial_number: string;
  service_center_id: string;
  service_center_name: string;
  service_type: string;
  issue_description?: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  estimated_cost: number;
  actual_cost?: number;
  warranty_covered: boolean;
  timeline: TimelineEntry[];
  created_at: string;
}

export interface ServiceCenter {
  center_id: string;
  name: string;
  merchant_id?: string;
  address: string;
  city: string;
  state?: string;
  phone?: string;
  email?: string;
  services: string[];
  brands?: string[];
  distance?: number;
  status: 'active' | 'inactive';
}

// Ownership Passport
export interface OwnershipPassport {
  passport_id: string;
  serial_number: string;
  product: Product;
  status: 'active' | 'transferred' | 'reported_stolen' | 'recalled' | 'expired';
  certificate: {
    certificate_id: string;
    hash: string;
    qr_code: string;
  };
  warranty: {
    status: 'active' | 'expired' | 'claimed' | 'transferable';
    start_date: string;
    end_date: string;
    remaining_days: number;
    transferable: boolean;
  };
  ownership: {
    current_owner: Owner;
    original_owner?: Owner;
    chain_length: number;
    chain?: OwnershipChainEntry[];
  };
  service_history?: {
    total_services: number;
    records: ServiceRecord[];
  };
}

export interface OwnershipChainEntry {
  owner_id: string;
  owner_name: string;
  owner_phone?: string;
  acquired_date: string;
  transfer_type: 'purchase' | 'gift' | 'inheritance' | 'resale';
  verification_status: 'verified' | 'pending' | 'self_declared';
}

export interface ServiceRecord {
  record_id: string;
  service_type: string;
  description: string;
  service_center: {
    name: string;
    address?: string;
    city?: string;
  };
  service_date: string;
  cost: number;
  warranty_covered: boolean;
  parts_replaced?: string[];
}

// Resale Verification
export interface ResaleVerification {
  verification_id: string;
  serial_number: string;
  status: 'pending' | 'in_progress' | 'verified' | 'failed' | 'cancelled';
  risk_assessment: {
    score: number;
    level: 'low' | 'medium' | 'high';
    factors: RiskFactor[];
    can_proceed: boolean;
  };
  warranty: {
    status: string;
    remaining_days: number;
    transferable: boolean;
  };
  ownership: {
    current_owner_verified: boolean;
    ownership_chain_length: number;
  };
  service_history: {
    total_services: number;
    recent_services: number;
  };
  recommendation: string;
}

export interface RiskFactor {
  factor: string;
  score: number;
  description?: string;
}

// Express Replacement
export interface ExpressReplacement {
  replacement_id: string;
  status: string;
  original_serial: string;
  replacement_product: Product;
  deposit_required: boolean;
  deposit_amount: number;
  deposit_status: 'pending' | 'received' | 'refunded' | 'forfeited';
  shipping?: {
    courier: string;
    tracking_number: string;
    estimated_delivery: string;
  };
  timeline: TimelineEntry[];
}

// Warranty Plans
export interface WarrantyPlan {
  plan_id: string;
  name: string;
  description: string;
  tier: 'basic' | 'standard' | 'premium' | 'comprehensive';
  duration_months: number;
  price: number;
  coverage: {
    manufacturing_defects: boolean;
    accidental_damage: boolean;
    liquid_damage: boolean;
    theft_protection: boolean;
    pickup_delivery: boolean;
    express_service: boolean;
    unlimited_claims: boolean;
  };
  benefits: {
    cashback_percentage: number;
    loyalty_points_multiplier: number;
    priority_support: boolean;
  };
  limits: {
    max_claim_amount: number;
    max_total_claims: number;
    deductible: number;
  };
}

export interface WarrantySubscription {
  subscription_id: string;
  plan: {
    name: string;
    tier: string;
  };
  serial_number: string;
  status: 'active' | 'expired' | 'cancelled' | 'suspended';
  start_date: string;
  end_date: string;
  remaining_days: number;
  claims: {
    count: number;
    total_amount: number;
    remaining: number;
  };
}

// Analytics
export interface DashboardMetrics {
  total_serials: number;
  active_products: number;
  total_activations: number;
  activation_rate: number;
  pending_claims: number;
  total_claims: number;
  fraud_attempts: number;
}

export interface BookingMetrics {
  total: number;
  breakdown: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  avg_rating: number;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// API SERVICE
// ============================================

class VerifyQRApiService {
  private baseUrl: string;
  private internalToken: string;

  constructor() {
    // Use environment variable or default to local development
    this.baseUrl = process.env.NEXT_PUBLIC_VERIFY_API_URL || 'http://localhost:4003';
    this.internalToken = process.env.VERIFY_INTERNAL_TOKEN || '';
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.internalToken && { 'X-Internal-Token': this.internalToken }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // ============================================
  // VERIFICATION APIs
  // ============================================

  async verify(serialNumber: string, userId?: string, location?: { lat: number; lng: number }) {
    return this.request<VerificationResult>('/api/verify', {
      method: 'POST',
      body: JSON.stringify({
        serial_number: serialNumber,
        user_id: userId,
        location,
      }),
    });
  }

  // ============================================
  // WARRANTY APIs
  // ============================================

  async activateWarranty(data: {
    serial_number: string;
    user_id: string;
    customer_name: string;
    customer_phone: string;
    purchase_date: string;
    price_paid?: number;
    invoice_url?: string;
  }) {
    return this.request<{
      success: boolean;
      warranty_id: string;
      expires: string;
      cashback_earned: number;
    }>('/api/activate-warranty', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWarranty(serialNumber: string) {
    return this.request<Warranty>('/api/warranty/' + encodeURIComponent(serialNumber));
  }

  // ============================================
  // CLAIM APIs
  // ============================================

  async fileClaim(data: {
    warranty_id: string;
    issue_type: Claim['issue_type'];
    issue_description: string;
    photos?: string[];
    service_center_id?: string;
  }) {
    return this.request<{ success: boolean; claim_id: string }>('/api/claim', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getClaim(claimId: string) {
    return this.request<Claim>('/api/claim/' + claimId);
  }

  // ============================================
  // SERVICE BOOKING APIs
  // ============================================

  async getServiceSlots(centerId: string, date?: string, days = 7) {
    const params = new URLSearchParams({ center_id: centerId, days: String(days) });
    if (date) params.set('date', date);
    return this.request<{
      center_id: string;
      center_name: string;
      slots: ServiceSlot[];
    }>('/api/service-slots?' + params.toString());
  }

  async getServiceTypes(serialNumber: string) {
    return this.request<{
      serial_number: string;
      brand: string;
      model: string;
      warranty_status: string;
      services: ServiceType[];
    }>('/api/service-types/' + encodeURIComponent(serialNumber));
  }

  async bookService(data: {
    serial_number: string;
    user_id: string;
    customer_name: string;
    customer_phone: string;
    service_center_id: string;
    service_type: string;
    issue_description?: string;
    preferred_date: string;
    preferred_time: string;
  }) {
    return this.request<ServiceBooking>('/api/book-service', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBookings(userId: string, status?: string) {
    const params = new URLSearchParams({ user_id: userId });
    if (status) params.set('status', status);
    return this.request<PaginatedResponse<ServiceBooking>>('/api/bookings?' + params.toString());
  }

  async getBooking(bookingId: string) {
    return this.request<ServiceBooking>('/api/bookings/' + bookingId);
  }

  async cancelBooking(bookingId: string, reason?: string) {
    return this.request<{ success: boolean; message: string }>('/api/bookings/' + bookingId + '/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async rescheduleBooking(bookingId: string, newDate: string, newTime: string) {
    return this.request<ServiceBooking>('/api/bookings/' + bookingId + '/reschedule', {
      method: 'POST',
      body: JSON.stringify({ new_date: newDate, new_time: newTime }),
    });
  }

  async rateService(bookingId: string, rating: number, feedback?: string) {
    return this.request<{ success: boolean }>('/api/bookings/' + bookingId + '/rate', {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    });
  }

  async escalateBooking(bookingId: string, reason: string, priority = 'medium') {
    return this.request<{ success: boolean; ticket_id: string }>(
      '/api/bookings/' + bookingId + '/escalate',
      {
        method: 'POST',
        body: JSON.stringify({ reason, priority }),
      }
    );
  }

  // ============================================
  // SERVICE CENTERS
  // ============================================

  async getServiceCenters(params: {
    lat?: number;
    lng?: number;
    city?: string;
    brand?: string;
    service?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params.lat) searchParams.set('lat', String(params.lat));
    if (params.lng) searchParams.set('lng', String(params.lng));
    if (params.city) searchParams.set('city', params.city);
    if (params.brand) searchParams.set('brand', params.brand);
    if (params.service) searchParams.set('service', params.service);

    return this.request<{ count: number; centers: ServiceCenter[] }>(
      '/api/service-centers?' + searchParams.toString()
    );
  }

  async getServiceCenter(centerId: string) {
    return this.request<ServiceCenter>('/api/service-centers/' + centerId);
  }

  // ============================================
  // OWNERSHIP PASSPORT APIs
  // ============================================

  async createPassport(data: {
    serial_number: string;
    user_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    purchase_date: string;
    purchase_price?: number;
    purchase_location?: string;
    invoice_url?: string;
    warranty_months?: number;
  }) {
    return this.request<{
      success: boolean;
      passport_id: string;
      certificate: { certificate_id: string; hash: string; qr_code: string };
      warranty: OwnershipPassport['warranty'];
    }>('/api/passport/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPassport(serialNumber: string, includeHistory = true, includeService = true) {
    return this.request<OwnershipPassport>(
      `/api/passport/${encodeURIComponent(serialNumber)}?include_history=${includeHistory}&include_service=${includeService}`
    );
  }

  async getPassportCertificate(serialNumber: string) {
    return this.request<{
      certificate_id: string;
      passport_id: string;
      product: { brand: string; model: string };
      ownership: { current_owner: string; owned_since: string; chain_length: number };
      warranty: { status: string; expires: string; remaining_days: number };
      authenticity: { verified: boolean; hash: string };
    }>('/api/passport/' + encodeURIComponent(serialNumber) + '/certificate');
  }

  async transferOwnership(data: {
    serial_number: string;
    from_user_id: string;
    to_user_id: string;
    to_name: string;
    to_phone: string;
    to_email?: string;
    transfer_type?: 'resale' | 'gift';
    sale_price?: number;
    proof_url?: string;
  }) {
    return this.request<{
      success: boolean;
      passport_id: string;
      transfer_id: string;
      message: string;
      warranty_included: boolean;
    }>('/api/passport/' + encodeURIComponent(data.serial_number) + '/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // RESALE VERIFICATION APIs
  // ============================================

  async requestResaleVerification(data: {
    serial_number: string;
    buyer_user_id: string;
    buyer_name: string;
    buyer_phone: string;
  }) {
    return this.request<{ success: boolean; verification_id: string; message: string }>(
      '/api/resale/verify',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getResaleVerification(verificationId: string) {
    return this.request<ResaleVerification>('/api/resale/verify/' + verificationId);
  }

  async buyerCheck(serialNumber: string) {
    return this.request<ResaleVerification>('/api/resale/buyer-check/' + encodeURIComponent(serialNumber));
  }

  // ============================================
  // SERVICE RECORDS
  // ============================================

  async exportServiceHistory(serialNumber: string, purpose = 'resale') {
    return this.request<{
      export_id: string;
      service_summary: {
        total_services: number;
        total_cost: number;
        warranty_covered_cost: number;
        last_service_date: string;
      };
      service_records: ServiceRecord[];
      authenticity_hash: string;
    }>('/api/passport/service/export/' + encodeURIComponent(serialNumber) + '?purpose=' + purpose);
  }

  // ============================================
  // EXTENDED WARRANTY APIs
  // ============================================

  async getWarrantyPlans(params?: { brand_id?: string; category?: string; product_price?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.brand_id) searchParams.set('brand_id', params.brand_id);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.product_price) searchParams.set('product_price', String(params.product_price));

    return this.request<{ plans: WarrantyPlan[] }>('/api/warranty-plans?' + searchParams.toString());
  }

  async subscribeToPlan(data: {
    plan_id: string;
    serial_number: string;
    user_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    product_price: number;
    payment_method?: string;
    auto_renew?: boolean;
  }) {
    return this.request<{
      success: boolean;
      subscription_id: string;
      status: string;
      start_date: string;
      end_date: string;
      benefits: WarrantyPlan['coverage'];
    }>('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSubscriptions(userId: string, status?: string) {
    const params = new URLSearchParams({ user_id: userId });
    if (status) params.set('status', status);
    return this.request<{ subscriptions: WarrantySubscription[] }>('/api/subscriptions/' + params.toString());
  }

  // ============================================
  // EXPRESS REPLACEMENT APIs
  // ============================================

  async requestExpressReplacement(data: {
    claim_id: string;
    warranty_id?: string;
    user_id: string;
    customer_name: string;
    customer_phone: string;
    original_serial: string;
    issue_description: string;
  }) {
    return this.request<{
      success: boolean;
      replacement_id: string;
      replacement_available: boolean;
      replacement_product: Product;
      deposit_required: boolean;
      deposit_amount: number;
      estimated_delivery: string;
    }>('/api/express-replacement', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getExpressReplacement(replacementId: string) {
    return this.request<ExpressReplacement>('/api/express-replacement/' + replacementId);
  }

  async trackExpressReplacement(replacementId: string) {
    return this.request<{
      replacement_id: string;
      status: string;
      current_step: number;
      steps: Array<{
        step: string;
        label: string;
        completed: boolean;
        at?: string;
        tracking?: string;
        amount?: number;
      }>;
    }>('/api/express-replacement/' + replacementId + '/track');
  }

  // ============================================
  // ANALYTICS APIs
  // ============================================

  async getVerificationAnalytics(params?: { from?: string; to?: string; merchant_id?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);
    if (params?.merchant_id) searchParams.set('merchant_id', params.merchant_id);

    return this.request<{ scans: number; activations: number; claims: number }>(
      '/analytics/verifications?' + searchParams.toString()
    );
  }

  async getBookingAnalytics(params?: { from?: string; to?: string; center_id?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);
    if (params?.center_id) searchParams.set('center_id', params.center_id);

    return this.request<BookingMetrics>('/analytics/bookings?' + searchParams.toString());
  }

  // ============================================
  // SUPPORT APIs
  // ============================================

  async requestSupport(data: {
    user_id: string;
    customer_name: string;
    customer_phone: string;
    serial_number: string;
    issue_type: string;
    description: string;
    photos?: string[];
  }) {
    return this.request<{ success: boolean; ticket_id: string }>('/api/support/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const api = new VerifyQRApiService();
export default api;

// Export types for use in components
export type {
  VerificationResult,
  Warranty,
  Claim,
  ServiceBooking,
  ServiceCenter,
  ServiceSlot,
  ServiceType,
  OwnershipPassport,
  ResaleVerification,
  ExpressReplacement,
  WarrantyPlan,
  WarrantySubscription,
  DashboardMetrics,
  BookingMetrics,
};
