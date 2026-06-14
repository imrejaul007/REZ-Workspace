/**
 * rez-fraud-service — Fraud Detection Service
 *
 * Detects fraudulent activities including:
 * - Velocity attacks (too many orders)
 * - Geographic anomalies
 * - Payment fraud patterns
 * - Device fingerprinting
 * - Business rule violations
 */

import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';

// Type definitions
export interface FraudCheck {
  orderId: string;
  customerId: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  action: 'allow' | 'review' | 'block';
}

export interface Order {
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  deviceFingerprint: DeviceFingerprint;
  ipAddress: string;
  userAgent: string;
  paymentMethod: PaymentMethodInfo;
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  category: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

export interface DeviceFingerprint {
  fingerprintId: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  canvasHash?: string;
  webglRenderer?: string;
  audioHash?: string;
}

export interface PaymentMethodInfo {
  type: 'card' | 'upi' | 'wallet' | 'bank_transfer' | 'cod';
  cardLast4?: string;
  cardBrand?: string;
  cardType?: 'credit' | 'debit';
  issuerCountry?: string;
  isVirtualCard?: boolean;
  isPrepaid?: boolean;
  tokenized?: boolean;
}

export interface Payment {
  paymentId: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: PaymentMethodInfo;
  billingAddress: Address;
  deviceFingerprint: DeviceFingerprint;
  ipAddress: string;
  riskScore?: number;
  createdAt: Date;
}

export interface Customer {
  customerId: string;
  email: string;
  phone: string;
  addresses: Address[];
  registeredAt: Date;
  orderCount: number;
  totalSpent: number;
  riskScore: number;
  flags: string[];
}

export interface FraudCase {
  caseId: string;
  customerId: string;
  orderId?: string;
  paymentId?: string;
  type: 'velocity' | 'geographic' | 'payment' | 'device' | 'business_rule' | 'combined';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  evidence: Record<string, unknown>;
  status: 'open' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved';
  reportedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface FraudStats {
  totalChecks: number;
  totalOrdersChecked: number;
  totalPaymentsChecked: number;
  totalCustomersChecked: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  actionDistribution: {
    allow: number;
    review: number;
    block: number;
  };
  fraudCasesByType: Record<string, number>;
  averageRiskScore: number;
  lastUpdated: Date;
}

// Velocity detection thresholds
const VELOCITY_LIMITS = {
  ordersPerHour: { warning: 3, critical: 5 },
  ordersPerDay: { warning: 10, critical: 20 },
  ordersWithSameIp: { warning: 5, critical: 10 },
  ordersWithSameDevice: { warning: 3, critical: 5 },
  paymentAttemptsPerHour: { warning: 5, critical: 10 },
  amountPerHour: { warning: 10000, critical: 50000 },
  differentCardsPerHour: { warning: 2, critical: 4 },
};

// Geographic anomaly thresholds
const GEO_LIMITS = {
  distanceFromLastOrder: 500, // km - flag if further in 1 hour
  countriesPerDay: { warning: 2, critical: 3 },
  citiesPerDay: { warning: 3, critical: 5 },
  shippingBillingMismatch: true,
};

// Payment fraud patterns
const PAYMENT_PATTERNS = {
  highRiskCountries: ['XX', 'YY', 'ZZ'], // Placeholder for high-risk countries
  highRiskBinPrefixes: ['400000', '411111'], // Placeholder BIN prefixes
  maxAmountSingleTransaction: 100000,
  suspiciousAmounts: [0.01, 0.99, 1.00, 1.99, 9.99, 99.99, 999.99],
  prepaidCardRatio: 0.3,
  virtualCardRatio: 0.2,
};

// Device fingerprint patterns
const DEVICE_PATTERNS = {
  maxDevicesPerCustomer: 5,
  maxCustomersPerDevice: 3,
  newDevicePurchaseThreshold: 5000, // Flag if > this amount on new device
  suspiciousUserAgents: ['bot', 'crawler', 'curl', 'wget', 'python-requests'],
};

// Business rule violations
const BUSINESS_RULES = {
  maxOrderAmount: 100000,
  minOrderAmount: 0.01,
  requireAddressVerification: true,
  blacklistPatterns: [
    /test/i,
    /fake/i,
    /demo/i,
    /sample/i,
    /\$0/i,
  ],
  restrictedCategories: ['gift_card', 'digital_currency'],
};

/**
 * Calculate distance between two coordinates in km using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate risk score from 0-100 based on factors
 */
function calculateRiskScore(factors: { weight: number; score: number }[]): number {
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedScore = factors.reduce(
    (sum, f) => sum + f.weight * f.score,
    0
  );
  return Math.min(100, Math.round(weightedScore / totalWeight));
}

/**
 * Determine risk level and action based on score and reasons
 */
function determineRiskLevel(
  score: number,
  reasons: string[],
  criticalReasons: string[]
): { risk: FraudCheck['risk']; action: FraudCheck['action'] } {
  const hasCriticalReason = criticalReasons.some((r) =>
    reasons.some((reason) => reason.toLowerCase().includes(r.toLowerCase()))
  );

  let risk: FraudCheck['risk'];
  let action: FraudCheck['action'];

  if (hasCriticalReason || score >= 80) {
    risk = 'critical';
    action = 'block';
  } else if (score >= 60) {
    risk = 'high';
    action = 'block';
  } else if (score >= 40) {
    risk = 'medium';
    action = 'review';
  } else {
    risk = 'low';
    action = 'allow';
  }

  return { risk, action };
}

interface ActivityRecord {
  timestamp: Date;
  entityId: string;
  entityType: 'order' | 'payment' | 'customer' | 'device' | 'ip';
  data: Record<string, unknown>;
}

interface FraudState {
  activities: ActivityRecord[];
  customerVelocity: Map<string, ActivityRecord[]>;
  ipVelocity: Map<string, ActivityRecord[]>;
  deviceVelocity: Map<string, ActivityRecord[]>;
  fraudCases: Map<string, FraudCase>;
  stats: FraudStats;
}

export class FraudDetector {
  private state: FraudState;
  private readonly RETENTION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.state = {
      activities: [],
      customerVelocity: new Map(),
      ipVelocity: new Map(),
      deviceVelocity: new Map(),
      fraudCases: new Map(),
      stats: {
        totalChecks: 0,
        totalOrdersChecked: 0,
        totalPaymentsChecked: 0,
        totalCustomersChecked: 0,
        riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        actionDistribution: { allow: 0, review: 0, block: 0 },
        fraudCasesByType: {},
        averageRiskScore: 0,
        lastUpdated: new Date(),
      },
    };
  }

