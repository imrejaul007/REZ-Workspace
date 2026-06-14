import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface AdminDashboard {
  users: {
    total: number;
    active: number;
    new: number;
    byRole: {
      admin: number;
      restaurant: number;
      employee: number;
      vendor: number;
    };
  };
  restaurants: {
    total: number;
    verified: number;
    pending: number;
    active: number;
  };
  vendors: {
    total: number;
    verified: number;
    pending: number;
    active: number;
  };
  jobs: {
    total: number;
    active: number;
    filled: number;
    applications: number;
  };
  orders: {
    total: number;
    today: number;
    revenue: number;
    averageValue: number;
  };
  community: {
    posts: number;
    comments: number;
    activeUsers: number;
    reportsPending: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  systemHealth: {
    status: 'healthy' | 'warning' | 'error';
    services: Array<{
      name: string;
      status: 'up' | 'down' | 'degraded';
      latency?: number;
    }>;
  };
}

export interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    defaultLanguage: string;
    defaultTimezone: string;
    defaultCurrency: string;
  };
  features: {
    enableRegistration: boolean;
    enableEmailVerification: boolean;
    enableTwoFactor: boolean;
    enableGeoLocation: boolean;
    enableNotifications: boolean;
    enableMarketplace: boolean;
    enableCommunity: boolean;
    enableJobBoard: boolean;
  };
  security: {
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  email: {
    provider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromAddress: string;
    fromName: string;
  };
  payment: {
    enableStripe: boolean;
    stripePublishableKey: string;
    stripeSecretKey: string;
    enablePayPal: boolean;
    paypalClientId: string;
    paypalSecretKey: string;
    currency: string;
    taxRate: number;
  };
  storage: {
    provider: 'local' | 's3' | 'cloudinary';
    maxFileSize: number;
    allowedFileTypes: string[];
    s3Config?: {
      bucket: string;
      region: string;
      accessKey: string;
      secretKey: string;
    };
  };
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AnalyticsData {
  userGrowth: Array<{
    date: string;
    users: number;
    restaurants: number;
    vendors: number;
    employees: number;
  }>;
  revenueData: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topRestaurants: Array<{
    id: string;
    name: string;
    orders: number;
    revenue: number;
    rating: number;
  }>;
  topVendors: Array<{
    id: string;
    name: string;
    orders: number;
    revenue: number;
    rating: number;
  }>;
  popularCategories: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
  geoData: Array<{
    city: string;
    state: string;
    users: number;
    orders: number;
  }>;
}

class AdminApi {
  // Dashboard
  async getDashboard(): Promise<ApiResponse<AdminDashboard>> {
    return apiClient.get<AdminDashboard>('/admin/dashboard');
  }

  async getAnalytics(
    period: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<ApiResponse<AnalyticsData>> {
    return apiClient.get<AnalyticsData>('/admin/analytics', { params: { period } });
  }

  // User Management
  async getUsers(
    filters?: {
      role?: string[];
      status?: string[];
      search?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<unknown>> {
    const params = { ...filters, page, limit };
    return apiClient.getPaginated<unknown>('/admin/users', params);
  }

  async getUser(id: string): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>(`/admin/users/${id}`);
  }

  async createAdminUser(data: {
    email: string;
    password: string;
    role: string;
    permissions: string[];
  }): Promise<ApiResponse<AdminUser>> {
    return apiClient.post<AdminUser>('/admin/users', data);
  }

  async updateUser(id: string, data: {
    role?: string;
    permissions?: string[];
    isActive?: boolean;
  }): Promise<ApiResponse<unknown>> {
    return apiClient.patch<unknown>(`/admin/users/${id}`, data);
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/admin/users/${id}`);
  }

  async banUser(id: string, reason: string, duration?: number): Promise<ApiResponse<void>> {
    return apiClient.post(`/admin/users/${id}/ban`, { reason, duration });
  }

  async unbanUser(id: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/admin/users/${id}/unban`);
  }

  // Restaurant Management
  async getRestaurants(
    filters?: {
      status?: string[];
      isVerified?: boolean;
      city?: string;
      search?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<unknown>> {
    const params = { ...filters, page, limit };
    return apiClient.getPaginated<unknown>('/admin/restaurants', params);
  }

  async verifyRestaurant(id: string, verified: boolean): Promise<ApiResponse<void>> {
    return apiClient.patch(`/admin/restaurants/${id}/verify`, { verified });
  }

  async suspendRestaurant(id: string, reason: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/admin/restaurants/${id}/suspend`, { reason });
  }

  async unsuspendRestaurant(id: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/admin/restaurants/${id}/unsuspend`);
  }

  // Vendor Management
  async getVendors(
    filters?: {
      status?: string[];
      isVerified?: boolean;
      category?: string[];
      search?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<unknown>> {
    const params = { ...filters, page, limit };
    return apiClient.getPaginated<unknown>('/admin/vendors', params);
  }

  async verifyVendor(id: string, verified: boolean): Promise<ApiResponse<void>> {
    return apiClient.patch(`/admin/vendors/${id}/verify`, { verified });
  }

  async suspendVendor(id: string, reason: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/admin/vendors/${id}/suspend`, { reason });
  }

  async unsuspendVendor(id: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/admin/vendors/${id}/unsuspend`);
  }

  // Content Moderation
  async getReports(
    type?: 'post' | 'comment' | 'user' | 'restaurant' | 'vendor' | 'job',
    status?: 'pending' | 'resolved' | 'dismissed',
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<unknown>> {
    const params = { type, status, page, limit };
    return apiClient.getPaginated<unknown>('/admin/reports', params);
  }

  async resolveReport(
    id: string,
    action: 'dismiss' | 'warn' | 'suspend' | 'ban' | 'remove',
    notes?: string
  ): Promise<ApiResponse<void>> {
    return apiClient.patch(`/admin/reports/${id}/resolve`, { action, notes });
  }

  // System Settings
  async getSettings(): Promise<ApiResponse<SystemSettings>> {
    return apiClient.get<SystemSettings>('/admin/settings');
  }

  async updateSettings(settings: Partial<SystemSettings>): Promise<ApiResponse<SystemSettings>> {
    return apiClient.put<SystemSettings>('/admin/settings', settings);
  }

  // System Monitoring
  async getSystemHealth(): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>('/admin/health');
  }

  async getSystemLogs(
    level?: 'error' | 'warn' | 'info' | 'debug',
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResponse<unknown>> {
    const params = { level, page, limit };
    return apiClient.getPaginated<unknown>('/admin/logs', params);
  }

  async getSystemStats(): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>('/admin/stats');
  }

  // Bulk Operations
  async bulkUserAction(
    userIds: string[],
    action: 'activate' | 'deactivate' | 'delete' | 'verify'
  ): Promise<ApiResponse<{ success: number; failed: number }>> {
    return apiClient.post<{ success: number; failed: number }>('/admin/users/bulk', {
      userIds,
      action,
    });
  }

  async bulkRestaurantAction(
    restaurantIds: string[],
    action: 'verify' | 'suspend' | 'activate' | 'deactivate'
  ): Promise<ApiResponse<{ success: number; failed: number }>> {
    return apiClient.post<{ success: number; failed: number }>('/admin/restaurants/bulk', {
      restaurantIds,
      action,
    });
  }

  // Data Export
  async exportUsers(format: 'csv' | 'json' | 'xlsx'): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.get<{ downloadUrl: string }>('/admin/export/users', {
      params: { format },
    });
  }

  async exportRestaurants(format: 'csv' | 'json' | 'xlsx'): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.get<{ downloadUrl: string }>('/admin/export/restaurants', {
      params: { format },
    });
  }

  async exportOrders(
    dateFrom?: string,
    dateTo?: string,
    format: 'csv' | 'json' | 'xlsx' = 'csv'
  ): Promise<ApiResponse<{ downloadUrl: string }>> {
    const params = { dateFrom, dateTo, format };
    return apiClient.get<{ downloadUrl: string }>('/admin/export/orders', { params });
  }

  // Email Management
  async sendBulkEmail(data: {
    recipients: string[] | 'all' | 'restaurants' | 'vendors' | 'employees';
    subject: string;
    content: string;
    template?: string;
  }): Promise<ApiResponse<{ sent: number; failed: number }>> {
    return apiClient.post<{ sent: number; failed: number }>('/admin/email/bulk', data);
  }

  async getEmailTemplates(): Promise<ApiResponse<unknown[]>> {
    return apiClient.get<unknown[]>('/admin/email/templates');
  }

  async createEmailTemplate(data: {
    name: string;
    subject: string;
    content: string;
    variables: string[];
  }): Promise<ApiResponse<unknown>> {
    return apiClient.post<unknown>('/admin/email/templates', data);
  }

  async updateEmailTemplate(id: string, data: {
    name?: string;
    subject?: string;
    content?: string;
    variables?: string[];
  }): Promise<ApiResponse<unknown>> {
    return apiClient.put<unknown>(`/admin/email/templates/${id}`, data);
  }

  // Announcements
  async createAnnouncement(data: {
    title: string;
    content: string;
    type: 'info' | 'warning' | 'success' | 'error';
    targetAudience: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<unknown>> {
    return apiClient.post<unknown>('/admin/announcements', data);
  }

  async getAnnouncements(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<unknown>> {
    return apiClient.getPaginated<unknown>('/admin/announcements', { page, limit });
  }

  async deleteAnnouncement(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/admin/announcements/${id}`);
  }

  // Feature Flags
  async getFeatureFlags(): Promise<ApiResponse<Record<string, boolean>>> {
    return apiClient.get<Record<string, boolean>>('/admin/feature-flags');
  }

  async updateFeatureFlag(flag: string, enabled: boolean): Promise<ApiResponse<void>> {
    return apiClient.patch(`/admin/feature-flags/${flag}`, { enabled });
  }

  // Backup & Maintenance
  async createBackup(): Promise<ApiResponse<{ backupId: string; status: string }>> {
    return apiClient.post<{ backupId: string; status: string }>('/admin/backup');
  }

  async getBackups(): Promise<ApiResponse<unknown[]>> {
    return apiClient.get<unknown[]>('/admin/backups');
  }

  async restoreBackup(backupId: string): Promise<ApiResponse<{ status: string }>> {
    return apiClient.post<{ status: string }>(`/admin/backups/${backupId}/restore`);
  }

  async runMaintenance(tasks: string[]): Promise<ApiResponse<{ results: unknown[] }>> {
    return apiClient.post<{ results: unknown[] }>('/admin/maintenance', { tasks });
  }
}

export const adminApi = new AdminApi();