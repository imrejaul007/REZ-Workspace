import axios, { AxiosInstance } from 'axios';
import { HRISConnection, Employee } from '../../models';
import { EmployeeStatus } from '../../types';
import { logger } from '../../config/logger';

export interface BambooHREmployee {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  workEmail?: string;
  mobilePhone?: string;
  department?: string;
  jobTitle?: string;
  hireDate?: string;
  supervisorId?: string;
  status?: 'Active' | 'Inactive';
}

export interface SyncResult {
  added: number;
  updated: number;
  removed: number;
  errors: string[];
}

export class BambooHRService {
  private client: AxiosInstance;
  private connection: any;

  constructor(connection: any) {
    this.connection = connection;
    this.client = axios.create({
      baseURL: `https://api.bamboohr.com/api/gateway.php/${connection.credentials.subdomain}/v1`,
      timeout: 30000
    });
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(
      `${this.connection.credentials.apiKey}:x`
    ).toString('base64');
    return `Basic ${credentials}`;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': this.getAuthHeader(),
      'Accept': 'application/json'
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/employees/directory', {
        headers: this.getHeaders(),
        params: { format: 'json' }
      });

      return response.status === 200;
    } catch (error) {
      logger.error('BambooHR connection test failed', { error });
      return false;
    }
  }

  async getEmployees(): Promise<BambooHREmployee[]> {
    try {
      const fields = [
        'firstName',
        'lastName',
        'displayName',
        'workEmail',
        'mobilePhone',
        'department',
        'jobTitle',
        'hireDate',
        'supervisorId',
        'status'
      ].join(',');

      const response = await this.client.get('/employees/directory', {
        headers: this.getHeaders(),
        params: {
          format: 'json',
          fields
        }
      });

      return response.data.employees || [];
    } catch (error: any) {
      logger.error('Failed to fetch BambooHR employees', { error: error.message });
      throw new Error(`Failed to fetch employees: ${error.message}`);
    }
  }

  async getEmployeeById(employeeId: string): Promise<BambooHREmployee | null> {
    try {
      const response = await this.client.get(`/employees/${employeeId}`, {
        headers: this.getHeaders(),
        params: { fields: 'all' }
      });

      return response.data;
    } catch (error) {
      return null;
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

      const existingEmployees = await Employee.find({
        companyId,
        hrisConnectionId: this.connection._id
      });

      const existingByExternalId = new Map(
        existingEmployees.map(e => [e.externalId, e])
      );

      const currentExternalIds = new Set<string>();

      for (const bambooEmployee of employees) {
        try {
          currentExternalIds.add(bambooEmployee.id);

          const employeeData = this.transformEmployee(bambooEmployee);
          const existing = existingByExternalId.get(bambooEmployee.id);

          if (existing) {
            Object.assign(existing, employeeData);
            existing.syncedAt = new Date();
            await existing.save();
            result.updated++;
          } else {
            const newEmployee = new Employee({
              ...employeeData,
              companyId,
              hrisConnectionId: this.connection._id
            });
            await newEmployee.save();
            result.added++;
          }
        } catch (error: any) {
          result.errors.push(`Employee ${bambooEmployee.id}: ${error.message}`);
        }
      }

      for (const [externalId, employee] of existingByExternalId) {
        if (!currentExternalIds.has(externalId)) {
          employee.status = EmployeeStatus.TERMINATED;
          employee.syncedAt = new Date();
          await employee.save();
          result.removed++;
        }
      }

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
              employeesRemoved: result.removed
            }
          }
        }
      );

      logger.info('BambooHR sync completed', { result });
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

  transformEmployee(bambooEmployee: BambooHREmployee): Partial<any> {
    return {
      externalId: bambooEmployee.id,
      email: bambooEmployee.workEmail || `${bambooEmployee.firstName}.${bambooEmployee.lastName}@company.com`,
      firstName: bambooEmployee.firstName,
      lastName: bambooEmployee.lastName,
      department: bambooEmployee.department || 'General',
      designation: bambooEmployee.jobTitle || '',
      doj: bambooEmployee.hireDate ? new Date(bambooEmployee.hireDate) : new Date(),
      status: bambooEmployee.status === 'Active'
        ? EmployeeStatus.ACTIVE
        : EmployeeStatus.INACTIVE,
      managerId: bambooEmployee.supervisorId,
      phone: bambooEmployee.mobilePhone,
      syncedAt: new Date()
    };
  }
}
