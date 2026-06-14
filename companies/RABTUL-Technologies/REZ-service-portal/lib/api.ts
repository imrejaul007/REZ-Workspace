import axios, { AxiosInstance } from 'axios';
import type {
  Service,
  HealthCheck,
  HealthSummary,
  ServiceMetrics,
  ApiDoc,
  DashboardStats,
  Alert,
  ServiceCategory,
} from './types';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:4080';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || true;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: GATEWAY_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getServices(): Promise<Service[]> {
    if (USE_MOCK) return this.getMockServices();
    try {
      const response = await this.client.get('/api/services');
      return response.data;
    } catch {
      return this.getMockServices();
    }
  }

  async getService(id: string): Promise<Service | null> {
    if (USE_MOCK) {
      const services = this.getMockServices();
      return services.find((s) => s.id === id) || null;
    }
    try {
      const response = await this.client.get(`/api/services/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async getHealthChecks(): Promise<HealthCheck[]> {
    if (USE_MOCK) return this.getMockHealthChecks();
    try {
      const response = await this.client.get('/api/health');
      return response.data;
    } catch {
      return this.getMockHealthChecks();
    }
  }

  async getHealthSummary(): Promise<HealthSummary> {
    if (USE_MOCK) {
      const checks = this.getMockHealthChecks();
      return {
        total: checks.length,
        healthy: checks.filter((c) => c.status === 'healthy').length,
        degraded: checks.filter((c) => c.status === 'degraded').length,
        down: checks.filter((c) => c.status === 'down').length,
        lastUpdated: new Date().toISOString(),
      };
    }
    try {
      const response = await this.client.get('/api/health/summary');
      return response.data;
    } catch {
      return this.getMockHealthSummary();
    }
  }

  async getServiceMetrics(serviceId: string): Promise<ServiceMetrics> {
    if (USE_MOCK) return this.getMockMetrics(serviceId);
    try {
      const response = await this.client.get(`/api/metrics/${serviceId}`);
      return response.data;
    } catch {
      return this.getMockMetrics(serviceId);
    }
  }

  async getApiDocs(): Promise<ApiDoc[]> {
    if (USE_MOCK) return this.getMockApiDocs();
    try {
      const response = await this.client.get('/api/docs');
      return response.data;
    } catch {
      return this.getMockApiDocs();
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    if (USE_MOCK) return this.getMockDashboardStats();
    try {
      const response = await this.client.get('/api/dashboard/stats');
      return response.data;
    } catch {
      return this.getMockDashboardStats();
    }
  }

  async getAlerts(): Promise<Alert[]> {
    if (USE_MOCK) return this.getMockAlerts();
    try {
      const response = await this.client.get('/api/alerts');
      return response.data;
    } catch {
      return this.getMockAlerts();
    }
  }

  // Mock Data Generators
  private getMockServices(): Service[] {
    return [
      {
        id: 'rez-auth-service',
        name: 'ReZ Auth Service',
        description: 'Centralized authentication and authorization service',
        category: 'identity',
        status: 'healthy',
        port: 3000,
        url: 'http://localhost:3000',
        endpoints: [
          { path: '/api/auth/verify', method: 'POST', description: 'Verify JWT token', authenticated: false },
          { path: '/api/auth/login', method: 'POST', description: 'User login', authenticated: false },
          { path: '/api/auth/refresh', method: 'POST', description: 'Refresh token', authenticated: true },
        ],
        lastChecked: new Date().toISOString(),
        uptime: 99.98,
        avgResponseTime: 45,
        requestsPerMinute: 1250,
        errorRate: 0.02,
        owner: 'RABTUL Team',
        version: '2.1.0',
      },
      {
        id: 'rez-payment-service',
        name: 'ReZ Payment Service',
        description: 'Payment processing and transaction management',
        category: 'payments',
        status: 'healthy',
        port: 4001,
        url: 'http://localhost:4001',
        endpoints: [
          { path: '/api/payments/create', method: 'POST', description: 'Create payment', authenticated: true },
          { path: '/api/payments/verify', method: 'POST', description: 'Verify payment', authenticated: true },
          { path: '/api/payments/webhook', method: 'POST', description: 'Razorpay webhook', authenticated: false },
        ],
        lastChecked: new Date().toISOString(),
        uptime: 99.95,
        avgResponseTime: 120,
        requestsPerMinute: 850,
        errorRate: 0.05,
        owner: 'RABTUL Team',
        version: '1.8.5',
      },
      {
        id: 'rez-order-service',
        name: 'ReZ Order Service',
        description: 'Order management and fulfillment',
        category: 'commerce',
        status: 'degraded',
        port: 4003,
        url: 'http://localhost:4003',
        endpoints: [
          { path: '/api/orders', method: 'GET', description: 'List orders', authenticated: true },
          { path: '/api/orders/:id', method: 'GET', description: 'Get order', authenticated: true },
          { path: '/api/orders/create', method: 'POST', description: 'Create order', authenticated: true },
        ],
        lastChecked: new Date().toISOString(),
        uptime: 98.5,
        avgResponseTime: 250,
        requestsPerMinute: 620,
        errorRate: 1.5,
        owner: 'RABTUL Team',
        version: '3.2.1',
      },
      {
        id: 'rez-intent-graph',
        name: 'ReZ Intent Graph',
        description: 'AI-powered intent tracking and ML scoring',
        category: 'intelligence',
        status: 'healthy',
        port: 3001,
        url: 'http://localhost:3001',
        endpoints: [
          { path: '/api/intent/track', method: 'POST', description: 'Track user intent', authenticated: true },
          { path: '/api/intent/score', method: 'GET', description: 'Get intent scores', authenticated: true },
        ],
        lastChecked: new Date().toISOString(),
        uptime: 99.9,
        avgResponseTime: 85,
        requestsPerMinute: 420,
        errorRate: 0.1,
        owner: 'REZ-Intelligence',
        version: '1.5.0',
      },
      {
        id: 'rez-dooh-service',
        name: 'ReZ DOOH Service',
        description: 'Digital Out-of-Home advertising network',
        category: 'media',
        status: 'healthy',
        port: 4018,
        url: 'http://localhost:4018',
        endpoints: [
          { path: '/api/screens', method: 'GET', description: 'List screens', authenticated: true },
          { path: '/api/screens/:id/heartbeat', method: 'POST', description: 'Screen heartbeat', authenticated: false },
          { path: '/api/campaigns', method: 'GET', description: 'List campaigns', authenticated: true },
        ],
        lastChecked: new Date().toISOString(),
        uptime: 99.7,
        avgResponseTime: 65,
        requestsPerMinute: 380,
        errorRate: 0.3,
        owner: 'REZ-Media',
        version: '2.0.3',
      },
      {
        id: 'rez-support-dashboard',
        name: 'ReZ Support Dashboard',
        description: 'Unified support ticket management',
        category: 'support',
        status: 'healthy',
        port: 4052,
        url: 'http://localhost:4052',
        endpoints: [
          { path: '/api/tickets', method: 'GET', description: 'List tickets', authenticated: true },
          { path: '/api/tickets/:id', method: 'GET', description: 'Get ticket', authenticated: true },
          { path: '/api/tickets/create', method: 'POST', description: 'Create ticket', authenticated: true },
        ],
        lastChecked: new Date().toISOString(),
        uptime: 99.5,
        avgResponseTime: 95,
        requestsPerMinute: 210,
        errorRate: 0.5,
        owner: 'RTNM-Group',
        version: '1.2.0',
      },
      {
        id: 'rez-inventory-service',
        name: 'ReZ Inventory Service',
        description: 'Inventory and stock management',
        category: 'infrastructure',
        status: 'down',
        port: 4010,
        url: 'http://localhost:4010',
        endpoints: [
          { path: '/api/inventory', method: 'GET', description: 'Get inventory', authenticated: true },
          { path: '/api/inventory/update', method: 'PUT', description: 'Update stock', authenticated: true },
        ],
        lastChecked: new Date().toISOString(),
        uptime: 0,
        avgResponseTime: 0,
        requestsPerMinute: 0,
        errorRate: 100,
        owner: 'RABTUL Team',
        version: '1.4.2',
      },
      {
        id: 'rez-shopify-connector',
        name: 'ReZ Shopify Connector',
        description: 'Shopify OAuth and sync integration',
        category: 'commerce',
        status: 'healthy',
        port: 4050,
        url: 'http://localhost:4050',
        endpoints: [
          { path: '/api/shopify/auth', method: 'GET', description: 'OAuth redirect', authenticated: false },
          { path: '/api/shopify/callback', method: 'GET', description: 'OAuth callback', authenticated: false },
          { path: '/api/shopify/products/sync', method: 'POST', description: 'Sync products', authenticated: true },
        ],
        lastChecked: new Date().toISOString(),
        uptime: 99.8,
        avgResponseTime: 150,
        requestsPerMinute: 95,
        errorRate: 0.2,
        owner: 'REZ-Media',
        version: '1.0.5',
      },
      {
        id: 'rez-analytics-service',
        name: 'ReZ Analytics Service',
        description: 'Real-time analytics and reporting',
        category: 'analytics',
        status: 'healthy',
        port: 4006,
        url: 'http://localhost:4006',
        endpoints: [
          { path: '/api/analytics/events', method: 'POST', description: 'Track events', authenticated: true },
          { path: '/api/analytics/reports', method: 'GET', description: 'Get reports', authenticated: true },
        ],
        lastChecked: new Date().toISOString(),
        uptime: 99.6,
        avgResponseTime: 180,
        requestsPerMinute: 520,
        errorRate: 0.4,
        owner: 'RABTUL Team',
        version: '2.3.1',
      },
      {
        id: 'rez-coupon-service',
        name: 'ReZ Coupon Service',
        description: 'Coupon and promotion management',
        category: 'marketing',
        status: 'degraded',
        port: 4009,
        url: 'http://localhost:4009',
        endpoints: [
          { path: '/api/coupons', method: 'GET', description: 'List coupons', authenticated: true },
          { path: '/api/coupons/validate', method: 'POST', description: 'Validate coupon', authenticated: true },
        ],
        lastChecked: new Date().toISOString(),
        uptime: 97.8,
        avgResponseTime: 320,
        requestsPerMinute: 180,
        errorRate: 2.2,
        owner: 'RABTUL Team',
        version: '1.6.0',
      },
    ];
  }

  private getMockHealthChecks(): HealthCheck[] {
    const services = this.getMockServices();
    return services.map((service) => ({
      serviceId: service.id,
      serviceName: service.name,
      status: service.status,
      latency: service.avgResponseTime,
      lastChecked: service.lastChecked,
      responseCode: service.status === 'down' ? 0 : 200,
      message: service.status === 'down' ? 'Connection refused' : undefined,
    }));
  }

  private getMockHealthSummary(): HealthSummary {
    const services = this.getMockServices();
    return {
      total: services.length,
      healthy: services.filter((s) => s.status === 'healthy').length,
      degraded: services.filter((s) => s.status === 'degraded').length,
      down: services.filter((s) => s.status === 'down').length,
      lastUpdated: new Date().toISOString(),
    };
  }

  private getMockMetrics(serviceId: string): ServiceMetrics {
    const now = Date.now();
    // STATISTICAL: mock metrics data generation for dashboard
    const generateDataPoints = (base: number, variance: number): { timestamp: string; value: number }[] => {
      return Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
        value: Math.max(0, base + (Math.random() - 0.5) * variance),
      }));
    };

    const metricsMap: Record<string, { requests: number; responseTime: number; errorRate: number }> = {
      'rez-auth-service': { requests: 1250, responseTime: 45, errorRate: 0.02 },
      'rez-payment-service': { requests: 850, responseTime: 120, errorRate: 0.05 },
      'rez-order-service': { requests: 620, responseTime: 250, errorRate: 1.5 },
      'rez-intent-graph': { requests: 420, responseTime: 85, errorRate: 0.1 },
      'rez-dooh-service': { requests: 380, responseTime: 65, errorRate: 0.3 },
      'rez-support-dashboard': { requests: 210, responseTime: 95, errorRate: 0.5 },
      'rez-inventory-service': { requests: 0, responseTime: 0, errorRate: 100 },
      'rez-shopify-connector': { requests: 95, responseTime: 150, errorRate: 0.2 },
      'rez-analytics-service': { requests: 520, responseTime: 180, errorRate: 0.4 },
      'rez-coupon-service': { requests: 180, responseTime: 320, errorRate: 2.2 },
    };

    const base = metricsMap[serviceId] || { requests: 100, responseTime: 100, errorRate: 0.5 };

    return {
      serviceId,
      serviceName: serviceId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      requests: generateDataPoints(base.requests, base.requests * 0.3),
      responseTime: generateDataPoints(base.responseTime, base.responseTime * 0.4),
      errorRate: generateDataPoints(base.errorRate, base.errorRate * 0.5),
      cpuUsage: generateDataPoints(35, 25),
      memoryUsage: generateDataPoints(62, 15),
    };
  }

  private getMockApiDocs(): ApiDoc[] {
    return [
      {
        id: 'auth-api',
        serviceId: 'rez-auth-service',
        title: 'Authentication API',
        description: 'Endpoints for user authentication and token management',
        baseUrl: 'http://localhost:3000',
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/verify',
            summary: 'Verify JWT token',
            description: 'Validates a JWT token and returns user claims',
            requestBody: {
              contentType: 'application/json',
              schema: { token: { type: 'string', required: true } },
              example: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            },
            responses: [
              { statusCode: 200, description: 'Token is valid', example: { valid: true, userId: '123' } },
              { statusCode: 401, description: 'Invalid token' },
            ],
          },
          {
            method: 'POST',
            path: '/api/auth/login',
            summary: 'User login',
            description: 'Authenticates user and returns JWT token',
            requestBody: {
              contentType: 'application/json',
              schema: { email: { type: 'string' }, password: { type: 'string' } },
              example: { email: 'user@example.com', password: 'password123' },
            },
            responses: [
              { statusCode: 200, description: 'Login successful', example: { token: 'eyJ...', refreshToken: 'ref...' } },
              { statusCode: 401, description: 'Invalid credentials' },
            ],
          },
        ],
      },
      {
        id: 'payment-api',
        serviceId: 'rez-payment-service',
        title: 'Payment API',
        description: 'Payment processing and transaction management endpoints',
        baseUrl: 'http://localhost:4001',
        endpoints: [
          {
            method: 'POST',
            path: '/api/payments/create',
            summary: 'Create payment',
            description: 'Initiates a new payment transaction',
            parameters: [
              { name: 'X-Internal-Token', in: 'header', required: true, type: 'string', description: 'Service authentication token' },
            ],
            requestBody: {
              contentType: 'application/json',
              schema: {
                amount: { type: 'number' },
                currency: { type: 'string' },
                orderId: { type: 'string' },
              },
              example: { amount: 1000, currency: 'INR', orderId: 'order_123' },
            },
            responses: [
              { statusCode: 200, description: 'Payment created', example: { paymentId: 'pay_xxx', status: 'created' } },
              { statusCode: 400, description: 'Invalid request' },
            ],
          },
        ],
      },
    ];
  }

  private getMockDashboardStats(): DashboardStats {
    return {
      totalServices: 10,
      healthyServices: 7,
      totalRequests: 4525,
      avgResponseTime: 138,
      alerts: this.getMockAlerts(),
    };
  }

  private getMockAlerts(): Alert[] {
    return [
      {
        id: 'alert-1',
        serviceId: 'rez-inventory-service',
        serviceName: 'ReZ Inventory Service',
        type: 'error',
        message: 'Service is down - connection refused',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        acknowledged: false,
      },
      {
        id: 'alert-2',
        serviceId: 'rez-order-service',
        serviceName: 'ReZ Order Service',
        type: 'warning',
        message: 'High latency detected - avg response time exceeded 200ms',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        acknowledged: false,
      },
      {
        id: 'alert-3',
        serviceId: 'rez-coupon-service',
        serviceName: 'ReZ Coupon Service',
        type: 'warning',
        message: 'Error rate above threshold - 2.2%',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        acknowledged: true,
      },
    ];
  }
}

export const apiClient = new ApiClient();
export { GATEWAY_URL };
