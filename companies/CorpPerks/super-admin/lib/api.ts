import {
  Tenant,
  PlatformUser,
  Module,
  TenantModule,
  BillingRecord,
  ApiKey,
  PlatformAnalytics,
  UsageTrend,
  DashboardStats,
  TenantStats,
  UserStats,
  BillingStats,
  PaginatedResponse,
  CreateTenantInput,
  CreateApiKeyInput,
} from '@/types';
import {
  mockTenants,
  mockUsers,
  mockModules,
  mockTenantModules,
  mockBillingRecords,
  mockApiKeys,
  mockAnalytics,
  mockUsageTrends,
  mockTenantStats,
  mockUserStats,
  mockBillingStats,
  mockDashboardStats,
} from './mock-data';
import { generateId, generateApiKey } from './utils';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============ TENANTS API ============

export async function getTenants(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  plan?: string;
}): Promise<PaginatedResponse<Tenant>> {
  await delay(300);

  let filtered = [...mockTenants];

  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      t =>
        t.name.toLowerCase().includes(search) ||
        t.slug.toLowerCase().includes(search) ||
        t.adminEmail.toLowerCase().includes(search)
    );
  }

  if (params?.status) {
    filtered = filtered.filter(t => t.status === params.status);
  }

  if (params?.plan) {
    filtered = filtered.filter(t => t.plan === params.plan);
  }

  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: filtered.slice(start, end),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
  };
}

export async function getTenant(id: string): Promise<Tenant | null> {
  await delay(200);
  return mockTenants.find(t => t.id === id) || null;
}

export async function getTenantStats(): Promise<TenantStats> {
  await delay(200);
  return mockTenantStats;
}

export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  await delay(500);

  const newTenant: Tenant = {
    id: generateId(),
    ...input,
    status: 'pending',
    modules: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userCount: 0,
    adminEmail: input.adminEmail,
    adminName: input.adminName,
    billingEmail: input.adminEmail,
    maxUsers: input.plan === 'starter' ? 50 : input.plan === 'professional' ? 200 : 1000,
    apiCalls: 0,
    storageUsed: 0,
    monthlyRevenue: 0,
  };

  mockTenants.push(newTenant);
  return newTenant;
}

export async function updateTenant(
  id: string,
  updates: Partial<Tenant>
): Promise<Tenant | null> {
  await delay(300);

  const index = mockTenants.findIndex(t => t.id === id);
  if (index === -1) return null;

  mockTenants[index] = {
    ...mockTenants[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return mockTenants[index];
}

export async function deleteTenant(id: string): Promise<boolean> {
  await delay(300);
  const index = mockTenants.findIndex(t => t.id === id);
  if (index === -1) return false;
  mockTenants.splice(index, 1);
  return true;
}

export async function suspendTenant(id: string): Promise<Tenant | null> {
  return updateTenant(id, { status: 'suspended' });
}

export async function activateTenant(id: string): Promise<Tenant | null> {
  return updateTenant(id, { status: 'active' });
}

// ============ USERS API ============

export async function getUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  tenantId?: string;
}): Promise<PaginatedResponse<PlatformUser>> {
  await delay(300);

  let filtered = [...mockUsers];

  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      u =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
    );
  }

  if (params?.role) {
    filtered = filtered.filter(u => u.role === params.role);
  }

  if (params?.status) {
    filtered = filtered.filter(u => u.status === params.status);
  }

  if (params?.tenantId) {
    filtered = filtered.filter(u => u.tenantId === params.tenantId);
  }

  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: filtered.slice(start, end),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
  };
}

export async function getUserStats(): Promise<UserStats> {
  await delay(200);
  return mockUserStats;
}

export async function getUser(id: string): Promise<PlatformUser | null> {
  await delay(200);
  return mockUsers.find(u => u.id === id) || null;
}