  /**
   * Check an order for fraud indicators
   */
  async checkOrder(order: Order): Promise<FraudCheck> {
    const reasons: string[] = [];
    const criticalReasons: string[] = [];
    const factors: { weight: number; score: number }[] = [];

    // 1. Velocity Attack Detection
    const velocityResult = this.detectVelocityAttack(order);
    reasons.push(...velocityResult.reasons);
    criticalReasons.push(...velocityResult.criticalReasons);
    factors.push(...velocityResult.factors);

    // 2. Geographic Anomaly Detection
    const geoResult = this.detectGeographicAnomalies(order);
    reasons.push(...geoResult.reasons);
    criticalReasons.push(...geoResult.criticalReasons);
    factors.push(...geoResult.factors);

    // 3. Device Fingerprint Analysis
    const deviceResult = this.detectDeviceAnomalies(order);
    reasons.push(...deviceResult.reasons);
    criticalReasons.push(...deviceResult.criticalReasons);
    factors.push(...deviceResult.factors);

    // 4. Business Rule Violations
    const businessResult = this.checkBusinessRules(order);
    reasons.push(...businessResult.reasons);
    criticalReasons.push(...businessResult.criticalReasons);
    factors.push(...businessResult.factors);

    // Record this activity
    this.recordActivity({
      timestamp: order.createdAt,
      entityId: order.orderId,
      entityType: 'order',
      data: { customerId: order.customerId, amount: order.amount, ip: order.ipAddress },
    });

    // Update customer velocity
    this.updateCustomerVelocity(order.customerId, order);

    // Update IP velocity
    this.updateIpVelocity(order.ipAddress, order);

    // Update device velocity
    this.updateDeviceVelocity(order.deviceFingerprint.fingerprintId, order);

    // Calculate final risk score
    const riskScore = calculateRiskScore(factors);
    const { risk, action } = determineRiskLevel(
      riskScore,
      reasons,
      criticalReasons
    );

    // Update stats
    this.updateStats('order', risk, action);

    // Create fraud case if high risk
    if (risk === 'high' || risk === 'critical') {
      await this.createFraudCase({
        caseId: uuidv4(),
        customerId: order.customerId,
        orderId: order.orderId,
        type: 'combined',
        severity: risk,
        reasons,
        evidence: {
          riskScore,
          orderData: order,
          factors,
        },
        status: 'open',
        reportedAt: new Date(),
      });
    }

    return {
      orderId: order.orderId,
      customerId: order.customerId,
      risk,
      reasons,
      action,
    };
  }

