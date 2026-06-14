import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'RESTAURANT' | 'EMPLOYEE' | 'VENDOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  isActive: boolean;
  isVerified: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  profile?: UserProfile;
  restaurant?;
  vendor?;
  employee?: EmployeeProfile;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bio?: string;
  avatar?: string;
  preferences: {
    language: string;
    timezone: string;
    currency: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

export interface EmployeeProfile {
  id: string;
  experience: 'ENTRY_LEVEL' | 'MID_LEVEL' | 'SENIOR_LEVEL';
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startYear: number;
    endYear: number;
  }>;
  workExperience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
  }>;
  portfolio?: string;
  linkedIn?: string;
  resume?: string;
  expectedSalary?: number;
  availability: 'IMMEDIATE' | 'WITHIN_MONTH' | 'WITHIN_THREE_MONTHS' | 'NOT_AVAILABLE';
  preferredLocation?: string;
  willingToRelocate: boolean;
  tags: Array<{
    id: string;
    type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    content: string;
    addedBy: string;
    addedAt: string;
    status: 'ACTIVE' | 'DISPUTED' | 'RESOLVED';
  }>;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bio?: string;
  preferences?: {
    language?: string;
    timezone?: string;
    currency?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  };
}

export interface UpdateEmployeeProfileRequest {
  experience?: 'ENTRY_LEVEL' | 'MID_LEVEL' | 'SENIOR_LEVEL';
  skills?: string[];
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    startYear: number;
    endYear: number;
  }>;
  workExperience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
  }>;
  portfolio?: string;
  linkedIn?: string;
  expectedSalary?: number;
  availability?: 'IMMEDIATE' | 'WITHIN_MONTH' | 'WITHIN_THREE_MONTHS' | 'NOT_AVAILABLE';
  preferredLocation?: string;
  willingToRelocate?: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: {
    admin: number;
    restaurant: number;
    employee: number;
    vendor: number;
  };
  usersByStatus: {
    active: number;
    inactive: number;
    suspended: number;
    pendingVerification: number;
  };
  registrationTrend: Array<{
    date: string;
    count: number;
  }>;
  topCities: Array<{
    city: string;
    count: number;
  }>;
}

class UsersApi {
  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/users/profile');
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<User>> {
    return apiClient.put<User>('/users/profile', data);
  }

  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return apiClient.get<UserStats>('/users/stats');
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`/users/${id}`);
  }

  async updateEmployeeProfile(data: UpdateEmployeeProfileRequest): Promise<ApiResponse<EmployeeProfile>> {
    return apiClient.put<EmployeeProfile>('/users/employee-profile', data);
  }

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async uploadResume(file: File): Promise<ApiResponse<{ resume: string }>> {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await apiClient.post('/users/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async activateUser(id: string): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`/users/${id}/activate`);
  }

  async deactivateUser(id: string): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`/users/${id}/deactivate`);
  }

  async verifyEmail(id: string): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`/users/${id}/verify-email`);
  }

  async suspendUser(id: string, reason?: string): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`/users/${id}/suspend`, { reason });
  }

  async unsuspendUser(id: string): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`/users/${id}/unsuspend`);
  }

  async deleteAccount(): Promise<ApiResponse<void>> {
    return apiClient.delete('/users/profile');
  }

  async getUsers(
    filters?: {
      role?: string[];
      status?: string[];
      isActive?: boolean;
      isVerified?: boolean;
      city?: string;
      state?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<User>> {
    const params = { ...filters, page, limit };
    return apiClient.getPaginated<User>('/users', params);
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return apiClient.search<User>('/users/search', query);
  }

  async addEmployeeTag(
    employeeId: string,
    tag: {
      type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
      content: string;
    }
  ): Promise<ApiResponse<void>> {
    return apiClient.post(`/users/${employeeId}/tags`, tag);
  }

  async removeEmployeeTag(employeeId: string, tagId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/users/${employeeId}/tags/${tagId}`);
  }

  async disputeEmployeeTag(employeeId: string, tagId: string, reason: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/users/${employeeId}/tags/${tagId}/dispute`, { reason });
  }

  async getEmployeeTags(employeeId: string): Promise<ApiResponse<EmployeeProfile['tags']>> {
    return apiClient.get<EmployeeProfile['tags']>(`/users/${employeeId}/tags`);
  }

  async getNotifications(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<unknown>> {
    return apiClient.getPaginated<unknown>('/users/notifications', { page, limit });
  }

  async markNotificationRead(notificationId: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/users/notifications/${notificationId}/read`);
  }

  async markAllNotificationsRead(): Promise<ApiResponse<void>> {
    return apiClient.patch('/users/notifications/read-all');
  }

  async getActivityLog(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<unknown>> {
    return apiClient.getPaginated<unknown>('/users/activity-log', { page, limit });
  }

  async updateNotificationPreferences(preferences: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    jobAlerts?: boolean;
    orderUpdates?: boolean;
    marketing?: boolean;
  }): Promise<ApiResponse<void>> {
    return apiClient.patch('/users/notification-preferences', preferences);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return apiClient.post('/users/change-password', {
      currentPassword,
      newPassword,
    });
  }

  async enable2FA(): Promise<ApiResponse<{ qrCode: string; secret: string }>> {
    return apiClient.post<{ qrCode: string; secret: string }>('/users/2fa/enable');
  }

  async verify2FA(token: string): Promise<ApiResponse<{ backupCodes: string[] }>> {
    return apiClient.post<{ backupCodes: string[] }>('/users/2fa/verify', { token });
  }

  async disable2FA(token: string): Promise<ApiResponse<void>> {
    return apiClient.post('/users/2fa/disable', { token });
  }

  async requestDataExport(categories: string[]): Promise<ApiResponse<{ requestId: string }>> {
    return apiClient.post<{ requestId: string }>('/users/data-export', { categories });
  }

  async requestAccountDeletion(reason?: string): Promise<ApiResponse<{ requestId: string }>> {
    return apiClient.post<{ requestId: string }>('/users/delete-account', { reason });
  }
}

export const usersApi = new UsersApi();