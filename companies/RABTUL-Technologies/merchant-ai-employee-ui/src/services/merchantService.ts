// Merchant AI Employee UI - Merchant Service
// Cross-merchant context and permissions management

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

interface Merchant {
  id: string;
  name: string;
  slug: string;
  industry: string;
  tier: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'inactive';
  employees: number;
  aiAgentsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Employee {
  id: string;
  merchantId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'agent' | 'viewer';
  permissions: string[];
  avatar?: string;
  status: 'active' | 'inactive';
  lastLogin?: Date;
  createdAt: Date;
}

interface CrossMerchantContext {
  userId: string;
  viewingAs: 'own' | 'merchant';
  merchantId?: string;
  role: string;
  permissions: string[];
}

export class MerchantService {
  private merchants: Map<string, Merchant> = new Map();
  private employees: Map<string, Employee> = new Map();

  async getMerchant(merchantId: string): Promise<Merchant | null> {
    return this.merchants.get(merchantId) || null;
  }

  async getMerchantBySlug(slug: string): Promise<Merchant | null> {
    return Array.from(this.merchants.values())
      .find(m => m.slug === slug) || null;
  }

  async listMerchants(filters?: {
    status?: string;
    industry?: string;
    tier?: string;
  }): Promise<Merchant[]> {
    let merchants = Array.from(this.merchants.values());

    if (filters?.status) {
      merchants = merchants.filter(m => m.status === filters.status);
    }
    if (filters?.industry) {
      merchants = merchants.filter(m => m.industry === filters.industry);
    }
    if (filters?.tier) {
      merchants = merchants.filter(m => m.tier === filters.tier);
    }

    return merchants;
  }

  async createMerchant(data: Omit<Merchant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Merchant> {
    const id = `merchant_${uuidv4()}`;
    const merchant: Merchant = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.merchants.set(id, merchant);
    logger.info(`[Merchant] Created merchant ${id}: ${merchant.name}`);
    return merchant;
  }

  async updateMerchant(merchantId: string, updates: Partial<Merchant>): Promise<Merchant | null> {
    const existing = this.merchants.get(merchantId);
    if (!existing) return null;

    const updated: Merchant = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    this.merchants.set(merchantId, updated);
    return updated;
  }

  // Employee Management
  async getEmployee(employeeId: string): Promise<Employee | null> {
    return this.employees.get(employeeId) || null;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | null> {
    return Array.from(this.employees.values())
      .find(e => e.email === email) || null;
  }

  async listEmployees(merchantId: string): Promise<Employee[]> {
    return Array.from(this.employees.values())
      .filter(e => e.merchantId === merchantId);
  }

  async createEmployee(
    merchantId: string,
    data: Omit<Employee, 'id' | 'merchantId' | 'createdAt'>
  ): Promise<Employee> {
    const id = `emp_${uuidv4()}`;
    const employee: Employee = {
      ...data,
      id,
      merchantId,
      createdAt: new Date(),
    };
    this.employees.set(id, employee);
    logger.info(`[Merchant] Created employee ${id} for merchant ${merchantId}`);
    return employee;
  }

  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee | null> {
    const existing = this.employees.get(employeeId);
    if (!existing) return null;

    const updated: Employee = {
      ...existing,
      ...updates,
      id: existing.id,
      merchantId: existing.merchantId,
      createdAt: existing.createdAt,
    };
    this.employees.set(employeeId, updated);
    return updated;
  }

  // Role-based permissions
  private rolePermissions: Record<string, string[]> = {
    owner: ['*'],
    admin: [
      'agents:read', 'agents:write', 'agents:delete',
      'training:read', 'training:write', 'training:delete',
      'analytics:read', 'analytics:export',
      'employees:read', 'employees:write', 'employees:delete',
      'settings:read', 'settings:write',
    ],
    manager: [
      'agents:read', 'agents:write',
      'training:read', 'training:write',
      'analytics:read', 'analytics:export',
    ],
    agent: [
      'agents:read',
      'training:read',
      'analytics:read',
    ],
    viewer: [
      'agents:read',
      'analytics:read',
    ],
  };

  async getPermissionsForRole(role: string): Promise<string[]> {
    return this.rolePermissions[role] || [];
  }

  async hasPermission(employeeId: string, permission: string): Promise<boolean> {
    const employee = await this.getEmployee(employeeId);
    if (!employee) return false;

    const permissions = await this.getPermissionsForRole(employee.role);
    return permissions.includes('*') || permissions.includes(permission);
  }

  // Cross-merchant context for super admins
  async getCrossMerchantContext(
    userId: string,
    targetMerchantId?: string
  ): Promise<CrossMerchantContext> {
    const employee = Array.from(this.employees.values())
      .find(e => e.id === userId);

    if (!employee) {
      throw new Error('Employee not found');
    }

    return {
      userId,
      viewingAs: targetMerchantId && targetMerchantId !== employee.merchantId ? 'merchant' : 'own',
      merchantId: targetMerchantId || employee.merchantId,
      role: employee.role,
      permissions: await this.getPermissionsForRole(employee.role),
    };
  }

  async switchMerchantView(
    userId: string,
    targetMerchantId: string
  ): Promise<CrossMerchantContext> {
    const employee = await this.getEmployee(userId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const targetMerchant = await this.getMerchant(targetMerchantId);
    if (!targetMerchant) {
      throw new Error('Target merchant not found');
    }

    // Only owner/admin can view other merchants
    if (!['owner', 'admin'].includes(employee.role)) {
      throw new Error('Insufficient permissions to view other merchants');
    }

    return {
      userId,
      viewingAs: 'merchant',
      merchantId: targetMerchantId,
      role: employee.role,
      permissions: await this.getPermissionsForRole(employee.role),
    };
  }

  // Merchant statistics
  async getMerchantStats(merchantId: string): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    agentsEnabled: number;
    tier: string;
    status: string;
  }> {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const employees = await this.listEmployees(merchantId);

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'active').length,
      agentsEnabled: merchant.aiAgentsEnabled ? 1 : 0,
      tier: merchant.tier,
      status: merchant.status,
    };
  }
}

export const merchantService = new MerchantService();
export default merchantService;