  /**
   * Check a payment for fraud indicators
   */
  async checkPayment(payment: Payment): Promise<FraudCheck> {
    const reasons: string[] = [];
    const criticalReasons: string[] = [];
    const factors: { weight: number; score: number }[] = [];

    // 1. Payment Fraud Pattern Detection
    const paymentResult = this.detectPaymentFraudPatterns(payment);
    reasons.push(...paymentResult.reasons);
    criticalReasons.push(...paymentResult.criticalReasons);
    factors.push(...paymentResult.factors);

    // 2. Velocity Attack on Payments
    const velocityResult = this.detectPaymentVelocityAttack(payment);
    reasons.push(...velocityResult.reasons);
    criticalReasons.push(...velocityResult.criticalReasons);
    factors.push(...velocityResult.factors);

    // 3. Geographic Check for Payment
    const geoResult = this.detectPaymentGeographicAnomalies(payment);
    reasons.push(...geoResult.reasons);
    criticalReasons.push(...geoResult.criticalReasons);
    factors.push(...geoResult.factors);

    // 4. Device Fingerprint for Payment
    const deviceResult = this.detectPaymentDeviceAnomalies(payment);
    reasons.push(...deviceResult.reasons);
    criticalReasons.push(...deviceResult.criticalReasons);
    factors.push(...deviceResult.factors);

    // Record activity
    this.recordActivity({
      timestamp: payment.createdAt,
      entityId: payment.paymentId,
      entityType: 'payment',
      data: { customerId: payment.customerId, amount: payment.amount, ip: payment.ipAddress },
    });

    // Calculate final risk score
    const riskScore = calculateRiskScore(factors);
    const { risk, action } = determineRiskLevel(
      riskScore,
      reasons,
      criticalReasons
    );

    // Update stats
    this.updateStats('payment', risk, action);

    // Create fraud case if high risk
    if (risk === 'high' || risk === 'critical') {
      await this.createFraudCase({
        caseId: uuidv4(),
        customerId: payment.customerId,
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        type: 'payment',
        severity: risk,
        reasons,
        evidence: {
          riskScore,
          paymentData: payment,
          factors,
        },
        status: 'open',
        reportedAt: new Date(),
      });
    }

    return {
      orderId: payment.orderId,
      customerId: payment.customerId,
      risk,
      reasons,
      action,
    };
  }

