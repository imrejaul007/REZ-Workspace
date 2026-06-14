/**
 * PERMISSIONS API SERVICE
 * Integration with REZ Central Permissions
 *
 * Service: REZ-central-permissions
 * URL: https://REZ-central-permissions.onrender.com
 *
 * Features:
 * - RBAC/ABAC permissions
 * - Role management
 * - Access control
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export type Permission = 'read' | 'write' | 'delete' | 'admin';
export type Resource = 'orders' | 'products' | 'users' | 'settings' | 'reports' | 'payments';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Array<{ resource: Resource; permission: Permission }>;
}

export interface UserPermissions {
  userId: string;
  roles: string[];
  permissions: Array<{ resource: Resource; permission: Permission }>;
}

/**
 * Get user permissions
 */
export async function getUserPermissions(userId: string): Promise<ApiResponse<UserPermissions>> {
  try {
    return await apiClient.get(`/permissions/users/${userId}`);
  } catch (error) {
    logger.error('permissionsApi.getUserPermissions', { userId, error });
    throw error;
  }
}

/**
 * Check permission
 */
export async function checkPermission(userId: string, resource: Resource, permission: Permission): Promise<ApiResponse<{ allowed: boolean }>> {
  try {
    return await apiClient.get(`/permissions/check?userId=${userId}&resource=${resource}&permission=${permission}`);
  } catch (error) {
    logger.error('permissionsApi.check', { userId, resource, permission, error });
    throw error;
  }
}

/**
 * Get roles
 */
export async function getRoles(): Promise<ApiResponse<Role[]>> {
  try {
    return await apiClient.get('/permissions/roles');
  } catch (error) {
    logger.error('permissionsApi.getRoles', { error });
    throw error;
  }
}

/**
 * Get role by ID
 */
export async function getRole(roleId: string): Promise<ApiResponse<Role>> {
  try {
    return await apiClient.get(`/permissions/roles/${roleId}`);
  } catch (error) {
    logger.error('permissionsApi.getRole', { roleId, error });
    throw error;
  }
}

export default {
  getUserPermissions,
  checkPermission,
  getRoles,
  getRole,
};