export async function createUser(input: {
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  tenantId?: string;
  tenantName?: string;
  permissions: string[];
}): Promise<PlatformUser> {
  await delay(500);

  const newUser: PlatformUser = {
    id: generateId(),
    ...input,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  mockUsers.push(newUser);
  return newUser;
}

export async function updateUser(
  id: string,
  updates: Partial<PlatformUser>
): Promise<PlatformUser | null> {
  await delay(300);

  const index = mockUsers.findIndex(u => u.id === id);
  if (index === -1) return null;

  mockUsers[index] = {
    ...mockUsers[index],
    ...updates,
  };

  return mockUsers[index];
}

export async function deleteUser(id: string): Promise<boolean> {
  await delay(300);
  const index = mockUsers.findIndex(u => u.id === id);
  if (index === -1) return false;
  mockUsers.splice(index, 1);
  return true;
}

// ============ MODULES API ============

export async function getModules(params?: {
  category?: string;
  status?: string;
  tier?: string;
}): Promise<Module[]> {
  await delay(200);

  let filtered = [...mockModules];

  if (params?.category) {
    filtered = filtered.filter(m => m.category === params.category);
  }

  if (params?.status) {
    filtered = filtered.filter(m => m.status === params.status);
  }

  if (params?.tier) {
    filtered = filtered.filter(m => m.tier === params.tier);
  }

  return filtered;
}

export async function getModule(id: string): Promise<Module | null> {
  await delay(200);
  return mockModules.find(m => m.id === id) || null;
}

export async function getTenantModules(tenantId?: string): Promise<TenantModule[]> {
  await delay(200);

  if (tenantId) {
    return mockTenantModules.filter(tm => tm.tenantId === tenantId);
  }

  return mockTenantModules;
}

export async function assignModule(
  tenantId: string,
  moduleId: string
): Promise<TenantModule | null> {
  await delay(300);

  const tenant = mockTenants.find(t => t.id === tenantId);
  const module = mockModules.find(m => m.id === moduleId);

  if (!tenant || !module) return null;

  const existing = mockTenantModules.find(
    tm => tm.tenantId === tenantId && tm.moduleId === moduleId
  );

  if (existing) return existing;

  const newAssignment: TenantModule = {
    tenantId,
    tenantName: tenant.name,
    moduleId,
    moduleName: module.name,
    status: 'active',
    assignedAt: new Date().toISOString(),
    usage: 0,
    limit: tenant.maxUsers,
  };

  mockTenantModules.push(newAssignment);

  // Update tenant modules array
  tenant.modules.push(moduleId);
  tenant.updatedAt = new Date().toISOString();

  return newAssignment;
}

export async function unassignModule(
  tenantId: string,
  moduleId: string
): Promise<boolean> {
  await delay(300);

  const index = mockTenantModules.findIndex(
    tm => tm.tenantId === tenantId && tm.moduleId === moduleId
  );

  if (index === -1) return false;

  mockTenantModules.splice(index, 1);

  // Update tenant modules array
  const tenant = mockTenants.find(t => t.id === tenantId);
  if (tenant) {
    tenant.modules = tenant.modules.filter(m => m !== moduleId);
    tenant.updatedAt = new Date().toISOString();
  }

  return true;
}

// ============ BILLING API ============

export async function getBillingRecords(params?: {
  page?: number;
  limit?: number;
  tenantId?: string;
  status?: string;
  type?: string;
}): Promise<PaginatedResponse<BillingRecord>> {
  await delay(300);

  let filtered = [...mockBillingRecords];

  if (params?.tenantId) {
    filtered = filtered.filter(b => b.tenantId === params.tenantId);
  }

  if (params?.status) {
    filtered = filtered.filter(b => b.status === params.status);
  }

  if (params?.type) {
    filtered = filtered.filter(b => b.type === params.type);
  }

  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: filtered.slice(start, end),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
  };
}

export async function getBillingStats(): Promise<BillingStats> {
  await delay(200);
  return mockBillingStats;
}

export async function createBillingRecord(input: {
  tenantId: string;
  amount: number;
  type: 'subscription' | 'addon' | 'overage' | 'one_time';
  description: string;
}): Promise<BillingRecord> {
  await delay(500);

  const tenant = mockTenants.find(t => t.id === input.tenantId);
  if (!tenant) throw new Error('Tenant not found');

  const newRecord: BillingRecord = {
    id: generateId(),
    tenantId: input.tenantId,
    tenantName: tenant.name,
    amount: input.amount,
    currency: 'USD',
    status: 'pending',
    type: input.type,
    description: input.description,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  mockBillingRecords.push(newRecord);
  return newRecord;
}

export async function updateBillingStatus(
  id: string,
  status: 'paid' | 'pending' | 'overdue' | 'refunded'
): Promise<BillingRecord | null> {
  await delay(300);

  const index = mockBillingRecords.findIndex(b => b.id === id);
  if (index === -1) return null;

  mockBillingRecords[index] = {
    ...mockBillingRecords[index],
    status,
    ...(status === 'paid' ? { paidAt: new Date().toISOString() } : {}),
  };

  return mockBillingRecords[index];
}

// ============ API KEYS API ============

export async function getApiKeys(params?: {
  page?: number;
  limit?: number;
  tenantId?: string;
  status?: string;
}): Promise<PaginatedResponse<ApiKey>> {
  await delay(300);

  let filtered = [...mockApiKeys];

  if (params?.tenantId) {
    filtered = filtered.filter(k => k.tenantId === params.tenantId);
  }

  if (params?.status) {
    filtered = filtered.filter(k => k.status === params.status);
  }

  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: filtered.slice(start, end),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
  };
}

export async function createApiKey(input: CreateApiKeyInput): Promise<ApiKey> {
  await delay(500);

  const tenant = input.tenantId
    ? mockTenants.find(t => t.id === input.tenantId)
    : null;

  const newKey: ApiKey = {
    id: generateId(),
    name: input.name,
    key: generateApiKey(),
    tenantId: input.tenantId,
    tenantName: tenant?.name,
    permissions: input.permissions,
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresIn
      ? new Date(Date.now() + input.expiresIn * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
    usageCount: 0,
  };

  mockApiKeys.push(newKey);
  return newKey;
}

export async function revokeApiKey(id: string): Promise<boolean> {
  await delay(300);

  const index = mockApiKeys.findIndex(k => k.id === id);
  if (index === -1) return false;

  mockApiKeys[index].status = 'inactive';
  return true;
}

export async function regenerateApiKey(id: string): Promise<ApiKey | null> {
  await delay(500);

  const index = mockApiKeys.findIndex(k => k.id === id);
  if (index === -1) return null;

  mockApiKeys[index].key = generateApiKey();
  mockApiKeys[index].usageCount = 0;
  mockApiKeys[index].lastUsed = undefined;

  return mockApiKeys[index];
}

// ============ ANALYTICS API ============

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  await delay(200);
  return mockAnalytics;
}

export async function getUsageTrends(): Promise<UsageTrend[]> {
  await delay(200);
  return mockUsageTrends;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(300);
  return mockDashboardStats;
}