  /**
   * Check a customer for fraud indicators
   */
  async checkCustomer(customerId: string): Promise<FraudCheck> {
    const reasons: string[] = [];
    const criticalReasons: string[] = [];
    const factors: { weight: number; score: number }[] = [];

    // Get customer activities
    const customerActivities = this.state.customerVelocity.get(customerId) || [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check order velocity
    const recentOrders = customerActivities.filter(
      (a) => a.timestamp > oneHourAgo && a.entityType === 'order'
    );
    const dailyOrders = customerActivities.filter(
      (a) => a.timestamp > oneDayAgo && a.entityType === 'order'
    );

    if (recentOrders.length >= VELOCITY_LIMITS.ordersPerHour.critical) {
      reasons.push(
        `Critical: ${recentOrders.length} orders in the last hour`
      );
      criticalReasons.push('velocity');
      factors.push({ weight: 3, score: 100 });
    } else if (recentOrders.length >= VELOCITY_LIMITS.ordersPerHour.warning) {
      reasons.push(
        `Warning: ${recentOrders.length} orders in the last hour`
      );
      factors.push({ weight: 2, score: 60 });
    }

    if (dailyOrders.length >= VELOCITY_LIMITS.ordersPerDay.critical) {
      reasons.push(
        `Critical: ${dailyOrders.length} orders in the last 24 hours`
      );
      criticalReasons.push('velocity');
      factors.push({ weight: 3, score: 100 });
    } else if (dailyOrders.length >= VELOCITY_LIMITS.ordersPerDay.warning) {
      reasons.push(
        `Warning: ${dailyOrders.length} orders in the last 24 hours`
      );
      factors.push({ weight: 2, score: 50 });
    }

    // Check for multiple IPs associated with customer
    const ipsUsed = new Set(
      customerActivities
        .filter((a) => a.data && a.data.ip)
        .map((a) => a.data.ip as string)
    );
    if (ipsUsed.size > 3) {
      reasons.push(`Multiple IPs detected: ${ipsUsed.size} different IPs`);
      factors.push({ weight: 2, score: 40 });
    }

    // Check for multiple devices
    const recentDevices = this.getRecentDevicesForCustomer(customerId);
    if (recentDevices.size > DEVICE_PATTERNS.maxDevicesPerCustomer) {
      reasons.push(
        `Multiple devices detected: ${recentDevices.size} different devices`
      );
      factors.push({ weight: 2, score: 50 });
    }

    // Check total spending anomalies
    const totalSpent = dailyOrders.reduce(
      (sum, a) => sum + ((a.data?.amount as number) || 0),
      0
    );
    if (totalSpent > VELOCITY_LIMITS.amountPerHour.critical) {
      reasons.push(`Critical spending: $${totalSpent} in the last hour`);
      criticalReasons.push('velocity');
      factors.push({ weight: 3, score: 100 });
    } else if (totalSpent > VELOCITY_LIMITS.amountPerHour.warning) {
      reasons.push(`High spending: $${totalSpent} in the last hour`);
      factors.push({ weight: 2, score: 60 });
    }

    // Calculate risk score
    const riskScore = calculateRiskScore(factors);
    const { risk, action } = determineRiskLevel(
      riskScore,
      reasons,
      criticalReasons
    );

    // Update stats
    this.updateStats('customer', risk, action);

    return {
      orderId: '',
      customerId,
      risk,
      reasons,
      action,
    };
  }

  /**
   * Report a confirmed fraud case
   */
  async reportFraud(fraudCase: FraudCase): Promise<void> {
    this.state.fraudCases.set(fraudCase.caseId, fraudCase);

    // Update type distribution
    if (!this.state.stats.fraudCasesByType[fraudCase.type]) {
      this.state.stats.fraudCasesByType[fraudCase.type] = 0;
    }
    this.state.stats.fraudCasesByType[fraudCase.type]++;

    console.log(`[FRAUD CASE REPORTED] ${fraudCase.caseId}`, {
      customerId: fraudCase.customerId,
      type: fraudCase.type,
      severity: fraudCase.severity,
      reasons: fraudCase.reasons,
    });
  }

  /**
   * Get fraud detection statistics
   */
  async getStats(): Promise<FraudStats> {
    return {
      ...this.state.stats,
      lastUpdated: new Date(),
    };
  }

  // ==================== Detection Methods ====================

  private detectVelocityAttack(order: Order): {
    reasons: string[];
    criticalReasons: string[];
    factors: { weight: number; score: number }[];
  } {
    const reasons: string[] = [];
    const criticalReasons: string[] = [];
    const factors: { weight: number; score: number }[] = [];

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check orders per hour for this customer
    const customerActivities = this.state.customerVelocity.get(order.customerId) || [];
    const recentOrders = customerActivities.filter(
      (a) => a.timestamp > oneHourAgo && a.entityType === 'order'
    );

    if (recentOrders.length >= VELOCITY_LIMITS.ordersPerHour.critical) {
      reasons.push(
        `Velocity attack: ${recentOrders.length + 1} orders in the last hour`
      );
      criticalReasons.push('velocity');
      factors.push({ weight: 3, score: 100 });
    } else if (recentOrders.length >= VELOCITY_LIMITS.ordersPerHour.warning) {
      reasons.push(
        `High velocity: ${recentOrders.length + 1} orders in the last hour`
      );
      factors.push({ weight: 2, score: 60 });
    }

    // Check orders per day
    const dailyOrders = customerActivities.filter(
      (a) => a.timestamp > oneDayAgo && a.entityType === 'order'
    );

    if (dailyOrders.length >= VELOCITY_LIMITS.ordersPerDay.critical) {
      reasons.push(
        `Daily velocity exceeded: ${dailyOrders.length + 1} orders in 24 hours`
      );
      criticalReasons.push('velocity');
      factors.push({ weight: 3, score: 90 });
    }

    // Check same IP activity
    const ipActivities = this.state.ipVelocity.get(order.ipAddress) || [];
    const recentFromIp = ipActivities.filter(
      (a) => a.timestamp > oneHourAgo && a.entityType === 'order'
    );

    if (recentFromIp.length >= VELOCITY_LIMITS.ordersWithSameIp.critical) {
      reasons.push(
        `IP sharing detected: ${recentFromIp.length + 1} orders from same IP`
      );
      criticalReasons.push('ip_sharing');
      factors.push({ weight: 2, score: 85 });
    }

    // Check amount velocity
    const totalAmount = recentOrders.reduce(
      (sum, a) => sum + ((a.data?.amount as number) || 0),
      0
    ) + order.amount;

    if (totalAmount > VELOCITY_LIMITS.amountPerHour.critical) {
      reasons.push(
        `Amount velocity exceeded: $${totalAmount} in the last hour`
      );
      criticalReasons.push('amount_velocity');
      factors.push({ weight: 3, score: 95 });
    }

    return { reasons, criticalReasons, factors };
  }

  private detectGeographicAnomalies(order: Order): {
    reasons: string[];
    criticalReasons: string[];
    factors: { weight: number; score: number }[];
  } {
    const reasons: string[] = [];
    const criticalReasons: string[] = [];
    const factors: { weight: number; score: number }[] = [];

    const customerActivities = this.state.customerVelocity.get(order.customerId) || [];
    const recentOrders = customerActivities
      .filter((a) => a.entityType === 'order')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Check shipping/billing address mismatch
    if (
      BUSINESS_RULES.requireAddressVerification &&
      order.shippingAddress.country !== order.billingAddress.country
    ) {
      reasons.push('Shipping and billing address country mismatch');
      factors.push({ weight: 2, score: 50 });
    }

    // Check distance from last order
    if (
      recentOrders.length > 0 &&
      order.shippingAddress.latitude &&
      order.shippingAddress.longitude
    ) {
      const lastOrder = recentOrders[0];
      // @ts-expect-error - data contains address info
      const lastLat = lastOrder.data?.latitude;
      // @ts-expect-error - data contains address info
      const lastLon = lastOrder.data?.longitude;

      if (lastLat && lastLon) {
        const distance = calculateDistance(
          lastLat,
          lastLon,
          order.shippingAddress.latitude,
          order.shippingAddress.longitude
        );

        const hoursSinceLastOrder =
          (Date.now() - lastOrder.timestamp.getTime()) / (1000 * 60 * 60);

        // If distance is > 500km in less than 1 hour, flag as suspicious
        if (distance > GEO_LIMITS.distanceFromLastOrder && hoursSinceLastOrder < 1) {
          reasons.push(
            `Impossible travel: ${Math.round(distance)}km in ${Math.round(hoursSinceLastOrder * 60)} minutes`
          );
          criticalReasons.push('impossible_travel');
          factors.push({ weight: 3, score: 95 });
        }
      }
    }

    // Check for high-risk country
    if (PAYMENT_PATTERNS.highRiskCountries.includes(order.shippingAddress.country)) {
      reasons.push('Shipping to high-risk country');
      factors.push({ weight: 2, score: 70 });
    }

    return { reasons, criticalReasons, factors };
  }

  private detectDeviceAnomalies(order: Order): {
    reasons: string[];
    criticalReasons: string[];
    factors: { weight: number; score: number }[];
  } {
    const reasons: string[] = [];
    const criticalReasons: string[] = [];
    const factors: { weight: number; score: number }[] = [];

    const deviceId = order.deviceFingerprint.fingerprintId;

    // Check for suspicious user agents
    const userAgentLower = order.userAgent.toLowerCase();
    for (const pattern of DEVICE_PATTERNS.suspiciousUserAgents) {
      if (userAgentLower.includes(pattern)) {
        reasons.push(`Suspicious user agent: ${order.userAgent}`);
        criticalReasons.push('suspicious_user_agent');
        factors.push({ weight: 3, score: 100 });
        break;
      }
    }

    // Check for new device with high-value order
    const deviceActivities = this.state.deviceVelocity.get(deviceId) || [];
    const isNewDevice = deviceActivities.length === 0;

    if (isNewDevice && order.amount > DEVICE_PATTERNS.newDevicePurchaseThreshold) {
      reasons.push(
        `High-value order ($${order.amount}) on new device`
      );
      factors.push({ weight: 2, score: 60 });
    }

    // Check for multiple customers using same device
    const customerIdsUsingDevice = new Set(
      deviceActivities
        .filter((a) => a.data?.customerId)
        .map((a) => a.data.customerId as string)
    );
    customerIdsUsingDevice.add(order.customerId);

    if (customerIdsUsingDevice.size > DEVICE_PATTERNS.maxCustomersPerDevice) {
      reasons.push(
        `Device sharing: ${customerIdsUsingDevice.size} customers using same device`
      );
      criticalReasons.push('device_sharing');
      factors.push({ weight: 3, score: 90 });
    }

    // Check for missing or suspicious fingerprint components
    const fingerprint = order.deviceFingerprint;
    const missingComponents: string[] = [];
    if (!fingerprint.canvasHash) missingComponents.push('canvas');
    if (!fingerprint.webglRenderer) missingComponents.push('webgl');
    if (!fingerprint.audioHash) missingComponents.push('audio');

    if (missingComponents.length >= 2) {
      reasons.push(`Incomplete device fingerprint: missing ${missingComponents.join(', ')}`);
      factors.push({ weight: 2, score: 55 });
    }

    return { reasons, criticalReasons, factors };
  }

  private checkBusinessRules(order: Order): {
    reasons: string[];
    criticalReasons: string[];
    factors: { weight: number; score: number }[];
  } {
    const reasons: string[] = [];
    const criticalReasons: string[] = [];
    const factors: { weight: number; score: number }[] = [];

    // Check order amount limits
    if (order.amount > BUSINESS_RULES.maxOrderAmount) {
      reasons.push(`Order amount ($${order.amount}) exceeds maximum ($${BUSINESS_RULES.maxOrderAmount})`);
      criticalReasons.push('amount_limit');
      factors.push({ weight: 3, score: 100 });
    }

    if (order.amount < BUSINESS_RULES.minOrderAmount) {
      reasons.push(`Order amount ($${order.amount}) below minimum ($${BUSINESS_RULES.minOrderAmount})`);
      criticalReasons.push('amount_limit');
      factors.push({ weight: 3, score: 100 });
    }

    // Check for suspicious amounts
    if (PAYMENT_PATTERNS.suspiciousAmounts.includes(order.amount)) {
      reasons.push(`Suspicious order amount: $${order.amount}`);
      factors.push({ weight: 1, score: 40 });
    }

    // Check for restricted categories
    for (const item of order.items) {
      if (BUSINESS_RULES.restrictedCategories.includes(item.category.toLowerCase())) {
        reasons.push(`Restricted category: ${item.category}`);
        factors.push({ weight: 2, score: 70 });
      }
    }

    // Check address for blacklisted patterns
    const addressString = `${order.shippingAddress.street} ${order.shippingAddress.city} ${order.shippingAddress.postalCode}`;
    for (const pattern of BUSINESS_RULES.blacklistPatterns) {
      if (pattern.test(addressString)) {
        reasons.push('Address contains blacklisted pattern');
        factors.push({ weight: 3, score: 90 });
        break;
      }
    }

    return { reasons, criticalReasons, factors };
  }

  private detectPaymentFraudPatterns(payment: Payment): {
    reasons: string[];
    criticalReasons: string[];
    factors: { weight: number; score: number }[];
  } {
    const reasons: string[] = [];
    const criticalReasons: string[] = [];
    const factors: { weight: number; score: number }[] = [];

    const method = payment.method;

    // Check for high-risk card BIN prefixes
    if (method.type === 'card' && method.cardBrand) {
      const binPrefix = method.cardLast4 ? `****${method.cardLast4}` : '';

      if (
        PAYMENT_PATTERNS.highRiskBinPrefixes.some((prefix) =>
          binPrefix.startsWith(prefix)
        )
      ) {
        reasons.push('High-risk card BIN prefix detected');
        factors.push({ weight: 2, score: 75 });
      }
    }

    // Check for high-risk country
    if (method.issuerCountry) {
      if (PAYMENT_PATTERNS.highRiskCountries.includes(method.issuerCountry)) {
        reasons.push('Card issued in high-risk country');
        criticalReasons.push('high_risk_country');
        factors.push({ weight: 2, score: 80 });
      }
    }

    // Check for prepaid cards
    if (method.isPrepaid) {
      reasons.push('Prepaid card used');
      factors.push({ weight: 1, score: 30 });
    }

    // Check for virtual cards
    if (method.isVirtualCard) {
      reasons.push('Virtual card used');
      factors.push({ weight: 1, score: 40 });
    }

    // Check amount limits
    if (payment.amount > PAYMENT_PATTERNS.maxAmountSingleTransaction) {
      reasons.push(
        `Payment amount ($${payment.amount}) exceeds limit ($${PAYMENT_PATTERNS.maxAmountSingleTransaction})`
      );
      criticalReasons.push('amount_limit');
      factors.push({ weight: 3, score: 100 });
    }

    // Check for suspicious amounts
    if (PAYMENT_PATTERNS.suspiciousAmounts.includes(payment.amount)) {
      reasons.push(`Suspicious payment amount: $${payment.amount}`);
      factors.push({ weight: 1, score: 45 });
    }

    return { reasons, criticalReasons, factors };
  }

  private detectPaymentVelocityAttack(payment: Payment): {
    reasons: string[];
    criticalReasons: string[];
    factors: { weight: number; score: number }[];
  } {
    const reasons: string[] = [];
    const criticalReasons: string[] = [];
    const factors: { weight: number; score: number }[] = [];

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check payment attempts per hour
    const customerActivities = this.state.customerVelocity.get(payment.customerId) || [];
    const recentPayments = customerActivities.filter(
      (a) => a.timestamp > oneHourAgo && a.entityType === 'payment'
    );

    if (recentPayments.length >= VELOCITY_LIMITS.paymentAttemptsPerHour.critical) {
      reasons.push(
        `Payment velocity attack: ${recentPayments.length + 1} payment attempts in the last hour`
      );
      criticalReasons.push('payment_velocity');
      factors.push({ weight: 3, score: 100 });
    } else if (recentPayments.length >= VELOCITY_LIMITS.paymentAttemptsPerHour.warning) {
      reasons.push(
        `High payment velocity: ${recentPayments.length + 1} payment attempts in the last hour`
      );
      factors.push({ weight: 2, score: 60 });
    }

    // Check for different cards used
    if (payment.method.cardLast4) {
      const uniqueCards = new Set(
        recentPayments
          .filter((a) => a.data?.cardLast4)
          .map((a) => a.data.cardLast4 as string)
      );
      uniqueCards.add(payment.method.cardLast4);

      if (uniqueCards.size >= VELOCITY_LIMITS.differentCardsPerHour.critical) {
        reasons.push(
          `Multiple cards attempted: ${uniqueCards.size} different cards in the last hour`
        );
        criticalReasons.push('multiple_cards');
        factors.push({ weight: 3, score: 95 });
      }
    }

    return { reasons, criticalReasons, factors };
  }

  private detectPaymentGeographicAnomalies(payment: Payment): {
    reasons: string[];
    criticalReasons: string[];
    factors: { weight: number; score: number }[];
  } {
    const reasons: string[] = [];
    const criticalReasons: string[] = [];
    const factors: { weight: number; score: number }[] = [];

    const customerActivities = this.state.customerVelocity.get(payment.customerId) || [];
    const recentPayments = customerActivities
      .filter((a) => a.entityType === 'payment')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Check for IP country mismatch with billing country
    if (
      payment.billingAddress.country &&
      this.isIpFromDifferentCountry(payment.ipAddress, payment.billingAddress.country)
    ) {
      reasons.push('IP location mismatch with billing country');
      factors.push({ weight: 2, score: 55 });
    }

    // Check for impossible travel between payments
    if (recentPayments.length > 0 && payment.billingAddress.latitude && payment.billingAddress.longitude) {
      const lastPayment = recentPayments[0];
      // @ts-expect-error - data contains billing address
      const lastLat = lastPayment.data?.billingLat;
      // @ts-expect-error - data contains billing address
      const lastLon = lastPayment.data?.billingLon;

      if (lastLat && lastLon) {
        const distance = calculateDistance(
          lastLat,
          lastLon,
          payment.billingAddress.latitude,
          payment.billingAddress.longitude
        );

        const hoursSinceLastPayment =
          (Date.now() - lastPayment.timestamp.getTime()) / (1000 * 60 * 60);

        if (distance > GEO_LIMITS.distanceFromLastOrder && hoursSinceLastPayment < 1) {
          reasons.push(
            `Impossible travel: ${Math.round(distance)}km between payments in ${Math.round(hoursSinceLastPayment * 60)} minutes`
          );
          criticalReasons.push('impossible_travel');
          factors.push({ weight: 3, score: 95 });
        }
      }
    }

    return { reasons, criticalReasons, factors };
  }

  private detectPaymentDeviceAnomalies(payment: Payment): {
    reasons: string[];
    criticalReasons: string[];
    factors: { weight: number; score: number }[];
  } {
    const reasons: string[] = [];
    const criticalReasons: string[] = [];
    const factors: { weight: number; score: number }[] = [];

    const deviceId = payment.deviceFingerprint.fingerprintId;

    // Check for suspicious user agents
    const userAgentLower = payment.deviceFingerprint.userAgent.toLowerCase();
    for (const pattern of DEVICE_PATTERNS.suspiciousUserAgents) {
      if (userAgentLower.includes(pattern)) {
        reasons.push(`Suspicious user agent: ${payment.deviceFingerprint.userAgent}`);
        criticalReasons.push('suspicious_user_agent');
        factors.push({ weight: 3, score: 100 });
        break;
      }
    }

    // Check for new device with high-value payment
    const deviceActivities = this.state.deviceVelocity.get(deviceId) || [];
    const isNewDevice = deviceActivities.length === 0;

    if (isNewDevice && payment.amount > DEVICE_PATTERNS.newDevicePurchaseThreshold) {
      reasons.push(
        `High-value payment ($${payment.amount}) on new device`
      );
      factors.push({ weight: 2, score: 65 });
    }

    return { reasons, criticalReasons, factors };
  }

  // ==================== Helper Methods ====================

  private recordActivity(activity: ActivityRecord): void {
    this.state.activities.push(activity);
    this.cleanupOldActivities();
  }

  private updateCustomerVelocity(customerId: string, order: Order): void {
    const activities = this.state.customerVelocity.get(customerId) || [];
    activities.push({
      timestamp: order.createdAt,
      entityId: order.orderId,
      entityType: 'order',
      data: {
        amount: order.amount,
        ip: order.ipAddress,
        latitude: order.shippingAddress.latitude,
        longitude: order.shippingAddress.longitude,
      },
    });
    this.state.customerVelocity.set(customerId, activities);
  }

  private updateIpVelocity(ipAddress: string, order: Order): void {
    const activities = this.state.ipVelocity.get(ipAddress) || [];
    activities.push({
      timestamp: order.createdAt,
      entityId: order.orderId,
      entityType: 'order',
      data: { customerId: order.customerId, amount: order.amount },
    });
    this.state.ipVelocity.set(ipAddress, activities);
  }

  private updateDeviceVelocity(deviceId: string, order: Order): void {
    const activities = this.state.deviceVelocity.get(deviceId) || [];
    activities.push({
      timestamp: order.createdAt,
      entityId: order.orderId,
      entityType: 'order',
      data: { customerId: order.customerId, amount: order.amount },
    });
    this.state.deviceVelocity.set(deviceId, activities);
  }

  private getRecentDevicesForCustomer(customerId: string): Set<string> {
    const customerActivities = this.state.customerVelocity.get(customerId) || [];
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentActivities = customerActivities.filter(
      (a) => a.timestamp > oneDayAgo
    );

    const deviceIds = new Set<string>();
    // @ts-expect-error - device info stored in data
    recentActivities.forEach((a) => {
      if (a.data?.deviceId) {
        deviceIds.add(a.data.deviceId as string);
      }
    });

    return deviceIds;
  }

  private isIpFromDifferentCountry(ipAddress: string, billingCountry: string): boolean {
    // In production, this would use a GeoIP service
    // For now, we'll use a simple heuristic
    const localhostIndicators = ['127.0.0.1', '::1', 'localhost'];
    if (localhostIndicators.includes(ipAddress) || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      return false;
    }
    // Placeholder - real implementation would check against GeoIP database
    return false;
  }

  private cleanupOldActivities(): void {
    const cutoff = new Date(Date.now() - this.RETENTION_WINDOW_MS);

    // Clean up main activities
    this.state.activities = this.state.activities.filter(
      (a) => a.timestamp > cutoff
    );

    // Clean up customer velocity maps
    for (const [customerId, activities] of this.state.customerVelocity.entries()) {
      const filtered = activities.filter((a) => a.timestamp > cutoff);
      if (filtered.length === 0) {
        this.state.customerVelocity.delete(customerId);
      } else {
        this.state.customerVelocity.set(customerId, filtered);
      }
    }

    // Clean up IP velocity maps
    for (const [ip, activities] of this.state.ipVelocity.entries()) {
      const filtered = activities.filter((a) => a.timestamp > cutoff);
      if (filtered.length === 0) {
        this.state.ipVelocity.delete(ip);
      } else {
        this.state.ipVelocity.set(ip, filtered);
      }
    }

    // Clean up device velocity maps
    for (const [deviceId, activities] of this.state.deviceVelocity.entries()) {
      const filtered = activities.filter((a) => a.timestamp > cutoff);
      if (filtered.length === 0) {
        this.state.deviceVelocity.delete(deviceId);
      } else {
        this.state.deviceVelocity.set(deviceId, filtered);
      }
    }
  }

  private async createFraudCase(fraudCase: FraudCase): Promise<void> {
    await this.reportFraud(fraudCase);
  }

  private updateStats(
    type: 'order' | 'payment' | 'customer',
    risk: FraudCheck['risk'],
    action: FraudCheck['action']
  ): void {
    this.state.stats.totalChecks++;
    this.state.stats.lastUpdated = new Date();

    if (type === 'order') {
      this.state.stats.totalOrdersChecked++;
    } else if (type === 'payment') {
      this.state.stats.totalPaymentsChecked++;
    } else if (type === 'customer') {
      this.state.stats.totalCustomersChecked++;
    }

    this.state.stats.riskDistribution[risk]++;
    this.state.stats.actionDistribution[action]++;

    // Update average risk score
    const totalRiskPoints = this.state.stats.riskDistribution;
    const totalCount =
      totalRiskPoints.low +
      totalRiskPoints.medium +
      totalRiskPoints.high +
      totalRiskPoints.critical;

    const riskPointMap = { low: 20, medium: 50, high: 75, critical: 95 };
    const avgScore =
      totalRiskPoints.low * riskPointMap.low +
      totalRiskPoints.medium * riskPointMap.medium +
      totalRiskPoints.high * riskPointMap.high +
      totalRiskPoints.critical * riskPointMap.critical;

    this.state.stats.averageRiskScore = totalCount > 0 ? Math.round(avgScore / totalCount) : 0;
  }
}

// Export singleton instance for use across the service
export const fraudDetector = new FraudDetector();

// Default export
export default fraudDetector;


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-fraud-service',
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
