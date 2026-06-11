import { apiClient } from './apiClient';

export interface AdminUserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  assignedTickets: number;
}

export interface CreateAdminData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: string;
}

export interface UpdateAdminData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  isActive?: boolean;
  password?: string;
}

class AdminUserProfilesService {
  async listAdmins(): Promise<AdminUserProfile[]> {
    const response = await apiClient.get<{ adminUsers: AdminUserProfile[] }>('admin/admin-users');
    if (!response.success) {
      throw new Error(response.message || 'Failed to load admin users');
    }
    return response.data?.adminUsers || [];
  }

  async createAdmin(data: CreateAdminData): Promise<AdminUserProfile> {
    const response = await apiClient.post<{ adminUser: AdminUserProfile }>(
      'admin/admin-users',
      data as any
    );
    if (!response.success || !response.data?.adminUser) {
      throw new Error(response.message || 'Failed to create admin user');
    }
    return response.data.adminUser;
  }

  async updateAdmin(id: string, data: UpdateAdminData): Promise<AdminUserProfile> {
    const response = await apiClient.put<{ adminUser: AdminUserProfile }>(
      `admin/admin-users/${id}`,
      data as any
    );
    if (!response.success || !response.data?.adminUser) {
      throw new Error(response.message || 'Failed to update admin user');
    }
    return response.data.adminUser;
  }

  async deactivateAdmin(id: string): Promise<void> {
    const response = await apiClient.delete(`admin/admin-users/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to deactivate admin user');
    }
  }
}

export const adminUsersService = new AdminUserProfilesService();
export default adminUsersService;
