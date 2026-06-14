import axios, { AxiosInstance } from 'axios';
import { HRISConnection, Employee } from '../../models';
import { HRISProvider, EmployeeStatus } from '../../types';
import { logger } from '../../config/logger';

export interface GreytHREmployee {
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  department_name: string;
  designation: string;
  date_of_joining: string;
  status: 'active' | 'inactive' | 'terminated';
  manager_employee_id?: string;
  phone?: string;
}

export interface GreytHRDepartment {
  department_id: string;
  department_name: string;
  parent_department_id?: string;
}

export interface SyncResult {
  added: number;
  updated: number;
  removed: number;
  errors: string[];
}

export class GreytHRService {
  private client: AxiosInstance;
  private connection: any;

  constructor(connection: any) {
    this.connection = connection;
    this.client = axios.create({
      baseURL: 'https://api.greythr.com/v3',
      timeout: 30000
    });
  }

  async authenticate(): Promise<void> {
    try {
      const response = await this.client.post('/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.connection.credentials.clientId,
        client_secret: this.connection.credentials.clientSecret
      });

      this.connection.credentials.accessToken = response.data.access_token;
      this.connection.credentials.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);

      await HRISConnection.updateOne(
        { _id: this.connection._id },
        {
          $set: {
            'credentials.accessToken': response.data.access_token,
            'credentials.tokenExpiry': this.connection.credentials.tokenExpiry
          }
        }
      );

      logger.info('GreytHR authentication successful');
    } catch (error: any) {
      logger.error('GreytHR authentication failed', { error: error.message });
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (
      !this.connection.credentials.accessToken ||
      !this.connection.credentials.tokenExpiry ||
      new Date() >= new Date(this.connection.credentials.tokenExpiry)
    ) {
      await this.authenticate();
    }

    return {
      'Authorization': `Bearer ${this.connection.credentials.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();

      const response = await this.client.get('/company/profile', {
        headers: await this.getAuthHeaders()
      });

      return response.status === 200;
    } catch (error) {
      logger.error('GreytHR connection test failed', { error });
      return false;
    }
  }

  async getEmployees(): Promise<GreytHREmployee[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.get('/employees', {
        headers,
        params: {
          status: 'active',
          page_size: 500
        }
      });

      return response.data.employees || [];
    } catch (error: any) {
      logger.error('Failed to fetch employees', { error: error.message });
      throw new Error(`Failed to fetch employees: ${error.message}`);
    }
  }

  async getEmployeeById(employeeId: string): Promise<GreytHREmployee | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.get(`/employees/${employeeId}`, {
        headers
      });

      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getDepartments(): Promise<GreytHRDepartment[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.get('/departments', {
        headers
      });

      return response.data.departments || [];
    } catch (error: any) {
      logger.error('Failed to fetch departments', { error: error.message });
      return [];
    }
  }

  async syncEmployees(companyId: string): Promise<SyncResult> {
    const result: SyncResult = {
      added: 0,
      updated: 0,
      removed: 0,
      errors: []
    };

    try {
      const employees = await this.getEmployees();
      const fieldMappings = this.connection.fieldMappings || {};

      // Get existing employees
      const existingEmployees = await Employee.find({
        companyId,
        hrisConnectionId: this.connection._id
      });

      const existingByExternalId = new Map(
        existingEmployees.map(e => [e.externalId, e])
      );

      const currentExternalIds = new Set<string>();

      for (const greytEmployee of employees) {
        try {
          currentExternalIds.add(greytEmployee.employee_id);

          const employeeData = this.transformEmployee(greytEmployee, companyId);
          const existing = existingByExternalId.get(greytEmployee.employee_id);

          if (existing) {
            // Update existing
            Object.assign(existing, employeeData);
            existing.syncedAt = new Date();
            await existing.save();
            result.updated++;
          } else {
            // Add new
            const newEmployee = new Employee({
              ...employeeData,
              companyId,
              hrisConnectionId: this.connection._id
            });
            await newEmployee.save();
            result.added++;
          }
        } catch (error: any) {
          result.errors.push(`Employee ${greytEmployee.employee_id}: ${error.message}`);
        }
      }

      // Mark removed employees
      for (const [externalId, employee] of existingByExternalId) {
        if (!currentExternalIds.has(externalId)) {
          employee.status = EmployeeStatus.TERMINATED;
          employee.syncedAt = new Date();
          await employee.save();
          result.removed++;
        }
      }

      // Update connection status
      await HRISConnection.updateOne(
        { _id: this.connection._id },
        {
          $set: {
            status: 'connected',
            lastSyncAt: new Date(),
            lastSyncStatus: result.errors.length > 0 ? 'partial' : 'success',
            syncHistory: {
              syncedAt: new Date(),
              status: result.errors.length > 0 ? 'partial' : 'success',
              employeesAdded: result.added,
              employeesUpdated: result.updated,
              employeesRemoved: result.removed,
              error: result.errors.length > 0 ? result.errors[0] : undefined
            }
          }
        }
      );

      logger.info('GreytHR sync completed', { result });
      return result;
    } catch (error: any) {
      await HRISConnection.updateOne(
        { _id: this.connection._id },
        {
          $set: {
            status: 'error',
            lastSyncError: error.message
          }
        }
      );

      throw error;
    }
  }

  transformEmployee(greytEmployee: GreytHREmployee, companyId: string): Partial<any> {
    const fieldMappings = this.connection.fieldMappings || {};

    return {
      externalId: greytEmployee.employee_id,
      email: greytEmployee.email,
      firstName: greytEmployee.first_name,
      lastName: greytEmployee.last_name,
      department: greytEmployee.department_name,
      designation: greytEmployee.designation,
      doj: new Date(greytEmployee.date_of_joining),
      status: greytEmployee.status === 'active'
        ? EmployeeStatus.ACTIVE
        : EmployeeStatus.INACTIVE,
      managerId: greytEmployee.manager_employee_id,
      phone: greytEmployee.phone,
      syncedAt: new Date()
    };
  }

  async getEmployeeChanges(since: Date): Promise<GreytHREmployee[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.get('/employees/changes', {
        headers,
        params: {
          since: since.toISOString(),
          page_size: 500
        }
      });

      return response.data.changes || [];
    } catch (error: any) {
      logger.error('Failed to fetch employee changes', { error: error.message });
      return [];
    }
  }
}
