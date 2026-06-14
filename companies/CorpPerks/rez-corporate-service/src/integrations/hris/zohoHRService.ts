import axios, { AxiosInstance } from 'axios';
import { HRISConnection, Employee } from '../../models';
import { EmployeeStatus } from '../../types';
import { logger } from '../../config/logger';

export interface ZohoHREmployee {
  Employee_ID: string;
  Email: string;
  First_Name: string;
  Last_Name: string;
  Department: string;
  Designation: string;
  Date_of_Joining: string;
  Manager_ID?: string;
  Phone_Number?: string;
  Status?: 'Active' | 'Inactive';
}

export interface SyncResult {
  added: number;
  updated: number;
  removed: number;
  errors: string[];
}

export class ZohoHRService {
  private client: AxiosInstance;
  private connection: any;
  private accessToken: string | null = null;

  constructor(connection: any) {
    this.connection = connection;
    this.client = axios.create({
      baseURL: 'https://www.zohoapis.com/recruit/v2',
      timeout: 30000
    });
  }

  async authenticate(): Promise<void> {
    try {
      const response = await axios.post(
        'https://accounts.zoho.com/oauth/v2/token',
        null,
        {
          params: {
            grant_type: 'refresh_token',
            client_id: this.connection.credentials.clientId,
            client_secret: this.connection.credentials.clientSecret,
            refresh_token: this.connection.credentials.refreshToken
          }
        }
      );

      this.accessToken = response.data.access_token;

      await HRISConnection.updateOne(
        { _id: this.connection._id },
        {
          $set: {
            'credentials.accessToken': response.data.access_token,
            'credentials.tokenExpiry': new Date(Date.now() + response.data.expires_in * 1000)
          }
        }
      );

      logger.info('Zoho HR authentication successful');
    } catch (error: any) {
      logger.error('Zoho HR authentication failed', { error: error.message });
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    return {
      'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();

      const response = await this.client.get('/ Candidates', {
        headers: await this.getAuthHeaders(),
        params: { per_page: 1 }
      });

      return response.status === 200;
    } catch (error) {
      logger.error('Zoho HR connection test failed', { error });
      return false;
    }
  }

  async getEmployees(): Promise<ZohoHREmployee[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.get(
        '/recruit/v2/candidates',
        {
          headers,
          params: {
            per_page: 200
          }
        }
      );

      return response.data.data || [];
    } catch (error: any) {
      logger.error('Failed to fetch Zoho HR employees', { error: error.message });
      throw new Error(`Failed to fetch employees: ${error.message}`);
    }
  }

  async getEmployeeById(employeeId: string): Promise<ZohoHREmployee | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.get(
        `/recruit/v2/candidates/${employeeId}`,
        { headers }
      );

      return response.data.data?.[0] || null;
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

      for (const zohoEmployee of employees) {
        try {
          currentExternalIds.add(zohoEmployee.Employee_ID);

          const employeeData = this.transformEmployee(zohoEmployee);
          const existing = existingByExternalId.get(zohoEmployee.Employee_ID);

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
          result.errors.push(`Employee ${zohoEmployee.Employee_ID}: ${error.message}`);
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

      logger.info('Zoho HR sync completed', { result });
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

  transformEmployee(zohoEmployee: ZohoHREmployee): Partial<any> {
    return {
      externalId: zohoEmployee.Employee_ID,
      email: zohoEmployee.Email,
      firstName: zohoEmployee.First_Name,
      lastName: zohoEmployee.Last_Name,
      department: zohoEmployee.Department || 'General',
      designation: zohoEmployee.Designation || '',
      doj: zohoEmployee.Date_of_Joining
        ? new Date(zohoEmployee.Date_of_Joining)
        : new Date(),
      status: zohoEmployee.Status === 'Active'
        ? EmployeeStatus.ACTIVE
        : EmployeeStatus.INACTIVE,
      managerId: zohoEmployee.Manager_ID,
      phone: zohoEmployee.Phone_Number,
      syncedAt: new Date()
    };
  }
}
