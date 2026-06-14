// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo?: string;
  industry: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  plan: 'starter' | 'professional' | 'enterprise';
  modules: string[];
  createdAt: string;
  updatedAt: string;
  userCount: number;
  adminEmail: string;
  adminName: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  billingEmail: string;
  maxUsers: number;
  apiCalls: number;
  storageUsed: number;
  monthlyRevenue: number;
}

export interface TenantStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  newThisMonth: number;
  churnedThisMonth: number;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  domain: string;
  industry: string;
  plan: 'starter' | 'professional' | 'enterprise';
  adminName: string;
  adminEmail: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

// User Types
export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'support';
  tenantId?: string;
  tenantName?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  createdAt: string;
  permissions: string[];
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  newThisWeek: number;
  byRole: {
    super_admin: number;
    admin: number;
    support: number;
  };
}

// Module Types
export interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: 'core' | 'hr' | 'finance' | 'analytics' | 'integrations';
  status: 'active' | 'inactive' | 'beta';
  price: number;
  icon: string;
  required: boolean;
  tier: 'starter' | 'professional' | 'enterprise';
}

export interface TenantModule {
  tenantId: string;
  tenantName: string;
  moduleId: string;
  moduleName: string;
  status: 'active' | 'inactive' | 'trial';
  assignedAt: string;
  expiresAt?: string;
  usage: number;
  limit: number;
}

// Billing Types
export interface BillingRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'refunded';
  type: 'subscription' | 'addon' | 'overage' | 'one_time';
  description: string;
  invoiceUrl?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export interface BillingStats {
  totalRevenue: number;
  mrr: number;
  arr: number;
  pendingPayments: number;
  overduePayments: number;
  averageRevenuePerTenant: number;
  revenueByPlan: {
    starter: number;
    professional: number;
    enterprise: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface CreateBillingInput {
  tenantId: string;
  amount: number;
  type: 'subscription' | 'addon' | 'overage' | 'one_time';
  description: string;
}

// API Key Types
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  tenantId?: string;
  tenantName?: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  usageCount: number;
}

export interface CreateApiKeyInput {
  name: string;
  tenantId?: string;
  permissions: string[];
  expiresIn?: number; // days
}

// Analytics Types
export interface PlatformAnalytics {
  totalUsers: number;
  totalTenants: number;
  totalRevenue: number;
  mrr: number;
  apiCalls: number;
  storageUsed: number;
  growthRate: number;
  churnRate: number;
  activeUsers: number;
  newTenantsThisMonth: number;
  newUsersThisMonth: number;
}

export interface UsageTrend {
  date: string;
  users: number;
  apiCalls: number;
  revenue: number;
}

// Dashboard Stats
export interface DashboardStats {
  tenants: TenantStats;
  users: UserStats;
  billing: BillingStats;
  analytics: PlatformAnalytics;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface TenantFormData {
  name: string;
  slug: string;
  domain: string;
  industry: string;
  plan: 'starter' | 'professional' | 'enterprise';
  adminName: string;
  adminEmail: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  billingEmail: string;
  maxUsers: number;
  modules: string[];
}

export interface UserFormData {
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  tenantId?: string;
  permissions: string[];
}
